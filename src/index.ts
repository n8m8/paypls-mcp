#!/usr/bin/env node
/**
 * PayPls MCP Server
 * 
 * Model Context Protocol server for AI agent wallet integration.
 * Enables AI agents to manage Bitcoin (BTC) and USDC payments via PayPls API.
 * 
 * @see https://github.com/paypls/mcp-server
 * @license MIT
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Configuration from environment
const API_URL = process.env.PAYPLS_API_URL || 'https://api.paypls.io';
const API_TOKEN = process.env.PAYPLS_TOKEN;

if (!API_TOKEN) {
  console.error('Error: PAYPLS_TOKEN environment variable is required');
  console.error('Get your token at https://paypls.io/settings/api');
  process.exit(1);
}

// Supported tokens
type Token = 'BTC' | 'USDC';

// Tool input schemas
const WalletBalanceSchema = z.object({
  bucket_id: z.string().optional(),
  token: z.enum(['BTC', 'USDC']).optional().default('BTC'),
});

const WalletListBucketsSchema = z.object({});

const WalletSendBtcSchema = z.object({
  bucket_id: z.string().optional(),
  address: z.string().min(26).max(62),
  amount_sats: z.number().int().positive(),
  justification: z.string().min(1).max(500),
});

const WalletSendUsdcSchema = z.object({
  bucket_id: z.string().optional(),
  address: z.string().min(26).max(62),
  amount_usdc: z.number().positive(),
  justification: z.string().min(1).max(500),
});

const WalletReceiveSchema = z.object({
  bucket_id: z.string().optional(),
  token: z.enum(['BTC', 'USDC']).optional().default('BTC'),
});

const WalletTxStatusSchema = z.object({
  transaction_id: z.string().uuid(),
});

/**
 * Make an authenticated API request to PayPls
 */
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'paypls-mcp/0.1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

// API response types
interface BalanceResponse {
  balance: number;
  balance_usd?: number;
  pending?: number;
}

interface BucketsResponse {
  buckets: Array<{
    id: string;
    name: string;
    btc_balance_sats: number;
    usdc_balance: number;
    auto_approve_limit_sats?: number;
    auto_approve_limit_usdc?: number;
  }>;
}

interface SendResponse {
  transaction_id: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  requires_approval: boolean;
  message?: string;
}

interface ReceiveAddressResponse {
  address: string;
  expires_at?: string;
}

interface TxStatusResponse {
  transaction_id: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'failed';
  tx_hash?: string;
  confirmations?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: 'paypls',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'wallet_balance',
        description: 'Get the balance of a wallet bucket. Returns balance in the native unit (sats for BTC, dollars for USDC) plus approximate USD value.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket ID to check. Defaults to primary bucket if not specified.',
            },
            token: {
              type: 'string',
              enum: ['BTC', 'USDC'],
              description: 'Which token balance to check. Defaults to BTC.',
            },
          },
        },
      },
      {
        name: 'wallet_list_buckets',
        description: 'List all wallet buckets you have access to, with their balances and auto-approve limits for both BTC and USDC.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'wallet_send_btc',
        description: 'Send Bitcoin to an address. May require human approval depending on amount and bucket settings. Always provide a clear justification.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket to send from. Defaults to primary bucket if not specified.',
            },
            address: {
              type: 'string',
              description: 'The Bitcoin address to send to (bc1... for mainnet, tb1... for testnet).',
            },
            amount_sats: {
              type: 'integer',
              description: 'Amount to send in satoshis (1 BTC = 100,000,000 sats). For example: 10000 sats ≈ $10 at $100k BTC.',
            },
            justification: {
              type: 'string',
              description: 'Clear explanation of why this payment is needed. This is shown to the human for approval.',
            },
          },
          required: ['address', 'amount_sats', 'justification'],
        },
      },
      {
        name: 'wallet_send_usdc',
        description: 'Send USDC (stablecoin) to an address. May require human approval depending on amount. USDC is ideal for stable-value payments.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket to send from. Defaults to primary bucket if not specified.',
            },
            address: {
              type: 'string',
              description: 'The wallet address to send to (Ethereum, Polygon, or Solana address depending on network).',
            },
            amount_usdc: {
              type: 'number',
              description: 'Amount to send in USDC (e.g., 25.00 for $25). USDC is a stablecoin pegged to USD.',
            },
            justification: {
              type: 'string',
              description: 'Clear explanation of why this payment is needed. This is shown to the human for approval.',
            },
          },
          required: ['address', 'amount_usdc', 'justification'],
        },
      },
      {
        name: 'wallet_receive',
        description: 'Get an address to receive funds into a bucket. Specify token type to get the appropriate address format.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket to receive into. Defaults to primary bucket if not specified.',
            },
            token: {
              type: 'string',
              enum: ['BTC', 'USDC'],
              description: 'Which token to receive. Defaults to BTC. Use USDC for stablecoin payments.',
            },
          },
        },
      },
      {
        name: 'wallet_tx_status',
        description: 'Check the status of a transaction by its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            transaction_id: {
              type: 'string',
              description: 'The transaction ID returned from wallet_send_btc or wallet_send_usdc.',
            },
          },
          required: ['transaction_id'],
        },
      },
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'wallet_balance': {
          const input = WalletBalanceSchema.parse(args);
          const bucketId = input.bucket_id || 'primary';
          const result = await apiRequest<BalanceResponse>(
            `/v1/buckets/${bucketId}/balance?token=${input.token}`
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  token: input.token,
                  hint: input.token === 'USDC'
                    ? 'USDC is a stablecoin - 1 USDC ≈ $1 USD'
                    : 'BTC price varies - check current rate for accurate USD value',
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_list_buckets': {
          WalletListBucketsSchema.parse(args);
          const result = await apiRequest<BucketsResponse>('/v1/buckets');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  supported_tokens: ['BTC', 'USDC'],
                  note: 'Each bucket can hold both BTC and USDC',
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_send_btc': {
          const input = WalletSendBtcSchema.parse(args);
          const result = await apiRequest<SendResponse>('/v1/transactions/send', 'POST', {
            bucket_id: input.bucket_id || 'primary',
            address: input.address,
            amount_sats: input.amount_sats,
            justification: input.justification,
            token: 'BTC',
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  token: 'BTC',
                  amount_sats: input.amount_sats,
                  amount_btc: (input.amount_sats / 100_000_000).toFixed(8),
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_send_usdc': {
          const input = WalletSendUsdcSchema.parse(args);
          const result = await apiRequest<SendResponse>('/v1/transactions/send', 'POST', {
            bucket_id: input.bucket_id || 'primary',
            address: input.address,
            amount_usdc: input.amount_usdc,
            justification: input.justification,
            token: 'USDC',
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  token: 'USDC',
                  amount_usdc: input.amount_usdc,
                  amount_usd: `$${input.amount_usdc.toFixed(2)}`,
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_receive': {
          const input = WalletReceiveSchema.parse(args);
          const bucketId = input.bucket_id || 'primary';
          const result = await apiRequest<ReceiveAddressResponse>(
            `/v1/buckets/${bucketId}/address?token=${input.token}`
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  token: input.token,
                  note: input.token === 'USDC'
                    ? 'Send USDC to this address. Network fees apply.'
                    : 'Send Bitcoin to this address. Requires 1 confirmation.',
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_tx_status': {
          const input = WalletTxStatusSchema.parse(args);
          const result = await apiRequest<TxStatusResponse>(
            `/v1/transactions/${input.transaction_id}`
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Main entry point
 */
async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error('PayPls MCP server running (BTC + USDC supported)');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
