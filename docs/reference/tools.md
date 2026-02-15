# Tools Reference

VibeMCP provides **31 tools** across 5 categories. Every tool that returns data supports both `toon` and `json` output via the `format` parameter.

## Account Management (7)

| Tool | Description |
|:-----|:------------|
| `list_accounts` | List all connected accounts with auth status |
| `add_google_account` | Start Google OAuth flow (opens browser) |
| `complete_google_auth` | Complete Google authentication |
| `add_microsoft_account` | Start Microsoft Device Code flow |
| `complete_microsoft_auth` | Complete Microsoft authentication |
| `remove_account` | Remove a connected account |
| `accounts_status` | Check auth status and server configuration |

## Gmail (8)

| Tool | Description | Default Format |
|:-----|:------------|:--------------:|
| `gmail_list_messages` | List/search messages with Gmail search operators | toon |
| `gmail_get_message` | Get full message content with body and attachments | json |
| `gmail_send_message` | Send email with RFC 2822 compliance | - |
| `gmail_reply_to_message` | Reply with proper threading (In-Reply-To / References) | - |
| `gmail_create_draft` | Create a draft email | - |
| `gmail_list_labels` | List all Gmail labels | toon |
| `gmail_list_threads` | List email threads | toon |
| `gmail_get_thread` | Get full thread with all messages | json |

### Gmail Parameters

**`gmail_list_messages`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `email` | string | required | Gmail account email |
| `query` | string | `""` | Gmail search query (e.g., `from:alice subject:report`) |
| `maxResults` | number | `10` | Max messages to return (1-100) |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

**`gmail_get_message`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `email` | string | required | Gmail account email |
| `messageId` | string | required | Message ID from list results |
| `format` | `"toon"` \| `"json"` | `"json"` | Output format |

## Outlook (8)

| Tool | Description | Default Format |
|:-----|:------------|:--------------:|
| `outlook_list_messages` | List messages with folder filtering | toon |
| `outlook_get_message` | Get full message content | json |
| `outlook_send_message` | Send email via Microsoft Graph | - |
| `outlook_reply_to_message` | Reply to a message | - |
| `outlook_forward_message` | Forward a message | - |
| `outlook_list_folders` | List mail folders | toon |
| `outlook_move_message` | Move message between folders | - |
| `outlook_search` | Search messages via Microsoft Graph | toon |

### Outlook Parameters

**`outlook_list_messages`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `email` | string | required | Microsoft account email |
| `folderId` | string | `"inbox"` | Folder ID or name |
| `maxResults` | number | `10` | Max messages to return |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

## Calendar (5)

| Tool | Description | Default Format |
|:-----|:------------|:--------------:|
| `calendar_list_calendars` | List calendars (auto-detects provider) | toon |
| `calendar_list_events` | List events in a time range | toon |
| `calendar_create_event` | Create event (supports Teams / Meet links) | - |
| `calendar_update_event` | Update an Outlook event | - |
| `calendar_delete_event` | Delete an event | - |

### Calendar Parameters

**`calendar_list_events`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `email` | string | required | Account email |
| `timeMin` | string | now | ISO 8601 start time |
| `timeMax` | string | +7 days | ISO 8601 end time |
| `maxResults` | number | `20` | Max events to return |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

## Unified / Cross-Account (3)

| Tool | Description | Default Format |
|:-----|:------------|:--------------:|
| `unified_search` | Search across all email accounts simultaneously | toon |
| `unified_inbox` | Aggregated unread messages from all accounts | toon |
| `unified_calendar` | Merged calendar view across all providers | toon |

### Unified Parameters

**`unified_search`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `query` | string | required | Search query |
| `maxResults` | number | `10` | Max results per account |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

## Output Format

All tools return MCP `TextContent`. When `format: "toon"`:

```
messages[10]{id,subject,from,date,snippet}
msg001	Team standup	alice@co.com	2026-02-16	Notes from today...
msg002	Invoice #4521	billing@v.com	2026-02-15	Your February invoice...
```

When `format: "json"`:

```json
[
  {"id": "msg001", "subject": "Team standup", "from": "alice@co.com", ...},
  {"id": "msg002", "subject": "Invoice #4521", "from": "billing@v.com", ...}
]
```

See [Output Format](/reference/output-format) for detailed encoding rules.
