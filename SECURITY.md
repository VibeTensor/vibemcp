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
- **Email us**: Send details to security@vibetensor.com
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

## Security Measures

VibeMCP implements the following security measures:

### Authentication & Authorization

- OAuth 2.1 with PKCE for all authentication flows
- No token passthrough (tokens are validated server-side)
- Per-account isolated credential storage
- Automatic token refresh with secure storage

### Input Validation

- All inputs are validated and sanitized
- Parameterized queries (no string concatenation)
- Protection against prompt injection attacks
- Tool parameter validation using Zod schemas

### Data Protection

- Credentials stored securely (encrypted at rest)
- No sensitive data in logs
- Minimal data retention
- HTTPS enforcement for all external communications

### Human-in-the-Loop

- Destructive operations require explicit confirmation
- Dangerous actions are logged and auditable
- Rate limiting on sensitive operations

## Known Security Considerations

### MCP Protocol Risks

As documented in MCP security research:

1. **Tool Poisoning**: We use a curated, verified tool set
2. **Prompt Injection**: Input sanitization on all tool parameters
3. **Token Leakage**: Tokens never exposed in tool responses
4. **Command Injection**: No shell command execution from user input

### Third-Party Dependencies

- Dependencies are regularly updated via Dependabot
- Security advisories are monitored
- npm audit runs on every CI build

## Security Acknowledgments

We thank the following researchers for responsibly disclosing vulnerabilities:

*No vulnerabilities reported yet.*

---

## Contact

- **Security Email**: security@vibetensor.com
- **GitHub Security Advisories**: [Report here](https://github.com/VibeTensor/vibemcp/security/advisories/new)
- **PGP Key**: Available upon request

Thank you for helping keep VibeMCP and our users safe!
