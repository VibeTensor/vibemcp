import http from 'node:http';
import { google } from 'googleapis';
import open from 'open';
import { completeGoogleAuth, initiateGoogleAuth } from '../src/auth/google.js';
import { writeTokenFile } from '../src/auth/store.js';

jest.mock('node:http', () => ({
  __esModule: true,
  default: { createServer: jest.fn() },
}));
jest.mock('googleapis', () => ({ google: { auth: { OAuth2: jest.fn() } } }));
jest.mock('open', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../src/config.js', () => ({
  GOOGLE_CLIENT_ID: 'synthetic-client',
  GOOGLE_CLIENT_SECRET: 'synthetic-secret',
  GOOGLE_SCOPES: ['synthetic-scope'],
  GOOGLE_OAUTH_PORT: 4100,
  PROJECT_DIR: '/synthetic-no-files',
}));
jest.mock('../src/auth/store.js', () => ({
  readTokenFile: jest.fn(),
  writeTokenFile: jest.fn(),
}));
jest.mock('../src/utils/logger.js', () => ({ log: jest.fn() }));

const EMAIL = 'user@example.test';
interface MockServer {
  callback: http.RequestListener;
  listen: jest.Mock;
  once: jest.Mock;
  close: jest.Mock;
}
const servers: MockServer[] = [];
const clients: Array<{
  generateAuthUrl: jest.Mock;
  getToken: jest.Mock;
  setCredentials: jest.Mock;
}> = [];
let failListen = false;

function clientAt(index: number) {
  const client = clients[index];
  if (!client) throw new Error('Expected a synthetic client');
  return client;
}

function serverAt(index: number) {
  const server = servers[index];
  if (!server) throw new Error('Expected a synthetic listener');
  return server;
}

function nonce(index = clients.length - 1): string {
  const options = clientAt(index).generateAuthUrl.mock.calls[0]?.[0] as
    | { state: string }
    | undefined;
  if (!options) throw new Error('Expected generated authorization options');
  return options.state;
}

function callback(url: string, method = 'GET', index = servers.length - 1) {
  const response = { writeHead: jest.fn(), end: jest.fn() };
  serverAt(index).callback(
    { url, method } as http.IncomingMessage,
    response as unknown as http.ServerResponse,
  );
  return response.writeHead.mock.calls[0][0] as number;
}

function acceptedCallback(index = servers.length - 1, code = 'synthetic-code') {
  return callback(`/code?code=${code}&state=${encodeURIComponent(nonce(index))}`, 'GET', index);
}

beforeEach(() => {
  jest.clearAllMocks();
  servers.splice(0);
  clients.splice(0);
  failListen = false;
  (google.auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => {
    const client = {
      generateAuthUrl: jest.fn(() => 'https://accounts.example.test/authorize'),
      getToken: jest.fn().mockResolvedValue({ tokens: { access_token: 'synthetic-access' } }),
      setCredentials: jest.fn(),
    };
    clients.push(client);
    return client;
  });
  (http.createServer as unknown as jest.Mock).mockImplementation(
    (listener: http.RequestListener) => {
      let errorListener: ((error: Error) => void) | undefined;
      const server: MockServer = {
        callback: listener,
        listen: jest.fn((_port: number, _host: string, ready: () => void) => {
          if (failListen) errorListener?.(new Error('synthetic bind failure'));
          else ready();
          return server;
        }),
        once: jest.fn((_event: string, handler: (error: Error) => void) => {
          errorListener = handler;
          return server;
        }),
        close: jest.fn(),
      };
      servers.push(server);
      return server;
    },
  );
  jest.mocked(open).mockResolvedValue({} as Awaited<ReturnType<typeof open>>);
});

afterEach(async () => {
  if (servers.length > 0) acceptedCallback();
  await completeGoogleAuth(EMAIL);
});

it('uses a different cryptographic state for each attempt and binds only localhost', async () => {
  await initiateGoogleAuth(EMAIL);
  const first = nonce();
  await initiateGoogleAuth(EMAIL);

  expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(nonce()).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(nonce()).not.toBe(first);
  expect(serverAt(0).close).toHaveBeenCalled();
  expect(serverAt(1).listen).toHaveBeenCalledWith(4100, 'localhost', expect.any(Function));
});

it.each(['missing', 'wrong', 'duplicate', 'non-ASCII'])(
  'rejects %s state before exchange',
  async (kind) => {
    await initiateGoogleAuth(EMAIL);
    const state = nonce();
    const suffix =
      kind === 'missing'
        ? ''
        : kind === 'duplicate'
          ? `&state=${state}&state=${state}`
          : kind === 'non-ASCII'
            ? `&state=${encodeURIComponent(String.fromCharCode(233).repeat(43))}`
            : `&state=${'x'.repeat(43)}`;

    expect(callback(`/code?code=untrusted-code${suffix}`)).toBe(400);
    expect(await completeGoogleAuth(EMAIL)).toBe(false);
    expect(clientAt(0).getToken).not.toHaveBeenCalled();
    expect(writeTokenFile).not.toHaveBeenCalled();
    expect(acceptedCallback()).toBe(200);
    expect(await completeGoogleAuth(EMAIL)).toBe(true);
  },
);

