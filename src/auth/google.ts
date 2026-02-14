/**
 * Google OAuth2 multi-account authentication.
 *
 * Port of productivity-mcp/auth/google_auth.py
 * Uses googleapis OAuth2Client with local callback server.
 */

import http from 'node:http';
import { URL, URLSearchParams } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import open from 'open';

import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_SCOPES,
  GOOGLE_OAUTH_PORT,
  PROJECT_DIR,
  loadAccounts,
} from '../config.js';
import { readTokenFile, writeTokenFile } from './store.js';
import { log } from '../utils/logger.js';

// =====================================================================
// Pending auth state (module-scoped, replaces Python's builtins hack)
// =====================================================================

const pendingFlows = new Map<string, { client: OAuth2Client; server: http.Server; code: string | null }>();

// =====================================================================
// Token file management
// =====================================================================

function tokenFilePath(email: string): string {
  return path.join(PROJECT_DIR, `.oauth2.${email}.json`);
}

function saveCredentials(email: string, tokens: Record<string, unknown>): void {
  writeTokenFile(tokenFilePath(email), tokens);
}

// =====================================================================
// Credential management
// =====================================================================

function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `http://localhost:${GOOGLE_OAUTH_PORT}/code`,
  );
}

/**
 * Get stored credentials for a Google account.
 * Auto-refreshes if expired.
 */
export async function getCredentials(email: string): Promise<OAuth2Client | null> {
  const tokenData = readTokenFile(tokenFilePath(email));
  if (!tokenData) return null;

  const client = createOAuth2Client();
  client.setCredentials(tokenData as {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
    token_type?: string;
  });

  // Check if token is expired and refresh
  const expiryDate = tokenData['expiry_date'] as number | undefined;
  if (expiryDate && expiryDate < Date.now()) {
    if (tokenData['refresh_token']) {
      try {
        const { credentials } = await client.refreshAccessToken();
        client.setCredentials(credentials);
        saveCredentials(email, credentials as Record<string, unknown>);
        log('info', `Refreshed Google token for ${email}`);
      } catch (e) {
        log('warn', `Failed to refresh Google token for ${email}: ${e}`);
        return null;
      }
    } else {
      log('warn', `Token expired for ${email} and no refresh token available`);
      return null;
    }
  }

  return client;
}

// =====================================================================
// OAuth flow
// =====================================================================

/**
 * Start Google OAuth flow.
 * Creates a local callback server and opens the browser.
 * Returns auth URL, or null on failure.
 */
export async function initiateGoogleAuth(email: string): Promise<{ authUrl: string } | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    log('error', 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
    return null;
  }

  const client = createOAuth2Client();

  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account consent',
    login_hint: email,
    scope: GOOGLE_SCOPES,
  });

  // Close any existing pending flow for this email
  const existing = pendingFlows.get(email);
  if (existing?.server) {
    try { existing.server.close(); } catch { /* ignore */ }
  }

  // Start callback server
  let resolveCode: ((code: string) => void) | null = null;
  const codePromise = new Promise<string>((resolve) => { resolveCode = resolve; });

  const state: { code: string | null; server: http.Server | null } = { code: null, server: null };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://localhost:${GOOGLE_OAUTH_PORT}`);
    const code = url.searchParams.get('code');

    if (code) {
      state.code = code;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Authentication successful! You can close this tab.</h2>');
      resolveCode?.(code);
    } else {
      res.writeHead(400);
      res.end('<h2>Authentication failed. No code received.</h2>');
    }
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.listen(GOOGLE_OAUTH_PORT, 'localhost', () => resolve());
      server.on('error', reject);
    });
  } catch (e) {
    log('error', `Could not start callback server on port ${GOOGLE_OAUTH_PORT}: ${e}`);
    return null;
  }

  state.server = server;
  pendingFlows.set(email, { client, server, code: null });

  // Store code promise for completion
  codePromise.then((code) => {
    const flow = pendingFlows.get(email);
    if (flow) flow.code = code;
  });

  // Auto-open browser
  try {
    await open(authUrl);
  } catch {
    log('warn', 'Could not open browser automatically');
  }

  log('info', `Google auth initiated for ${email}, callback server on port ${GOOGLE_OAUTH_PORT}`);
  return { authUrl };
}

/**
 * Complete Google OAuth after user has authorized in browser.
 */
export async function completeGoogleAuth(email: string): Promise<boolean> {
  const flow = pendingFlows.get(email);
  if (!flow) {
    log('error', `No pending Google auth flow for ${email}`);
    return false;
  }

  // Wait a moment for the code to arrive if not yet received
  if (!flow.code) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!flow.code) {
    log('error', `No authorization code received yet for ${email}`);
    return false;
  }

  try {
    const { tokens } = await flow.client.getToken(flow.code);
    flow.client.setCredentials(tokens);
    saveCredentials(email, tokens as Record<string, unknown>);
    log('info', `Google account ${email} authenticated successfully`);

    // Cleanup
    try { flow.server.close(); } catch { /* ignore */ }
    pendingFlows.delete(email);

    return true;
  } catch (e) {
    log('error', `Failed to exchange code for ${email}: ${e}`);
    try { flow.server.close(); } catch { /* ignore */ }
    pendingFlows.delete(email);
    return false;
  }
}

/**
 * Check if a Google account has valid credentials.
 */
export async function validateGoogleAccount(email: string): Promise<boolean> {
  const creds = await getCredentials(email);
  return creds !== null;
}
