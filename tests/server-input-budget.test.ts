import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import { createVibeMcpServer, MAX_TOOL_INPUT_ELEMENTS } from '../src/server.js';

describe('server tool input budget', () => {
  const peers: Array<{ client: Client; server: ReturnType<typeof createVibeMcpServer> }> = [];

  async function connect() {
    const server = createVibeMcpServer({ name: 'input-budget-test', version: '0.0.0' });
    const handler = jest.fn(async () => ({
      content: [{ type: 'text' as const, text: 'accepted' }],
    }));
    server.registerTool('batch', { inputSchema: { items: z.array(z.string()) } }, handler);
    server.registerTool('record', { inputSchema: { values: z.record(z.string()) } }, handler);
    const client = new Client({ name: 'input-budget-client', version: '0.0.0' });
    peers.push({ client, server });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return { client, handler };
  }

  afterEach(async () => {
    for (const { client, server } of peers.splice(0)) {
      await client.close();
      await server.close();
    }
  });

  it('rejects oversized arrays before executing the tool and keeps serving', async () => {
    const { client, handler } = await connect();

    const rejected = await client.callTool({
      name: 'batch',
      arguments: { items: Array.from({ length: MAX_TOOL_INPUT_ELEMENTS }, () => 'id') },
    });

    expect(rejected.isError).toBe(true);
    expect(handler).not.toHaveBeenCalled();

    const accepted = await client.callTool({ name: 'batch', arguments: { items: ['id'] } });
    expect(accepted.isError).not.toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('rejects oversized objects before executing the tool', async () => {
    const { client, handler } = await connect();
    const values = Object.fromEntries(
      Array.from({ length: MAX_TOOL_INPUT_ELEMENTS }, (_, index) => [`key-${index}`, 'value']),
    );

    const result = await client.callTool({ name: 'record', arguments: { values } });

    expect(result.isError).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });

  it('accepts arguments at the element limit', async () => {
    const { client, handler } = await connect();

    const result = await client.callTool({
      name: 'batch',
      arguments: { items: Array.from({ length: MAX_TOOL_INPUT_ELEMENTS - 1 }, () => 'id') },
    });

    expect(result.isError).not.toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
