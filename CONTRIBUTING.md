# Contributing to VibeMCP

Thank you for your interest in contributing to VibeMCP! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

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
4. Write/update tests
5. Run tests: `npm test`
6. Run linter: `npm run lint`
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

# Run in development mode
npm run dev

# Run tests
npm test

# Build
npm run build
```

## Project Structure

```
vibemcp/
├── src/
│   ├── index.ts          # Entry point
│   ├── server.ts         # MCP server implementation
│   ├── auth/             # OAuth authentication
│   ├── providers/        # Gmail, Outlook providers
│   ├── tools/            # MCP tool definitions
│   ├── toon/             # TOON encoder/decoder
│   ├── compression/      # Context compression (ACON)
│   ├── cache/            # Semantic caching
│   └── utils/            # Utilities
├── tests/                # Test files
├── docs/                 # Documentation
└── examples/             # Usage examples
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all function parameters and returns
- Use interfaces for object shapes
- Avoid `any` type

### Style

- Use ESLint and Prettier configurations
- 2 spaces for indentation
- Single quotes for strings
- No trailing semicolons (configurable)

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Gmail attachment streaming
fix: resolve OAuth token refresh issue
docs: update README with new examples
test: add unit tests for TOON encoder
refactor: simplify multi-account handling
```

### Testing

- Write unit tests for new features
- Maintain >80% code coverage
- Use descriptive test names

## Areas for Contribution

### High Priority

- [ ] Gmail tool implementations
- [ ] Outlook tool implementations
- [ ] TOON encoder optimization
- [ ] Unit test coverage

### Medium Priority

- [ ] Documentation improvements
- [ ] Example configurations
- [ ] Performance benchmarks
- [ ] Error handling improvements

### Good First Issues

Look for issues labeled `good first issue` for beginner-friendly tasks.

## Getting Help

- **Discord**: [Join our community](https://discord.gg/vibetensor)
- **Discussions**: [GitHub Discussions](https://github.com/VibeTensor/vibemcp/discussions)
- **Email**: opensource@vibetensor.com

## Recognition

Contributors will be recognized in:
- README.md Contributors section
- Release notes
- Our website

Thank you for contributing to VibeMCP!
