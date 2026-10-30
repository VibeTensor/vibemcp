import fs from 'node:fs';
import * as msal from '@azure/msal-node';
import {
  completeDeviceFlow,
  getTokenForAccount,
  initiateDeviceFlow,
} from '../src/auth/microsoft.js';

jest.mock('node:fs', () => ({
  __esModule: true,
  default: { existsSync: jest.fn(), readFileSync: jest.fn(), writeFileSync: jest.fn() },
}));
jest.mock('@azure/msal-node', () => ({ PublicClientApplication: jest.fn() }));
jest.mock('../src/config.js', () => ({
  AZURE_CLIENT_ID: 'synthetic-client',
  AZURE_TENANT_ID: 'synthetic-tenant',
  MS_TOKEN_CACHE_PATH: '/synthetic-no-files/ms-cache.json',
  MS_SCOPES: ['Mail.Read', 'Chat.Read'],
  MS_SCOPES_PERSONAL: ['Mail.Read'],
}));
jest.mock('../src/utils/logger.js', () => ({ log: jest.fn() }));

const account = { username: 'user@example.test', homeAccountId: 'synthetic-account' };
const cache = {
  getAllAccounts: jest.fn(),
  serialize: jest.fn(() => 'synthetic-cache'),
  deserialize: jest.fn(),
};
const client = {
  getTokenCache: jest.fn(() => cache),
  acquireTokenSilent: jest.fn(),
  acquireTokenByDeviceCode: jest.fn(),
};
let configuration: msal.Configuration;

beforeAll(() => {
  (msal.PublicClientApplication as unknown as jest.Mock).mockImplementation(
    (options: msal.Configuration) => {
      configuration = options;
      return client;
    },
  );
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  cache.getAllAccounts.mockResolvedValue([account]);
  client.acquireTokenSilent.mockResolvedValue({ accessToken: 'synthetic-access' });
});

afterEach(() => jest.useRealTimers());

test('silently refreshes the matching account using business scopes', async () => {
  expect(await getTokenForAccount('USER@example.test')).toBe('synthetic-access');
  expect(client.acquireTokenSilent).toHaveBeenCalledWith({
    account,
    scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Chat.Read'],
  });
});

test('returns no token after silent refresh failure', async () => {
  client.acquireTokenSilent.mockRejectedValueOnce(new Error('synthetic refresh failure'));
  expect(await getTokenForAccount(account.username)).toBeNull();
});

test('does not refresh an unrelated cached account', async () => {
  expect(await getTokenForAccount('other@example.test')).toBeNull();
  expect(client.acquireTokenSilent).not.toHaveBeenCalled();
});

test('loads and persists a synthetic cache through the MSAL cache plugin', async () => {
  await getTokenForAccount(account.username);
  jest.mocked(fs.existsSync).mockReturnValue(true);
  jest.mocked(fs.readFileSync).mockReturnValue('synthetic-cache');
  const context = { tokenCache: cache, cacheHasChanged: true } as unknown as msal.TokenCacheContext;
  await configuration.cache?.cachePlugin?.beforeCacheAccess(context);
  expect(cache.deserialize).toHaveBeenCalledWith('synthetic-cache');
  await configuration.cache?.cachePlugin?.afterCacheAccess(context);
  expect(fs.writeFileSync).toHaveBeenCalledWith(
    '/synthetic-no-files/ms-cache.json',
    'synthetic-cache',
  );
  jest.mocked(fs.writeFileSync).mockClear();
  await configuration.cache?.cachePlugin?.afterCacheAccess({
    tokenCache: cache,
    cacheHasChanged: false,
  } as unknown as msal.TokenCacheContext);
  expect(fs.writeFileSync).not.toHaveBeenCalled();
});

test('completes a device callback and consumes its pending result once', async () => {
  client.acquireTokenByDeviceCode.mockImplementationOnce((request: msal.DeviceCodeRequest) => {
    request.deviceCodeCallback({
      userCode: 'SYNTHETIC',
      verificationUri: 'https://example.test/device',
      message: 'synthetic verification',
      deviceCode: 'synthetic-device-code',
      expiresIn: 600,
      interval: 5,
    });
    return Promise.resolve({ accessToken: 'synthetic-device-access' });
  });
  const started = initiateDeviceFlow('user@outlook.com');
  await jest.advanceTimersByTimeAsync(1000);
  expect(await started).toEqual({
    userCode: 'SYNTHETIC',
    verificationUri: 'https://example.test/device',
    message: 'synthetic verification',
  });
  expect(client.acquireTokenByDeviceCode.mock.calls.at(-1)?.[0].scopes).toEqual([
    'https://graph.microsoft.com/Mail.Read',
  ]);
  expect(await completeDeviceFlow('user@outlook.com')).toBe('synthetic-device-access');
  expect(await completeDeviceFlow('user@outlook.com')).toBeNull();
});
