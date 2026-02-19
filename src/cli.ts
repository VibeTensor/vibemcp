#!/usr/bin/env node

/**
 * VibeMCP CLI — Authentication & Account Management
 *
 * Usage:
 *   npx tsx src/cli.ts auth google user@gmail.com
 *   npx tsx src/cli.ts auth microsoft user@outlook.com
 *   npx tsx src/cli.ts accounts list
 *   npx tsx src/cli.ts accounts remove user@gmail.com
 */

import './utils/logger.js';

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
VibeMCP CLI v0.1.0

Usage:
  vibemcp auth google <email>       Authenticate a Google account (browser flow)
  vibemcp auth microsoft <email>    Authenticate a Microsoft account (device code)
  vibemcp accounts list             List configured accounts
  vibemcp accounts remove <email>   Remove an account
  vibemcp help                      Show this help
`);
}

async function main(): Promise<void> {
  if (!command || command === 'help' || command === '--help') {
    usage();
    return;
  }

  if (command === 'auth') {
    const email = args[2];
    if (!email) {
      console.error('Error: email address required');
      usage();
      process.exit(1);
    }

    if (subcommand === 'google') {
      console.error(`Authenticating Google account: ${email}`);
      const authUrl = await initiateGoogleAuth(email);
      console.error(`\nOpen this URL in your browser:\n${authUrl}\n`);
      console.error('Waiting for callback...');

      const success = await completeGoogleAuth(email);
      if (success) {
        addGoogleAccount(email);
        console.error(`Google account ${email} authenticated and registered.`);
      } else {
        console.error('Authentication failed.');
        process.exit(1);
      }
    } else if (subcommand === 'microsoft') {
      console.error(`Authenticating Microsoft account: ${email}`);
      const flow = await initiateDeviceFlow(email);

      if (!flow) {
        console.error('Failed to initiate device code flow.');
        process.exit(1);
      }

      console.error(`\n${flow.message}\n`);
      console.error('Waiting for device code entry...');

      const token = await completeDeviceFlow(email);
      if (token) {
        addMicrosoftAccount(email);
        console.error(`Microsoft account ${email} authenticated and registered.`);
      } else {
        console.error('Authentication failed or timed out.');
        process.exit(1);
      }
    } else {
      console.error(`Unknown auth provider: ${subcommand}`);
      usage();
      process.exit(1);
    }
  } else if (command === 'accounts') {
    if (subcommand === 'list') {
      const data = loadAccounts();
      console.error('\nConfigured Accounts:');
      console.error('\nGoogle:');
      if (data.google_accounts.length === 0) {
        console.error('  (none)');
      } else {
        for (const a of data.google_accounts) {
          console.error(`  - ${a.email} (${a.accountType})`);
        }
      }
      console.error('\nMicrosoft:');
      if (data.microsoft_accounts.length === 0) {
        console.error('  (none)');
      } else {
        for (const a of data.microsoft_accounts) {
          console.error(`  - ${a.email} (${a.accountType})`);
        }
      }
    } else if (subcommand === 'remove') {
      const email = args[2];
      if (!email) {
        console.error('Error: email address required');
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
      usage();
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
