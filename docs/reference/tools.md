# Tools Reference

VibeMCP provides **51 tools** across 7 modules. Every tool that returns data supports both `toon` and `json` output via the `format` parameter.

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

## Gmail (16)

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
| `gmail_create_label` | Create a new Gmail label | toon |
| `gmail_update_label` | Update label name or visibility settings | toon |
| `gmail_delete_label` | Delete a user-created label | - |
| `gmail_modify_labels` | Add or remove labels from specific messages | - |
| `gmail_download_attachment` | Download an attachment with metadata | json |
| `gmail_batch_modify` | Batch archive, read, unread, trash, or untrash messages | - |
| `gmail_get_vacation` | Get current out-of-office auto-reply settings | toon |
| `gmail_set_vacation` | Enable or disable out-of-office with date range | - |

### Gmail Parameters

**`gmail_list_messages`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `email` | string | required | Gmail account email |
| `query` | string | `""` | Gmail search query (e.g., `from:alice subject:report`) |
| `maxResults` | number | `10` | Max messages to return (1-100) |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

**`gmail_batch_modify`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Gmail account email |
| `message_ids` | string[] | required | Message IDs to modify (1-1000) |
| `action` | enum | required | `archive`, `mark_read`, `mark_unread`, `trash`, or `untrash` |

**`gmail_set_vacation`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Gmail account email |
| `enable` | boolean | required | Enable or disable auto-reply |
| `subject` | string | optional | Auto-reply subject line |
| `message` | string | optional | Auto-reply body text |
| `start_time` | string | optional | Start time (ISO 8601) |
| `end_time` | string | optional | End time (ISO 8601) |

## Outlook (16)

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
| `outlook_list_categories` | List available Outlook categories | toon |
| `outlook_set_categories` | Set categories on a message | - |
| `outlook_set_flag` | Set follow-up flag on a message | - |
| `outlook_batch_update` | Batch mark read/unread, archive, or move messages | - |
| `outlook_download_attachment` | Download an attachment by ID | json |
| `outlook_list_attachments` | List attachments on a message | toon |
| `outlook_get_auto_reply` | Get current auto-reply (OOO) settings | toon |
| `outlook_set_auto_reply` | Configure auto-reply with schedule | - |

### Outlook Parameters

**`outlook_list_messages`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `email` | string | required | Microsoft account email |
| `folderId` | string | `"inbox"` | Folder ID or name |
| `maxResults` | number | `10` | Max messages to return |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

**`outlook_batch_update`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Microsoft account email |
| `message_ids` | string[] | required | Message IDs to update (1-100) |
| `action` | enum | required | `mark_read`, `mark_unread`, `archive`, or `move` |
| `destination_folder` | string | optional | Folder ID (required for `move` action) |

**`outlook_set_auto_reply`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Microsoft account email |
| `status` | enum | required | `disabled`, `alwaysEnabled`, or `scheduled` |
| `internal_message` | string | optional | Reply message for internal senders |
| `external_message` | string | optional | Reply message for external senders |
| `external_audience` | enum | optional | `none`, `contactsOnly`, or `all` |
| `start_date` | string | optional | Schedule start (ISO 8601, required for `scheduled`) |
| `end_date` | string | optional | Schedule end (ISO 8601, required for `scheduled`) |

## Calendar (6)

| Tool | Description | Default Format |
|:-----|:------------|:--------------:|
| `calendar_list_calendars` | List calendars (auto-detects provider) | toon |
| `calendar_list_events` | List events in a time range | toon |
| `calendar_create_event` | Create event with optional recurrence (RRULE) | - |
| `calendar_update_event` | Update an event (Google and Microsoft) | - |
| `calendar_delete_event` | Delete an event | - |
| `calendar_free_busy` | Check free/busy availability for calendars | toon |

### Calendar Parameters

**`calendar_list_events`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Account email |
| `timeMin` | string | required | ISO 8601 start time |
| `timeMax` | string | required | ISO 8601 end time |
| `calendarId` | string | optional | Calendar ID (default: primary) |
| `maxResults` | number | `50` | Max events to return |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

**`calendar_create_event`** (with recurrence)
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Account email |
| `title` | string | required | Event title |
| `start` | string | required | Start time (ISO 8601) |
| `end` | string | required | End time (ISO 8601) |
| `location` | string | optional | Event location |
| `description` | string | optional | Event description |
| `attendees` | string[] | optional | Attendee email addresses |
| `recurrence_rule` | string | optional | RRULE (e.g., `FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10`) |

**`calendar_free_busy`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Account email |
| `emails` | string[] | required | Email addresses or calendar IDs to check |
| `start_time` | string | required | Start of time range (ISO 8601) |
| `end_time` | string | required | End of time range (ISO 8601) |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

## Contacts (3)

| Tool | Description | Default Format |
|:-----|:------------|:--------------:|
| `contact_search` | Search contacts by name or email | toon |
| `resolve_contacts` | Resolve email addresses to display names | toon |
| `contact_list` | List contacts from a Google or Microsoft account | toon |

### Contacts Parameters

**`contact_search`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Account email |
| `query` | string | required | Search query (name or email) |
| `max_results` | number | `10` | Max results to return |
| `format` | `"toon"` \| `"json"` | `"toon"` | Output format |

**`resolve_contacts`**
| Parameter | Type | Default | Description |
|:----------|:-----|:--------|:------------|
| `account` | string | required | Account email |
| `emails` | string[] | required | Email addresses to resolve (1-50) |
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
