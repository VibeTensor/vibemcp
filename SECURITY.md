# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of VibeMCP seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do

- **Report privately**: Use [GitHub Security Advisories](https://github.com/VibeTensor/vibemcp/security/advisories/new) to report vulnerabilities privately
- **Email us**: Send details to info@vibetensor.com
- **Provide details**: Include steps to reproduce, potential impact, and suggested fixes if any
- **Give us time**: Allow reasonable time for us to address the issue before public disclosure

### Please Don't

- **Don't open public issues** for security vulnerabilities
- **Don't exploit** the vulnerability beyond what's necessary to demonstrate it
- **Don't access** other users' data or accounts
- **Don't perform** denial of service attacks

## What to Include

When reporting a vulnerability, please include:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Affected versions** of VibeMCP
4. **Potential impact** (what could an attacker do?)
5. **Suggested fix** (if you have one)
6. **Your contact information** for follow-up questions

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Fix Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next release cycle

## Security Architecture

### Self-Hosted Model

VibeMCP runs entirely on your local machine. There is no VibeTensor-hosted backend, no telemetry, and no data transmission to third parties.

### Authentication

- **Google**: Standard OAuth 2.0 with localhost redirect (`http://localhost:4100/code`). Users create their own Google Cloud OAuth client
- **Microsoft**: MSAL Device Code Flow. Users create their own Azure App Registration
- Per-account isolated token storage (one file per account)
- Automatic token refresh via googleapis and MSAL libraries

### Credential Storage

- OAuth tokens stored as local JSON files in the project directory
- Google tokens: `.oauth2.{email}.json`
- Microsoft tokens: `~/.vibemcp-ms-cache.json` (MSAL persistent cache)
- Account registry: `accounts.json`
- **All credential files are excluded from git via `.gitignore`**

### Input Validation

- All tool parameters validated using Zod schemas
- Type coercion for MCP protocol compatibility
- No shell command execution from user input
- No dynamic code evaluation

### Data Flow

- VibeMCP is a passthrough: it fetches data from Google/Microsoft APIs and returns it to the MCP client
- No persistent data storage beyond auth tokens
- No caching of email content or calendar data
- stderr-safe logging ensures no sensitive data leaks to stdout (which carries MCP JSON-RPC messages)

### Token Safety

- OAuth tokens are never included in MCP tool responses
- Tokens are never logged (console.log redirected to stderr, and token values are not logged)
- Service instances are cached in-memory with 10-minute TTL (tokens stay in memory only while the process runs)

## Known Security Considerations

### MCP Protocol Risks

As documented in MCP security research:

1. **Tool Poisoning**: VibeMCP uses a curated, verified tool set (31 tools, all defined in source)
2. **Token Leakage**: OAuth tokens are never exposed in tool responses
3. **Command Injection**: No shell command execution from user input

### Credential File Permissions

OAuth token files are created with default file permissions. On shared systems, users should ensure these files are readable only by their user account:

```bash
# Linux/macOS
chmod 600 .oauth2.*.json
chmod 600 accounts.json
```

### Third-Party Dependencies

- Dependencies are regularly updated via Dependabot
- Key runtime dependencies: `googleapis`, `@azure/msal-node`, `@modelcontextprotocol/sdk`, `zod`
- Security advisories are monitored

## Files That Should Never Be Committed

The following files contain sensitive credentials and are excluded by `.gitignore`:

| File Pattern | Contents |
|-------------|----------|
| `.env` | Google/Microsoft API credentials |
| `.oauth2.*.json` | Google OAuth access + refresh tokens |
| `.vibemcp-ms-cache.json` | Microsoft MSAL token cache |
| `accounts.json` | Registered account emails |

If you accidentally commit any of these files:
1. Immediately revoke the exposed credentials
2. Remove the file from git history (`git filter-branch` or `BFG Repo-Cleaner`)
3. Rotate all affected API keys and tokens

## Security Acknowledgments

We thank the following researchers for responsibly disclosing vulnerabilities:

*No vulnerabilities reported yet.*

---

## Contact

- **Security Email**: info@vibetensor.com
- **GitHub Security Advisories**: [Report here](https://github.com/VibeTensor/vibemcp/security/advisories/new)

Thank you for helping keep VibeMCP and our users safe!
