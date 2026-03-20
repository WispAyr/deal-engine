# Admin Dashboard

## Data Pipelines

| Pipeline | Description | Action |
|----------|-------------|--------|
| HM Land Registry | Price Paid Data CSV | Run Land Registry Sync |
| Rightmove | Sales & rentals | Force Sync |
| Zoopla | Puppeteer scrape | Run Zoopla Sync |
| Donald Ross | Ayrshire agent | Run Donald Ross Sync |

## User Management

- **Registrations** — Pending sign-ups; approve or reject
- **Onboarding** — Track user progress (steps completed)
- **Clients** — List users, roles, status, last active

## Database Browser

View and export all data sources:

| Source | Description |
|--------|-------------|
| Sales Listings | raw_listings.json |
| Rentals | raw_rentals.json |
| Market Stats | market_stats.json (by postcode/type) |
| Market Intel | marketIntel.json (AI buy bands, yields) |
| Price History | price_history.json (snapshots over time) |
| Strategy Flows | strategy_flows.json |
| Users | users.json (no password hashes) |

- **Table view** — Browse array data (listings, rentals, price history, users)
- **JSON view** — Raw structure for any source
- **Export JSON** — Download full dataset
- **Export CSV** — For array sources (listings, rentals, etc.)

## Requirements

- Admin role required
- Set `AUTH_PASSWORD` or use user auth to protect endpoints
