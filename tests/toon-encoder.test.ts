import { encodeToon, encodeToonSingle, formatOutput, stripHtml } from '../src/toon/encoder.js';

describe('encodeToon', () => {
  it('should return empty marker for empty array', () => {
    const result = encodeToon('items', []);
    expect(result).toBe('items[0]{}');
  });

  it('should encode a single record with auto-detected fields', () => {
    const data = [{ id: '1', name: 'Alice', age: 30 }];
    const result = encodeToon('users', data);
    const lines = result.split('\n');

    expect(lines[0]).toBe('users[1]{id,name,age}');
    expect(lines[1]).toBe('1\tAlice\t30');
  });

  it('should encode with explicit field list', () => {
    const data = [{ id: '1', name: 'Alice', age: 30 }];
    const result = encodeToon('users', data, ['id', 'name']);
    const lines = result.split('\n');

    expect(lines[0]).toBe('users[1]{id,name}');
    expect(lines[1]).toBe('1\tAlice');
  });

  it('should encode multiple records with correct count', () => {
    const data = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
      { id: '3', name: 'C' },
    ];
    const result = encodeToon('items', data, ['id', 'name']);
    const lines = result.split('\n');

    expect(lines).toHaveLength(4); // 1 header + 3 data rows
    expect(lines[0]).toBe('items[3]{id,name}');
    expect(lines[1]).toBe('1\tA');
    expect(lines[2]).toBe('2\tB');
    expect(lines[3]).toBe('3\tC');
  });

  it('should handle null/undefined values', () => {
    const data = [{ id: '1', name: null, status: undefined }];
    const result = encodeToon('items', data as Record<string, unknown>[], ['id', 'name', 'status']);
    const lines = result.split('\n');

    expect(lines[1]).toBe('1\tnull\tnull');
  });

  it('should handle boolean values', () => {
    const data = [{ id: '1', active: true, archived: false }];
    const result = encodeToon('items', data, ['id', 'active', 'archived']);
    const lines = result.split('\n');

    expect(lines[1]).toBe('1\ttrue\tfalse');
  });

  it('should quote values containing delimiter', () => {
    const data = [{ id: '1', note: 'hello\tworld' }];
    const result = encodeToon('items', data, ['id', 'note']);
    const lines = result.split('\n');

    // Value containing tab should be quoted
    expect(lines[1]).toContain('"');
  });

  it('should quote values containing newlines', () => {
    const data = [{ id: '1', note: 'line1\nline2' }];
    const result = encodeToon('items', data, ['id', 'note']);
    const lines = result.split('\n');

    // The multiline value should be quoted with escaped newlines
    expect(result).toContain('\\n');
  });

  it('should encode empty strings as quoted empty', () => {
    const data = [{ id: '1', name: '' }];
    const result = encodeToon('items', data, ['id', 'name']);
    const lines = result.split('\n');

    expect(lines[1]).toBe('1\t""');
  });

  it('should support custom delimiter via options', () => {
    const data = [{ id: '1', name: 'Alice' }];
    const result = encodeToon('items', data, ['id', 'name'], { delimiter: ',' });
    const lines = result.split('\n');

    expect(lines[1]).toBe('1,Alice');
  });

  it('should support hiding count via options', () => {
    const data = [{ id: '1' }];
    const result = encodeToon('items', data, ['id'], { includeCount: false });

    expect(result).toMatch(/^items\{id\}/);
    expect(result).not.toContain('[');
  });

  it('should handle nested objects by JSON-serializing them', () => {
    const data = [{ id: '1', meta: { key: 'value' } }];
    const result = encodeToon('items', data as Record<string, unknown>[], ['id', 'meta']);
    const lines = result.split('\n');

    expect(lines[1]).toContain('1');
    expect(lines[1]).toContain('key');
  });

  it('should truncate long values when maxValueLength is set', () => {
    const longStr = 'a'.repeat(600);
    const data = [{ id: '1', text: longStr }];
    const result = encodeToon('items', data, ['id', 'text']);
    const lines = result.split('\n');

    // Default maxValueLength is 500, so 500 chars + '...'
    expect(lines[1]).toContain('a'.repeat(500) + '...');
    expect(lines[1]).not.toContain('a'.repeat(501));
  });

  it('should not truncate when maxValueLength is 0', () => {
    const longStr = 'a'.repeat(600);
    const data = [{ id: '1', text: longStr }];
    const result = encodeToon('items', data, ['id', 'text'], { maxValueLength: 0 });
    const lines = result.split('\n');

    expect(lines[1]).toContain(longStr);
  });

  it('should flatten calendar dateTime objects', () => {
    const data = [
      {
        id: 'ev1',
        start: { dateTime: '2026-03-07T10:00:00Z', timeZone: 'UTC' },
        end: { dateTime: '2026-03-07T11:00:00Z', timeZone: 'UTC' },
      },
    ];
    const result = encodeToon('events', data as Record<string, unknown>[], ['id', 'start', 'end']);
    const lines = result.split('\n');

    expect(lines[1]).toBe('ev1\t2026-03-07T10:00:00Z\t2026-03-07T11:00:00Z');
  });

  it('should flatten calendar date-only objects', () => {
    const data = [
      {
        id: 'ev1',
        start: { date: '2026-03-07' },
        end: { date: '2026-03-08' },
      },
    ];
    const result = encodeToon('events', data as Record<string, unknown>[], ['id', 'start', 'end']);
    const lines = result.split('\n');

    expect(lines[1]).toBe('ev1\t2026-03-07\t2026-03-08');
  });

  it('should flatten primitive arrays as pipe-separated values', () => {
    const data = [{ id: '1', labels: ['INBOX', 'UNREAD', 'IMPORTANT'] }];
    const result = encodeToon('messages', data as Record<string, unknown>[], ['id', 'labels']);
    const lines = result.split('\n');

    expect(lines[1]).toBe('1\tINBOX|UNREAD|IMPORTANT');
  });

  it('should handle empty arrays in values', () => {
    const data = [{ id: '1', tags: [] as string[] }];
    const result = encodeToon('items', data as Record<string, unknown>[], ['id', 'tags']);
    const lines = result.split('\n');

    // Empty array returns empty string (no quotes)
    expect(lines[1]).toBe('1\t');
  });
});

