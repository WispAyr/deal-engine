# Deal Engine — User Guide

Step-by-step guide for using the Ayrshire Deal Engine.

---

## 1. Getting Started

1. Open the app (e.g. `http://localhost:5173`) — you’ll see the **marketing page** first
2. Click **Open Deal Engine** or **Dashboard** to enter the app
3. If data is empty, go to **Admin** → **Force Sync** to load listings
4. Select a **Target Town** in the sidebar (e.g. Ayr)

*On mobile, the sidebar collapses to a top bar; towns appear as a horizontal scroll.*

---

## 2. Finding Deals (Prompts)

1. Click **Prompts** in the header
2. Browse deal cards (town × property type)
3. Use **Strategy** filter: BTL, BRRR, Flip, HMO, SA
4. Use **Type** filter: Flat, House
5. Use **#** filter: 1, 2, 3, 4+ beds
6. Click a card to expand
7. Read **Intel** tab: buy band, rent, yield, deal rule
8. Check **Mkt** tab: live listings, rentals
9. Click **★** to add to shortlist

---

## 3. Using the Strategy Builder

1. Click **Strategies** in the header
2. Select a flow from the dropdown (or **New**)
3. Add **Condition** nodes: e.g. `yieldMax > 12`
4. Add **Strategy** nodes: BRRR, Flip, BTL, etc.
5. Connect: Input → Condition (true→BRRR, false→next) → …
6. **Save** — persist the flow
7. **Default** — use this flow for intel generation
8. Run a sync to apply changes

---

## 4. Viewing Listings (Comps)

1. Click **Comps** in the header
2. Toggle **Sales** / **Rentals**
3. Use search and filters
4. Click address to open Rightmove
5. Click **★** to add to shortlist

---

## 5. Shortlist

1. Click **Shortlist** in the sidebar or header
2. View saved deals
3. Click **×** to remove

---

## 6. Auctions & Bridge

- **Auctions** — Listings with "auction" in description
- **Bridge** — Development, refurbishment, land, investment potential

---

## 7. Admin

- **Force Sync** — Run Rightmove scrape
- **Run Zoopla Sync** — Run Zoopla scrape
- **Run Donald Ross Sync** — Run Donald Ross scrape
- **Run Land Registry Sync** — Process HM Land Registry CSV
- **User Management** — (Admin only) Registrations, onboarding, clients

---

## 8. Billing

- **Free** — Basic access
- **Pro / Team** — Upgrade via **Billing** or Stripe Customer Portal
- Manage subscription, update card, view invoices

---

## Quick Reference

| Action | Location |
|--------|----------|
| Find BTL deals | Prompts → Strategy: BTL |
| Compare listings | Comps |
| Save a deal | ★ on card or Comps row |
| Configure strategies | Strategies |
| Load fresh data | Admin → Force Sync |
