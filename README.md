# PayPls MCP Server

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@paypls/mcp-server.svg)](https://www.npmjs.com/package/@paypls/mcp-server)
[![Circle USDC Hackathon 2026](https://img.shields.io/badge/Circle%20USDC-Hackathon%202026-00D395)](https://www.moltbook.com/post/23aa9fe6-21d0-48c7-86c7-fe45db58a08e)

MCP (Model Context Protocol) server that enables AI agents to manage Bitcoin and USDC payments through [PayPls](https://paypls.io).

> 🏆 **Built for the Circle USDC Hackathon 2026** — [View Submission](https://www.moltbook.com/post/23aa9fe6-21d0-48c7-86c7-fe45db58a08e)

## What is this?

> ⚠️ **Important:** This MCP server does NOT enforce spending limits or approval requirements. 
> All limits are configured and enforced by the PayPls backend. Configure your limits in the 
> [PayPls Dashboard](https://test.paypls.io) before giving agents access to real funds.

This server allows AI assistants like Claude to:

- 💰 Check wallet balances (BTC and USDC)
- 📤 Send payments with human approval
- 📥 Generate receive addresses
- 🔍 Track transaction status

All transactions can be configured to require human approval above certain thresholds, giving you control while enabling AI autonomy for small payments.

## Quick Links

| Resource | URL |
|----------|-----|
| 🌐 Landing Page | [paypls.io](https://paypls.io) |
| 🧪 Testnet Dashboard | [test.paypls.io](https://test.paypls.io) |
| 📡 API (Production) | [api.paypls.io](https://api.paypls.io) |
| 📖 Integration Guide | [paypls.io/SKILL.md](https://paypls.io/SKILL.md) |
| 🏆 Hackathon Submission | [Moltbook](https://www.moltbook.com/post/23aa9fe6-21d0-48c7-86c7-fe45db58a08e) |
| 💻 Source Code | [GitHub](https://github.com/n8m8/paypls-mcp) |

## Installation

```bash
npm install -g @paypls/mcp-server
```

Or run directly with npx:

```bash
npx @paypls/mcp-server
```

## Configuration

### 1. Get your API token

Sign up at [paypls.io](https://paypls.io) (or [test.paypls.io](https://test.paypls.io) for testnet) and generate an API token in Settings → API Keys.

### 2. Set environment variables

```bash
# Required: Your PayPls API token (starts with pp_)
PAYPLS_TOKEN=pp_your_token_here

# Optional: API URL (defaults to https://api.paypls.io)
# For testnet, use: https://paypls-api-dev.nfwalls.workers.dev
PAYPLS_API_URL=https://api.paypls.io
```

### 3. Configure Claude Desktop

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "paypls": {
      "command": "npx",
      "args": ["@paypls/mcp-server"],
      "env": {
        "PAYPLS_TOKEN": "pp_your_token_here"
      }
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "paypls": {
      "command": "paypls-mcp",
      "env": {
        "PAYPLS_TOKEN": "pp_your_token_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `wallet_balance` | Check BTC or USDC balance of your wallet |
| `wallet_send_btc` | Send Bitcoin to an address |
| `wallet_send_usdc` | Send USDC to an EVM address |
| `wallet_receive` | Get an address to receive funds |
| `wallet_tx_status` | Check transaction status |

## Example Usage

Once configured, you can ask Claude things like:

- "What's my Bitcoin balance?"
- "Send 10,000 sats to tb1q... for the API subscription"
- "Send $25 USDC to 0x... for the design work"
- "Generate a receive address for my wallet"
- "Check the status of transaction abc-123"

## Security

- **Human approval**: Configure auto-approve limits in the PayPls dashboard. Transactions above the limit require explicit approval via Telegram.
- **Justifications**: Every send requires a justification that's logged and shown during approval.
- **Bucket isolation**: Use separate buckets to limit agent access to specific funds.
- **Token permissions**: API tokens can be scoped to specific buckets.

## Handling Approval Flows

When a transaction exceeds auto-approve limits, the API returns:

```json
{
  "status": "pending_approval",
  "transaction_id": "...",
  "message": "Awaiting human approval via Telegram",
  "expires_at": "2026-02-04T05:00:00Z"
}
```

Your agent should:
1. Inform the user that approval is needed
2. Optionally poll `wallet_tx_status` to check status
3. NOT retry the same transaction (use idempotency_key instead)

## Development

```bash
# Clone the repository
git clone https://github.com/n8m8/paypls-mcp.git
cd paypls-mcp

# Install dependencies
npm install

# Run in development mode
PAYPLS_TOKEN=pp_your_token npm run dev

# Build
npm run build

# Type check
npm run typecheck
```

## API Endpoints Used

This MCP server communicates with the PayPls Agent API:

| MCP Tool | API Endpoint |
|----------|--------------|
| `wallet_balance` | `GET /agent/balance` |
| `wallet_send_btc` | `POST /agent/send` |
| `wallet_send_usdc` | `POST /agent/send` |
| `wallet_receive` | `POST /agent/receive` |
| `wallet_tx_status` | `GET /agent/tx/:id` |

Full API documentation: [paypls.io/SKILL.md](https://paypls.io/SKILL.md)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAYPLS_TOKEN` | Yes | - | Your PayPls API token (pp_xxx) |
| `PAYPLS_API_URL` | No | `https://api.paypls.io` | API endpoint URL |

## Testnet

Currently running on Bitcoin testnet (`tbtc`) and Ethereum Sepolia (USDC). Perfect for development and testing!

**Testnet API:** `https://paypls-api-dev.nfwalls.workers.dev`
**Testnet Dashboard:** [test.paypls.io](https://test.paypls.io)

## Support

- 📖 [Integration Guide](https://paypls.io/SKILL.md)
- 🐛 [Issues](https://github.com/n8m8/paypls-mcp/issues)

## License

[MIT](LICENSE)

---

<p align="center">
  <sub>Built with ❤️ for the <a href="https://www.moltbook.com/post/23aa9fe6-21d0-48c7-86c7-fe45db58a08e">Circle USDC Hackathon 2026</a></sub>
</p>
