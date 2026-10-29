import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Implementation } from '@modelcontextprotocol/sdk/types.js';

// Allows normal provider batches while bounding work before Zod validation.
export const MAX_TOOL_INPUT_ELEMENTS = 10_000;

export function createVibeMcpServer(info: Implementation): McpServer {
  return new McpServer(info, { maxToolInputElements: MAX_TOOL_INPUT_ELEMENTS });
}
