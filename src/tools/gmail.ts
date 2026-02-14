/**
 * Gmail Tool Handlers
 *
 * Registers Gmail MCP tools with TOON-optimized output.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { GmailService } from '../services/gmail.js';
import { getServiceAsync } from '../services/cache.js';
import { formatOutput } from '../toon/encoder.js';
import { logError, ErrorCategory } from '../utils/logger.js';

async function getGmail(account: string): Promise<GmailService> {
  return getServiceAsync(`GmailService:${account}`, () => GmailService.create(account));
}

export function registerGmailTools(server: McpServer): void {

  // ===================================================================
  // List Messages
  // ===================================================================

  server.tool(
    'gmail_list_messages',
    'List Gmail messages with TOON-optimized output. Supports Gmail search operators (e.g., "is:unread from:john@example.com").',
    {
      account: z.string().email().describe('Google account email'),
      query: z.string().optional().describe('Gmail search query'),
      maxResults: z.coerce.number().min(1).max(500).default(10).describe('Max messages to return'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format (toon saves 50% tokens)'),
    },
    async ({ account, query, maxResults, format }) => {
      try {
        const svc = await getGmail(account);
        const emails = await svc.searchEmails(query ?? '', maxResults);

        if (emails.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No messages found.' }] };
        }

        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(emails, format, 'messages', ['id', 'subject', 'from', 'date', 'snippet']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_list_messages', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Get Message
  // ===================================================================

  server.tool(
    'gmail_get_message',
    'Get full Gmail message content by ID including body and attachments.',
    {
      account: z.string().email().describe('Google account email'),
      messageId: z.string().describe('Gmail message ID'),
      format: z.enum(['toon', 'json']).default('json').describe('Output format'),
    },
    async ({ account, messageId, format }) => {
      try {
        const svc = await getGmail(account);
        const email = await svc.getEmail(messageId);

        return {
          content: [{
            type: 'text' as const,
            text: format === 'json'
              ? JSON.stringify(email, null, 2)
              : formatOutput(email, 'toon', 'message'),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_get_message', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Send Message
  // ===================================================================

  server.tool(
    'gmail_send_message',
    'Send an email via Gmail with proper RFC 2822 threading support.',
    {
      account: z.string().email().describe('Google account email'),
      to: z.string().describe('Recipient email(s), comma-separated'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body (plain text)'),
      cc: z.string().optional().describe('CC recipients, comma-separated'),
    },
    async ({ account, to, subject, body, cc }) => {
      try {
        const svc = await getGmail(account);
        const result = await svc.sendEmail(to, subject, body, cc);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_send_message', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Reply to Message
  // ===================================================================

  server.tool(
    'gmail_reply_to_message',
    'Reply to an existing Gmail message with automatic threading (In-Reply-To, References headers).',
    {
      account: z.string().email().describe('Google account email'),
      messageId: z.string().describe('Original message ID to reply to'),
      body: z.string().describe('Reply body (plain text)'),
      send: z.boolean().default(false).describe('True to send immediately, false to save as draft'),
      cc: z.string().optional().describe('CC recipients'),
    },
    async ({ account, messageId, body, send, cc }) => {
      try {
        const svc = await getGmail(account);
        const result = await svc.reply(messageId, body, send, cc);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_reply_to_message', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Create Draft
  // ===================================================================

  server.tool(
    'gmail_create_draft',
    'Create a new Gmail draft.',
    {
      account: z.string().email().describe('Google account email'),
      to: z.string().describe('Recipient email(s)'),
      subject: z.string().describe('Email subject'),
      body: z.string().describe('Email body'),
      cc: z.string().optional().describe('CC recipients'),
    },
    async ({ account, to, subject, body, cc }) => {
      try {
        const svc = await getGmail(account);
        const result = await svc.createDraft(to, subject, body, cc);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_create_draft', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // List Labels
  // ===================================================================

  server.tool(
    'gmail_list_labels',
    'List all Gmail labels.',
    {
      account: z.string().email().describe('Google account email'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ account, format }) => {
      try {
        const svc = await getGmail(account);
        const labels = await svc.listLabels();
        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(labels, format, 'labels', ['id', 'name', 'type']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_list_labels', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // List Threads
  // ===================================================================

  server.tool(
    'gmail_list_threads',
    'List email threads with TOON-optimized output.',
    {
      account: z.string().email().describe('Google account email'),
      query: z.string().optional().describe('Gmail search query'),
      maxResults: z.coerce.number().min(1).max(500).default(10),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ account, query, maxResults, format }) => {
      try {
        const svc = await getGmail(account);
        const threads = await svc.listThreads(query ?? '', maxResults);
        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(threads, format, 'threads', ['id', 'snippet']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_list_threads', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Get Thread
  // ===================================================================

  server.tool(
    'gmail_get_thread',
    'Get full conversation thread with all messages.',
    {
      account: z.string().email().describe('Google account email'),
      threadId: z.string().describe('Gmail thread ID'),
      format: z.enum(['toon', 'json']).default('json'),
    },
    async ({ account, threadId, format }) => {
      try {
        const svc = await getGmail(account);
        const thread = await svc.getThread(threadId);

        if (format === 'json') {
          return { content: [{ type: 'text' as const, text: JSON.stringify(thread, null, 2) }] };
        }

        // TOON: show thread messages as array
        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(thread.messages, 'toon', 'thread_messages', ['id', 'from', 'subject', 'date', 'snippet']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('gmail_get_thread', e as Error, ErrorCategory.GMAIL) }], isError: true };
      }
    },
  );
}
