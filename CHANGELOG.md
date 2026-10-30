# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-10-30

### Changed
- Restore the published @vibetensor/vibemcp package identity and update installation examples. The executable remains vibemcp.
- Require Node.js 22.12 or later; validate Node.js 22 and 24 in CI.
- Update MSAL to 7.1.2 and Zod to 4.6.7.
- Fail release publication on errors and verify the uploaded package before creating a GitHub release.

### Security
- Require MCP SDK 1.32.0 or later and explicitly limit tool-call arguments to 10,000 combined array elements and object keys before schema validation.
- Verify that oversized calls do not invoke tools and that the stdio server continues handling valid calls.
- Bind each Google OAuth callback to a cryptographic per-attempt state and reject missing, mismatched or duplicated state before code exchange.
- Accept callbacks once on the expected path, prevent repeated token exchanges and isolate replacement attempts during in-flight authentication.
- Cover callback rejection, replay, replacement, failure cleanup and manual browser fallback with synthetic tests.

## [0.1.3] - 2026-02-19

### Added
- **Test suite**: 46 tests across 4 test suites (TOON encoder, logger, token store, service cache)
- **ESLint configuration**: Flat config (v9+) with TypeScript support and strict rules
- **Prettier configuration**: Consistent code formatting (single quotes, trailing commas, 100 char width)
- **Jest configuration**: ts-jest with ESM support for modern TypeScript testing
- **Dockerfile**: Multi-stage production build (node:20-alpine)
- **Docker ignore**: Proper .dockerignore for clean builds
- **Examples**: Claude Desktop integration configuration (`examples/claude-desktop-config.json`)

### Fixed
- Removed unused imports in `auth/google.ts` (`URLSearchParams`, `loadAccounts`)
- Removed unused variable in `auth/microsoft.ts` (`tokenCache`)
- Applied Prettier formatting to all source files

## [0.1.2] - 2026-02-16

### Changed
- Homepage now points to [vibemcp.vibetensor.com](https://vibemcp.vibetensor.com)
- README updated with logo, npx quick start, and troubleshooting on npm

## [0.1.1] - 2026-02-16

### Added
- **VMCP logo**: geometric 11x11 grid design with 4-letter quadrant layout (V, M, C, P)
  - SVG variants: dark, light, gold
  - PNG variants: gold, white (512x512)
  - App icon: sky blue rounded square with white lettermarks
  - Favicon SVG for documentation site
- **Documentation website** (VitePress) at [vibemcp.vibetensor.com](https://vibemcp.vibetensor.com)
  - Guide: getting started, TOON format, multi-account auth
  - Reference: tools, CLI, configuration, output format
  - Ecosystem: architecture, integrations, roadmap

### Improved
- README: added logo, npx-first quick start, troubleshooting section, docs site links

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
| 0.1.3 | 2026-02-19 | Test suite, ESLint, Prettier, Docker support |
| 0.1.2 | 2026-02-16 | Homepage update, npm README refresh |
| 0.1.1 | 2026-02-16 | Logo, documentation site, README improvements |
| 0.1.0 | 2026-02-14 | Initial release: Gmail + Outlook + Calendar + TOON |
| 0.2.0 | TBD | Attachments, label management, test suite |
| 0.3.0 | TBD | Slack, Todoist, semantic caching |
| 1.0.0 | TBD | Hosted OAuth, npm package, enterprise features |

[0.1.3]: https://github.com/VibeTensor/vibemcp/releases/tag/v0.1.3
[0.1.2]: https://github.com/VibeTensor/vibemcp/releases/tag/v0.1.2
[0.1.1]: https://github.com/VibeTensor/vibemcp/releases/tag/v0.1.1
[0.1.0]: https://github.com/VibeTensor/vibemcp/releases/tag/v0.1.0
