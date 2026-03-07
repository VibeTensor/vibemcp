#!/usr/bin/env node

/**
 * VibeMCP - Token-Optimized Unified MCP Server
 *
 * A Model Context Protocol server that unifies Gmail and Microsoft 365
 * services with TOON-based token optimization (40-60% fewer tokens).
 *
 * @author VibeTensor Private Limited
 * @license PolyForm-Noncommercial-1.0.0
 * @see https://github.com/VibeTensor/vibemcp
 */

// Redirect console.log to stderr FIRST - protects JSON-RPC stdout
import './utils/logger.js';

import { createRequire } from 'node:module';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerAdminTools } from './tools/admin.js';
import { registerGmailTools } from './tools/gmail.js';
import { registerOutlookTools } from './tools/outlook.js';
import { registerCalendarTools } from './tools/calendar.js';
import { registerUnifiedTools } from './tools/unified.js';
import { registerContactTools } from './tools/contacts.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };
const VERSION = pkg.version;
const SERVER_NAME = 'vibemcp';

// =============================================================================
// Initialize MCP Server
// =============================================================================

const server = new McpServer({
  name: SERVER_NAME,
  version: VERSION,
});

// =============================================================================
// Register All Tools
// =============================================================================

registerAdminTools(server); // list_accounts, add_google_account, etc.
registerGmailTools(server); // gmail_list_messages, gmail_send_message, labels, batch, vacation, etc.
registerOutlookTools(server); // outlook_list_messages, categories, flags, batch, auto-reply, etc.
registerCalendarTools(server); // calendar_list_events, free_busy, recurring, etc.
registerUnifiedTools(server); // unified_search, unified_inbox, unified_calendar
registerContactTools(server); // contact_search, resolve_contacts, contact_list

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`VibeMCP v${VERSION} running on stdio`);
  console.error('Modules: admin, gmail, outlook, calendar, unified, contacts');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
