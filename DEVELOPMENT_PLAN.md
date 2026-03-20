# Deal Engine — Development Plan

## MVP Status ✅

- [x] IntelPane fix (description/notes, why_this_works)
- [x] Town change refetches listings/rentals
- [x] Env-based API URL
- [x] Error handling when backend offline
- [x] Port freeing before server start
- [x] Vitest + core component tests
- [x] README + docs

## Post-MVP

### Data
- [x] HM Land Registry CSV pipeline → `market_stats.json` (Admin: Run Land Registry Sync)
- [x] Wire cron jobs to scraper scripts (Rightmove + Donald Ross + Zoopla, daily midnight)
- [x] Zoopla scraper (optional)
- [x] Donald Ross scraper (Ayrshire-wide, sales + rentals, paginated)

### UX
- [x] Property card expand/collapse
- [x] "Force Sync DB" → run scraper via API (Admin: Zoopla + Donald Ross buttons)
- [x] Search/filter in Header

### Strategy Builder ✅
- [x] n8n-style flow canvas (React Flow)
- [x] Condition + Strategy nodes, create/delete/configure
- [x] API persist + generateRealIntel integration

### Features (deferred)
- [x] BTR / BTF / BRRR / HMO / SA strategy tabs (PropertyCard)
- [x] Comps pane strategy filter (maps listings → intel segment)
- [x] Shortlist, Auctions, Bridge nav (Sidebar Shortlist wired, beds 4+ filter fixed)
- [x] Auth (optional: AUTH_PASSWORD env, HMAC token, login modal on 401)

### MCP ✅
- [x] Full MCP server (tools, resources, prompts)
- [x] Mounted at POST /mcp on Express
- [x] Cursor / Claude Desktop integration (see docs/MCP.md)

## Future
- Multi-user (per-user shortlists, saved views)
- Alert triggers (yield up, price drop)
