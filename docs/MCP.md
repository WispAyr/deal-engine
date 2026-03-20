# Deal Engine MCP Server

The Model Context Protocol (MCP) server exposes Deal Engine data and actions to AI assistants (Cursor, Claude Desktop, etc.).

## Prerequisites

1. **Start the Deal Engine server** — MCP is served from the same process:
   ```bash
   npm run start-server
   ```
   Or use `npm run dev:full` for server + frontend.

2. **Confirm MCP endpoint** — `POST http://localhost:3000/mcp`

## Cursor Setup

1. Open **Cursor Settings** → **Tools & MCP** (or **Features** → **MCP**)
2. Add a new MCP server:
   - **Name:** `deal-engine`
   - **Type:** `streamableHttp` (or URL-based)
   - **URL:** `http://127.0.0.1:3000/mcp`

Or add to `.cursor/mcp.json` in your project/user config:

```json
{
  "mcpServers": {
    "deal-engine": {
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

3. **Restart Cursor** after adding the server.

## Tools

| Tool | Description |
|------|-------------|
| `get_listings` | Fetch sales listings (optional `town` filter) |
| `get_rentals` | Fetch rental listings (optional `town` filter) |
| `get_intel` | Market intel: buy bands, yields, strategy (optional `town`) |
| `get_stats` | Market statistics by postcode/type |
| `get_price_history` | Historical price snapshots |
| `get_towns` | List all 12 Ayrshire towns |
| `run_sync` | Trigger Rightmove sync (1–2 min) |
| `run_donaldross_sync` | Trigger Donald Ross sync |
| `run_zoopla_sync` | Trigger Zoopla sync (several min) |

*Note: Sync tools may require auth if AUTH_PASSWORD is set.*

## Resources

| URI | Description |
|-----|-------------|
| `deal-engine://listings` | Sales listings (first 100) |
| `deal-engine://rentals` | Rental listings (first 100) |
| `deal-engine://stats` | Market stats |

## Prompts

| Prompt | Description |
|--------|-------------|
| `analyze-town` | Analyze investment opportunities in a town (pick from 12) |
| `market-summary` | Produce an Ayrshire-wide market overview |

## Capabilities

- **Listings** — Rightmove, Zoopla, Donald Ross (12 Ayrshire towns)
- **Intel** — Algorithmic buy bands, yields, strategies (BTL, BRRR, Flip, HMO, SA)
- **Strategy Builder** — Flow-based config (not exposed to MCP; use API)
- **Sync** — Rightmove, Zoopla, Donald Ross (Land Registry via npm script)

## Example usage in Cursor

- *"Use the deal-engine MCP to find BTL opportunities in Kilmarnock"*
- *"Get market intel for Ayr and summarize the best buy bands"*
- *"Run a Donald Ross sync and then show me the latest listings"*
