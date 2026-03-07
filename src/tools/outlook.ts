/**
 * Outlook / Microsoft 365 Mail Tool Handlers
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { MicrosoftMailService } from '../services/ms-mail.js';
import { getServiceAsync } from '../services/cache.js';
import { formatOutput, encodeToonSingle } from '../toon/encoder.js';
import { logError, ErrorCategory } from '../utils/logger.js';

async function getOutlook(account: string): Promise<MicrosoftMailService> {
  return getServiceAsync(`MicrosoftMailService:${account}`, () =>
    MicrosoftMailService.create(account),
  );
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
      folderId: z
        .string()
        .default('inbox')
        .describe('Folder ID or well-known name (inbox, sentitems, drafts, etc.)'),
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
          content: [
            {
              type: 'text' as const,
              text: formatOutput(messages, format, 'messages', [
                'id',
                'subject',
                'from',
                'receivedDateTime',
                'isRead',
                'preview',
              ]),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_list_messages', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
          content: [
            {
              type: 'text' as const,
              text:
                format === 'json'
                  ? JSON.stringify(msg, null, 2)
                  : formatOutput(msg, 'toon', 'message'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_get_message', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_send_message', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_reply_to_message', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_forward_message', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
          content: [
            {
              type: 'text' as const,
              text: formatOutput(folders, format, 'folders', [
                'id',
                'displayName',
                'totalItemCount',
                'unreadItemCount',
              ]),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_list_folders', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_move_message', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
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
          content: [
            {
              type: 'text' as const,
              text: formatOutput(messages, format, 'messages', [
                'id',
                'subject',
                'from',
                'receivedDateTime',
                'preview',
              ]),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_search', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // List Categories
  // ===================================================================

  server.tool(
    'outlook_list_categories',
    'List all Outlook mail categories for the account.',
    {
      account: z.string().email().describe('Microsoft account email'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ account, format }) => {
      try {
        const svc = await getOutlook(account);
        const categories = await svc.listCategories();

        if (categories.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No categories found.' }] };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(categories, format, 'categories', ['id', 'displayName', 'color']),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_list_categories', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Set Categories
  // ===================================================================

  server.tool(
    'outlook_set_categories',
    'Set categories on an Outlook message.',
    {
      account: z.string().email().describe('Microsoft account email'),
      message_id: z.string().describe('Message ID to categorize'),
      categories: z.array(z.string()).describe('List of category names to apply'),
    },
    async ({ account, message_id, categories }) => {
      try {
        const svc = await getOutlook(account);
        await svc.setMessageCategories(message_id, categories);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ status: 'categories_set', categories }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_set_categories', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Set Flag
  // ===================================================================

  server.tool(
    'outlook_set_flag',
    'Set a follow-up flag on an Outlook message.',
    {
      account: z.string().email().describe('Microsoft account email'),
      message_id: z.string().describe('Message ID to flag'),
      status: z.enum(['flagged', 'complete', 'notFlagged']).describe('Flag status to set'),
      due_date: z.string().optional().describe('Due date for flagged items in ISO 8601 format'),
    },
    async ({ account, message_id, status, due_date }) => {
      try {
        const svc = await getOutlook(account);
        await svc.setMessageFlag(message_id, status, due_date);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ status: 'flag_set', flagStatus: status }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_set_flag', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Batch Update
  // ===================================================================

  server.tool(
    'outlook_batch_update',
    'Batch update multiple Outlook messages at once. Supports marking read/unread, archiving, and moving.',
    {
      account: z.string().email().describe('Microsoft account email'),
      message_ids: z.array(z.string()).min(1).max(100).describe('Array of message IDs to update'),
      action: z
        .enum(['mark_read', 'mark_unread', 'archive', 'move'])
        .describe('Action to perform on all messages'),
      destination_folder: z.string().optional().describe('Folder ID for move action'),
    },
    async ({ account, message_ids, action, destination_folder }) => {
      try {
        const svc = await getOutlook(account);

        let result: { updated: number } = { updated: 0 };

        switch (action) {
          case 'mark_read':
            result = await svc.batchUpdate(message_ids, { isRead: true });
            break;
          case 'mark_unread':
            result = await svc.batchUpdate(message_ids, { isRead: false });
            break;
          case 'archive': {
            result = await svc.batchUpdate(message_ids, {
              destinationId: 'archive',
            });
            break;
          }
          case 'move': {
            if (!destination_folder) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: 'Error: destination_folder is required for move action.',
                  },
                ],
                isError: true,
              };
            }
            result = await svc.batchUpdate(message_ids, {
              destinationId: destination_folder,
            });
            break;
          }
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ status: action, ...result }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_batch_update', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Download Attachment
  // ===================================================================

  server.tool(
    'outlook_download_attachment',
    'Download a specific attachment from an Outlook message.',
    {
      account: z.string().email().describe('Microsoft account email'),
      message_id: z.string().describe('Message ID containing the attachment'),
      attachment_id: z.string().describe('Attachment ID to download'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ account, message_id, attachment_id, format }) => {
      try {
        const svc = await getOutlook(account);
        const attachment = await svc.downloadAttachment(message_id, attachment_id);

        return {
          content: [
            {
              type: 'text' as const,
              text:
                format === 'json'
                  ? JSON.stringify(attachment, null, 2)
                  : encodeToonSingle(
                      'attachment',
                      attachment as unknown as Record<string, unknown>,
                    ),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_download_attachment', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // List Attachments
  // ===================================================================

  server.tool(
    'outlook_list_attachments',
    'List all attachments on an Outlook message.',
    {
      account: z.string().email().describe('Microsoft account email'),
      message_id: z.string().describe('Message ID to list attachments for'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ account, message_id, format }) => {
      try {
        const svc = await getOutlook(account);
        const attachments = await svc.listAttachments(message_id);

        if (attachments.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No attachments found.' }] };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(attachments, format, 'attachments', [
                'id',
                'name',
                'contentType',
                'size',
              ]),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_list_attachments', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Get Auto-Reply
  // ===================================================================

  server.tool(
    'outlook_get_auto_reply',
    'Get the current auto-reply (out-of-office) settings for an Outlook account.',
    {
      account: z.string().email().describe('Microsoft account email'),
      format: z.enum(['toon', 'json']).default('toon').describe('Output format'),
    },
    async ({ account, format }) => {
      try {
        const svc = await getOutlook(account);
        const settings = await svc.getAutoReply();

        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(settings, format, 'autoReplySettings'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_get_auto_reply', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Set Auto-Reply
  // ===================================================================

  server.tool(
    'outlook_set_auto_reply',
    'Configure auto-reply (out-of-office) settings for an Outlook account.',
    {
      account: z.string().email().describe('Microsoft account email'),
      status: z.enum(['disabled', 'alwaysEnabled', 'scheduled']).describe('Auto-reply status'),
      internal_message: z.string().optional().describe('Reply message for internal senders'),
      external_message: z.string().optional().describe('Reply message for external senders'),
      external_audience: z
        .enum(['none', 'contactsOnly', 'all'])
        .optional()
        .describe('Who receives the external reply'),
      start_date: z
        .string()
        .optional()
        .describe('Start date for scheduled auto-reply in ISO 8601 format'),
      end_date: z
        .string()
        .optional()
        .describe('End date for scheduled auto-reply in ISO 8601 format'),
    },
    async ({
      account,
      status,
      internal_message,
      external_message,
      external_audience,
      start_date,
      end_date,
    }) => {
      try {
        if (status === 'scheduled' && (!start_date || !end_date)) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'Error: start_date and end_date are required when status is "scheduled".',
              },
            ],
            isError: true,
          };
        }
        const svc = await getOutlook(account);
        const result = await svc.setAutoReply({
          status,
          internalReplyMessage: internal_message,
          externalReplyMessage: external_message,
          externalAudience: external_audience,
          startDateTime: start_date,
          endDateTime: end_date,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ action: 'auto_reply_configured', ...result }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('outlook_set_auto_reply', e as Error, ErrorCategory.MS_MAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
