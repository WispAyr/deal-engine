# Deal Engine — Ayrshire Acq.

Real estate deal analysis for Ayrshire — all 12 towns: Ayr, Prestwick, Troon, Girvan, Maybole (South); Kilmarnock, Cumnock (East); Irvine, Kilwinning, Ardrossan, Saltcoats, Largs (North). Combines algorithmic intel, HM Land Registry stats, and live Rightmove listings to surface BTL/BRRR opportunities.

**Marketing** — Landing page at `/` (default). **Dashboard** — Summary stats with an interactive map at `/app`. **Towns** — Per-town market info. **Mobile** — Responsive layout with collapsible sidebar.

## Quick Start

```bash
npm install
npm run start-server   # API on :3000 (frees port first)
npm run dev            # Vite frontend on :5173
```

Full stack: `npm run dev:full` (server + frontend).

## Data Pipeline

1. **Rightmove** — Scrapes all 12 Ayrshire towns → `raw_listings.json`, `raw_rentals.json`
2. **Zoopla** — Puppeteer + stealth headless scraper → merges into same files (optional)
3. **Donald Ross** — Direct fetch from donaldross.co.uk → Ayrshire-wide agent (optional)
4. **HM Land Registry** — Price Paid Data CSV → `market_stats.json` (optional, Admin)
5. **Market Stats** — Derives quartiles from scrapers or LR → `market_stats.json`
6. **Intel** — Algorithmic intel → `marketIntel.json`
7. **Price History** — Appends snapshot each sync → `price_history.json`

Run full sync: `npm run sync` (Rightmove), **Run Zoopla Sync**, **Run Donald Ross Sync**, or **Run Land Registry Sync** in Admin. CRON runs a full sync (Rightmove + Donald Ross + Zoopla) daily at midnight when the server is running.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/intel?town=Ayr` | Market intel (all or by town) |
| `GET /api/stats` | Market stats (from Rightmove data) |
| `GET /api/listings?town=Ayr` | Live sales listings |
| `GET /api/rentals?town=Ayr` | Live rentals |
| `GET /api/price-history` | Price snapshots over time |
| `GET /api/auth/status` | `{ authRequired, userMode }` |
| `POST /api/auth/login` | `{ password }` or `{ email, password }` (user mode) |
| `POST /api/auth/register` | `{ email, password }` (user mode) |
| `POST /api/sync` | Run scraper + stats + intel + price history |
| `GET /api/strategies` | Strategy flows (default + list) |
| `POST /api/strategies` | Save flow (id, name, nodes, edges, setAsDefault) |
| `DELETE /api/strategies/:id` | Delete a flow |
| `POST /mcp` | MCP endpoint (for Cursor, Claude, etc.) |

## MCP (AI Assistants)

Deal Engine exposes an MCP server so Cursor, Claude Desktop and other clients can query listings, intel and stats, and run syncs. See [docs/MCP.md](docs/MCP.md) for setup.

**Quick Cursor setup:** Add `http://127.0.0.1:3000/mcp` as a `streamableHttp` MCP server in Cursor Settings → Tools & MCP. Ensure the server is running first.

## Strategy Builder

Visual flow editor (n8n-style) to configure investment strategies. **Strategies** in the header → create multiple flows, switch via dropdown, add Condition and Strategy nodes. **Default** marks which flow `generateRealIntel` uses. New / Save / Delete / Reset supported.

## Auth (optional)

Set `AUTH_PASSWORD` to protect sync and strategy write endpoints. When set, a login modal appears on 401. Token stored in localStorage, valid 24h.

```bash
AUTH_PASSWORD=your-secret npm run start-server
```

## Environment

- `VITE_API_URL` — API base URL (default: `http://localhost:3000`)
- `PORT` — Server port (default: `3000`)
- `AUTH_PASSWORD` — Optional. When set, sync + strategy POST/DELETE require login
- `STRIPE_SECRET_KEY` — Stripe API key (recurring billing)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `STRIPE_PRICE_ID` — Default price for checkout (optional)

## Scripts

- `npm run dev` — Vite dev server
- `npm run start-server` — Express API (auto frees port)
- `npm run sync` — Scrape Rightmove + generate stats + intel
- `npm run sync:zoopla` — Scrape Zoopla (Puppeteer) + stats + intel
- `npm run sync:donaldross` — Scrape Donald Ross (Alloway, exclusives) + stats + intel
- `npm run sync:landregistry` — Download HM Land Registry CSV, process Ayrshire (KA), derive market_stats
- `npm run dev:full` — Server + frontend
- `npm test` — Vitest
- `npm run build` — Production build
