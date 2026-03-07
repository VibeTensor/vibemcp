/**
 * Microsoft MSAL multi-account authentication.
 *
 * Port of productivity-mcp/auth/microsoft_auth.py
 * Uses Device Code Flow for terminal-friendly auth.
 */

import fs from 'node:fs';
import * as msal from '@azure/msal-node';

import {
  AZURE_CLIENT_ID,
  AZURE_TENANT_ID,
  MS_TOKEN_CACHE_PATH,
  MS_SCOPES,
  MS_SCOPES_PERSONAL,
} from '../config.js';
import { log } from '../utils/logger.js';

// Personal account domains - Graph Teams/Chat scopes not supported for MSA
const PERSONAL_DOMAINS = new Set([
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.de',
  'outlook.co.uk',
  'live.co.uk',
]);

// =====================================================================
// MSAL App (singleton with persistent cache)
// =====================================================================

let msalApp: msal.PublicClientApplication | null = null;
// tokenCache reference kept for future use in cache persistence improvements

function saveCacheIfChanged(): void {
  if (!msalApp) return;
  try {
    const cache = msalApp.getTokenCache();
    const serialized = cache.serialize();
    fs.writeFileSync(MS_TOKEN_CACHE_PATH, serialized);
  } catch {
    /* ignore */
  }
}

async function getMsalApp(): Promise<msal.PublicClientApplication | null> {
  if (msalApp) return msalApp;

  if (!AZURE_CLIENT_ID) {
    log('error', 'MICROSOFT_CLIENT_ID must be set in .env');
    return null;
  }

  const cachePlugin: msal.ICachePlugin = {
    beforeCacheAccess: async (context: msal.TokenCacheContext) => {
      if (fs.existsSync(MS_TOKEN_CACHE_PATH)) {
        const data = fs.readFileSync(MS_TOKEN_CACHE_PATH, 'utf-8');
        context.tokenCache.deserialize(data);
      }
    },
    afterCacheAccess: async (context: msal.TokenCacheContext) => {
      if (context.cacheHasChanged) {
        const data = context.tokenCache.serialize();
        fs.writeFileSync(MS_TOKEN_CACHE_PATH, data);
      }
    },
  };

  msalApp = new msal.PublicClientApplication({
    auth: {
      clientId: AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`,
    },
    cache: {
      cachePlugin,
    },
  });

  // Save cache on process exit
  process.on('exit', saveCacheIfChanged);
  process.on('SIGINT', () => {
    saveCacheIfChanged();
    process.exit(0);
  });

  return msalApp;
}

// =====================================================================
// Scope management
// =====================================================================

function isPersonalAccount(email: string): boolean {
  const domain = email.toLowerCase().split('@').pop() ?? '';
  return PERSONAL_DOMAINS.has(domain);
}

function scopesForAccount(email: string): string[] {
  const scopes = isPersonalAccount(email) ? MS_SCOPES_PERSONAL : MS_SCOPES;
  return scopes.map((s) => `https://graph.microsoft.com/${s}`);
}

// =====================================================================
// Token acquisition
// =====================================================================

/**
 * Get an access token for a specific Microsoft account.
 * Uses silent token acquisition from cache.
 */
export async function getTokenForAccount(accountId: string): Promise<string | null> {
  const app = await getMsalApp();
  if (!app) return null;

  const scopes = scopesForAccount(accountId);

  const accounts = await app.getTokenCache().getAllAccounts();
  const target = accounts.find((acc) => acc.username?.toLowerCase() === accountId.toLowerCase());

  if (target) {
    try {
      const result = await app.acquireTokenSilent({ scopes, account: target });
      if (result?.accessToken) return result.accessToken;
    } catch {
      log('warn', `Silent token acquisition failed for ${accountId}`);
    }
  }

  log('warn', `No cached token for ${accountId}. Use add_microsoft_account tool to authenticate.`);
  return null;
}

// =====================================================================
// Device Code Flow
// =====================================================================

// Store pending flows
const pendingFlows = new Map<string, msal.DeviceCodeRequest>();

/**
 * Start Device Code Flow. Returns flow info with user_code and verification_uri.
 */
export async function initiateDeviceFlow(email: string): Promise<{
  userCode: string;
  verificationUri: string;
  message: string;
} | null> {
  const app = await getMsalApp();
  if (!app) return null;

  const scopes = scopesForAccount(email);
  const personal = isPersonalAccount(email);

  log(
    'info',
    `Starting device flow for ${email} (${personal ? 'personal' : 'business'}) with ${scopes.length} scopes`,
  );

  try {
    // We need to use a callback-based approach for device code
    let deviceCodeInfo: { userCode: string; verificationUri: string; message: string } | null =
      null;

    const request: msal.DeviceCodeRequest = {
      scopes,
      deviceCodeCallback: (response) => {
        deviceCodeInfo = {
          userCode: response.userCode,
          verificationUri: response.verificationUri,
          message: response.message,
        };
      },
    };

    // Store for later completion - but we need a different approach
    // MSAL Node's device code flow is a single call that blocks until complete
    // We'll start it but not await it immediately
    const tokenPromise = app.acquireTokenByDeviceCode(request);
    pendingFlows.set(email, request);

    // Store the promise for completion
    (globalThis as Record<string, unknown>)[`_ms_flow_${email}`] = tokenPromise;

    // Wait briefly for the device code callback to fire
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!deviceCodeInfo) {
      log('error', 'Device code callback did not fire');
      return null;
    }

    return deviceCodeInfo;
  } catch (e) {
    log('error', `Failed to start device flow: ${e}`);
    return null;
  }
}

/**
 * Complete Device Code Flow. Waits for the user to enter the code.
 * Returns access token on success.
 */
export async function completeDeviceFlow(email: string): Promise<string | null> {
  const key = `_ms_flow_${email}`;
  const tokenPromise = (globalThis as Record<string, unknown>)[key] as
    | Promise<msal.AuthenticationResult | null>
    | undefined;

  if (!tokenPromise) {
    log('error', `No pending device flow for ${email}`);
    return null;
  }

  try {
    const result = await tokenPromise;
    delete (globalThis as Record<string, unknown>)[key];
    pendingFlows.delete(email);

    if (result?.accessToken) {
      log('info', `Microsoft account ${email} authenticated successfully`);
      return result.accessToken;
    }

    log('error', `Microsoft auth failed for ${email}`);
    return null;
  } catch (e) {
    delete (globalThis as Record<string, unknown>)[key];
    pendingFlows.delete(email);
    log('error', `Microsoft auth error: ${e}`);
    return null;
  }
}

/**
 * Check if a Microsoft account has valid cached credentials.
 */
export async function validateMicrosoftAccount(accountId: string): Promise<boolean> {
  const token = await getTokenForAccount(accountId);
  return token !== null;
}

/**
 * List all Microsoft accounts in the MSAL cache.
 */
export async function listCachedAccounts(): Promise<
  Array<{ username: string; homeAccountId: string }>
> {
  const app = await getMsalApp();
  if (!app) return [];

  const accounts = await app.getTokenCache().getAllAccounts();
  return accounts.map((acc) => ({
    username: acc.username ?? '',
    homeAccountId: acc.homeAccountId ?? '',
  }));
}
