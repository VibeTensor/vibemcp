/**
 * VibeMCP Configuration
 *
 * Manages environment variables, account registry, and paths.
 *
 * Config directory resolution (in order):
 *   1. VIBEMCP_CONFIG_DIR env var (explicit override)
 *   2. ~/.vibemcp/ (standard user config location)
 *
 * The .env file is loaded from:
 *   1. Current working directory (for local development)
 *   2. Config directory (for production installs)
 */

import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// =====================================================================
// Config Directory - persistent storage for tokens and accounts
// =====================================================================

function resolveConfigDir(): string {
  // Explicit override via env var
  if (process.env.VIBEMCP_CONFIG_DIR) {
    return process.env.VIBEMCP_CONFIG_DIR;
  }
  // Default: ~/.vibemcp/
  return path.join(os.homedir(), '.vibemcp');
}

export const CONFIG_DIR = resolveConfigDir();

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

export const ACCOUNTS_FILE = path.join(CONFIG_DIR, 'accounts.json');

// =====================================================================
// .env Loading - try cwd first (dev), then config dir (production)
// =====================================================================

const cwdEnv = path.join(process.cwd(), '.env');
const configDirEnv = path.join(CONFIG_DIR, '.env');

if (fs.existsSync(cwdEnv)) {
  dotenv.config({ path: cwdEnv });
} else if (fs.existsSync(configDirEnv)) {
  dotenv.config({ path: configDirEnv });
} else {
  // Still call dotenv to respect any pre-set env vars (from MCP client config)
  dotenv.config();
}

// =====================================================================
// Environment Variables
// =====================================================================

/**
 * Get an environment variable. Only warns for truly required vars
 * when no default is provided.
 */
function getEnv(key: string, defaultValue?: string): string {
  return process.env[key] ?? defaultValue ?? '';
}

// Google OAuth
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');
export const GOOGLE_OAUTH_PORT = parseInt(getEnv('GOOGLE_OAUTH_PORT', '4100'), 10);
export const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/contacts.readonly',
];

// Microsoft MSAL
export const AZURE_CLIENT_ID = getEnv('MICROSOFT_CLIENT_ID');
export const AZURE_TENANT_ID = getEnv('MICROSOFT_TENANT_ID', 'common');
export const MS_TOKEN_CACHE_PATH = path.join(CONFIG_DIR, 'ms-token-cache.json');

// Base scopes - work for ALL Microsoft accounts (personal + business)
export const MS_SCOPES_BASE = ['Mail.ReadWrite', 'Mail.Send', 'Calendars.ReadWrite', 'User.Read', 'Contacts.Read', 'People.Read'];

// Teams scopes - only work for business/organizational accounts
export const MS_SCOPES_TEAMS = [
  'Chat.ReadWrite',
  'User.ReadBasic.All',
  'ChannelMessage.Send',
  'Team.ReadBasic.All',
  'Channel.ReadBasic.All',
];

// Personal accounts: base only (Chat.ReadWrite not supported by MSA)
export const MS_SCOPES_PERSONAL = MS_SCOPES_BASE;

// Business accounts: base + Teams
export const MS_SCOPES = [...MS_SCOPES_BASE, ...MS_SCOPES_TEAMS];

// VibeMCP settings
export const DEFAULT_OUTPUT_FORMAT = getEnv('VIBEMCP_OUTPUT_FORMAT', 'toon') as 'toon' | 'json';

// Legacy: keep PROJECT_DIR for backward compat but point to config dir
export const PROJECT_DIR = CONFIG_DIR;

// =====================================================================
// Account Registry
// =====================================================================

export interface AccountEntry {
  email: string;
  accountType: string;
  extraInfo: string;
}

export interface AccountsData {
  google_accounts: AccountEntry[];
  microsoft_accounts: AccountEntry[];
}

export function loadAccounts(): AccountsData {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return { google_accounts: [], microsoft_accounts: [] };
  }
  const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
  return JSON.parse(raw) as AccountsData;
}

export function saveAccounts(data: AccountsData): void {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
}

export function addGoogleAccount(email: string, accountType = 'personal', extraInfo = ''): boolean {
  const data = loadAccounts();
  if (data.google_accounts.some((a) => a.email === email)) return false;
  data.google_accounts.push({ email, accountType, extraInfo });
  saveAccounts(data);
  return true;
}

export function removeGoogleAccount(email: string): boolean {
  const data = loadAccounts();
  const before = data.google_accounts.length;
  data.google_accounts = data.google_accounts.filter((a) => a.email !== email);
  if (data.google_accounts.length < before) {
    saveAccounts(data);
    const tokenFile = path.join(CONFIG_DIR, `.oauth2.${email}.json`);
    if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
    return true;
  }
  return false;
}

export function addMicrosoftAccount(
  email: string,
  accountType = 'business',
  extraInfo = '',
): boolean {
  const data = loadAccounts();
  if (data.microsoft_accounts.some((a) => a.email === email)) return false;
  data.microsoft_accounts.push({ email, accountType, extraInfo });
  saveAccounts(data);
  return true;
}

export function removeMicrosoftAccount(email: string): boolean {
  const data = loadAccounts();
  const before = data.microsoft_accounts.length;
  data.microsoft_accounts = data.microsoft_accounts.filter((a) => a.email !== email);
  if (data.microsoft_accounts.length < before) {
    saveAccounts(data);
    return true;
  }
  return false;
}
