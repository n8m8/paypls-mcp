# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-02-05

### Changed
- **BREAKING:** Fixed all API endpoints to match actual PayPls API
  - `wallet_balance` now uses `GET /agent/balance` (was `/v1/buckets/{id}/balance`)
  - `wallet_send_*` now uses `POST /agent/send` (was `/v1/transactions/send`)
  - `wallet_receive` now uses `POST /agent/receive` (was `/v1/buckets/{id}/address`)
  - `wallet_tx_status` now uses `GET /agent/tx/:id` (was `/v1/transactions/:id`)
- Removed `wallet_list_buckets` tool (not available in agent API)
- Updated balance response format to match API
- Added EURC support in balance queries

### Added
- Added `idempotency_key` parameter to send operations
- Added `next_steps` hints in send responses for pending approvals
- Added proper USDC micro-unit handling (1 USDC = 1,000,000 micro-USDC)

### Fixed
- Fixed README links - now points to correct GitHub repo (n8m8/paypls-mcp)
- Removed non-existent docs.paypls.io and discord links
- Fixed package.json repository URL

### Links
- 🏆 [Hackathon Submission](https://www.moltbook.com/post/23aa9fe6-21d0-48c7-86c7-fe45db58a08e)
- 🌐 [PayPls Landing](https://paypls.io)
- 🧪 [Testnet Dashboard](https://test.paypls.io)
- 📖 [Integration Guide](https://paypls.io/SKILL.md)

## [0.1.0] - 2026-02-05

### Added
- Initial public release for Circle USDC Hackathon 2026
- MCP server implementation for AI agent wallet integration
- Support for BTC and USDC payments
- Tools: `wallet_balance`, `wallet_list_buckets`, `wallet_send_btc`, `wallet_send_usdc`, `wallet_receive`, `wallet_tx_status`
- Human approval flow support for transactions above configured limits
- Bucket-based wallet isolation
- Comprehensive documentation and Claude Desktop configuration examples

### Links
- 🏆 [Hackathon Submission](https://www.moltbook.com/post/23aa9fe6-21d0-48c7-86c7-fe45db58a08e)
- 🌐 [PayPls Landing](https://paypls.io)
- 🧪 [Testnet Dashboard](https://test.paypls.io)
- 📡 [API](https://api.paypls.io)
