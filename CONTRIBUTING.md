# Contributing to VibeMCP

Thank you for your interest in contributing to VibeMCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/VibeTensor/vibemcp/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing [Issues](https://github.com/VibeTensor/vibemcp/issues) and [Discussions](https://github.com/VibeTensor/vibemcp/discussions)
2. Create a feature request with:
   - Clear use case
   - Proposed solution
   - Alternatives considered

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run type checking: `npx tsc --noEmit`
5. Run tests: `npm test`
6. Run linting: `npm run lint`
7. Commit with clear messages
8. Push and create a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/vibemcp.git
cd vibemcp

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your Google/Microsoft credentials

# Build
npm run build

# Run directly (starts MCP server on stdio)
node dist/index.js

# Dev mode (auto-reload)
npm run dev

# Type check
npx tsc --noEmit

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

### Authentication Setup

You need your own API credentials to develop and test:

1. **Google**: Create an OAuth 2.0 Client ID at [Google Cloud Console](https://console.cloud.google.com/apis/credentials). See README for details.
2. **Microsoft**: Register an app at [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade). See README for details.

## Project Structure

```
src/
├── index.ts              # MCP server entry point (StdioServerTransport)
├── cli.ts                # CLI for auth management
├── config.ts             # Environment, account registry, scopes
├── auth/
│   ├── google.ts         # Google OAuth2 with local callback server
│   ├── microsoft.ts      # Microsoft MSAL Device Code Flow
│   └── store.ts          # Token file I/O helpers
├── services/
│   ├── gmail.ts          # Gmail API service (googleapis)
│   ├── ms-mail.ts        # Microsoft Graph Mail (native fetch)
│   ├── google-calendar.ts # Google Calendar API service
│   ├── ms-calendar.ts    # Microsoft Graph Calendar (native fetch)
│   └── cache.ts          # Service instance cache (10-min TTL)
├── tools/
│   ├── admin.ts          # Account management tools (7)
│   ├── gmail.ts          # Gmail tool handlers (8)
│   ├── outlook.ts        # Outlook tool handlers (8)
│   ├── calendar.ts       # Unified calendar tools (5)
│   └── unified.ts        # Cross-account aggregation tools (3)
├── toon/
│   ├── encoder.ts        # TOON serialization (encodeToon, formatOutput)
│   └── types.ts          # ToonOptions interface
└── utils/
    ├── logger.ts         # stderr-safe logging (protects JSON-RPC stdout)
    └── errors.ts         # Error categories and formatting
```

## Testing

Tests are in the `tests/` directory and use Jest with ts-jest for ESM support.

```bash
npm test                          # Run all tests
npm run test:coverage             # Run with coverage report
npx jest tests/toon-encoder.test.ts  # Run a specific test file
```

**Test files:**
- `toon-encoder.test.ts` — TOON encoder (encodeToon, encodeToonSingle, formatOutput)
- `logger.test.ts` — Logger utility and error categories
- `token-store.test.ts` — Token file read/write/delete
- `cache.test.ts` — Service instance cache

When adding new features, include corresponding tests.

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and returns
- Use interfaces for object shapes
- Avoid `any` type

### Style

- 2 spaces for indentation
- Single quotes for strings
- Semicolons at end of statements

### Key Patterns

- **stderr-safe logging**: Never use `console.log` for debug output. The `utils/logger.ts` module redirects console.log to stderr. Stdout is reserved for MCP JSON-RPC.
- **Static factory pattern**: Services use `ServiceClass.create(email)` instead of constructors because auth initialization is async.
- **Service caching**: Use `getServiceAsync()` from `services/cache.ts` to avoid redundant auth per tool call.
- **Zod coercion**: Use `z.coerce.number()` instead of `z.number()` for numeric params (MCP sends them as strings).

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Gmail attachment streaming
fix: resolve OAuth token refresh issue
docs: update README with new examples
test: add unit tests for TOON encoder
refactor: simplify multi-account handling
```

## Areas for Contribution

### High Priority

- [x] Unit tests for TOON encoder, logger, token store, service cache
- [ ] Integration tests for tool handlers
- [ ] Attachment handling (upload/download)
- [ ] Google Calendar event update support
- [ ] Gmail label management (create/delete/apply)

### Medium Priority

- [ ] Slack integration (new service module)
- [ ] Todoist integration
- [ ] TOON encoder improvements (better field selection)
- [ ] Error handling improvements

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks.

## Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/VibeTensor/vibemcp/discussions)
- **Email**: info@vibetensor.com

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes

Thank you for contributing to VibeMCP!
