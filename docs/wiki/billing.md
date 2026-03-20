# Billing & Subscriptions

Deal Engine uses **Stripe** for recurring billing.

## Setup

1. Create a [Stripe account](https://stripe.com)
2. Add products/prices in Stripe Dashboard (e.g. Monthly, Annual)
3. Set env:
   - `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API keys
   - `STRIPE_WEBHOOK_SECRET` — from Stripe Dashboard → Webhooks → Add endpoint
   - `STRIPE_PRICE_ID` — (optional) default price for checkout
4. Configure webhook in Stripe: `POST https://your-domain/api/webhooks/stripe`
5. Subscribe to events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## Plans

| Plan | Description |
|------|-------------|
| Free | Limited listings, basic intel |
| Pro | Full access, Strategy Builder, exports |
| Team | Multi-user, API access |

(Plans configured in Stripe Dashboard.)

## Flow

1. **Sign up** → Stripe Customer created automatically (stored in `stripeCustomerId`)
2. **Subscribe** → `POST /api/billing/checkout` returns checkout URL (requires `STRIPE_PRICE_ID`)
3. **Manage** → `GET /api/billing/portal` returns Customer Portal URL
4. **Webhook** → Updates `subscriptionStatus` on user from subscription events
5. **Access** — App can check `subscriptionStatus` (e.g. `active`, `canceled`) before gating features

## API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/billing/portal` | GET | Bearer | Returns Stripe Customer Portal URL |
| `/api/billing/checkout` | POST | Bearer | Returns Stripe Checkout URL for new subscription |
| `/api/webhooks/stripe` | POST | Stripe-Signature | Webhook handler (raw body) |
