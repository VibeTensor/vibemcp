# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- MCP server skeleton with TypeScript
- TOON format integration planning
- Gmail tool definitions (35+ tools)
- Outlook/MS365 tool definitions (35+ tools)
- Calendar tool definitions (15+ tools)
- Unified cross-account tool definitions
- Multi-account authentication support design
- OAuth 2.1 + PKCE authentication flow
- Context compression (ACON-inspired) planning
- Semantic caching layer planning
- Comprehensive documentation (README, CONTRIBUTING, SECURITY)
- GitHub Actions CI/CD pipeline
- CodeRabbit integration for AI code reviews
- Issue and PR templates

### Security
- Security policy (SECURITY.md)
- Input validation schemas using Zod
- OAuth 2.1 with PKCE (no token passthrough)

## [0.1.0] - TBD

### Added
- First public release
- Core MCP server implementation
- Gmail basic operations
- Outlook basic operations
- TOON encoder/decoder
- Multi-account token storage

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | TBD | Initial release with Gmail + Outlook support |
| 0.2.0 | TBD | Calendar integration + context compression |
| 0.3.0 | TBD | Semantic caching + performance optimizations |
| 1.0.0 | TBD | Production-ready release |

[Unreleased]: https://github.com/VibeTensor/vibemcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/VibeTensor/vibemcp/releases/tag/v0.1.0
