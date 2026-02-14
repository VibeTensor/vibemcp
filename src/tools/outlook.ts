/**
 * Outlook / Microsoft 365 Mail Tool Handlers
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { MicrosoftMailService } from '../services/ms-mail.js';
import { getServiceAsync } from '../services/cache.js';
import { formatOutput } from '../toon/encoder.js';
import { logError, ErrorCategory } from '../utils/logger.js';

async function getOutlook(account: string): Promise<MicrosoftMailService> {
  return getServiceAsync(`MicrosoftMailService:${account}`, () => MicrosoftMailService.create(account));
}

export function registerOutlookTools(server: McpServer): void {

  // ===================================================================
  // List Messages
  // ===================================================================

  server.tool(
    'outlook_list_messages',
    'List Outlook messages with TOON-optimized output. Supports folder filtering.',
    {
      account: z.string().email().describe('Microsoft account email'),
      folderId: z.string().default('inbox').describe('Folder ID or well-known name (inbox, sentitems, drafts, etc.)'),
      top: z.coerce.number().min(1).max(1000).default(10).describe('Max messages'),
      filter: z.string().optional().describe('OData $filter query'),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ account, folderId, top, filter, format }) => {
      try {
        const svc = await getOutlook(account);
        const messages = await svc.listMessages(folderId, top, filter);

        if (messages.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No messages found.' }] };
        }

        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(messages, format, 'messages', ['id', 'subject', 'from', 'receivedDateTime', 'isRead', 'preview']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_list_messages', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Get Message
  // ===================================================================

  server.tool(
    'outlook_get_message',
    'Get full Outlook message by ID.',
    {
      account: z.string().email().describe('Microsoft account email'),
      messageId: z.string().describe('Message ID'),
      format: z.enum(['toon', 'json']).default('json'),
    },
    async ({ account, messageId, format }) => {
      try {
        const svc = await getOutlook(account);
        const msg = await svc.getMessage(messageId);
        return {
          content: [{
            type: 'text' as const,
            text: format === 'json' ? JSON.stringify(msg, null, 2) : formatOutput(msg, 'toon', 'message'),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_get_message', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Send Message
  // ===================================================================

  server.tool(
    'outlook_send_message',
    'Send an email via Microsoft 365 Outlook.',
    {
      account: z.string().email().describe('Microsoft account email'),
      to: z.array(z.string().email()).describe('Recipient emails'),
      subject: z.string(),
      body: z.string(),
      cc: z.array(z.string().email()).optional(),
    },
    async ({ account, to, subject, body, cc }) => {
      try {
        const svc = await getOutlook(account);
        const result = await svc.sendMessage(to, subject, body, cc);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_send_message', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Reply to Message
  // ===================================================================

  server.tool(
    'outlook_reply_to_message',
    'Reply to an Outlook message.',
    {
      account: z.string().email().describe('Microsoft account email'),
      messageId: z.string().describe('Message ID to reply to'),
      comment: z.string().describe('Reply content'),
    },
    async ({ account, messageId, comment }) => {
      try {
        const svc = await getOutlook(account);
        const result = await svc.replyMessage(messageId, comment);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_reply_to_message', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Forward Message
  // ===================================================================

  server.tool(
    'outlook_forward_message',
    'Forward an Outlook message.',
    {
      account: z.string().email().describe('Microsoft account email'),
      messageId: z.string().describe('Message ID to forward'),
      to: z.array(z.string().email()).describe('Forward recipients'),
      comment: z.string().optional().describe('Optional message to prepend'),
    },
    async ({ account, messageId, to, comment }) => {
      try {
        const svc = await getOutlook(account);
        const result = await svc.forwardMessage(messageId, to, comment);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_forward_message', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // List Folders
  // ===================================================================

  server.tool(
    'outlook_list_folders',
    'List Outlook mail folders.',
    {
      account: z.string().email().describe('Microsoft account email'),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ account, format }) => {
      try {
        const svc = await getOutlook(account);
        const folders = await svc.listFolders();
        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(folders, format, 'folders', ['id', 'displayName', 'totalItemCount', 'unreadItemCount']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_list_folders', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Move Message
  // ===================================================================

  server.tool(
    'outlook_move_message',
    'Move an Outlook message to a different folder.',
    {
      account: z.string().email().describe('Microsoft account email'),
      messageId: z.string().describe('Message ID'),
      destinationFolderId: z.string().describe('Destination folder ID'),
    },
    async ({ account, messageId, destinationFolderId }) => {
      try {
        const svc = await getOutlook(account);
        const result = await svc.moveMessage(messageId, destinationFolderId);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_move_message', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );

  // ===================================================================
  // Search Messages
  // ===================================================================

  server.tool(
    'outlook_search',
    'Search Outlook messages using KQL.',
    {
      account: z.string().email().describe('Microsoft account email'),
      query: z.string().describe('KQL search query'),
      top: z.coerce.number().min(1).max(1000).default(10),
      format: z.enum(['toon', 'json']).default('toon'),
    },
    async ({ account, query, top, format }) => {
      try {
        const svc = await getOutlook(account);
        const messages = await svc.searchMessages(query, top);
        return {
          content: [{
            type: 'text' as const,
            text: formatOutput(messages, format, 'messages', ['id', 'subject', 'from', 'receivedDateTime', 'preview']),
          }],
        };
      } catch (e) {
        return { content: [{ type: 'text' as const, text: logError('outlook_search', e as Error, ErrorCategory.MS_MAIL) }], isError: true };
      }
    },
  );
}
