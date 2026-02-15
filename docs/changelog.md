# Changelog

All notable changes to VibeMCP are documented here.

## v0.1.1 (2026-02-16)

### Added
- VMCP geometric logo (11x11 grid, 4-letter quadrant design)
  - 5 logo variants: dark SVG, light SVG, gold SVG, gold PNG, white PNG
  - App icon variant: sky blue rounded square with white lettermarks
  - Favicon SVG for documentation site
- Documentation website (VitePress) at [vibemcp.vibetensor.com](https://vibemcp.vibetensor.com)
  - Guide: getting started, TOON format, multi-account auth
  - Reference: all 31 tools, CLI, configuration, output format
  - Ecosystem: architecture, integrations, roadmap

### Improved
- README: added logo, npx quick start, troubleshooting section, docs site link

## v0.1.0 (2026-02-14)

### Added
- **31 MCP tools** across 5 categories:
  - Account management (7): multi-account auth for Google + Microsoft
  - Gmail (8): list, search, send, reply, draft, labels, threads
  - Outlook (8): list, get, send, reply, forward, folders, move, search
  - Google Calendar (4): list calendars, events, create, delete
  - Outlook Calendar (5): list, events, create, update, delete
  - Unified (3): cross-account search, inbox, calendar
- **TOON output format** with 51% average token savings
  - Source-level encoding with per-data-type field selection
  - Flat field transformation for nested API responses
  - Per-call `format` parameter (toon/json)
- **Multi-account authentication**
  - Google OAuth 2.0 with local callback server
  - Microsoft Device Code Flow via MSAL
- **CLI** for account management (`auth`, `accounts list`, `accounts remove`)
- **Service cache** with 10-minute TTL
- **stderr-safe logging** (protects MCP JSON-RPC stdout)
- Documentation: README, TOON.md, PRIVACY.md, SECURITY.md, CONTRIBUTING.md

### Security
- Credentials excluded from git (`.gitignore`)
- Zod input validation on all tool parameters
- No token exposure in tool responses
- No telemetry or data collection
