# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@paypls.io**

Include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fixes (optional)

### What to Expect

- **Acknowledgment** within 48 hours
- **Status update** within 7 days
- **Resolution timeline** based on severity

We appreciate responsible disclosure and will credit reporters (unless you prefer anonymity).

## Security Best Practices

When using the PayPls MCP server:

1. **Never commit API tokens** — use environment variables
2. **Set appropriate spending limits** in the PayPls dashboard
3. **Review transactions** via Telegram notifications
4. **Use separate tokens** for development vs production
5. **Rotate tokens** periodically

## Known Limitations

> ⚠️ **This MCP server does NOT enforce spending limits.**
> 
> All limits are configured and enforced by the PayPls backend. 
> An agent with access to this MCP server can request any transaction — 
> approval/denial happens server-side based on your configured rules.

Configure your limits at [paypls.io](https://paypls.io) before deploying.
