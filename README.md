# PayPls MCP Server

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/@paypls/mcp-server.svg)](https://www.npmjs.com/package/@paypls/mcp-server)

MCP (Model Context Protocol) server that enables AI agents to manage Bitcoin and USDC payments through [PayPls](https://paypls.io).

## What is this?

> ⚠️ **Important:** This MCP server does NOT enforce spending limits or approval requirements. 
> All limits are configured and enforced by the PayPls backend. Configure your limits in the 
> [PayPls Dashboard](https://paypls.io) before giving agents access to real funds.

This server allows AI assistants like Claude to:

- 💰 Check wallet balances (BTC and USDC)
- 📤 Send payments with human approval
- 📥 Generate receive addresses
- 📋 List wallet buckets
- 🔍 Track transaction status

All transactions can be configured to require human approval above certain thresholds, giving you control while enabling AI autonomy for small payments.

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

Sign up at [paypls.io](https://paypls.io) and generate an API token in Settings → API Keys.

### 2. Set environment variables

Create a `.env` file or set these environment variables:

```bash
# Required: Your PayPls API token
PAYPLS_TOKEN=your_token_here

# Optional: API URL (defaults to https://api.paypls.io)
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
        "PAYPLS_TOKEN": "your_token_here"
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
        "PAYPLS_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `wallet_balance` | Check BTC or USDC balance of a bucket |
| `wallet_list_buckets` | List all wallet buckets with balances |
| `wallet_send_btc` | Send Bitcoin to an address |
| `wallet_send_usdc` | Send USDC to an address |
| `wallet_receive` | Get an address to receive funds |
| `wallet_tx_status` | Check transaction status |

## Example Usage

Once configured, you can ask Claude things like:

- "What's my Bitcoin balance?"
- "Send 10,000 sats to bc1q... for the API subscription"
- "Send $25 USDC to 0x... for the design work"
- "Generate a receive address for Bitcoin"
- "Check the status of transaction abc-123"

## Security

- **Human approval**: Configure auto-approve limits in the PayPls dashboard. Transactions above the limit require explicit approval.
- **Justifications**: Every send requires a justification that's logged and shown during approval.
- **Bucket isolation**: Use separate buckets to limit agent access to specific funds.
- **Token permissions**: API tokens can be scoped to specific actions and buckets.

## Handling Approval Flows

When a transaction exceeds auto-approve limits, the API returns:

```json
{
  "status": "pending_approval",
  "transaction_id": "...",
  "message": "Awaiting human approval"
}
```

Your agent should:
1. Inform the user that approval is needed
2. Optionally poll `/agent/tx/:id` to check status
3. NOT retry the same transaction (use idempotency keys)

## Development

```bash
# Clone the repository
git clone https://github.com/paypls/mcp-server.git
cd mcp-server

# Install dependencies
npm install

# Run in development mode
PAYPLS_TOKEN=your_token npm run dev

# Build
npm run build

# Type check
npm run typecheck
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAYPLS_TOKEN` | Yes | - | Your PayPls API token |
| `PAYPLS_API_URL` | No | `https://api.paypls.io` | API endpoint URL |

## Support

- 📖 [Documentation](https://docs.paypls.io)
- 💬 [Discord](https://discord.gg/paypls)
- 🐛 [Issues](https://github.com/paypls/mcp-server/issues)

## License

[MIT](LICENSE)
