#!/usr/bin/env node

/**
 * VibeMCP CLI — MCP Server & Account Management
 *
 * Default (no args): starts the MCP stdio server for Claude Desktop/Code.
 *
 * Subcommands:
 *   vibemcp                              Start MCP server (default)
 *   vibemcp serve                        Start MCP server (explicit)
 *   vibemcp auth google <email>          Authenticate a Google account
 *   vibemcp auth microsoft <email>       Authenticate a Microsoft account
 *   vibemcp accounts list                List configured accounts
 *   vibemcp accounts remove <email>      Remove an account
 *   vibemcp help                         Show this help
 *
 * @license PolyForm-Noncommercial-1.0.0
 */

import './utils/logger.js';

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };
const VERSION = pkg.version;

import {
  loadAccounts,
  addGoogleAccount,
  addMicrosoftAccount,
  removeGoogleAccount,
  removeMicrosoftAccount,
} from './config.js';
import { initiateGoogleAuth, completeGoogleAuth } from './auth/google.js';
import { initiateDeviceFlow, completeDeviceFlow } from './auth/microsoft.js';

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

function usage(): void {
  console.error(`
VibeMCP v${VERSION} — Token-Optimized Unified MCP Server

Usage:
  vibemcp                              Start MCP server (stdio transport)
  vibemcp serve                        Start MCP server (explicit)
  vibemcp auth google <email>          Authenticate a Google account (browser)
  vibemcp auth microsoft <email>       Authenticate a Microsoft account (device code)
  vibemcp accounts list                List configured accounts
  vibemcp accounts remove <email>      Remove an account
  vibemcp help                         Show this help
`);
}

/**
 * Start the MCP stdio server.
 * Dynamically imports index.ts to avoid loading MCP SDK for CLI-only commands.
 */
async function startServer(): Promise<void> {
  // index.ts auto-starts the server on import
  await import('./index.js');
}

async function main(): Promise<void> {
  // No args or 'serve' → start MCP server
  if (!command || command === 'serve') {
    await startServer();
    return;
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    usage();
    return;
  }

  if (command === 'version' || command === '--version' || command === '-v') {
    console.error(`VibeMCP v${VERSION}`);
    return;
  }

  if (command === 'auth') {
    const email = args[2];
    if (!email) {
      console.error('Error: email address required');
      console.error('Usage: vibemcp auth google <email>');
      console.error('       vibemcp auth microsoft <email>');
      process.exit(1);
    }

    if (subcommand === 'google') {
      console.error(`Authenticating Google account: ${email}`);
      const result = await initiateGoogleAuth(email);
      if (!result) {
        console.error(
          'Failed to start Google OAuth flow. Check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        );
        process.exit(1);
      }
      console.error(`\nOpen this URL in your browser:\n${result.authUrl}\n`);
      console.error('Waiting for callback...');

      const success = await completeGoogleAuth(email);
      if (success) {
        addGoogleAccount(email);
        console.error(`\nGoogle account ${email} authenticated and registered.`);
      } else {
        console.error('Authentication failed. Make sure you completed the browser flow.');
        process.exit(1);
      }
    } else if (subcommand === 'microsoft') {
      console.error(`Authenticating Microsoft account: ${email}`);
      const flow = await initiateDeviceFlow(email);

      if (!flow) {
        console.error('Failed to initiate device code flow. Check your MICROSOFT_CLIENT_ID.');
        process.exit(1);
      }

      console.error(`\n${flow.message}\n`);
      console.error('Waiting for device code entry...');

      const token = await completeDeviceFlow(email);
      if (token) {
        addMicrosoftAccount(email);
        console.error(`\nMicrosoft account ${email} authenticated and registered.`);
      } else {
        console.error('Authentication failed or timed out. Try again.');
        process.exit(1);
      }
    } else {
      console.error(`Unknown auth provider: ${subcommand}`);
      console.error('Supported providers: google, microsoft');
      process.exit(1);
    }
  } else if (command === 'accounts') {
    if (subcommand === 'list') {
      const data = loadAccounts();
      console.error(`\nVibeMCP Accounts (v${VERSION}):`);
      console.error('\nGoogle:');
      if (data.google_accounts.length === 0) {
        console.error('  (none) — run: vibemcp auth google <email>');
      } else {
        for (const a of data.google_accounts) {
          console.error(`  - ${a.email} (${a.accountType})`);
        }
      }
      console.error('\nMicrosoft:');
      if (data.microsoft_accounts.length === 0) {
        console.error('  (none) — run: vibemcp auth microsoft <email>');
      } else {
        for (const a of data.microsoft_accounts) {
          console.error(`  - ${a.email} (${a.accountType})`);
        }
      }
      console.error('');
    } else if (subcommand === 'remove') {
      const email = args[2];
      if (!email) {
        console.error('Error: email address required');
        console.error('Usage: vibemcp accounts remove <email>');
        process.exit(1);
      }
      const removedG = removeGoogleAccount(email);
      const removedM = removeMicrosoftAccount(email);
      if (removedG || removedM) {
        console.error(`Removed account: ${email}`);
      } else {
        console.error(`Account not found: ${email}`);
      }
    } else {
      console.error(`Unknown accounts command: ${subcommand}`);
      console.error('Available: list, remove');
      process.exit(1);
    }
  } else {
    console.error(`Unknown command: ${command}`);
    usage();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
