# Multi-Account Authentication

VibeMCP supports connecting multiple Google and Microsoft accounts simultaneously. This enables cross-account operations like unified inbox and merged calendar views.

## How Multi-Account Works

```mermaid
flowchart TD
    subgraph Accounts["Connected Accounts"]
        G1["work@company.com\nGoogle"]
        G2["me@gmail.com\nGoogle"]
        M1["work@company.com\nMicrosoft"]
        M2["me@hotmail.com\nMicrosoft"]
    end

    subgraph Tools["Unified Tools"]
        UI["unified_inbox\nAll unread messages"]
        US["unified_search\nCross-account search"]
        UC["unified_calendar\nMerged calendar view"]
    end

    G1 & G2 & M1 & M2 --> UI & US & UC

    style Accounts fill:#f0f9ff,stroke:#0ea5e9
    style Tools fill:#f0fdf4,stroke:#22c55e
```

## Adding Accounts

### Multiple Google Accounts

```
> Add my work Google account (work@company.com)
  → add_google_account
  → complete_google_auth

> Add my personal Google account (me@gmail.com)
  → add_google_account
  → complete_google_auth
```

### Multiple Microsoft Accounts

```
> Add my work Microsoft account (work@company.com)
  → add_microsoft_account
  → complete_microsoft_auth

> Add my personal Outlook account (me@hotmail.com)
  → add_microsoft_account
  → complete_microsoft_auth
```

### Mixed Providers

You can connect both Google and Microsoft accounts. VibeMCP auto-detects the provider when routing tool calls.

## Cross-Account Tools

### Unified Inbox

Aggregates unread messages from all connected accounts:

```
> Show my unified inbox
```

Returns messages from all accounts, sorted by date.

### Unified Search

Search across all email accounts simultaneously:

```
> Search all accounts for "quarterly report"
```

### Unified Calendar

Merged calendar view across all providers:

```
> Show my calendar for this week
```

## Account Management

### List Connected Accounts

```
> list_accounts
```

Shows all accounts with their provider type and auth status.

### Remove an Account

```
> remove_account email="work@company.com"
```

### Check Status

```
> accounts_status
```

Shows detailed auth status and server configuration.

## How It Works Internally

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant VibeMCP
    participant Registry as Account Registry
    participant Cache as Service Cache
    participant Gmail as Gmail API
    participant Graph as Microsoft Graph

    AI->>VibeMCP: unified_inbox
    VibeMCP->>Registry: List all accounts
    Registry-->>VibeMCP: 4 accounts

    par Google accounts
        VibeMCP->>Cache: Get Gmail service (work@company.com)
        Cache-->>VibeMCP: Cached service
        VibeMCP->>Gmail: Fetch unread
        Gmail-->>VibeMCP: Messages
    and Microsoft accounts
        VibeMCP->>Cache: Get Graph service (me@hotmail.com)
        Cache-->>VibeMCP: Cached service
        VibeMCP->>Graph: Fetch unread
        Graph-->>VibeMCP: Messages
    end

    VibeMCP->>VibeMCP: Merge + sort by date
    VibeMCP->>VibeMCP: Encode as TOON
    VibeMCP-->>AI: TOON response
```

- Each account's OAuth tokens are stored separately in `~/.vibemcp/`
- VibeMCP maintains a service cache with 10-minute TTL per account
- Calendar tools auto-detect the provider (Google vs Microsoft) based on the account registry
- Unified tools fan out queries to all connected accounts and merge results
