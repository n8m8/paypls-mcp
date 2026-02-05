# Contributing to PayPls MCP Server

Thank you for your interest in contributing to the PayPls MCP Server! This document provides guidelines for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** — your bug might already be reported
2. **Create a new issue** with:
   - Clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (Node version, OS, etc.)

### Suggesting Features

1. **Open an issue** with the `enhancement` label
2. Describe the use case — *why* do you need this?
3. Propose a solution if you have one

### Submitting Pull Requests

#### Before You Start

1. **Open an issue first** to discuss significant changes
2. Fork the repository
3. Create a feature branch: `git checkout -b feature/your-feature`

#### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/paypls-mcp.git
cd paypls-mcp

# Install dependencies
npm install

# Create .env from example
cp .env.example .env
# Edit .env with your PayPls test credentials

# Run in development mode
npm run dev

# Run type checking
npm run typecheck

# Run linter
npm run lint
```

#### PR Requirements

All pull requests must:

1. **Pass CI checks** — linting, type checking, and tests
2. **Include tests** for new functionality (when applicable)
3. **Update documentation** if behavior changes
4. **Follow existing code style**
5. **Have a clear description** of what and why

#### PR Process

1. Push your branch to your fork
2. Open a PR against `main`
3. Fill out the PR template
4. Wait for review — **all PRs require maintainer approval**
5. Address any feedback
6. Once approved, a maintainer will merge

### Code Style

- **TypeScript** — use strict typing, avoid `any`
- **Formatting** — we use default ESLint rules
- **Naming** — clear, descriptive names; no abbreviations
- **Comments** — explain *why*, not *what*

### Commit Messages

Follow conventional commits:

```
feat: add support for USDC transactions
fix: handle network timeout gracefully
docs: update installation instructions
chore: bump dependencies
```

## Security

**Do not open public issues for security vulnerabilities.**

Email security concerns to: security@paypls.io

See [SECURITY.md](SECURITY.md) for our security policy.

## Questions?

- Open a [Discussion](https://github.com/n8m8/paypls-mcp/discussions)
- Check the [PayPls Docs](https://docs.paypls.io)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