describe('encodeToonSingle', () => {
  it('should encode a single object as key-value pairs', () => {
    const data = { id: 'msg1', subject: 'Hello', from: 'alice@test.com' };
    const result = encodeToonSingle('message', data);
    const lines = result.split('\n');

    expect(lines[0]).toBe('message:');
    expect(lines[1]).toBe('  id: msg1');
    expect(lines[2]).toBe('  subject: Hello');
    expect(lines[3]).toBe('  from: alice@test.com');
  });

  it('should skip undefined values', () => {
    const data = { id: 'msg1', subject: undefined, body: 'text' };
    const result = encodeToonSingle('message', data as Record<string, unknown>);
    const lines = result.split('\n');

    // header + id + body = 3 lines (subject skipped)
    expect(lines).toHaveLength(3);
    expect(result).not.toContain('subject');
  });

  it('should include null values', () => {
    const data = { id: 'msg1', body: null };
    const result = encodeToonSingle('message', data as Record<string, unknown>);

    expect(result).toContain('body: null');
  });

  it('should JSON-serialize nested objects', () => {
    const data = { id: 'msg1', meta: { key: 'val' } };
    const result = encodeToonSingle('message', data as Record<string, unknown>);

    expect(result).toContain('meta: {"key":"val"}');
  });
});

describe('formatOutput', () => {
  const sampleMessages = [
    {
      id: 'msg001',
      subject: 'Welcome',
      from: 'hello@vibetensor.com',
      date: '2025-12-18',
    },
  ];

  it('should return TOON format by default', () => {
    const result = formatOutput(sampleMessages, 'toon', 'messages');
    expect(result).toContain('messages[1]{');
    expect(result).toContain('msg001');
    expect(result).toContain('Welcome');
  });

  it('should return JSON when json format is requested', () => {
    const result = formatOutput(sampleMessages, 'json', 'messages');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(sampleMessages);
    expect(result).toContain('\n'); // pretty-printed
  });

  it('should handle empty arrays', () => {
    const result = formatOutput([], 'toon', 'messages');
    expect(result).toBe('messages[0]{}');
  });

  it('should handle single objects as key-value format', () => {
    const data = { key: 'value', count: 42 };
    const result = formatOutput(data, 'toon', 'item');

    expect(result).toContain('item:');
    expect(result).toContain('key: value');
    expect(result).toContain('count: 42');
  });

  it('should handle primitive values', () => {
    expect(formatOutput('hello', 'toon')).toBe('hello');
    expect(formatOutput(42, 'toon')).toBe('42');
  });

  it('should handle primitive arrays', () => {
    const result = formatOutput(['a', 'b', 'c'], 'toon', 'items');
    expect(result).toBe('items[3]\na\nb\nc');
  });

  it('should accept explicit field list', () => {
    const result = formatOutput(sampleMessages, 'toon', 'messages', ['id', 'subject']);
    const lines = result.split('\n');

    expect(lines[0]).toBe('messages[1]{id,subject}');
    expect(lines[1]).toBe('msg001\tWelcome');
  });
});

describe('stripHtml', () => {
  it('leaves no tag behind for nested tag fragments', () => {
    const out = stripHtml('<scr<script>ipt>alert(1)</scr</script>ipt>');
    expect(out).not.toMatch(/<[^>]+>/);
    expect(out).toContain('alert(1)');
  });

  it('should strip basic HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('should convert br tags to newlines', () => {
    expect(stripHtml('line1<br>line2<br/>line3')).toBe('line1\nline2\nline3');
  });

  it('should convert closing p and div tags to newlines', () => {
    expect(stripHtml('<p>Para 1</p><p>Para 2</p>')).toBe('Para 1\nPara 2');
  });

  it('should decode HTML entities', () => {
    expect(stripHtml('A &amp; B &lt; C &gt; D &quot;E&quot; F&#39;s')).toBe('A & B < C > D "E" F\'s');
  });

  it('should replace &nbsp; with spaces', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world');
  });

  it('should collapse excessive newlines', () => {
    expect(stripHtml('a\n\n\n\n\nb')).toBe('a\n\nb');
  });

  it('should trim whitespace', () => {
    expect(stripHtml('  <p>text</p>  ')).toBe('text');
  });

  it('should not double-unescape entities like &amp;lt;', () => {
    // "&amp;lt;" should become "&lt;" not "<"
    expect(stripHtml('&amp;lt;script&amp;gt;')).toBe('&lt;script&gt;');
  });

  it('should fully resolve multi-level &amp; encoding', () => {
    // "&amp;amp;" should become "&amp;" then "&" via iterative decoding
    expect(stripHtml('&amp;amp;')).toBe('&');
    expect(stripHtml('&amp;amp;amp;')).toBe('&');
  });

  it('should handle mixed entities without double-unescaping', () => {
    expect(stripHtml('A &amp;lt; B &amp; C')).toBe('A &lt; B & C');
  });
});
