/**
 * Account Management + Config Tools
 *
 * Port of productivity-mcp/tools/account_tools.py
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import {
  loadAccounts,
  addGoogleAccount,
  addMicrosoftAccount,
  removeGoogleAccount,
  removeMicrosoftAccount,
  GOOGLE_CLIENT_ID,
  AZURE_CLIENT_ID,
  DEFAULT_OUTPUT_FORMAT,
} from '../config.js';
import { initiateGoogleAuth, completeGoogleAuth, validateGoogleAccount } from '../auth/google.js';
import { initiateDeviceFlow, completeDeviceFlow, validateMicrosoftAccount, listCachedAccounts } from '../auth/microsoft.js';
import { logError, ErrorCategory } from '../utils/logger.js';
import { formatOutput } from '../toon/encoder.js';

export function registerAdminTools(server: McpServer): void {

  // ===================================================================
  // List Accounts
  // ===================================================================

  server.tool(
    'list_accounts',
    'List all connected Google and Microsoft accounts with their auth status.',
    {
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ format }) => {
      try {
        const data = loadAccounts();
        const result: Record<string, unknown>[] = [];

        for (const acc of data.google_accounts) {
          const valid = await validateGoogleAccount(acc.email);
          result.push({
            provider: 'google',
            email: acc.email,
            type: acc.accountType,
            authenticated: valid,
          });
        }

        for (const acc of data.microsoft_accounts) {
          const valid = await validateMicrosoftAccount(acc.email);
          result.push({
            provider: 'microsoft',
            email: acc.email,
            type: acc.accountType,
            authenticated: valid,
          });
        }

        return {
          content: [{
            type: 'text' as const,
            text: result.length > 0
              ? formatOutput(result, format, 'accounts', ['provider', 'email', 'type', 'authenticated'])
              : 'No accounts configured. Use add_google_account or add_microsoft_account to get started.',
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('list_accounts', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Add Google Account
  // ===================================================================

  server.tool(
    'add_google_account',
    'Add a Google account and start OAuth flow. Opens browser for sign-in. Call complete_google_auth after signing in.',
    {
      email: z.string().email().describe('Google account email (e.g., user@gmail.com)'),
      accountType: z.enum(['personal', 'work']).default('personal'),
      extraInfo: z.string().optional().describe('Description of the account'),
    },
    async ({ email, accountType, extraInfo }) => {
      try {
        addGoogleAccount(email, accountType, extraInfo ?? '');

        const result = await initiateGoogleAuth(email);
        if (!result) {
          return {
            content: [{ type: 'text' as const, text: 'Failed: Could not start Google OAuth. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'pending_auth',
              email,
              instruction: 'A browser window should have opened. Sign in and grant access.',
              auth_url: result.authUrl,
              next_step: `After signing in, call complete_google_auth with email='${email}'`,
            }, null, 2),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('add_google_account', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Complete Google Auth
  // ===================================================================

  server.tool(
    'complete_google_auth',
    'Complete Google authentication after user has signed in via the OAuth URL.',
    {
      email: z.string().email().describe('Google account email from add_google_account'),
    },
    async ({ email }) => {
      try {
        const success = await completeGoogleAuth(email);
        if (success) {
          return { content: [{ type: 'text' as const, text: `authenticated:${email}` }] };
        }
        return {
          content: [{ type: 'text' as const, text: `failed:Authentication not complete for ${email}. Make sure you signed in and granted access in the browser, then try again.` }],
          isError: true,
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('complete_google_auth', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Add Microsoft Account
  // ===================================================================

  server.tool(
    'add_microsoft_account',
    'Add a Microsoft account using Device Code Flow. Returns a code the user must enter at a URL. Call complete_microsoft_auth after entering the code.',
    {
      email: z.string().email().describe('Microsoft account email (e.g., user@outlook.com)'),
      accountType: z.enum(['personal', 'business']).default('business'),
      extraInfo: z.string().optional().describe('Description of the account'),
    },
    async ({ email, accountType, extraInfo }) => {
      try {
        addMicrosoftAccount(email, accountType, extraInfo ?? '');

        const result = await initiateDeviceFlow(email);
        if (!result) {
          return {
            content: [{ type: 'text' as const, text: 'Failed: Could not start device flow. Check MICROSOFT_CLIENT_ID in .env' }],
            isError: true,
          };
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              status: 'pending_auth',
              email,
              instruction: `Go to ${result.verificationUri} and enter the code below:`,
              user_code: result.userCode,
              verification_uri: result.verificationUri,
              next_step: `After entering the code, call complete_microsoft_auth with email='${email}'`,
            }, null, 2),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('add_microsoft_account', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Complete Microsoft Auth
  // ===================================================================

  server.tool(
    'complete_microsoft_auth',
    'Complete Microsoft authentication after user has entered the device code.',
    {
      email: z.string().email().describe('Microsoft account email from add_microsoft_account'),
    },
    async ({ email }) => {
      try {
        const token = await completeDeviceFlow(email);
        if (token) {
          return { content: [{ type: 'text' as const, text: `authenticated:${email}` }] };
        }
        return {
          content: [{ type: 'text' as const, text: `failed:Authentication failed for ${email}. The code may have expired - try add_microsoft_account again.` }],
          isError: true,
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('complete_microsoft_auth', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Remove Account
  // ===================================================================

  server.tool(
    'remove_account',
    'Remove a connected account.',
    {
      email: z.string().email().describe('Account email to remove'),
      provider: z.enum(['google', 'microsoft', 'auto']).default('auto').describe('Provider, or auto to detect'),
    },
    async ({ email, provider }) => {
      try {
        let removed = false;
        if (provider === 'auto' || provider === 'google') {
          removed = removeGoogleAccount(email);
        }
        if (!removed && (provider === 'auto' || provider === 'microsoft')) {
          removed = removeMicrosoftAccount(email);
        }

        if (removed) {
          return { content: [{ type: 'text' as const, text: `removed:${email}` }] };
        }
        return { content: [{ type: 'text' as const, text: `not_found:${email} not found in any provider` }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('remove_account', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Account Status
  // ===================================================================

  server.tool(
    'accounts_status',
    'Check authentication status of all accounts and server configuration.',
    {},
    async () => {
      try {
        const data = loadAccounts();
        const cached = await listCachedAccounts();

        const status = {
          configuration: {
            google_oauth_configured: Boolean(GOOGLE_CLIENT_ID),
            azure_configured: Boolean(AZURE_CLIENT_ID),
            default_format: DEFAULT_OUTPUT_FORMAT,
          },
          google_accounts: await Promise.all(
            data.google_accounts.map(async acc => ({
              email: acc.email,
              type: acc.accountType,
              valid: await validateGoogleAccount(acc.email),
            })),
          ),
          microsoft_accounts: await Promise.all(
            data.microsoft_accounts.map(async acc => ({
              email: acc.email,
              type: acc.accountType,
              valid: await validateMicrosoftAccount(acc.email),
            })),
          ),
          microsoft_cached_accounts: cached,
        };

        return { content: [{ type: 'text' as const, text: JSON.stringify(status, null, 2) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('accounts_status', e as Error, ErrorCategory.ACCOUNT) }], isError: true };
      }
    },
  );
}
