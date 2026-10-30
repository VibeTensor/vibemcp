import { PublicClientApplication } from '@azure/msal-node';

test('MSAL preserves an existing serialized account across an offline cache roundtrip', async () => {
  const app = new PublicClientApplication({ auth: { clientId: 'synthetic-client' } });
  const cache = app.getTokenCache();
  const claims = Buffer.from(
    JSON.stringify({
      preferred_username: 'user@example.test',
      oid: 'synthetic-local',
      tid: 'synthetic-tenant',
    }),
  ).toString('base64url');
  cache.deserialize(
    JSON.stringify({
      Account: {
        'synthetic.login.microsoftonline.com.synthetic-tenant': {
          home_account_id: 'synthetic-account',
          environment: 'login.microsoftonline.com',
          realm: 'synthetic-tenant',
          local_account_id: 'synthetic-local',
          username: 'user@example.test',
          authority_type: 'MSSTS',
          name: 'Synthetic User',
        },
      },
      IdToken: {
        'synthetic-account-login.microsoftonline.com-idtoken-synthetic-client-synthetic-tenant-': {
          home_account_id: 'synthetic-account',
          environment: 'login.microsoftonline.com',
          credential_type: 'IdToken',
          client_id: 'synthetic-client',
          secret: `eyJhbGciOiJub25lIn0.${claims}.synthetic`,
          realm: 'synthetic-tenant',
        },
      },
      AccessToken: {},
      RefreshToken: {},
      AppMetadata: {},
    }),
  );
  const restored = new PublicClientApplication({ auth: { clientId: 'synthetic-client' } });
  restored.getTokenCache().deserialize(cache.serialize());
  expect(await restored.getTokenCache().getAllAccounts()).toEqual([
    expect.objectContaining({
      homeAccountId: 'synthetic-account',
      username: 'user@example.test',
      tenantId: 'synthetic-tenant',
    }),
  ]);
});
