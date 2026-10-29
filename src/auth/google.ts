/**
 * Google OAuth2 multi-account authentication.
 *
 * Port of productivity-mcp/auth/google_auth.py
 * Uses googleapis OAuth2Client with local callback server.
 */

import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { URL } from 'node:url';
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
} from '../config.js';
import { readTokenFile, writeTokenFile } from './store.js';
import { log } from '../utils/logger.js';

// =====================================================================
// Pending auth state (module-scoped, replaces Python's builtins hack)
// =====================================================================

interface PendingGoogleFlow {
  client: OAuth2Client;
  server: http.Server;
  code: string | null;
  callbackConsumed: boolean;
  exchanging: boolean;
}

const pendingFlows = new Map<string, PendingGoogleFlow>();

function cleanupPendingFlow(email: string, flow: PendingGoogleFlow): void {
  // An older exchange must never remove a replacement attempt.
  if (pendingFlows.get(email) === flow) pendingFlows.delete(email);
  try {
    flow.server.close();
  } catch {
    /* already closed */
  }
}

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
  client.setCredentials(
    tokenData as {
      access_token?: string;
      refresh_token?: string;
      expiry_date?: number;
      token_type?: string;
    },
  );

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
  const oauthState = randomBytes(32).toString('base64url');
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account consent',
    login_hint: email,
    scope: GOOGLE_SCOPES,
    state: oauthState,
  });

  const existing = pendingFlows.get(email);
  if (existing) cleanupPendingFlow(email, existing);

  const server = http.createServer((req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405, { Allow: 'GET' });
      res.end('Only GET callbacks are accepted.');
      return;
    }

    let url: URL;
    try {
      url = new URL(req.url ?? '/', `http://localhost:${GOOGLE_OAUTH_PORT}`);
    } catch {
      res.writeHead(400);
      res.end('Invalid callback URL.');
      return;
    }
    if (url.pathname !== '/code') {
      res.writeHead(404);
      res.end('Unknown callback path.');
      return;
    }

    const states = url.searchParams.getAll('state');
    const suppliedState = states[0];
    if (
      states.length !== 1 ||
      suppliedState === undefined ||
      Buffer.byteLength(suppliedState) !== Buffer.byteLength(oauthState) ||
      !timingSafeEqual(Buffer.from(suppliedState), Buffer.from(oauthState))
    ) {
      res.writeHead(400);
      res.end('Invalid authorization state.');
      return;
    }
    if (pendingFlows.get(email) !== flow || flow.callbackConsumed) {
      res.writeHead(409);
      res.end('This authorization attempt is no longer pending.');
      return;
    }
    if (url.searchParams.has('error')) {
      flow.callbackConsumed = true;
      res.writeHead(400);
      res.end('Authorization was not completed. Start a new attempt.');
      cleanupPendingFlow(email, flow);
      return;
    }

    const codes = url.searchParams.getAll('code');
    const code = codes[0];
    if (codes.length !== 1 || code === undefined || !code.trim()) {
      res.writeHead(400);
      res.end('A single authorization code is required.');
      return;
    }

    flow.callbackConsumed = true;
    flow.code = code;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>Authorization received. You can close this tab and complete authentication.</h2>');
  });
  const flow: PendingGoogleFlow = {
    client,
    server,
    code: null,
    callbackConsumed: false,
    exchanging: false,
  };
  pendingFlows.set(email, flow);

  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(GOOGLE_OAUTH_PORT, 'localhost', () => resolve());
    });
  } catch (e) {
    log('error', `Could not start OAuth callback server on the configured GOOGLE_OAUTH_PORT: ${e}`);
    cleanupPendingFlow(email, flow);
    return null;
  }
  if (pendingFlows.get(email) !== flow) {
    cleanupPendingFlow(email, flow);
    return null;
  }

  try {
    await open(authUrl);
  } catch {
    log('warn', 'Could not open browser automatically');
  }
  if (pendingFlows.get(email) !== flow) return null;

  log(
    'info',
    `Google auth initiated for ${email}, callback server listening on the configured GOOGLE_OAUTH_PORT`,
  );
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

  if (!flow.code && !flow.exchanging) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (pendingFlows.get(email) !== flow || !flow.code || flow.exchanging) {
    log('error', `No unconsumed authorization code is ready for ${email}`);
    return false;
  }

  const code = flow.code;
  flow.code = null;
  flow.exchanging = true;
  try {
    const { tokens } = await flow.client.getToken(code);
    if (pendingFlows.get(email) !== flow) return false;
    flow.client.setCredentials(tokens);
    saveCredentials(email, tokens as Record<string, unknown>);
    log('info', `Google account ${email} authenticated successfully`);
    return true;
  } catch {
    log('error', `Failed to exchange authorization code for ${email}`);
    return false;
  } finally {
    cleanupPendingFlow(email, flow);
  }
}

/**
 * Check if a Google account has valid credentials.
 */
export async function validateGoogleAccount(email: string): Promise<boolean> {
  const creds = await getCredentials(email);
  return creds !== null;
}
