#!/usr/bin/env node
/**
 * PayPls MCP Server
 * 
 * Model Context Protocol server for AI agent wallet integration.
 * Enables AI agents to manage Bitcoin (BTC) and USDC payments via PayPls API.
 * 
 * @see https://github.com/n8m8/paypls-mcp
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
  console.error('Get your token at https://paypls.io or https://test.paypls.io');
  process.exit(1);
}

// Tool input schemas
const WalletBalanceSchema = z.object({
  bucket_id: z.string().optional(),
  token: z.enum(['BTC', 'USDC', 'EURC']).optional(),
});

const WalletSendBtcSchema = z.object({
  bucket_id: z.string().optional(),
  address: z.string().min(26).max(62),
  amount_sats: z.number().int().positive(),
  justification: z.string().min(1).max(500),
  idempotency_key: z.string().optional(),
});

const WalletSendUsdcSchema = z.object({
  bucket_id: z.string().optional(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount_usdc: z.number().positive(),
  justification: z.string().min(1).max(500),
  idempotency_key: z.string().optional(),
});

const WalletReceiveSchema = z.object({
  bucket_id: z.string().optional(),
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
      'User-Agent': 'paypls-mcp/0.2.0',
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
  bucket_name: string;
  bucket_id: string;
  token: string;
  currency: string;
  chain: string;
  balance: string;
  balance_smallest_unit: string;
  balance_formatted: string;
  balance_sats?: number;
  balance_btc?: string;
  balance_micro?: number;
  balance_usd?: string;
  pending_sats?: number;
}

interface SendResponse {
  transaction_id: string;
  status: 'pending_approval' | 'completed' | 'denied';
  message?: string;
  expires_at?: string;
  idempotent?: boolean;
}

interface ReceiveAddressResponse {
  bucket_id: string;
  bucket_name: string;
  currency: string;
  chain: string;
  address: string;
  note?: string;
}

interface TxStatusResponse {
  id: string;
  status: 'pending_approval' | 'completed' | 'denied' | 'failed' | 'expired';
  type: string;
  amount_sats?: number;
  amount_decimal?: string;
  currency?: string;
  address: string;
  justification?: string;
  approval_method?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Create and configure the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: 'paypls',
      version: '0.2.0',
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
        description: 'Get the balance of your wallet. Returns balance in the native unit (sats for BTC, micro-units for USDC/EURC) plus formatted display values.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket ID to check. Defaults to primary bucket if not specified.',
            },
            token: {
              type: 'string',
              enum: ['BTC', 'USDC', 'EURC'],
              description: 'Which token balance to check. If not specified, uses the primary bucket.',
            },
          },
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
            idempotency_key: {
              type: 'string',
              description: 'Optional unique key to prevent duplicate transactions. If provided and a transaction with this key exists (within 24h), returns the existing transaction.',
            },
          },
          required: ['address', 'amount_sats', 'justification'],
        },
      },
      {
        name: 'wallet_send_usdc',
        description: 'Send USDC (stablecoin) to an EVM address. May require human approval depending on amount. USDC is ideal for stable-value payments.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket to send from. Defaults to primary bucket if not specified.',
            },
            address: {
              type: 'string',
              description: 'The EVM wallet address to send to (0x... format).',
            },
            amount_usdc: {
              type: 'number',
              description: 'Amount to send in micro-USDC (1 USDC = 1,000,000 micro-USDC). For example: 5000000 = $5.00 USDC.',
            },
            justification: {
              type: 'string',
              description: 'Clear explanation of why this payment is needed. This is shown to the human for approval.',
            },
            idempotency_key: {
              type: 'string',
              description: 'Optional unique key to prevent duplicate transactions.',
            },
          },
          required: ['address', 'amount_usdc', 'justification'],
        },
      },
      {
        name: 'wallet_receive',
        description: 'Get an address to receive funds into your wallet. Returns a deposit address for the specified bucket.',
        inputSchema: {
          type: 'object',
          properties: {
            bucket_id: {
              type: 'string',
              description: 'The bucket to receive into. Defaults to primary bucket if not specified.',
            },
          },
        },
      },
      {
        name: 'wallet_tx_status',
        description: 'Check the status of a transaction by its ID. Use this to poll for approval status after a send that requires human approval.',
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
          // Build query string for optional params
          const params = new URLSearchParams();
          if (input.bucket_id) params.set('bucket_id', input.bucket_id);
          if (input.token) params.set('token', input.token);
          const queryString = params.toString();
          const endpoint = `/agent/balance${queryString ? `?${queryString}` : ''}`;
          
          const result = await apiRequest<BalanceResponse>(endpoint);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  hint: result.token === 'USDC' || result.token === 'EURC'
                    ? `${result.token} is a stablecoin - 1 ${result.token} ≈ $1 USD`
                    : 'BTC price varies - check current rate for accurate USD value',
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_send_btc': {
          const input = WalletSendBtcSchema.parse(args);
          const result = await apiRequest<SendResponse>('/agent/send', 'POST', {
            bucket_id: input.bucket_id,
            address: input.address,
            amount_sats: input.amount_sats,
            justification: input.justification,
            idempotency_key: input.idempotency_key,
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
                  next_steps: result.status === 'pending_approval' 
                    ? 'Transaction requires human approval. Poll wallet_tx_status to check status, or wait for approval notification.'
                    : undefined,
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_send_usdc': {
          const input = WalletSendUsdcSchema.parse(args);
          const result = await apiRequest<SendResponse>('/agent/send', 'POST', {
            bucket_id: input.bucket_id,
            address: input.address,
            amount_usdc: input.amount_usdc,
            justification: input.justification,
            idempotency_key: input.idempotency_key,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  token: 'USDC',
                  amount_micro: input.amount_usdc,
                  amount_usd: `$${(input.amount_usdc / 1_000_000).toFixed(2)}`,
                  next_steps: result.status === 'pending_approval'
                    ? 'Transaction requires human approval. Poll wallet_tx_status to check status.'
                    : undefined,
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_receive': {
          const input = WalletReceiveSchema.parse(args);
          const result = await apiRequest<ReceiveAddressResponse>(
            '/agent/receive',
            'POST',
            input.bucket_id ? { bucket_id: input.bucket_id } : {}
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  instructions: result.currency === 'BTC'
                    ? 'Send Bitcoin to this address. Requires confirmations before available.'
                    : `Send ${result.currency} on ${result.chain} to this address. Network fees apply.`,
                }, null, 2),
              },
            ],
          };
        }

        case 'wallet_tx_status': {
          const input = WalletTxStatusSchema.parse(args);
          const result = await apiRequest<TxStatusResponse>(
            `/agent/tx/${input.transaction_id}`
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
