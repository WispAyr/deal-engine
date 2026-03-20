# API Reference

## Base URL

`http://localhost:3000` (or `VITE_API_URL`)

## Auth

- **Legacy:** When `AUTH_PASSWORD` is set and no users exist, login with `{ password }`
- **User mode:** When users exist, login with `{ email, password }`, register with `{ email, password }`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/auth/status | GET | No | `{ authRequired, userMode }` |
| /api/auth/login | POST | No | `{ password }` or `{ email, password }` |
| /api/auth/register | POST | No | `{ email, password }` (user mode) |
| /api/admin/users | GET | Admin | List users |
| /api/admin/users/:id | PATCH | Admin | Update status, role, onboardingStep |
| /api/admin/data-sources | GET | Admin | List data sources with counts |
| /api/admin/data/:source | GET | Admin | Raw data (listings, rentals, stats, intel, priceHistory, strategies, users) |
| /api/billing/portal | GET | Bearer | Stripe Customer Portal URL |
| /api/billing/checkout | POST | Bearer | Stripe Checkout URL |
| /api/sync* | POST | Bearer | Sync endpoints |
| /api/strategies | POST, DELETE | Bearer | Strategy flows |

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/intel | GET | Market intel (?town=) |
| /api/stats | GET | Market stats |
| /api/listings | GET | Sales (?town=) |
| /api/rentals | GET | Rentals (?town=) |
| /api/price-history | GET | Price snapshots |
| /api/strategies | GET | Strategy flows |
| /api/strategies | POST | Save flow |
| /api/strategies/:id | DELETE | Delete flow |
| /api/sync | POST | Rightmove sync |
| /api/sync/zoopla | POST | Zoopla sync |
| /api/sync/donaldross | POST | Donald Ross sync |
| /api/sync/landregistry | POST | Land Registry sync |
| /api/webhooks/stripe | POST | Stripe webhook (raw body) |

## MCP

`POST /mcp` — Model Context Protocol for AI assistants. See [MCP.md](../MCP.md).
