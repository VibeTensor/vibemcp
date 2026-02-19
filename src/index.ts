#!/usr/bin/env node

/**
 * VibeMCP - Token-Optimized Unified MCP Server
 *
 * A Model Context Protocol server that unifies Gmail and Microsoft 365
 * services with TOON-based token optimization (40-60% fewer tokens).
 *
 * @author VibeTensor Private Limited
 * @license MIT
 * @see https://github.com/VibeTensor/vibemcp
 */

// Redirect console.log to stderr FIRST — protects JSON-RPC stdout
import './utils/logger.js';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { registerAdminTools } from './tools/admin.js';
import { registerGmailTools } from './tools/gmail.js';
import { registerOutlookTools } from './tools/outlook.js';
import { registerCalendarTools } from './tools/calendar.js';
import { registerUnifiedTools } from './tools/unified.js';

const VERSION = '0.1.0';
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
registerGmailTools(server); // gmail_list_messages, gmail_send_message, etc.
registerOutlookTools(server); // outlook_list_messages, outlook_send_message, etc.
registerCalendarTools(server); // calendar_list_events, calendar_create_event, etc.
registerUnifiedTools(server); // unified_search, unified_inbox, unified_calendar

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`VibeMCP v${VERSION} running on stdio`);
  console.error('Modules: admin, gmail, outlook, calendar, unified');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
