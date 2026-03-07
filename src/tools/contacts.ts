/**
 * Contact Resolution Tool Handlers
 *
 * Registers contact search and resolution MCP tools with TOON-optimized output.
 * Supports both Google People API and Microsoft Graph contacts.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GoogleContactsService } from '../services/google-contacts.js';
import { MicrosoftContactsService } from '../services/ms-contacts.js';
import { getServiceAsync } from '../services/cache.js';
import { loadAccounts } from '../config.js';
import { formatOutput } from '../toon/encoder.js';
import { logError, ErrorCategory } from '../utils/logger.js';

// =====================================================================
// Service helpers
// =====================================================================

async function getGoogleContacts(account: string): Promise<GoogleContactsService> {
  return getServiceAsync(`GoogleContactsService:${account}`, () =>
    GoogleContactsService.create(account),
  );
}

async function getMSContacts(account: string): Promise<MicrosoftContactsService> {
  return getServiceAsync(`MicrosoftContactsService:${account}`, () =>
    MicrosoftContactsService.create(account),
  );
}

/**
 * Detect whether an account is a Google or Microsoft account
 * by checking the accounts registry first, then falling back
 * to domain-based heuristics.
 */
export function detectProvider(account: string): 'google' | 'microsoft' {
  const data = loadAccounts();
  if (data.google_accounts.some((a) => a.email === account)) return 'google';
  if (data.microsoft_accounts.some((a) => a.email === account)) return 'microsoft';

  const domain = account.split('@')[1]?.toLowerCase() ?? '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return 'google';
  return 'microsoft';
}

// =====================================================================
// Tool Registration
// =====================================================================

export function registerContactTools(server: McpServer): void {
  // ===================================================================
  // Contact Search
  // ===================================================================

  server.tool(
    'contact_search',
    'Search contacts by name or email across Google or Microsoft. Uses Google People API search or Microsoft Graph /me/people endpoint.',
    {
      account: z
        .string()
        .email()
        .describe('Email of the authenticated account to search contacts from'),
      query: z.string().describe('Search query (name or email)'),
      max_results: z.coerce.number().min(1).max(100).default(10).describe('Max results to return'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format (toon saves 50% tokens)'),
    },
    async ({ account, query, max_results, format }) => {
      try {
        const provider = detectProvider(account);
        let contacts;
        if (provider === 'google') {
          const svc = await getGoogleContacts(account);
          contacts = await svc.listContacts(max_results, query);
        } else {
          const svc = await getMSContacts(account);
          contacts = await svc.searchPeople(query, max_results);
        }

        if (contacts.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No contacts found.' }] };
        }

        const text = formatOutput(contacts, format, 'contacts', ['email', 'name']);
        return { content: [{ type: 'text' as const, text }] };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('contact_search', e as Error, ErrorCategory.UNIFIED),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Resolve Email Addresses to Names
  // ===================================================================

  server.tool(
    'resolve_contacts',
    'Resolve email addresses to display names using the account contacts. Useful for enriching email threads with sender names.',
    {
      account: z.string().email().describe('Email of the authenticated account'),
      emails: z.array(z.string().email()).min(1).max(50).describe('Email addresses to resolve'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format (toon saves 50% tokens)'),
    },
    async ({ account, emails, format }) => {
      try {
        const provider = detectProvider(account);
        let results;
        if (provider === 'google') {
          const svc = await getGoogleContacts(account);
          results = await svc.resolveEmails(emails);
        } else {
          const svc = await getMSContacts(account);
          results = await svc.resolveEmails(emails);
        }

        const text = formatOutput(results, format, 'contacts', ['email', 'name']);
        return { content: [{ type: 'text' as const, text }] };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('resolve_contacts', e as Error, ErrorCategory.UNIFIED),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // List All Contacts
  // ===================================================================

  server.tool(
    'contact_list',
    'List contacts from a Google or Microsoft account. Returns email, name, and provider-specific metadata.',
    {
      account: z.string().email().describe('Email of the authenticated account'),
      max_results: z.coerce
        .number()
        .min(1)
        .max(250)
        .default(50)
        .describe('Maximum contacts to return'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format (toon saves 50% tokens)'),
    },
    async ({ account, max_results, format }) => {
      try {
        const provider = detectProvider(account);
        let contacts;
        if (provider === 'google') {
          const svc = await getGoogleContacts(account);
          contacts = await svc.listContacts(max_results);
        } else {
          const svc = await getMSContacts(account);
          contacts = await svc.listContacts(max_results);
        }

        if (contacts.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No contacts found.' }] };
        }

        const text = formatOutput(contacts, format, 'contacts', ['email', 'name']);
        return { content: [{ type: 'text' as const, text }] };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('contact_list', e as Error, ErrorCategory.UNIFIED),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
