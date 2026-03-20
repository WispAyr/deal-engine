# Troubleshooting

## Backend offline

**Symptom:** "Backend unavailable" in UI

**Fix:** Start server: `npm run start-server`

## Port in use

**Symptom:** `EADDRINUSE` when starting server

**Fix:** Server auto-frees port. If not, kill manually: `npx kill-port 3000`

## No listings

**Symptom:** Empty Dashboard, 0 listings

**Fix:** Run sync. Admin → Force Sync, or `npm run sync`

## 401 on sync

**Symptom:** Sync fails with "Authentication required"

**Fix:** Set `AUTH_PASSWORD` and log in via the modal when prompted

## Strategy Builder not saving

**Symptom:** Save succeeds but flow not used

**Fix:** Click **Default** to set the flow as active for intel generation

## Zoopla/Puppeteer errors

**Symptom:** Zoopla sync fails

**Fix:** Ensure Chrome/Chromium available. Puppeteer downloads it on first run.