it('accepts the correct callback once and cannot replace its code with a replay', async () => {
  await initiateGoogleAuth(EMAIL);
  expect(acceptedCallback(0, 'first-code')).toBe(200);
  expect(acceptedCallback(0, 'replacement-code')).toBe(409);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
  expect(clientAt(0).getToken).toHaveBeenCalledWith('first-code');
  expect(clientAt(0).getToken).toHaveBeenCalledTimes(1);
  expect(await completeGoogleAuth(EMAIL)).toBe(false);
});

it('rejects unexpected methods, paths and missing or duplicate codes without consuming the attempt', async () => {
  await initiateGoogleAuth(EMAIL);
  const state = nonce();
  expect(callback(`/code?state=${state}&code=code`, 'POST')).toBe(405);
  expect(callback(`/other?state=${state}&code=code`)).toBe(404);
  expect(callback(`/code?state=${state}`)).toBe(400);
  expect(callback(`/code?state=${state}&code=one&code=two`)).toBe(400);
  expect(acceptedCallback()).toBe(200);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
});

it('cleans up a state-validated provider denial without exchanging a code', async () => {
  await initiateGoogleAuth(EMAIL);
  expect(callback(`/code?state=${nonce()}&error=access_denied`)).toBe(400);
  expect(await completeGoogleAuth(EMAIL)).toBe(false);
  expect(clientAt(0).getToken).not.toHaveBeenCalled();
  expect(serverAt(0).close).toHaveBeenCalled();
});

it('cleans up a failed exchange and cannot reuse its callback', async () => {
  await initiateGoogleAuth(EMAIL);
  clientAt(0).getToken.mockRejectedValueOnce(new Error('synthetic exchange failure'));
  acceptedCallback();
  expect(await completeGoogleAuth(EMAIL)).toBe(false);
  expect(acceptedCallback()).toBe(409);
  expect(await completeGoogleAuth(EMAIL)).toBe(false);
  expect(writeTokenFile).not.toHaveBeenCalled();
});

it('exchanges an accepted code only once under concurrent completion calls', async () => {
  await initiateGoogleAuth(EMAIL);
  let finish!: (value: { tokens: Record<string, string> }) => void;
  clientAt(0).getToken.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  acceptedCallback();
  const first = completeGoogleAuth(EMAIL);
  expect(await completeGoogleAuth(EMAIL)).toBe(false);
  finish({ tokens: { access_token: 'synthetic-access' } });
  expect(await first).toBe(true);
  expect(clientAt(0).getToken).toHaveBeenCalledTimes(1);
});

it('prevents a superseded callback from supplying the replacement flow code', async () => {
  await initiateGoogleAuth(EMAIL);
  const oldState = nonce();
  await initiateGoogleAuth(EMAIL);
  expect(acceptedCallback(0, 'old-code')).toBe(409);
  expect(callback(`/code?state=${oldState}&code=old-code`)).toBe(400);
  expect(acceptedCallback(1, 'new-code')).toBe(200);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
  expect(clientAt(0).getToken).not.toHaveBeenCalled();
  expect(clientAt(1).getToken).toHaveBeenCalledWith('new-code');
});

it('does not save an old exchange or delete its replacement attempt', async () => {
  await initiateGoogleAuth(EMAIL);
  let finish!: (value: { tokens: Record<string, string> }) => void;
  clientAt(0).getToken.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  acceptedCallback();
  const oldCompletion = completeGoogleAuth(EMAIL);
  await initiateGoogleAuth(EMAIL);
  finish({ tokens: { access_token: 'superseded-synthetic-access' } });
  expect(await oldCompletion).toBe(false);
  expect(writeTokenFile).not.toHaveBeenCalled();
  expect(acceptedCallback(1, 'new-code')).toBe(200);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
  expect(writeTokenFile).toHaveBeenCalledTimes(1);
});

it('cleans up listener failure and permits a new attempt', async () => {
  failListen = true;
  expect(await initiateGoogleAuth(EMAIL)).toBeNull();
  expect(await completeGoogleAuth(EMAIL)).toBe(false);
  expect(open).not.toHaveBeenCalled();
  failListen = false;
  expect(await initiateGoogleAuth(EMAIL)).not.toBeNull();
  acceptedCallback();
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
});

it('keeps the manual authorization URL available when browser opening fails', async () => {
  jest.mocked(open).mockRejectedValueOnce(new Error('synthetic browser failure'));
  expect(await initiateGoogleAuth(EMAIL)).toEqual({
    authUrl: 'https://accounts.example.test/authorize',
  });
  expect(acceptedCallback()).toBe(200);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
});

it('rejects malformed callback URLs without terminating the pending flow', async () => {
  await initiateGoogleAuth(EMAIL);
  expect(callback('http://[')).toBe(400);
  expect(acceptedCallback()).toBe(200);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
});

it('does not return a superseded authorization URL when browser opening was delayed', async () => {
  let finish!: (value: Awaited<ReturnType<typeof open>>) => void;
  jest.mocked(open).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const first = initiateGoogleAuth(EMAIL);
  await Promise.resolve();
  expect(open).toHaveBeenCalledTimes(1);
  expect(await initiateGoogleAuth(EMAIL)).not.toBeNull();
  finish({} as Awaited<ReturnType<typeof open>>);
  expect(await first).toBeNull();
  expect(acceptedCallback()).toBe(200);
  expect(await completeGoogleAuth(EMAIL)).toBe(true);
});
