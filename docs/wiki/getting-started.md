# Getting Started

## Requirements

- Node.js 18+
- npm

## Installation

```bash
git clone <repo>
cd deal-engine
npm install
```

## First Run

1. **Start the server**
   ```bash
   npm run start-server
   ```
   API runs on `http://localhost:3000`.

2. **Start the frontend**
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:5173`.

   Or use both: `npm run dev:full`

3. **Load data** — On first run, data may be empty. Go to **Admin** → run **Force Sync** (Rightmove) to scrape listings.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | API server port |
| `VITE_API_URL` | http://localhost:3000 | API base URL (frontend) |
| `AUTH_PASSWORD` | — | Optional. Protects sync/admin when set |
| `STRIPE_SECRET_KEY` | — | Required for billing |
| `STRIPE_WEBHOOK_SECRET` | — | Required for Stripe webhooks |

## Next Steps

- [User Guide](../USER_GUIDE.md) — Step-by-step walkthrough
- [Dashboard & Navigation](dashboard-navigation.md) — UI overview
