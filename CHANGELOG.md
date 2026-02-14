# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-14

### Added
- **31 MCP tools** across 5 modules: admin (7), gmail (8), outlook (8), calendar (5), unified (3)
- **TOON output format**: 51% average token savings vs JSON (38% email, 70% calendar)
- **Gmail integration**: list/search messages, get message, send, reply, create draft, list labels, list/get threads
- **Outlook integration**: list messages, get message, send, reply, forward, list folders, move message, search
- **Google Calendar**: list calendars, list events, create event, delete event
- **Outlook Calendar**: list calendars, list events, create event, update event, delete event
- **Unified tools**: cross-account search, aggregated inbox, merged calendar view
- **Multi-account authentication**: Google OAuth2 (browser flow) + Microsoft Device Code Flow
- **Account management**: add/remove accounts, status check, provider auto-detection
- **CLI**: `vibemcp auth google`, `vibemcp auth microsoft`, `vibemcp accounts list`
- **Service cache**: 10-minute TTL for authenticated service instances
- **stderr-safe logging**: protects MCP JSON-RPC stdout channel
- **Privacy documentation**: PRIVACY.md with data handling details
- **Security documentation**: SECURITY.md with architecture details

### Security
- All credential files excluded from git (.env, .oauth2.*.json, accounts.json, MSAL cache)
- Input validation on all tool parameters via Zod schemas
- OAuth tokens never exposed in MCP tool responses
- No telemetry, no data transmission to third parties

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-02-14 | Initial release: Gmail + Outlook + Calendar + TOON |
| 0.2.0 | TBD | Attachments, label management, test suite |
| 0.3.0 | TBD | Slack, Todoist, semantic caching |
| 1.0.0 | TBD | Hosted OAuth, npm package, enterprise features |

[0.1.0]: https://github.com/VibeTensor/vibemcp/releases/tag/v0.1.0
