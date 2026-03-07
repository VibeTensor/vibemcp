# TOON in VibeMCP

**How VibeMCP uses Token-Oriented Object Notation to cut LLM token costs by 51%**

---

## What is TOON?

[TOON (Token-Oriented Object Notation)](https://github.com/toon-format/toon) is an open data format (v3.0, MIT licensed) designed to encode structured data with fewer tokens than JSON. It combines YAML-style indentation for nested objects with CSV-style tabular layout for uniform arrays.

VibeMCP is the first email and calendar MCP server with native TOON output. Instead of converting JSON to TOON after the fact, VibeMCP encodes at the source level, selecting optimal fields per data type and transforming nested API responses into flat structures before serialization.

---

## Format Overview

### Tabular Arrays (Primary Use in VibeMCP)

Most MCP tool outputs are lists of similar objects (emails, events, folders, labels). TOON encodes these as a header + rows:

```
messages[3]{id,subject,from,date,snippet}
msg001	Meeting Tomorrow	john@example.com	2025-12-18	Let's meet at 3pm
msg002	Q4 Report	jane@example.com	2025-12-17	Please review the attached
msg003	Lunch?	bob@example.com	2025-12-16	Are you free Thursday
```

**Line 1 (Header):** `typeName[count]{field1,field2,...}` declares the schema once.
- `messages` - type label
- `[3]` - row count (enables LLM to verify completeness)
- `{id,subject,from,date,snippet}` - column names in order

**Lines 2+:** Tab-delimited values. One row per object. No repeated keys, no brackets, no quotes (unless the value contains a delimiter or special character).

The equivalent JSON:

```json
[
  {"id": "msg001", "subject": "Meeting Tomorrow", "from": "john@example.com", "date": "2025-12-18", "snippet": "Let's meet at 3pm"},
  {"id": "msg002", "subject": "Q4 Report", "from": "jane@example.com", "date": "2025-12-17", "snippet": "Please review the attached"},
  {"id": "msg003", "subject": "Lunch?", "from": "bob@example.com", "date": "2025-12-16", "snippet": "Are you free Thursday"}
]
```

JSON repeats `"id"`, `"subject"`, `"from"`, `"date"`, `"snippet"` for every row. TOON declares them once. For a 10-message response, that eliminates 45 repeated key strings.

### Single Objects

For individual records (e.g., full email detail), TOON uses key-value format:

```
message:
  id: msg001
  subject: Meeting Tomorrow
  from: john@example.com
  to: alice@company.com
  date: 2025-12-18T10:30:00Z
  threadId: thread_abc
  body: Let's meet at 3pm in the conference room. I'll bring the Q4 slides.
  attachments: [{"attachmentId":"att1","filename":"Q4_slides.pdf","mimeType":"application/pdf","size":245000}]
```

Complex nested values (like the `attachments` array) are JSON-serialized inline. This is intentional; see [Nested Objects](#nested-objects) below.

---

## How VibeMCP Implements TOON

### Encoder Architecture

VibeMCP's TOON encoder lives in `src/toon/encoder.ts` with three functions:

| Function | Purpose | Used By |
|----------|---------|---------|
| `encodeToon(typeName, items, fields, options)` | Encode array of objects as header + rows | List tools (`gmail_list_messages`, `outlook_list_messages`, `calendar_list_events`, etc.) |
| `encodeToonSingle(typeName, obj)` | Encode single object as key-value pairs | Detail tools (`gmail_get_message`, `outlook_get_message`) |
| `formatOutput(data, format, typeName, fields)` | Smart dispatch that picks the right encoder based on data shape, or returns JSON if `format: "json"` | All tool handlers |

### Field Selection Per Data Type

VibeMCP selects specific fields per data type rather than dumping all API response fields. This is a key part of the token optimization, and it happens before TOON encoding:

| Data Type | TOON Fields | Excluded Fields |
|-----------|-------------|-----------------|
| Gmail messages (list) | `id, subject, from, date, snippet` | `to, cc, labelIds, threadId, body, internalDate, sizeEstimate` |
| Gmail messages (detail) | All fields (defaults to JSON) | None (full detail) |
| Outlook messages (list) | `id, subject, from, receivedDateTime, isRead, preview` | `body, toRecipients, ccRecipients, hasAttachments, importance` |
| Outlook search results | `id, subject, from, receivedDateTime, preview` | Same as list, plus `isRead` |
| Google Calendar events | `id, summary, start, end, location, organizer` | `attendees, recurrence, reminders, conferenceData, description` |
| Outlook Calendar events | `id, subject, start, end, location, organizer` | `attendees, body, importance, isOnlineMeeting` |
| Gmail labels | `id, name, type` | `messagesTotal, messagesUnread, color` |
| Outlook folders | `id, displayName, totalItemCount, unreadItemCount` | `childFolderCount, parentFolderId` |

Note: Google Calendar uses `summary` for event titles while Outlook uses `subject`. Google Calendar flattens `start`/`end` to date strings; Outlook Calendar preserves the `{dateTime, timeZone}` structure which `encodeToonSingle` serializes as inline JSON.

### Delimiter and Options

```typescript
interface ToonOptions {
  delimiter: '\t' | ',' | '|';  // Default: tab
  includeCount: boolean;         // Default: true
}
```

VibeMCP uses **tab** as the default delimiter because email subjects and calendar titles commonly contain commas. Tab is safe for natural language content.

### Per-Call Format Control

Every VibeMCP tool accepts a `format` parameter:

```
format: "toon"  → TOON output (saves tokens)
format: "json"  → Standard JSON output (for debugging or downstream processing)
```

List tools (`gmail_list_messages`, `outlook_list_messages`, `calendar_list_events`, etc.) default to `toon`. Detail tools (`gmail_get_message`, `outlook_get_message`) default to `json` because single-object detail views benefit less from TOON and developers often need JSON for inspection. Switch per-call as needed.

---

## Nested Objects

### The Problem

API responses from Google and Microsoft contain deeply nested structures:

```json
{
  "start": {
    "dateTime": "2025-12-18T10:00:00",
    "timeZone": "America/New_York"
  },
  "attendees": [
    {
      "emailAddress": {
        "name": "John",
        "address": "john@example.com"
      },
      "responseStatus": "accepted"
    }
  ]
}
```

### VibeMCP's Approach: Transform and Flatten in the Service Layer

TOON v3.0 supports nested objects via indentation (like YAML). VibeMCP takes a simpler approach: each service layer transforms raw API responses into typed objects, extracting nested values into flat fields where possible.

**Google Calendar** (full flattening):
- `start.dateTime` or `start.date` → `start` (flat string)
- `end.dateTime` or `end.date` → `end` (flat string)
- `organizer.email` → `organizer` (flat string)
- `attendees[].email` → `attendees` (string array, dropped in list view)

**Outlook / Microsoft Graph** (partial flattening):
- `from.emailAddress.address` → `from` (flat string)
- `organizer.emailAddress.address` → `organizer` (flat string)
- `start` → `{ dateTime, timeZone }` (still nested, simplified but not flat)
- `end` → `{ dateTime, timeZone }` (still nested)

Google Calendar achieves 70% savings because its service layer produces fully flat records. Outlook Calendar savings are lower because `start`/`end` retain a nested structure. When encoded in TOON tabular format, `escapeValue` serializes these nested objects as JSON strings inline.

**For detail views** (single objects like `gmail_get_message`), nested values that cannot be meaningfully flattened (like an array of attachment metadata) are JSON-serialized inline by `encodeToonSingle`:

```
message:
  id: msg001
  subject: Meeting Tomorrow
  attachments: [{"attachmentId":"att1","filename":"slides.pdf","mimeType":"application/pdf","size":245000}]
```

The trade-off by data shape:
- **List views** (10-50 items): Tabular TOON. Maximum token savings. Fields are pre-selected per data type.
- **Detail views** (single item): Key-value TOON with inline JSON for nested fields. Detail tools default to JSON output since the savings are smaller and developers often need JSON for inspection.

### Why Not Full TOON Nesting?

TOON v3.0 supports indentation-based nesting:

```
event:
  id: evt001
  summary: Team Meeting
  start:
    dateTime: 2025-12-18T10:00:00
    timeZone: America/New_York
  attendees[2]{name,email,status}:
    John,john@example.com,accepted
    Jane,jane@example.com,tentative
```

VibeMCP avoids full TOON nesting for two reasons:

1. **Tabular is cheaper.** For list views, transforming `start.dateTime` to a flat `start` field and encoding 10 events in a single table saves more tokens than encoding 10 individually-nested TOON objects with indentation.

2. **LLM parsing reliability.** LLMs parse tabular data (header + rows) more reliably than indentation-based nesting. The TOON spec itself notes that tabular format achieves higher accuracy in benchmarks.

---

## Schema Evolution

### How VibeMCP Handles Version Changes

TOON headers are self-describing. Each response declares its own schema:

```
messages[10]{id,subject,from,date,snippet}
```

If VibeMCP v0.2 adds a `labels` field:

```
messages[10]{id,subject,from,date,snippet,labels}
```

The LLM reads the header and knows what columns to expect. No version negotiation, no schema registry, no breaking change. The header **is** the schema.

### Adding Fields

New fields are appended to the field list. Existing fields keep their positions. An LLM consuming VibeMCP v0.1 output and then VibeMCP v0.2 output will see a wider table, but the first 5 columns remain identical.

### Removing Fields

If a field is removed in a future version, the header simply omits it. The LLM reads the new header and adjusts. No backward-compatibility shim needed.

### Renaming Fields

Field renames are visible in the header. `receivedDateTime` → `date` would appear as a new column name. LLMs handle this naturally since they read the header on every response.

### Type Changes

TOON values are strings on the wire (like CSV). The header doesn't declare types. The LLM infers them from context (`2025-12-18` is a date, `42` is a number). Type changes in the underlying data are transparent.

---

## MCP Client Compatibility

### No Compatibility Layer Needed

MCP tools return `TextContent`, which is plain text strings. The MCP protocol has no opinion on what format that text is in. A tool can return JSON, TOON, Markdown, CSV, or prose.

```typescript
// VibeMCP tool response (TOON)
return {
  content: [{
    type: 'text',
    text: 'messages[2]{id,subject,from}\nmsg001\tHello\tjohn@example.com\nmsg002\tWorld\tjane@example.com'
  }]
};
```

Any MCP client that can read `text` content can read TOON output. The optimization is invisible to the transport layer.

### What the LLM Sees

When an MCP client (like Claude Code) calls `gmail_list_messages`, VibeMCP returns TOON text. The LLM receives this as tool result content, just a string. The LLM reads the header, understands the schema, and extracts data. No special parser, no SDK changes, no client-side configuration.

### JSON Fallback

Every VibeMCP tool accepts `format: "json"` for cases where:
- A downstream system needs JSON input
- You're debugging tool output
- You prefer JSON readability for a specific call

The `format` parameter is per-call, so you can mix TOON and JSON responses in the same session.

---

## Benchmarks

Measured on live accounts with real data, February 2026:

| Dataset | JSON Tokens | TOON Tokens | Savings |
|---------|:-----------:|:-----------:|:-------:|
| Gmail (10 messages) | 961 | 591 | **38%** |
| Outlook (10 messages) | 1,480 | 872 | **41%** |
| Google Calendar (11 events) | 1,462 | 441 | **70%** |
| **Combined** | **3,903** | **1,904** | **51%** |

Calendar events show the highest savings because the original Google Calendar API response contains deeply nested objects (`start.dateTime`, `start.timeZone`, `attendees[].email`, `organizer.email`, `conferenceData.entryPoints[].uri`) that VibeMCP's Google Calendar service transforms into a flat row of primitive values.

### Why Savings Vary

- **Flat data** (labels, folders): ~25-35% savings. Less structural overhead to remove.
- **Moderate nesting** (emails): ~38-41% savings. Keys like `from`, `subject`, `date` repeated per item.
- **Deep nesting** (calendar events): ~60-70% savings. Multiple levels of nested objects and arrays collapsed to flat fields.

---

## TOON Spec Reference

VibeMCP implements a subset of [TOON v3.0](https://github.com/toon-format/spec):

| TOON Feature | VibeMCP Support | Notes |
|-------------|:---------------:|-------|
| Tabular arrays `[N]{fields}` | Yes | Primary format for all list tools |
| Key-value objects | Yes | Used for single-object detail views |
| Tab delimiter | Yes (default) | Safe for natural language content |
| Comma delimiter | Configurable | Available via `ToonOptions` |
| Pipe delimiter | Configurable | Available via `ToonOptions` |
| Nested objects (indentation) | No | Service layer transforms nested data; `encodeToonSingle` uses inline JSON for remaining nested values |
| Non-uniform arrays (hyphen markers) | No | Not needed for email/calendar data |
| Path folding (`a.b.c: value`) | No | Not needed for current data types |
| Quoted strings | Yes | Auto-applied when values contain delimiters |
| Escape sequences (`\\`, `\"`, `\n`, `\r`) | Yes | Per TOON v3.0 spec |
| Count validation `[N]` | Yes | Count always included in header |

---

## Further Reading

- [TOON Specification v3.0](https://github.com/toon-format/spec) - Full normative spec
- [TOON Format Repository](https://github.com/toon-format/toon) - Overview and ecosystem
- [VibeMCP README](README.md) - Installation, setup, and tool reference
- [VibeMCP Source: `src/toon/encoder.ts`](src/toon/encoder.ts) - Encoder implementation
