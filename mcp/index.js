/**
 * Deal Engine MCP Server
 * Exposes tools, resources, and prompts for AI assistants (Cursor, Claude, etc.)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'src/data');
const INTEL_DB = path.join(DATA_DIR, 'marketIntel.json');
const STATS_DB = path.join(DATA_DIR, 'market_stats.json');
const LISTINGS_DB = path.join(DATA_DIR, 'raw_listings.json');
const RENTALS_DB = path.join(DATA_DIR, 'raw_rentals.json');
const PRICE_HISTORY_DB = path.join(DATA_DIR, 'price_history.json');

const readDB = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
};

const runScript = (name) =>
  new Promise((resolve, reject) => {
    const proc = spawn('node', [path.join(ROOT, 'scripts', name)], { cwd: ROOT, stdio: 'pipe' });
    let err = '';
    proc.stderr?.on('data', (d) => { err += d.toString(); });
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `Exit ${code}`))));
  });

const TOWNS = ['Ayr', 'Prestwick', 'Troon', 'Girvan', 'Maybole', 'Kilmarnock', 'Cumnock', 'Irvine', 'Kilwinning', 'Ardrossan', 'Saltcoats', 'Largs'];

function createMcpServer() {
  const server = new McpServer(
    { name: 'deal-engine', version: '1.0.0' },
    { capabilities: { logging: {} } }
  );

  // ---- TOOLS ----
  server.registerTool(
    'get_listings',
    {
      title: 'Get Sales Listings',
      description: 'Fetch property sales listings from Rightmove/Zoopla. Optionally filter by town.',
      inputSchema: { town: z.string().optional().describe('Filter by town name (e.g. Ayr, Kilmarnock)') }
    },
    async ({ town }) => {
      const data = readDB(LISTINGS_DB);
      let listings = Array.isArray(data) ? data : [];
      if (town) {
        listings = listings.filter((l) => l.town?.toLowerCase() === town.toLowerCase());
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ count: listings.length, listings: listings.slice(0, 50) }, null, 2) }]
      };
    }
  );

  server.registerTool(
    'get_rentals',
    {
      title: 'Get Rental Listings',
      description: 'Fetch rental listings. Optionally filter by town.',
      inputSchema: { town: z.string().optional().describe('Filter by town name') }
    },
    async ({ town }) => {
      const data = readDB(RENTALS_DB);
      let rentals = Array.isArray(data) ? data : [];
      if (town) {
        rentals = rentals.filter((r) => r.town?.toLowerCase() === town.toLowerCase());
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ count: rentals.length, rentals: rentals.slice(0, 50) }, null, 2) }]
      };
    }
  );

  server.registerTool(
    'get_intel',
    {
      title: 'Get Market Intel',
      description: 'Get algorithmic investment intel (buy bands, rent ranges, yields, strategy) for a town or all towns.',
      inputSchema: { town: z.string().optional().describe('Town name, or omit for all') }
    },
    async ({ town }) => {
      const intel = readDB(INTEL_DB);
      const out = town ? (intel[town] ?? {}) : intel;
      return {
        content: [{ type: 'text', text: JSON.stringify(out, null, 2) }]
      };
    }
  );

  server.registerTool(
    'get_stats',
    {
      title: 'Get Market Stats',
      description: 'Get market statistics (quartiles, averages by postcode/type).',
      inputSchema: {}
    },
    async () => {
      const stats = readDB(STATS_DB);
      return {
        content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }]
      };
    }
  );

  server.registerTool(
    'get_price_history',
    {
      title: 'Get Price History',
      description: 'Get historical price snapshots over time.',
      inputSchema: {}
    },
    async () => {
      const history = readDB(PRICE_HISTORY_DB);
      const arr = Array.isArray(history) ? history : [];
      return {
        content: [{ type: 'text', text: JSON.stringify(arr.slice(-20), null, 2) }]
      };
    }
  );

  server.registerTool(
    'get_towns',
    {
      title: 'List Ayrshire Towns',
      description: 'List all 12 Ayrshire towns covered by Deal Engine.',
      inputSchema: {}
    },
    async () => ({
      content: [{ type: 'text', text: JSON.stringify({ towns: TOWNS }, null, 2) }]
    })
  );

  server.registerTool(
    'run_sync',
    {
      title: 'Run Rightmove Sync',
      description: 'Trigger full data sync (Rightmove scrape + stats + intel). Takes 1-2 minutes.',
      inputSchema: {}
    },
    async () => {
      try {
        await runScript('rightmoveScraper.js');
        await runScript('generateMarketStats.js');
        await runScript('generateRealIntel.js');
        await runScript('appendPriceHistory.js');
        return { content: [{ type: 'text', text: 'Sync complete. Rightmove data, stats, intel and price history updated.' }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Sync failed: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'run_donaldross_sync',
    {
      title: 'Run Donald Ross Sync',
      description: 'Scrape Donald Ross (Ayrshire-wide agent) + stats + intel.',
      inputSchema: {}
    },
    async () => {
      try {
        await runScript('donaldRossScraper.js');
        await runScript('generateMarketStats.js');
        await runScript('generateRealIntel.js');
        await runScript('appendPriceHistory.js');
        return { content: [{ type: 'text', text: 'Donald Ross sync complete.' }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Donald Ross sync failed: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  server.registerTool(
    'run_zoopla_sync',
    {
      title: 'Run Zoopla Sync',
      description: 'Trigger Zoopla scrape (headless browser) + stats + intel. Takes several minutes.',
      inputSchema: {}
    },
    async () => {
      try {
        await runScript('zooplaScraper.js');
        await runScript('generateMarketStats.js');
        await runScript('generateRealIntel.js');
        await runScript('appendPriceHistory.js');
        return { content: [{ type: 'text', text: 'Zoopla sync complete.' }] };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Zoopla sync failed: ${err.message}` }],
          isError: true
        };
      }
    }
  );

  // ---- RESOURCES ----
  server.registerResource(
    'listings',
    'deal-engine://listings',
    { title: 'Sales Listings', mimeType: 'application/json' },
    async () => {
      const data = readDB(LISTINGS_DB);
      const listings = Array.isArray(data) ? data : [];
      return {
        contents: [{ uri: 'deal-engine://listings', mimeType: 'application/json', text: JSON.stringify(listings.slice(0, 100), null, 2) }]
      };
    }
  );

  server.registerResource(
    'rentals',
    'deal-engine://rentals',
    { title: 'Rental Listings', mimeType: 'application/json' },
    async () => {
      const data = readDB(RENTALS_DB);
      const rentals = Array.isArray(data) ? data : [];
      return {
        contents: [{ uri: 'deal-engine://rentals', mimeType: 'application/json', text: JSON.stringify(rentals.slice(0, 100), null, 2) }]
      };
    }
  );

  server.registerResource(
    'stats',
    'deal-engine://stats',
    { title: 'Market Stats', mimeType: 'application/json' },
    async () => {
      const stats = readDB(STATS_DB);
      return {
        contents: [{ uri: 'deal-engine://stats', mimeType: 'application/json', text: JSON.stringify(stats, null, 2) }]
      };
    }
  );

  // ---- PROMPTS ----
  server.registerPrompt(
    'analyze-town',
    {
      title: 'Analyze Town Investment',
      description: 'Get a prompt to analyze investment opportunities in an Ayrshire town.',
      argsSchema: { town: z.string().describe('Town to analyze (e.g. Ayr, Kilmarnock, Irvine)') }
    },
    async ({ town }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I'm using Deal Engine for Ayrshire property investment. Please analyze ${town} as an investment market. Use the get_intel and get_listings tools to fetch current data, then summarize: (1) best property types for BTL/BRRR, (2) buy price bands, (3) rental expectations, (4) yield ranges, (5) key risks. Be specific and data-driven.`
          }
        }
      ]
    })
  );

  server.registerPrompt(
    'market-summary',
    {
      title: 'Ayrshire Market Summary',
      description: 'Get a prompt to produce a market overview across all Ayrshire towns.',
      argsSchema: {}
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I'm using Deal Engine. Please produce a concise Ayrshire property investment market summary. Use get_intel, get_stats, get_listings and get_rentals to gather data. Summarize: (1) total listings/rentals, (2) top 3 towns for yield, (3) best buy bands by property type, (4) any notable gaps or opportunities.`
          }
        }
      ]
    })
  );

  return server;
}

/**
 * Create MCP HTTP handler for Express.
 * Mount at POST /mcp
 */
export async function handleMcpRequest(req, res) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  res.on('close', () => {
    transport.close();
    server.close();
  });
  await transport.handleRequest(req, res, req.body);
}

export { createMcpServer };
