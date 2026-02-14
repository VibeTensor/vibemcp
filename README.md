# VibeMCP

**Token-Optimized Unified MCP Server for Gmail & Microsoft 365**

[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-purple.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![MCP Version](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org)

---

## What is VibeMCP?

VibeMCP is an open-source MCP server that **unifies Gmail and Microsoft 365** into a single server with **TOON (Token-Oriented Object Notation)** output, cutting LLM token consumption by **51% on average** compared to standard JSON MCP servers.

One server. Two ecosystems. Half the tokens.

### The Problem

Most email/calendar MCP servers return verbose JSON that wastes tokens:

```json
[
  {"id": "abc123", "subject": "Meeting Tomorrow", "from": "john@example.com", "date": "2025-12-18", "snippet": "Let's meet at 3pm..."},
  {"id": "def456", "subject": "Q4 Report", "from": "jane@example.com", "date": "2025-12-17", "snippet": "Please review the..."}
]
```

**~85 tokens** for 2 messages. Repeated keys (`"id"`, `"subject"`, `"from"`, `"date"`) eat tokens on every row.

### The VibeMCP Solution

```
messages[2]{id,subject,from,date,snippet}
abc123	Meeting Tomorrow	john@example.com	2025-12-18	Let's meet at 3pm...
def456	Q4 Report	jane@example.com	2025-12-17	Please review the...
```

**~38 tokens** for the same data. The header `messages[2]{id,subject,from,date,snippet}` declares the schema once, then rows are tab-delimited. No repeated keys, no brackets, no quotes.

---

## Benchmarks (Real Data)

Measured on live Gmail and Outlook accounts, Feb 2026:

| Dataset | TOON | JSON | Token Savings |
|---------|------|------|:-------------:|
| Gmail - 10 messages | 591 tokens | 961 tokens | **38%** |
| Outlook - 10 messages | 872 tokens | 1,480 tokens | **41%** |
| Google Calendar - 11 events | 441 tokens | 1,462 tokens | **70%** |
| **Combined** | **1,904 tokens** | **3,903 tokens** | **51%** |

Calendar events show 70% savings because JSON has deeply nested objects (`start.dateTime`, `start.timeZone`, `attendees[].emailAddress.address`) that TOON flattens.

### Cost Impact

At Claude Opus pricing ($15/M input tokens):

| Usage | Annual Token Savings | Annual Cost Savings |
|-------|---------------------|:-------------------:|
| 10 calls/day | 7.3M tokens | **$109** |
| 50 calls/day | 36.5M tokens | **$547** |
| 200 calls/day | 146M tokens | **$2,190** |

Every tool in VibeMCP supports both `toon` and `json` output via the `format` parameter, so you can switch per-call.

---

## Comparison with Other MCP Servers

| Feature | VibeMCP | [gmail-mcp](https://github.com/shinzo-labs/gmail-mcp) | [ms-365-mcp-server](https://github.com/Softeria/ms-365-mcp-server) | [google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) |
|---------|:-------:|:---------:|:------------------:|:---------------------:|
| Gmail | 8 tools | 60+ tools | - | 80+ tools |
| Outlook Mail | 8 tools | - | 90+ tools | - |
| Google Calendar | 4 tools | - | - | included |
| Outlook Calendar | 5 tools | - | included | - |
| **Unified (both providers)** | **Yes** | No | No | No |
| **TOON output** | **Yes** | No | No | No |
| **Multi-account** | **Native** | No | No | Manual |
| **Cross-account search** | **Yes** | No | No | No |
| Token optimization | **51% avg** | None | None | None |
| Language | TypeScript | Python | TypeScript | Python |

**VibeMCP is the first MCP server that natively outputs TOON.** Existing TOON MCP servers (like `toon-mcp`) are generic JSON-to-TOON converters. VibeMCP encodes at the source level, selecting the optimal fields per data type.

---

## Tools (31 total)

### Account Management (7 tools)

| Tool | Description |
|------|-------------|
| `list_accounts` | List all connected accounts with auth status |
| `add_google_account` | Start Google OAuth flow (browser-based) |
| `complete_google_auth` | Complete Google authentication |
| `add_microsoft_account` | Start Microsoft Device Code flow |
| `complete_microsoft_auth` | Complete Microsoft authentication |
| `remove_account` | Remove a connected account |
| `accounts_status` | Check auth status and server configuration |

### Gmail (8 tools)

| Tool | Description |
|------|-------------|
| `gmail_list_messages` | List/search messages with Gmail operators |
| `gmail_get_message` | Get full message content with body and attachments |
| `gmail_send_message` | Send email with RFC 2822 compliance |
| `gmail_reply_to_message` | Reply with proper threading (In-Reply-To/References) |
| `gmail_create_draft` | Create a draft email |
| `gmail_list_labels` | List all Gmail labels |
| `gmail_list_threads` | List email threads |
| `gmail_get_thread` | Get full thread with all messages |

### Outlook (8 tools)

| Tool | Description |
|------|-------------|
| `outlook_list_messages` | List messages with folder filtering |
| `outlook_get_message` | Get full message content |
| `outlook_send_message` | Send email via Microsoft Graph |
| `outlook_reply_to_message` | Reply to a message |
| `outlook_forward_message` | Forward a message |
| `outlook_list_folders` | List mail folders |
| `outlook_move_message` | Move message between folders |
| `outlook_search` | Search messages via Microsoft Graph |

### Calendar (5 tools)

| Tool | Description |
|------|-------------|
| `calendar_list_calendars` | List calendars (Google or Outlook, auto-detected) |
| `calendar_list_events` | List events in a time range |
| `calendar_create_event` | Create event (supports Teams/Meet links) |
| `calendar_update_event` | Update an Outlook event |
| `calendar_delete_event` | Delete an event |

### Unified / Cross-Account (3 tools)

| Tool | Description |
|------|-------------|
| `unified_search` | Search across all email accounts simultaneously |
| `unified_inbox` | Aggregated unread messages from all accounts |
| `unified_calendar` | Merged calendar view across all providers |

---

## Quick Start

### Prerequisites

- Node.js >= 18
- Google Cloud OAuth credentials ([setup guide](#google-oauth-setup))
- Azure App Registration ([setup guide](#microsoft-auth-setup))

### Installation

```bash
# Clone and build
git clone https://github.com/VibeTensor/vibemcp.git
cd vibemcp
npm install
npm run build
```

### Configure Environment

Create a `.env` file in the project root:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-azure-client-id
MICROSOFT_TENANT_ID=common
VIBEMCP_OUTPUT_FORMAT=toon
```

### Add to Claude Code

Add to your Claude Code MCP config (`~/.claude.json` > `mcpServers`):

```json
{
  "vibemcp": {
    "type": "stdio",
    "command": "node",
    "args": ["/path/to/vibemcp/dist/index.js"],
    "env": {}
  }
}
```

### Authenticate Accounts

Once VibeMCP is running as an MCP server, use the built-in tools:

```
> Add my Google account
# VibeMCP calls add_google_account -> opens browser for OAuth
# Then calls complete_google_auth to finish

> Add my Microsoft account
# VibeMCP calls add_microsoft_account -> returns device code
# You enter the code at microsoft.com/devicelogin
# Then calls complete_microsoft_auth to finish
```

Or use the CLI directly:

```bash
npx tsx src/cli.ts auth google your@gmail.com
npx tsx src/cli.ts auth microsoft your@outlook.com
npx tsx src/cli.ts accounts list
```

---

## Architecture

```
src/
  index.ts              # MCP server entry point (StdioServerTransport)
  cli.ts                # CLI for auth management
  config.ts             # Environment, account registry, scopes
  auth/
    google.ts           # Google OAuth2 with local callback server (port 4100)
    microsoft.ts        # Microsoft MSAL Device Code Flow
    store.ts            # Token file I/O helpers
  services/
    gmail.ts            # Gmail API service (googleapis)
    ms-mail.ts          # Microsoft Graph Mail (native fetch)
    google-calendar.ts  # Google Calendar API service
    ms-calendar.ts      # Microsoft Graph Calendar (native fetch)
    cache.ts            # Service instance cache (10-min TTL)
  tools/
    admin.ts            # Account management tools
    gmail.ts            # Gmail MCP tool handlers
    outlook.ts          # Outlook MCP tool handlers
    calendar.ts         # Unified calendar tools (auto-detects provider)
    unified.ts          # Cross-account aggregation tools
  toon/
    encoder.ts          # TOON serialization (encodeToon, formatOutput)
    types.ts            # ToonOptions interface
  utils/
    logger.ts           # stderr-safe logging (protects JSON-RPC stdout)
    errors.ts           # Error categories and formatting
```

### Key Design Decisions

- **stderr-safe logging**: `console.log` is redirected to `console.error` at import time, ensuring stdout is reserved for MCP JSON-RPC messages
- **Static factory pattern**: Services use `ServiceClass.create(email)` instead of constructors because Microsoft auth is async
- **Provider auto-detection**: Calendar tools check the account registry to determine if an email is Google or Microsoft, then route to the correct service
- **Service cache with TTL**: Authenticated service instances are cached for 10 minutes to avoid repeated token acquisition (saves 200-400ms per call)

---

## Auth Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Desktop Application)
3. Add `http://localhost:4100/code` as an authorized redirect URI
4. Enable the Gmail API and Google Calendar API
5. Copy the Client ID and Client Secret to your `.env`

**Scopes requested:**
- `openid` + `userinfo.email` (identity)
- `https://mail.google.com/` (full Gmail access)
- `https://www.googleapis.com/auth/calendar` (Calendar read/write)

### Microsoft Auth Setup

1. Go to [Azure Portal > App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application (any name)
3. Set "Supported account types" to "Personal Microsoft accounts only" or "All account types"
4. Under Authentication, enable "Allow public client flows" (required for Device Code)
5. Copy the Application (client) ID to your `.env`

**Scopes requested:**
- `Mail.ReadWrite`, `Mail.Send` (email)
- `Calendars.ReadWrite` (calendar)
- `User.Read` (profile)

Personal accounts (hotmail/outlook/live) automatically exclude Teams scopes.

---

## TOON Format

TOON (Token-Oriented Object Notation) encodes structured data as a header + tab-delimited rows:

```
typeName[count]{field1,field2,field3}
value1a	value1b	value1c
value2a	value2b	value2c
```

**Header**: `typeName[count]{fields}` declares the schema once
**Rows**: Tab-separated values, one per line. No repeated keys.

For single objects, TOON uses key-value format:

```
typeName
key1: value1
key2: value2
```

### Why TOON beats JSON for LLMs

1. **No repeated keys** - JSON repeats `"subject"`, `"from"`, `"date"` for every item. TOON declares fields once in the header.
2. **No syntax noise** - No `{`, `}`, `[`, `]`, `"`, `,` characters consuming tokens.
3. **Schema in header** - The `[count]{fields}` header tells the LLM what to expect, improving parsing accuracy.
4. **Fallback to JSON** - Every tool accepts `format: "json"` for debugging or downstream JSON processing.

---

## Development

```bash
# Install dependencies
npm install

# Type check
npx tsc --noEmit

# Build
npm run build

# Dev mode (auto-reload)
npm run dev

# Run directly
node dist/index.js
```

---

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/slack-integration`)
3. Make your changes
4. Run type checking (`npx tsc --noEmit`)
5. Commit and push
6. Open a Pull Request

### Areas for Contribution

- **New service modules**: Slack, Todoist, Discord, Reddit
- **TOON encoder improvements**: Better field selection per data type
- **Semantic caching**: Cache frequent queries to reduce API calls
- **Context compression**: ACON-based history optimization
- **Tests**: Unit and integration tests
- **Documentation**: Usage examples, video tutorials

---

## Roadmap

### v0.1 - Foundation (Current)
- [x] Gmail (8 tools) with TOON output
- [x] Outlook Mail (8 tools) with TOON output
- [x] Google Calendar (4 tools)
- [x] Outlook Calendar (5 tools)
- [x] Multi-account authentication (Google OAuth + Microsoft Device Code)
- [x] Unified cross-account tools (search, inbox, calendar)
- [x] CLI for account management
- [x] 51% average token savings vs JSON

### v0.2 - Polish
- [ ] Attachment handling (upload/download)
- [ ] Google Calendar event update
- [ ] Gmail label management (create/delete/apply)
- [ ] Outlook category support
- [ ] Comprehensive test suite
- [ ] npm package publish (`@vibetensor/vibemcp`)

### v0.3 - Expand
- [ ] Slack integration
- [ ] Todoist integration
- [ ] Semantic caching layer
- [ ] Context compression (ACON)
- [ ] Rate limiting

### v1.0 - Production
- [ ] Hosted OAuth (no user GCP/Azure setup needed)
- [ ] Teams chat integration
- [ ] Google Drive / OneDrive
- [ ] Admin dashboard
- [ ] Enterprise SSO

---

## Research References

- [MCP Specification](https://modelcontextprotocol.io) - Model Context Protocol
- [TOON Format](https://github.com/toon-format/toon) - Token-Oriented Object Notation
- [ACON: Context Compression](https://arxiv.org/abs/2510.00615) - 26-54% memory reduction
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/draft/basic/security_best_practices)

---

## Privacy & Data Handling

VibeMCP is **fully self-hosted**. Your data never leaves your machine.

- **No telemetry**: VibeMCP does not phone home, collect analytics, or send data to VibeTensor or any third party
- **No hosted OAuth**: You create your own Google Cloud project and Azure App Registration. VibeTensor never sees your credentials
- **Local token storage**: OAuth tokens are stored as local JSON files in your project directory. They are never transmitted
- **No data retention**: VibeMCP is a passthrough — it fetches data from APIs on demand and returns it to your MCP client. Nothing is stored permanently except auth tokens needed for API access
- **You own your credentials**: Your Google Client ID/Secret and Azure App Registration are yours. VibeTensor has no access to them

See [PRIVACY.md](PRIVACY.md) for full details.

---

## Disclaimer

This project is **not affiliated with, endorsed by, or sponsored by Google or Microsoft**.

- Gmail, Google Calendar, and Google Cloud are trademarks of Google LLC
- Microsoft 365, Outlook, Azure, and Microsoft Graph are trademarks of Microsoft Corporation
- VibeMCP uses these services' public APIs under their respective Terms of Service

Users are responsible for:
- Creating their own API credentials (Google Cloud OAuth, Azure App Registration)
- Complying with [Google APIs Terms of Service](https://developers.google.com/terms) and [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy)
- Complying with [Microsoft APIs Terms of Use](https://learn.microsoft.com/en-us/legal/microsoft-apis/terms-of-use)
- Providing a privacy policy when configuring their OAuth consent screens (templates provided in [PRIVACY.md](PRIVACY.md))

---

## License

**PolyForm Noncommercial 1.0.0** - [VibeTensor Private Limited](https://vibetensor.com)

This software is free for personal use, research, education, hobby projects, and noncommercial organizations. Commercial use requires a separate license from VibeTensor.

See [LICENSE](LICENSE) for full text.

## About VibeTensor

VibeTensor is a DPIIT-recognized AI startup from India building intelligent developer tools.

- [Website](https://vibetensor.com) | [GitHub](https://github.com/VibeTensor) | [LinkedIn](https://linkedin.com/company/vibetensor)
