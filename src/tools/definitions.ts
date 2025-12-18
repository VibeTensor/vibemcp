/**
 * VibeMCP Tool Definitions
 *
 * Comprehensive tool set matching features from:
 * - @shinzolabs/gmail-mcp (60+ Gmail tools)
 * - google_workspace_mcp (80+ Google tools)
 * - ms-365-mcp-server (90+ MS365 tools)
 * - office-365-mcp-server (24 tools)
 * - calendar-mcp (unified calendar)
 *
 * All tools support TOON output format for 50-60% token reduction.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  category: 'gmail' | 'outlook' | 'calendar' | 'drive' | 'onedrive' | 'unified' | 'admin';
}

// =============================================================================
// GMAIL TOOLS (35+ tools - matching shinzolabs/gmail-mcp features)
// =============================================================================

export const GMAIL_TOOLS: ToolDefinition[] = [
  // === Message Operations ===
  {
    name: 'gmail_list_messages',
    description: 'List Gmail messages with TOON-optimized output. Supports Gmail search operators.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string', description: 'Account ID' },
        query: { type: 'string', description: 'Gmail search query (e.g., "is:unread from:john@example.com")' },
        maxResults: { type: 'number', default: 10, description: 'Max messages (1-500)' },
        labelIds: { type: 'array', items: { type: 'string' }, description: 'Filter by label IDs' },
        includeSpamTrash: { type: 'boolean', default: false },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'gmail_get_message',
    description: 'Get full message content by ID including headers, body, and attachment metadata.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string', description: 'Gmail message ID' },
        format: { type: 'string', enum: ['full', 'minimal', 'raw', 'metadata'], default: 'full' },
        metadataHeaders: { type: 'array', items: { type: 'string' }, description: 'Specific headers to return' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_send_message',
    description: 'Send an email with proper RFC 2822 threading (In-Reply-To, References headers).',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        to: { type: 'array', items: { type: 'string' }, description: 'Recipients' },
        subject: { type: 'string' },
        body: { type: 'string', description: 'Email body (text or HTML)' },
        bodyType: { type: 'string', enum: ['text', 'html'], default: 'text' },
        cc: { type: 'array', items: { type: 'string' } },
        bcc: { type: 'array', items: { type: 'string' } },
        inReplyTo: { type: 'string', description: 'Message-ID for threading' },
        references: { type: 'string', description: 'References header for threading' },
        threadId: { type: 'string', description: 'Gmail thread ID' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_reply_to_message',
    description: 'Reply to an existing message with automatic threading.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string', description: 'Original message ID to reply to' },
        body: { type: 'string' },
        bodyType: { type: 'string', enum: ['text', 'html'], default: 'text' },
        replyAll: { type: 'boolean', default: false },
      },
      required: ['messageId', 'body'],
    },
  },
  {
    name: 'gmail_forward_message',
    description: 'Forward a message to new recipients.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        to: { type: 'array', items: { type: 'string' } },
        additionalMessage: { type: 'string', description: 'Optional message to prepend' },
      },
      required: ['messageId', 'to'],
    },
  },
  {
    name: 'gmail_trash_message',
    description: 'Move message to trash.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_untrash_message',
    description: 'Remove message from trash.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_delete_message',
    description: 'Permanently delete a message (requires confirmation).',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        confirm: { type: 'boolean', description: 'Must be true to delete' },
      },
      required: ['messageId', 'confirm'],
    },
  },
  {
    name: 'gmail_mark_as_read',
    description: 'Mark message as read.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_mark_as_unread',
    description: 'Mark message as unread.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_archive_message',
    description: 'Archive message (remove INBOX label).',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_batch_modify',
    description: 'Batch modify multiple messages (add/remove labels, mark read/unread).',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageIds: { type: 'array', items: { type: 'string' } },
        addLabelIds: { type: 'array', items: { type: 'string' } },
        removeLabelIds: { type: 'array', items: { type: 'string' } },
      },
      required: ['messageIds'],
    },
  },

  // === Thread Operations ===
  {
    name: 'gmail_list_threads',
    description: 'List email threads with TOON-optimized output.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        query: { type: 'string' },
        maxResults: { type: 'number', default: 10 },
        labelIds: { type: 'array', items: { type: 'string' } },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'gmail_get_thread',
    description: 'Get full conversation thread with all messages.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        threadId: { type: 'string' },
        format: { type: 'string', enum: ['full', 'minimal', 'metadata'], default: 'full' },
      },
      required: ['threadId'],
    },
  },
  {
    name: 'gmail_trash_thread',
    description: 'Move entire thread to trash.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        threadId: { type: 'string' },
      },
      required: ['threadId'],
    },
  },

  // === Label Operations ===
  {
    name: 'gmail_list_labels',
    description: 'List all Gmail labels.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'gmail_create_label',
    description: 'Create a new label with optional color.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        name: { type: 'string' },
        backgroundColor: { type: 'string', description: 'Hex color (e.g., #ff0000)' },
        textColor: { type: 'string' },
        labelListVisibility: { type: 'string', enum: ['labelShow', 'labelShowIfUnread', 'labelHide'] },
        messageListVisibility: { type: 'string', enum: ['show', 'hide'] },
      },
      required: ['name'],
    },
  },
  {
    name: 'gmail_update_label',
    description: 'Update label properties.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        labelId: { type: 'string' },
        name: { type: 'string' },
        backgroundColor: { type: 'string' },
        textColor: { type: 'string' },
      },
      required: ['labelId'],
    },
  },
  {
    name: 'gmail_delete_label',
    description: 'Delete a label.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        labelId: { type: 'string' },
      },
      required: ['labelId'],
    },
  },
  {
    name: 'gmail_add_label',
    description: 'Add label to a message.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        labelId: { type: 'string' },
      },
      required: ['messageId', 'labelId'],
    },
  },
  {
    name: 'gmail_remove_label',
    description: 'Remove label from a message.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        labelId: { type: 'string' },
      },
      required: ['messageId', 'labelId'],
    },
  },

  // === Draft Operations ===
  {
    name: 'gmail_list_drafts',
    description: 'List all drafts.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        maxResults: { type: 'number', default: 10 },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'gmail_create_draft',
    description: 'Create a new draft.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        to: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
        bodyType: { type: 'string', enum: ['text', 'html'], default: 'text' },
        cc: { type: 'array', items: { type: 'string' } },
        bcc: { type: 'array', items: { type: 'string' } },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'gmail_update_draft',
    description: 'Update an existing draft.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        draftId: { type: 'string' },
        to: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
      },
      required: ['draftId'],
    },
  },
  {
    name: 'gmail_send_draft',
    description: 'Send an existing draft.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        draftId: { type: 'string' },
      },
      required: ['draftId'],
    },
  },
  {
    name: 'gmail_delete_draft',
    description: 'Delete a draft.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        draftId: { type: 'string' },
      },
      required: ['draftId'],
    },
  },

  // === Attachment Operations ===
  {
    name: 'gmail_list_attachments',
    description: 'List attachments for a message.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_get_attachment',
    description: 'Get attachment content (streamed for large files).',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        attachmentId: { type: 'string' },
        returnBase64: { type: 'boolean', default: false, description: 'Return base64 (small files only)' },
      },
      required: ['messageId', 'attachmentId'],
    },
  },

  // === Settings Operations ===
  {
    name: 'gmail_get_profile',
    description: 'Get Gmail profile information.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
      },
    },
  },
  {
    name: 'gmail_get_vacation_settings',
    description: 'Get vacation auto-reply settings.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
      },
    },
  },
  {
    name: 'gmail_update_vacation_settings',
    description: 'Update vacation auto-reply settings.',
    category: 'gmail',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        enableAutoReply: { type: 'boolean' },
        responseSubject: { type: 'string' },
        responseBodyPlainText: { type: 'string' },
        responseBodyHtml: { type: 'string' },
        startTime: { type: 'string', description: 'ISO 8601 timestamp' },
        endTime: { type: 'string' },
        restrictToContacts: { type: 'boolean' },
        restrictToDomain: { type: 'boolean' },
      },
      required: ['enableAutoReply'],
    },
  },
];

// =============================================================================
// OUTLOOK / MICROSOFT 365 TOOLS (35+ tools)
// =============================================================================

export const OUTLOOK_TOOLS: ToolDefinition[] = [
  // === Message Operations ===
  {
    name: 'outlook_list_messages',
    description: 'List Outlook messages with TOON-optimized output. Supports OData queries.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        folderId: { type: 'string', default: 'inbox', description: 'Folder ID or well-known name' },
        filter: { type: 'string', description: 'OData $filter query' },
        search: { type: 'string', description: 'KQL search query' },
        top: { type: 'number', default: 10 },
        skip: { type: 'number', default: 0 },
        orderby: { type: 'string', default: 'receivedDateTime desc' },
        select: { type: 'array', items: { type: 'string' }, description: 'Properties to return' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'outlook_get_message',
    description: 'Get full message by ID.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        select: { type: 'array', items: { type: 'string' } },
        expand: { type: 'array', items: { type: 'string' }, description: 'Related entities to expand' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'outlook_send_message',
    description: 'Send a new email via Microsoft Graph.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        toRecipients: { type: 'array', items: { type: 'string' } },
        subject: { type: 'string' },
        body: { type: 'string' },
        bodyType: { type: 'string', enum: ['text', 'html'], default: 'text' },
        ccRecipients: { type: 'array', items: { type: 'string' } },
        bccRecipients: { type: 'array', items: { type: 'string' } },
        importance: { type: 'string', enum: ['low', 'normal', 'high'], default: 'normal' },
        saveToSentItems: { type: 'boolean', default: true },
      },
      required: ['toRecipients', 'subject', 'body'],
    },
  },
  {
    name: 'outlook_reply_to_message',
    description: 'Reply to a message with automatic threading.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        comment: { type: 'string', description: 'Reply content' },
        replyAll: { type: 'boolean', default: false },
      },
      required: ['messageId', 'comment'],
    },
  },
  {
    name: 'outlook_forward_message',
    description: 'Forward a message.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        toRecipients: { type: 'array', items: { type: 'string' } },
        comment: { type: 'string' },
      },
      required: ['messageId', 'toRecipients'],
    },
  },
  {
    name: 'outlook_move_message',
    description: 'Move message to a folder.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        destinationId: { type: 'string', description: 'Destination folder ID' },
      },
      required: ['messageId', 'destinationId'],
    },
  },
  {
    name: 'outlook_copy_message',
    description: 'Copy message to a folder.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        destinationId: { type: 'string' },
      },
      required: ['messageId', 'destinationId'],
    },
  },
  {
    name: 'outlook_delete_message',
    description: 'Delete a message.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'outlook_update_message',
    description: 'Update message properties (read status, categories, flag).',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        isRead: { type: 'boolean' },
        categories: { type: 'array', items: { type: 'string' } },
        flag: {
          type: 'object',
          properties: {
            flagStatus: { type: 'string', enum: ['notFlagged', 'complete', 'flagged'] },
          },
        },
        importance: { type: 'string', enum: ['low', 'normal', 'high'] },
      },
      required: ['messageId'],
    },
  },

  // === Folder Operations ===
  {
    name: 'outlook_list_folders',
    description: 'List mail folders.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        parentFolderId: { type: 'string', description: 'Parent folder ID (empty for root)' },
        includeHidden: { type: 'boolean', default: false },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'outlook_create_folder',
    description: 'Create a new mail folder.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        displayName: { type: 'string' },
        parentFolderId: { type: 'string' },
        isHidden: { type: 'boolean', default: false },
      },
      required: ['displayName'],
    },
  },
  {
    name: 'outlook_update_folder',
    description: 'Update folder properties.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        folderId: { type: 'string' },
        displayName: { type: 'string' },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'outlook_delete_folder',
    description: 'Delete a mail folder.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        folderId: { type: 'string' },
      },
      required: ['folderId'],
    },
  },

  // === Attachment Operations ===
  {
    name: 'outlook_list_attachments',
    description: 'List attachments for a message.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'outlook_get_attachment',
    description: 'Get attachment content.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        attachmentId: { type: 'string' },
      },
      required: ['messageId', 'attachmentId'],
    },
  },
  {
    name: 'outlook_add_attachment',
    description: 'Add attachment to a draft message.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        messageId: { type: 'string' },
        name: { type: 'string' },
        contentType: { type: 'string' },
        contentBytes: { type: 'string', description: 'Base64 content' },
      },
      required: ['messageId', 'name', 'contentBytes'],
    },
  },

  // === Category Operations ===
  {
    name: 'outlook_list_categories',
    description: 'List Outlook categories.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'outlook_create_category',
    description: 'Create a new category.',
    category: 'outlook',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        displayName: { type: 'string' },
        color: {
          type: 'string',
          enum: ['none', 'preset0', 'preset1', 'preset2', 'preset3', 'preset4', 'preset5', 'preset6', 'preset7', 'preset8', 'preset9', 'preset10', 'preset11', 'preset12', 'preset13', 'preset14', 'preset15', 'preset16', 'preset17', 'preset18', 'preset19', 'preset20', 'preset21', 'preset22', 'preset23', 'preset24'],
        },
      },
      required: ['displayName'],
    },
  },
];

// =============================================================================
// CALENDAR TOOLS (15+ tools)
// =============================================================================

export const CALENDAR_TOOLS: ToolDefinition[] = [
  {
    name: 'calendar_list_events',
    description: 'List calendar events with TOON-optimized output. Works with Google Calendar and Outlook.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        calendarId: { type: 'string', default: 'primary' },
        timeMin: { type: 'string', description: 'Start time (ISO 8601)' },
        timeMax: { type: 'string', description: 'End time (ISO 8601)' },
        maxResults: { type: 'number', default: 10 },
        singleEvents: { type: 'boolean', default: true, description: 'Expand recurring events' },
        orderBy: { type: 'string', enum: ['startTime', 'updated'], default: 'startTime' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'calendar_get_event',
    description: 'Get event details by ID.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        calendarId: { type: 'string', default: 'primary' },
        eventId: { type: 'string' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_create_event',
    description: 'Create a new calendar event.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        calendarId: { type: 'string', default: 'primary' },
        summary: { type: 'string', description: 'Event title' },
        description: { type: 'string' },
        location: { type: 'string' },
        start: { type: 'string', description: 'Start time (ISO 8601)' },
        end: { type: 'string', description: 'End time (ISO 8601)' },
        attendees: { type: 'array', items: { type: 'string' }, description: 'Attendee emails' },
        reminders: {
          type: 'object',
          properties: {
            useDefault: { type: 'boolean' },
            overrides: { type: 'array', items: { type: 'object' } },
          },
        },
        recurrence: { type: 'array', items: { type: 'string' }, description: 'RRULE strings' },
        conferenceData: { type: 'boolean', description: 'Create Teams/Meet link' },
      },
      required: ['summary', 'start', 'end'],
    },
  },
  {
    name: 'calendar_update_event',
    description: 'Update an existing event.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        calendarId: { type: 'string', default: 'primary' },
        eventId: { type: 'string' },
        summary: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string' },
        start: { type: 'string' },
        end: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_delete_event',
    description: 'Delete a calendar event.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        calendarId: { type: 'string', default: 'primary' },
        eventId: { type: 'string' },
        sendUpdates: { type: 'string', enum: ['all', 'externalOnly', 'none'], default: 'all' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'calendar_list_calendars',
    description: 'List all calendars.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'calendar_get_free_busy',
    description: 'Get free/busy information for scheduling.',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        timeMin: { type: 'string' },
        timeMax: { type: 'string' },
        items: { type: 'array', items: { type: 'string' }, description: 'Calendar IDs to check' },
      },
      required: ['timeMin', 'timeMax'],
    },
  },
  {
    name: 'calendar_respond_to_event',
    description: 'Respond to an event invitation (accept, decline, tentative).',
    category: 'calendar',
    inputSchema: {
      type: 'object',
      properties: {
        account: { type: 'string' },
        eventId: { type: 'string' },
        response: { type: 'string', enum: ['accept', 'decline', 'tentative'] },
        comment: { type: 'string' },
      },
      required: ['eventId', 'response'],
    },
  },
];

// =============================================================================
// UNIFIED / CROSS-ACCOUNT TOOLS (10+ tools)
// =============================================================================

export const UNIFIED_TOOLS: ToolDefinition[] = [
  {
    name: 'unified_search',
    description: 'Search across all configured accounts simultaneously.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        accounts: { type: 'array', items: { type: 'string' }, description: 'Accounts to search (default: all)' },
        types: { type: 'array', items: { type: 'string', enum: ['email', 'calendar', 'files'] }, default: ['email'] },
        maxResultsPerAccount: { type: 'number', default: 5 },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
      required: ['query'],
    },
  },
  {
    name: 'unified_inbox',
    description: 'Get unified inbox view across all email accounts.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        accounts: { type: 'array', items: { type: 'string' } },
        filter: { type: 'string', enum: ['unread', 'flagged', 'all'], default: 'all' },
        maxPerAccount: { type: 'number', default: 10 },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'unified_calendar',
    description: 'Get aggregated calendar view across all accounts.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        accounts: { type: 'array', items: { type: 'string' } },
        timeMin: { type: 'string' },
        timeMax: { type: 'string' },
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'list_accounts',
    description: 'List all configured accounts.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['toon', 'json'], default: 'toon' },
      },
    },
  },
  {
    name: 'switch_account',
    description: 'Switch default account for operations.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'get_account_status',
    description: 'Get account authentication and quota status.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
    },
  },
  {
    name: 'refresh_account_token',
    description: 'Force refresh authentication token for an account.',
    category: 'unified',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string' },
      },
      required: ['accountId'],
    },
  },
];

// =============================================================================
// ADMIN / CONFIGURATION TOOLS
// =============================================================================

export const ADMIN_TOOLS: ToolDefinition[] = [
  {
    name: 'config_get',
    description: 'Get current VibeMCP configuration.',
    category: 'admin',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'config_set_output_format',
    description: 'Set default output format (toon/json).',
    category: 'admin',
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['toon', 'json'] },
      },
      required: ['format'],
    },
  },
  {
    name: 'config_set_compression',
    description: 'Configure context compression settings.',
    category: 'admin',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        method: { type: 'string', enum: ['acon', 'llmlingua', 'none'] },
        threshold: { type: 'number', description: 'Compression threshold (0-1)' },
      },
    },
  },
  {
    name: 'config_set_cache',
    description: 'Configure semantic caching settings.',
    category: 'admin',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        similarity: { type: 'number', description: 'Similarity threshold (0.9-0.99)' },
        ttl: { type: 'number', description: 'Cache TTL in seconds' },
      },
    },
  },
  {
    name: 'stats_get_token_savings',
    description: 'Get token savings statistics.',
    category: 'admin',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['hour', 'day', 'week', 'month'], default: 'day' },
      },
    },
  },
  {
    name: 'stats_get_cache_hits',
    description: 'Get cache hit/miss statistics.',
    category: 'admin',
    inputSchema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['hour', 'day', 'week', 'month'], default: 'day' },
      },
    },
  },
];

// =============================================================================
// EXPORT ALL TOOLS
// =============================================================================

export const ALL_TOOLS = [
  ...GMAIL_TOOLS,
  ...OUTLOOK_TOOLS,
  ...CALENDAR_TOOLS,
  ...UNIFIED_TOOLS,
  ...ADMIN_TOOLS,
];

// Tool count summary
export const TOOL_COUNTS = {
  gmail: GMAIL_TOOLS.length,
  outlook: OUTLOOK_TOOLS.length,
  calendar: CALENDAR_TOOLS.length,
  unified: UNIFIED_TOOLS.length,
  admin: ADMIN_TOOLS.length,
  total: ALL_TOOLS.length,
};

console.log(`VibeMCP Tools: ${TOOL_COUNTS.total} total`);
console.log(`  Gmail: ${TOOL_COUNTS.gmail}`);
console.log(`  Outlook: ${TOOL_COUNTS.outlook}`);
console.log(`  Calendar: ${TOOL_COUNTS.calendar}`);
console.log(`  Unified: ${TOOL_COUNTS.unified}`);
console.log(`  Admin: ${TOOL_COUNTS.admin}`);
