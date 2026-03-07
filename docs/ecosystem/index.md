# Ecosystem

VibeMCP is part of a growing ecosystem of token-optimized MCP tools built by [VibeTensor](https://vibetensor.com).

## Architecture

```mermaid
flowchart TD
    subgraph MCP["MCP Server (stdio)"]
        IDX["index.ts\nServer Entry"]
        ADM["tools/admin.ts\nAccount Management (7)"]
        GM["tools/gmail.ts\nGmail Tools (16)"]
        OL["tools/outlook.ts\nOutlook Tools (16)"]
        CAL["tools/calendar.ts\nCalendar Tools (6)"]
        CON["tools/contacts.ts\nContacts Tools (3)"]
        UNI["tools/unified.ts\nCross-Account (3)"]
    end

    subgraph Core["Core Layer"]
        CFG["config.ts\nEnv + Account Registry"]
        TOON["toon/encoder.ts\nTOON Serialization"]
        LOG["utils/logger.ts\nstderr-safe Logging"]
    end

    subgraph Auth["Auth Layer"]
        GA["auth/google.ts\nOAuth2 + Browser"]
        MA["auth/microsoft.ts\nMSAL Device Code"]
        TS["auth/store.ts\nToken File I/O"]
    end

    subgraph Services["Service Layer"]
        GS["services/gmail.ts\ngoogleapis"]
        MS["services/ms-mail.ts\nGraph API (fetch)"]
        GC["services/google-calendar.ts\ngoogleapis"]
        MC["services/ms-calendar.ts\nGraph API (fetch)"]
        GPC["services/google-contacts.ts\nPeople API"]
        MSC["services/ms-contacts.ts\nGraph API (fetch)"]
        CACHE["services/cache.ts\n10-min TTL"]
    end

    IDX --> ADM & GM & OL & CAL & CON & UNI
    ADM --> CFG & GA & MA
    GM --> GS & TOON
    OL --> MS & TOON
    CAL --> GC & MC & TOON
    CON --> GPC & MSC & TOON
    UNI --> GS & MS & GC & MC & TOON
    GS & MS & GC & MC & GPC & MSC --> CACHE
    GA --> TS
    MA --> TS

    classDef mcpStyle fill:#f0f9ff,stroke:#0ea5e9,color:#0c4a6e
    classDef coreStyle fill:#f0fdf4,stroke:#22c55e,color:#14532d
    classDef authStyle fill:#fefce8,stroke:#eab308,color:#713f12
    classDef svcStyle fill:#faf5ff,stroke:#a855f7,color:#581c87

    class MCP mcpStyle
    class Core coreStyle
    class Auth authStyle
    class Services svcStyle
```

## Source Structure

```
src/
├── index.ts                # MCP server entry + tool registration
├── cli.ts                  # CLI entry point (auth, accounts, serve)
├── config.ts               # Environment loading, account registry
├── auth/
│   ├── google.ts           # Google OAuth2 with local callback server
│   ├── microsoft.ts        # Microsoft MSAL Device Code Flow
│   └── store.ts            # Token file I/O helpers
├── services/
│   ├── gmail.ts            # Gmail API service (googleapis)
│   ├── ms-mail.ts          # Microsoft Graph Mail (native fetch)
│   ├── google-calendar.ts  # Google Calendar API service
│   ├── ms-calendar.ts      # Microsoft Graph Calendar (native fetch)
│   ├── google-contacts.ts  # Google People API (contacts)
│   ├── ms-contacts.ts      # Microsoft Graph Contacts (native fetch)
│   └── cache.ts            # Service instance cache (10-min TTL)
├── tools/
│   ├── admin.ts            # Account management tools (7)
│   ├── gmail.ts            # Gmail tool handlers (16)
│   ├── outlook.ts          # Outlook tool handlers (16)
│   ├── calendar.ts         # Unified calendar tools (6)
│   ├── contacts.ts         # Contact tools (3)
│   └── unified.ts          # Cross-account aggregation (3)
├── toon/
│   ├── encoder.ts          # TOON serialization
│   └── types.ts            # ToonOptions interface
└── utils/
    ├── logger.ts           # stderr-safe logging
    └── errors.ts           # Error formatting
```

## Design Decisions

### stderr-safe Logging

`console.log` is redirected to `console.error` at import time. MCP uses stdout for JSON-RPC communication, so any stray `console.log` would corrupt the protocol stream.

### Static Factory Pattern

Services use `ServiceClass.create(email)` because auth initialization is async. The factory creates the service, acquires tokens, and returns a ready-to-use instance.

### Provider Auto-Detection

Calendar tools check the account registry to route requests to the correct service (Google Calendar vs Outlook Calendar) based on the email address.

### Service Cache

Authenticated service instances are cached with a 10-minute TTL. This avoids repeated token acquisition for consecutive tool calls.

### Config Directory

All persistent data (`~/.vibemcp/`) is stored in the user's home directory, not in the working directory or npm cache. This ensures tokens survive across `npx` invocations.

## Request Flow

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as VibeMCP Server
    participant Tool as Tool Handler
    participant Svc as Service Layer
    participant API as External API
    participant TOON as TOON Encoder

    AI->>MCP: MCP tool call (JSON-RPC)
    MCP->>Tool: Route to handler
    Tool->>Svc: Get/create service
    Svc->>API: API request (Gmail/Graph)
    API-->>Svc: JSON response
    Svc-->>Tool: Parsed data
    Tool->>TOON: Encode response
    TOON-->>Tool: TOON string
    Tool-->>MCP: MCP TextContent
    MCP-->>AI: JSON-RPC response
```

## Roadmap

### v0.1.x (Foundation)

- 31 MCP tools (admin, gmail, outlook, calendar, unified)
- TOON output with 51% average token savings
- Multi-account Google + Microsoft
- Cross-account unified search, inbox, calendar
- CLI for authentication and account management
- Test suite, ESLint, Prettier, Docker support

### v0.2 (Polish, Current)

- 51 MCP tools across 7 modules
- Attachment download for Gmail and Outlook
- Google Calendar event update (was Microsoft only)
- Gmail label management (create, update, delete, apply to messages)
- Email batch operations (Gmail and Outlook)
- Outlook categories and follow-up flags
- Out-of-office / auto-reply (Gmail vacation, Outlook auto-reply)
- Contact name resolution via Google People API and Microsoft Graph
- Calendar free/busy lookup
- Recurring event support (RRULE patterns)
- 149 tests across 8 suites

### v0.3 (Expand)

- Slack integration
- Todoist integration
- Semantic caching layer
- Rate limiting

### v1.0 (Production)

- Hosted OAuth (no user GCP / Azure setup needed)
- Teams chat integration
- Google Drive / OneDrive
- Enterprise SSO

## Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/VibeTensor/vibemcp/blob/main/CONTRIBUTING.md) for guidelines.

**High-priority areas:**
- Unit and integration tests
- New service modules (Slack, Todoist, Discord)
- TOON encoder improvements
- Documentation and examples

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/) - [VibeTensor Private Limited](https://vibetensor.com)

Free for personal use, research, education, hobby projects, and noncommercial organizations. Commercial use requires a separate license from VibeTensor.
