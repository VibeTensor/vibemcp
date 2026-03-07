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
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format (toon saves 50% tokens)'),
    },
    async ({ account, query, maxResults, format }) => {
      try {
        const svc = await getGmail(account);
        const emails = await svc.searchEmails(query ?? '', maxResults);

        if (emails.length === 0) {
          return { content: [{ type: 'text' as const, text: 'No messages found.' }] };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(emails, format, 'messages', [
                'id',
                'subject',
                'from',
                'date',
                'snippet',
              ]),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_list_messages', e as Error, ErrorCategory.GMAIL),
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
          content: [
            {
              type: 'text' as const,
              text:
                format === 'json'
                  ? JSON.stringify(email, null, 2)
                  : formatOutput(email, 'toon', 'message'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_get_message', e as Error, ErrorCategory.GMAIL),
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_send_message', e as Error, ErrorCategory.GMAIL),
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_reply_to_message', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
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
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_create_draft', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
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
          content: [
            {
              type: 'text' as const,
              text: formatOutput(labels, format, 'labels', ['id', 'name', 'type']),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_list_labels', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
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
          content: [
            {
              type: 'text' as const,
              text: formatOutput(threads, format, 'threads', ['id', 'snippet']),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_list_threads', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
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
          content: [
            {
              type: 'text' as const,
              text: formatOutput(thread.messages, 'toon', 'thread_messages', [
                'id',
                'from',
                'subject',
                'date',
                'snippet',
              ]),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_get_thread', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Gmail Label Management
  // ===================================================================

  server.tool(
    'gmail_create_label',
    'Create a new Gmail label.',
    {
      account: z.string().email().describe('Google account email'),
      name: z.string().describe('Label name to create'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format'),
    },
    async ({ account, name, format }) => {
      try {
        const svc = await getGmail(account);
        const label = await svc.createLabel(name);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(label, format, 'label'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_create_label', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'gmail_update_label',
    'Update an existing Gmail label name or visibility.',
    {
      account: z.string().email().describe('Google account email'),
      label_id: z.string().describe('Label ID to update'),
      name: z.string().optional().describe('New label name'),
      label_list_visibility: z
        .enum(['labelShow', 'labelShowIfUnread', 'labelHide'])
        .optional()
        .describe('Visibility in the label list sidebar'),
      message_list_visibility: z
        .enum(['show', 'hide'])
        .optional()
        .describe('Visibility in the message list'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format'),
    },
    async ({ account, label_id, name, label_list_visibility, message_list_visibility, format }) => {
      try {
        const svc = await getGmail(account);
        const label = await svc.updateLabel(label_id, name, label_list_visibility, message_list_visibility);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(label, format, 'label'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_update_label', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'gmail_delete_label',
    'Delete a Gmail label by ID. System labels cannot be deleted.',
    {
      account: z.string().email().describe('Google account email'),
      label_id: z.string().describe('Label ID to delete'),
    },
    async ({ account, label_id }) => {
      try {
        const svc = await getGmail(account);
        await svc.deleteLabel(label_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ status: 'deleted', label_id }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_delete_label', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'gmail_modify_labels',
    'Add or remove labels from one or more Gmail messages.',
    {
      account: z.string().email().describe('Google account email'),
      message_ids: z.array(z.string()).describe('Array of message IDs to modify'),
      add_label_ids: z
        .array(z.string())
        .optional()
        .describe('Label IDs to add to each message'),
      remove_label_ids: z
        .array(z.string())
        .optional()
        .describe('Label IDs to remove from each message'),
    },
    async ({ account, message_ids, add_label_ids, remove_label_ids }) => {
      try {
        if ((!add_label_ids || add_label_ids.length === 0) && (!remove_label_ids || remove_label_ids.length === 0)) {
          return {
            content: [
              { type: 'text' as const, text: 'Error: Provide at least one of add_label_ids or remove_label_ids.' },
            ],
            isError: true,
          };
        }
        const svc = await getGmail(account);
        await svc.modifyLabels(message_ids, add_label_ids ?? [], remove_label_ids ?? []);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ status: 'modified', count: message_ids.length }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_modify_labels', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Gmail Attachment Download
  // ===================================================================

  server.tool(
    'gmail_download_attachment',
    'Download an attachment from a Gmail message. Returns base64url-encoded data with metadata.',
    {
      account: z.string().email().describe('Google account email'),
      message_id: z.string().describe('Gmail message ID containing the attachment'),
      attachment_id: z.string().describe('Attachment ID from the message metadata'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format'),
    },
    async ({ account, message_id, attachment_id, format }) => {
      try {
        const svc = await getGmail(account);
        const attachment = await svc.downloadAttachment(message_id, attachment_id);
        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(attachment, format, 'attachment'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_download_attachment', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Gmail Batch Operations
  // ===================================================================

  server.tool(
    'gmail_batch_modify',
    'Batch modify Gmail messages: archive, mark read/unread, trash, or untrash up to 1000 messages at once.',
    {
      account: z.string().email().describe('Google account email'),
      message_ids: z
        .array(z.string())
        .min(1)
        .max(1000)
        .describe('Array of message IDs to modify (max 1000)'),
      action: z
        .enum(['archive', 'mark_read', 'mark_unread', 'trash', 'untrash'])
        .describe('Action to perform on all specified messages'),
    },
    async ({ account, message_ids, action }) => {
      try {
        const svc = await getGmail(account);

        // Map actions to label operations
        let addLabelIds: string[] = [];
        let removeLabelIds: string[] = [];

        switch (action) {
          case 'archive':
            removeLabelIds = ['INBOX'];
            break;
          case 'mark_read':
            removeLabelIds = ['UNREAD'];
            break;
          case 'mark_unread':
            addLabelIds = ['UNREAD'];
            break;
          case 'trash':
            addLabelIds = ['TRASH'];
            break;
          case 'untrash':
            removeLabelIds = ['TRASH'];
            break;
        }

        const result = await svc.batchModify(message_ids, addLabelIds, removeLabelIds);
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
              text: logError('gmail_batch_modify', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ===================================================================
  // Gmail Vacation / Out-of-Office Settings
  // ===================================================================

  server.tool(
    'gmail_get_vacation',
    'Get current Gmail vacation (out-of-office) auto-reply settings.',
    {
      account: z.string().email().describe('Google account email'),
      format: z
        .enum(['toon', 'json'])
        .default('toon')
        .describe('Output format'),
    },
    async ({ account, format }) => {
      try {
        const svc = await getGmail(account);
        const vacation = await svc.getVacation();
        return {
          content: [
            {
              type: 'text' as const,
              text: formatOutput(vacation, format, 'vacation'),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_get_vacation', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'gmail_set_vacation',
    'Enable or disable Gmail vacation (out-of-office) auto-reply with optional date range.',
    {
      account: z.string().email().describe('Google account email'),
      enable: z.boolean().describe('Enable or disable auto-reply'),
      subject: z.string().optional().describe('Auto-reply subject line'),
      message: z.string().optional().describe('Auto-reply message body (plain text)'),
      start_time: z
        .string()
        .optional()
        .describe('Start time in ISO 8601 format (e.g., 2026-03-10T00:00:00Z)'),
      end_time: z
        .string()
        .optional()
        .describe('End time in ISO 8601 format (e.g., 2026-03-17T00:00:00Z)'),
    },
    async ({ account, enable, subject, message, start_time, end_time }) => {
      try {
        const svc = await getGmail(account);
        const result = await svc.setVacation({
          enableAutoReply: enable,
          responseSubject: subject,
          responseBodyPlainText: message,
          startTime: start_time,
          endTime: end_time,
        });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ status: 'updated', ...result }),
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: 'text' as const,
              text: logError('gmail_set_vacation', e as Error, ErrorCategory.GMAIL),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
