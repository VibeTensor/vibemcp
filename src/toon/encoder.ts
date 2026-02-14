/**
 * VibeMCP TOON Encoder
 *
 * Encodes structured data into TOON (Token-Oriented Object Notation) format.
 * Achieves 40-60% token reduction compared to JSON for uniform arrays.
 *
 * TOON spec: https://github.com/toon-format/toon
 */

import { ToonOptions, DEFAULT_TOON_OPTIONS } from './types.js';

/**
 * Escape a string value for TOON output.
 * Only quote if the value contains the delimiter, newlines, or quotes.
 */
function escapeValue(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') return escapeValue(JSON.stringify(value), delimiter);

  const str = String(value);
  if (str === '') return '""';

  // Quote if contains delimiter, newline, or starts/ends with whitespace
  if (
    str.includes(delimiter) ||
    str.includes('\n') ||
    str.includes('\r') ||
    str.includes('"') ||
    str.startsWith(' ') ||
    str.endsWith(' ')
  ) {
    return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
  }

  return str;
}

/**
 * Encode an array of objects into TOON format.
 *
 * @param typeName - The type label (e.g., "messages", "events", "folders")
 * @param items - Array of objects to encode
 * @param fields - Fields to include (in order). If omitted, auto-detected from first item.
 * @param options - TOON encoding options
 * @returns TOON-formatted string
 *
 * @example
 * encodeToon('messages', [
 *   { id: 'msg001', subject: 'Hello', from: 'john@example.com', date: '2025-12-18' },
 *   { id: 'msg002', subject: 'World', from: 'jane@example.com', date: '2025-12-17' },
 * ]);
 * // Output:
 * // messages[2]{id,subject,from,date}
 * // msg001	Hello	john@example.com	2025-12-18
 * // msg002	World	jane@example.com	2025-12-17
 */
export function encodeToon<T extends Record<string, unknown>>(
  typeName: string,
  items: T[],
  fields?: (keyof T & string)[],
  options?: ToonOptions,
): string {
  const opts = { ...DEFAULT_TOON_OPTIONS, ...options };
  const delim = opts.delimiter;

  if (items.length === 0) {
    return `${typeName}[0]{}`;
  }

  // Auto-detect fields from first item if not specified
  const fieldList = fields ?? (Object.keys(items[0]!) as (keyof T & string)[]);

  // Header: typeName[count]{field1,field2,...}
  const countPart = opts.includeCount ? `[${items.length}]` : '';
  const header = `${typeName}${countPart}{${fieldList.join(',')}}`;

  // Data rows: delimiter-separated values
  const rows = items.map(item =>
    fieldList.map(f => escapeValue(item[f], delim)).join(delim),
  );

  return `${header}\n${rows.join('\n')}`;
}

/**
 * Encode a single object as TOON key-value pairs.
 */
export function encodeToonSingle(typeName: string, obj: Record<string, unknown>): string {
  const lines: string[] = [`${typeName}:`];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const val = typeof value === 'object' && value !== null
      ? JSON.stringify(value)
      : escapeValue(value, '\t');
    lines.push(`  ${key}: ${val}`);
  }
  return lines.join('\n');
}

/**
 * Format output in TOON or JSON based on the format parameter.
 */
export function formatOutput(
  data: unknown,
  format: 'toon' | 'json' = 'toon',
  typeName = 'data',
  fields?: string[],
): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // TOON format
  if (Array.isArray(data)) {
    if (data.length === 0) return `${typeName}[0]{}`;
    if (typeof data[0] === 'object' && data[0] !== null) {
      return encodeToon(typeName, data as Record<string, unknown>[], fields);
    }
    // Primitive array
    return `${typeName}[${data.length}]\n${data.join('\n')}`;
  }

  if (typeof data === 'object' && data !== null) {
    return encodeToonSingle(typeName, data as Record<string, unknown>);
  }

  return String(data);
}
