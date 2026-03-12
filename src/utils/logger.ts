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

/** Keys whose values must be redacted from log output */
const SENSITIVE_KEYS =
  /^(token|access_?token|refresh_?token|password|secret|api_?key|authorization|credential|client_?secret|code|device_?code|id_?token)$/i;

/** Redact sensitive values from a context object before logging */
function redactSensitive(context: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.test(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      redacted[key] = redactSensitive(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export function log(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (context) {
    console.error(`${prefix} ${message}`, JSON.stringify(redactSensitive(context)));
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
