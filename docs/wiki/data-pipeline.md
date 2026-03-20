# Data Pipeline

## Sources

| Source | Data | File |
|--------|------|------|
| Rightmove | Sales, rentals (12 towns) | raw_listings.json, raw_rentals.json |
| Zoopla | Sales, rentals (Ayr, Kilmarnock, Irvine) | same |
| Donald Ross | Sales, rentals (Ayrshire-wide) | same |
| HM Land Registry | Price Paid Data (KA postcodes) | market_stats.json |

## Processing

1. **Scrapers** — Fetch → merge by source
2. **generateMarketStats** — Quartiles, medians from listings (or LR)
3. **generateRealIntel** — Strategy rules, buy bands, yields
4. **appendPriceHistory** — Time-series snapshots

## Sync Commands

| Command | Description |
|---------|-------------|
| `npm run sync` | Rightmove only |
| `npm run sync:zoopla` | Zoopla |
| `npm run sync:donaldross` | Donald Ross |
| `npm run sync:landregistry` | Land Registry CSV |

## CRON

When server runs: full sync (Rightmove + Donald Ross + Zoopla) daily at midnight.

## Strategy Flows

If `strategy_flows.json` exists, `generateRealIntel` uses the configured flow instead of built-in rules.
