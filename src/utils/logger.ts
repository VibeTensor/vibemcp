/**
 * VibeMCP Logger - stderr-safe logging
 *
 * All output MUST go to stderr to protect JSON-RPC on stdout.
 */

// Redirect console.log to stderr immediately
const _originalLog = console.log;
console.log = (...args: unknown[]) => console.error(...args);

export enum ErrorCategory {
  GOOGLE_AUTH = 'GOOGLE_AUTH',
  GMAIL = 'GMAIL',
  GCAL = 'GCAL',
  MS_AUTH = 'MS_AUTH',
  MS_MAIL = 'MS_MAIL',
  MS_CAL = 'MS_CAL',
  ACCOUNT = 'ACCOUNT',
  CONFIG = 'CONFIG',
  TOON = 'TOON',
  UNIFIED = 'UNIFIED',
}

export function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (context) {
    console.error(`${prefix} ${message}`, JSON.stringify(context));
  } else {
    console.error(`${prefix} ${message}`);
  }
}

export function logError(
  functionName: string,
  error: Error,
  category?: ErrorCategory,
  context?: Record<string, unknown>,
): string {
  const cat = category ?? 'UNKNOWN';
  const msg = error.message || String(error);

  log('error', `[${cat}] ${functionName}: ${msg}`, context);

  return `Error [${cat}]: ${msg}`;
}
