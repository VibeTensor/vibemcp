#!/usr/bin/env node

/**
 * VibeMCP - Token-Optimized Unified MCP Server
 *
 * A Model Context Protocol server that unifies Gmail and Microsoft 365
 * services with TOON-based token optimization.
 *
 * @author VibeTensor Private Limited
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Server version
const VERSION = '0.1.0';

// Initialize MCP Server
const server = new Server(
  {
    name: 'vibemcp',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'gmail_list_messages',
    description: 'List Gmail messages with TOON-optimized output. Returns emails in compact format for reduced token usage.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        account: {
          type: 'string',
          description: 'Account identifier (e.g., "personal", "work")',
        },
        query: {
          type: 'string',
          description: 'Gmail search query (e.g., "is:unread", "from:john@example.com")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of messages to return (default: 10)',
          default: 10,
        },
        format: {
          type: 'string',
          enum: ['toon', 'json'],
          description: 'Output format (default: toon for 50% token savings)',
          default: 'toon',
        },
      },
    },
  },
  {
    name: 'gmail_get_message',
    description: 'Get a specific Gmail message by ID with full content.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        account: {
          type: 'string',
          description: 'Account identifier',
        },
        messageId: {
          type: 'string',
          description: 'Gmail message ID',
        },
        format: {
          type: 'string',
          enum: ['toon', 'json'],
          default: 'toon',
        },
      },
      required: ['messageId'],
    },
  },
  {
    name: 'gmail_send_message',
    description: 'Send an email via Gmail with proper threading support (In-Reply-To headers).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        account: {
          type: 'string',
          description: 'Account identifier',
        },
        to: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recipient email addresses',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body (plain text or HTML)',
        },
        inReplyTo: {
          type: 'string',
          description: 'Message-ID for threading (optional)',
        },
        cc: {
          type: 'array',
          items: { type: 'string' },
          description: 'CC recipients (optional)',
        },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'outlook_list_messages',
    description: 'List Outlook/Microsoft 365 messages with TOON-optimized output.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        account: {
          type: 'string',
          description: 'Account identifier',
        },
        folder: {
          type: 'string',
          description: 'Folder name (default: inbox)',
          default: 'inbox',
        },
        filter: {
          type: 'string',
          description: 'OData filter query',
        },
        top: {
          type: 'number',
          description: 'Maximum results (default: 10)',
          default: 10,
        },
        format: {
          type: 'string',
          enum: ['toon', 'json'],
          default: 'toon',
        },
      },
    },
  },
  {
    name: 'outlook_send_message',
    description: 'Send an email via Microsoft 365 Outlook with threading support.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        account: {
          type: 'string',
          description: 'Account identifier',
        },
        toRecipients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recipient email addresses',
        },
        subject: {
          type: 'string',
          description: 'Email subject',
        },
        body: {
          type: 'string',
          description: 'Email body content',
        },
        bodyType: {
          type: 'string',
          enum: ['text', 'html'],
          default: 'text',
        },
        conversationId: {
          type: 'string',
          description: 'Conversation ID for threading (optional)',
        },
      },
      required: ['toRecipients', 'subject', 'body'],
    },
  },
  {
    name: 'unified_search',
    description: 'Search across all configured email accounts (Gmail + Outlook) simultaneously.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        accounts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Account IDs to search (default: all)',
        },
        maxResultsPerAccount: {
          type: 'number',
          default: 5,
        },
        format: {
          type: 'string',
          enum: ['toon', 'json'],
          default: 'toon',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_accounts',
    description: 'List all configured email accounts.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'switch_account',
    description: 'Switch the active account for subsequent operations.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        accountId: {
          type: 'string',
          description: 'Account identifier to switch to',
        },
      },
      required: ['accountId'],
    },
  },
];

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'gmail_list_messages':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Gmail list_messages not yet implemented.\n\nThis is a placeholder for the TOON-optimized Gmail message listing.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'gmail_get_message':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Gmail get_message not yet implemented.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'gmail_send_message':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Gmail send_message not yet implemented.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'outlook_list_messages':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Outlook list_messages not yet implemented.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'outlook_send_message':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Outlook send_message not yet implemented.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'unified_search':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Unified search not yet implemented.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      case 'list_accounts':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] No accounts configured yet.\n\nRun 'npx @vibetensor/vibemcp auth google' or 'npx @vibetensor/vibemcp auth microsoft' to add accounts.`,
            },
          ],
        };

      case 'switch_account':
        return {
          content: [
            {
              type: 'text',
              text: `[VibeMCP] Account switching not yet implemented.\n\nArgs: ${JSON.stringify(args, null, 2)}`,
            },
          ],
        };

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`VibeMCP v${VERSION} running on stdio`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
