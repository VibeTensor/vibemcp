/**
 * Unified / Cross-Account Tool Handlers
 *
 * Tools that work across all configured Gmail + Outlook accounts.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GmailService } from '../services/gmail.js';
import { MicrosoftMailService } from '../services/ms-mail.js';
import { GoogleCalendarService } from '../services/google-calendar.js';
import { MicrosoftCalendarService } from '../services/ms-calendar.js';
import { getServiceAsync } from '../services/cache.js';
import { loadAccounts } from '../config.js';
import { formatOutput } from '../toon/encoder.js';
import { logError, ErrorCategory } from '../utils/logger.js';

export function registerUnifiedTools(server: McpServer): void {

  // ===================================================================
  // Unified Search — search across all email accounts
  // ===================================================================

  server.tool(
    'unified_search',
    'Search across all configured email accounts (Gmail + Outlook) simultaneously. Returns combined results with TOON output.',
    {
      query: z.string().describe('Search query'),
      maxPerAccount: z.coerce.number().min(1).max(50).default(5).describe('Max results per account'),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ query, maxPerAccount, format }) => {
      try {
        const accounts = loadAccounts();
        const allResults: Array<Record<string, unknown>> = [];

        // Search Gmail accounts
        const gmailPromises = accounts.google_accounts.map(async (acc) => {
          try {
            const svc = await getServiceAsync(`GmailService:${acc.email}`, () => GmailService.create(acc.email));
            const emails = await svc.searchEmails(query, maxPerAccount);
            return emails.map(e => ({ ...e, _account: acc.email, _provider: 'gmail' }));
          } catch {
            return [{ _account: acc.email, _provider: 'gmail', error: 'Failed to search' }];
          }
        });

        // Search Outlook accounts
        const outlookPromises = accounts.microsoft_accounts.map(async (acc) => {
          try {
            const svc = await getServiceAsync(`MicrosoftMailService:${acc.email}`, () => MicrosoftMailService.create(acc.email));
            const messages = await svc.searchMessages(query, maxPerAccount);
            return messages.map(m => ({ ...m, _account: acc.email, _provider: 'outlook' }));
          } catch {
            return [{ _account: acc.email, _provider: 'outlook', error: 'Failed to search' }];
          }
        });

        const results = await Promise.all([...gmailPromises, ...outlookPromises]);
        for (const batch of results) {
          allResults.push(...batch);
        }

        if (allResults.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No results found across any account.' }] };
        }

        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(allResults, format, 'unified_results', ['_account', '_provider', 'subject', 'from', 'date']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('unified_search', e as Error, ErrorCategory.UNIFIED) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Unified Inbox — aggregated unread view
  // ===================================================================

  server.tool(
    'unified_inbox',
    'Get unread messages across all configured email accounts.',
    {
      maxPerAccount: z.coerce.number().min(1).max(50).default(10),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ maxPerAccount, format }) => {
      try {
        const accounts = loadAccounts();
        const allResults: Array<Record<string, unknown>> = [];

        // Gmail unread
        const gmailPromises = accounts.google_accounts.map(async (acc) => {
          try {
            const svc = await getServiceAsync(`GmailService:${acc.email}`, () => GmailService.create(acc.email));
            const emails = await svc.searchEmails('is:unread', maxPerAccount);
            return emails.map(e => ({ ...e, _account: acc.email, _provider: 'gmail' }));
          } catch {
            return [];
          }
        });

        // Outlook unread
        const outlookPromises = accounts.microsoft_accounts.map(async (acc) => {
          try {
            const svc = await getServiceAsync(`MicrosoftMailService:${acc.email}`, () => MicrosoftMailService.create(acc.email));
            const messages = await svc.listMessages('inbox', maxPerAccount, 'isRead eq false');
            return messages.map(m => ({ ...m, _account: acc.email, _provider: 'outlook' }));
          } catch {
            return [];
          }
        });

        const results = await Promise.all([...gmailPromises, ...outlookPromises]);
        for (const batch of results) {
          allResults.push(...batch);
        }

        if (allResults.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No unread messages across any account.' }] };
        }

        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(allResults, format, 'unread_messages', ['_account', '_provider', 'subject', 'from']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('unified_inbox', e as Error, ErrorCategory.UNIFIED) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Unified Calendar — merged calendar view
  // ===================================================================

  server.tool(
    'unified_calendar',
    'Get calendar events across all accounts (Google Calendar + Outlook) in a time range.',
    {
      timeMin: z.string().describe('Start time (ISO 8601)'),
      timeMax: z.string().describe('End time (ISO 8601)'),
      maxPerAccount: z.coerce.number().min(1).max(50).default(20),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ timeMin, timeMax, maxPerAccount, format }) => {
      try {
        const accounts = loadAccounts();
        const allEvents: Array<Record<string, unknown>> = [];

        // Google Calendar
        const gcalPromises = accounts.google_accounts.map(async (acc) => {
          try {
            const svc = await getServiceAsync(`GoogleCalendarService:${acc.email}`, () => GoogleCalendarService.create(acc.email));
            const events = await svc.getEvents(timeMin, timeMax, 'primary', maxPerAccount);
            return events.map(e => ({ ...e, _account: acc.email, _provider: 'google' }));
          } catch {
            return [];
          }
        });

        // Outlook Calendar
        const msCalPromises = accounts.microsoft_accounts.map(async (acc) => {
          try {
            const svc = await getServiceAsync(`MicrosoftCalendarService:${acc.email}`, () => MicrosoftCalendarService.create(acc.email));
            const events = await svc.getEvents(timeMin, timeMax, undefined, maxPerAccount);
            return events.map(e => ({ ...e, _account: acc.email, _provider: 'microsoft' }));
          } catch {
            return [];
          }
        });

        const results = await Promise.all([...gcalPromises, ...msCalPromises]);
        for (const batch of results) {
          allEvents.push(...batch);
        }

        if (allEvents.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No events found across any account in the given time range.' }] };
        }

        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(allEvents, format, 'events', ['_account', '_provider', 'summary', 'subject', 'start', 'end']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('unified_calendar', e as Error, ErrorCategory.UNIFIED) }], isError: true };
      }
    },
  );
}
