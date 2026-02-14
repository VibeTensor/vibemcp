/**
 * VibeMCP Configuration
 *
 * Manages environment variables, account registry, and paths.
 * Port of productivity-mcp/config.py
 */

import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_DIR = path.resolve(__dirname, '..');
const ENV_FILE = path.join(PROJECT_DIR, '.env');
export const ACCOUNTS_FILE = path.join(PROJECT_DIR, 'accounts.json');

// Load .env
dotenv.config({ path: ENV_FILE });

function getEnv(key: string, defaultValue?: string): string {
  const val = process.env[key] ?? defaultValue ?? '';
  if (!val) {
    console.error(`[CONFIG] Missing env var: ${key}`);
  }
  return val;
}

// Google OAuth
export const GOOGLE_CLIENT_ID = getEnv('GOOGLE_CLIENT_ID');
export const GOOGLE_CLIENT_SECRET = getEnv('GOOGLE_CLIENT_SECRET');
export const GOOGLE_OAUTH_PORT = parseInt(getEnv('GOOGLE_OAUTH_PORT', '4100'), 10);
export const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/calendar',
];

// Microsoft MSAL
export const AZURE_CLIENT_ID = getEnv('MICROSOFT_CLIENT_ID');
export const AZURE_TENANT_ID = getEnv('MICROSOFT_TENANT_ID', 'common');
export const MS_TOKEN_CACHE_PATH = path.join(
  process.env.HOME ?? process.env.USERPROFILE ?? PROJECT_DIR,
  '.vibemcp-ms-cache.json',
);

// Base scopes — work for ALL Microsoft accounts (personal + business)
export const MS_SCOPES_BASE = [
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.ReadWrite',
  'User.Read',
];

// Teams scopes — only work for business/organizational accounts
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
export const DEFAULT_OUTPUT_FORMAT = (getEnv('VIBEMCP_OUTPUT_FORMAT', 'toon') as 'toon' | 'json');

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
  if (data.google_accounts.some(a => a.email === email)) return false;
  data.google_accounts.push({ email, accountType, extraInfo });
  saveAccounts(data);
  return true;
}

export function removeGoogleAccount(email: string): boolean {
  const data = loadAccounts();
  const before = data.google_accounts.length;
  data.google_accounts = data.google_accounts.filter(a => a.email !== email);
  if (data.google_accounts.length < before) {
    saveAccounts(data);
    const tokenFile = path.join(PROJECT_DIR, `.oauth2.${email}.json`);
    if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
    return true;
  }
  return false;
}

export function addMicrosoftAccount(email: string, accountType = 'business', extraInfo = ''): boolean {
  const data = loadAccounts();
  if (data.microsoft_accounts.some(a => a.email === email)) return false;
  data.microsoft_accounts.push({ email, accountType, extraInfo });
  saveAccounts(data);
  return true;
}

export function removeMicrosoftAccount(email: string): boolean {
  const data = loadAccounts();
  const before = data.microsoft_accounts.length;
  data.microsoft_accounts = data.microsoft_accounts.filter(a => a.email !== email);
  if (data.microsoft_accounts.length < before) {
    saveAccounts(data);
    return true;
  }
  return false;
}
