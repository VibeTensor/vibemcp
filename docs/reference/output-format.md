# Output Format

VibeMCP returns data in two formats: **TOON** (default for list tools) and **JSON** (default for detail tools). Every tool accepts a `format` parameter to switch between them.

## TOON Format

### Tabular Arrays

List tools return tabular TOON:

```
messages[10]{id,subject,from,date,snippet}
abc123	Meeting Tomorrow	john@example.com	2025-12-18	Let's meet at 3pm
def456	Q4 Report	jane@example.com	2025-12-17	Please review the attached
```

**Header components:**
- `messages` - type name (describes the data)
- `[10]` - row count (lets the LLM verify all rows were received)
- `{id,subject,from,date,snippet}` - column names in order

**Row format:**
- Tab-delimited values
- One row per object
- Values containing tabs or newlines are quoted
- No trailing delimiter

### Single Objects

Detail tools (like `gmail_get_message`) with `format: "toon"` return key-value format:

```
message:
  id: msg001
  subject: Meeting Tomorrow
  from: john@example.com
  to: alice@company.com
  date: 2025-12-18T10:30:00Z
  threadId: thread_abc
  body: Let's meet at 3pm in the conference room.
  attachments: [{"attachmentId":"att1","filename":"slides.pdf","mimeType":"application/pdf","size":245000}]
```

Complex nested values (like arrays of objects) are JSON-serialized inline.

## JSON Format

Set `format: "json"` for standard JSON output:

```json
[
  {
    "id": "abc123",
    "subject": "Meeting Tomorrow",
    "from": "john@example.com",
    "date": "2025-12-18",
    "snippet": "Let's meet at 3pm"
  }
]
```

## Default Formats

| Tool Type | Default | Reason |
|:----------|:--------|:-------|
| List tools | `toon` | Maximum token savings for repeated structures |
| Detail tools | `json` | Single objects benefit less from TOON; JSON is easier to inspect |
| Write tools | n/a | Send/reply/create tools return status messages |

## Encoding Rules

### Delimiters

VibeMCP uses **tab** as the default delimiter. Tab is safe for natural language content (email subjects and calendar titles commonly contain commas).

### Quoting

Values are automatically quoted when they contain:
- The delimiter character (tab)
- Newlines (`\n`, `\r`)
- Quote characters (`"`)

### Escape Sequences

Per TOON v3.0 spec:
- `\\` - literal backslash
- `\"` - literal quote (inside quoted values)
- `\n` - newline
- `\r` - carriage return

### Count Validation

The `[N]` count in the header always matches the number of data rows. This enables LLMs to verify they received all rows and detect truncation.
