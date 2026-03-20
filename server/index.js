import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import kill from 'kill-port';
import cron from 'node-cron';
import { authRequired, verifyPassword, createToken, createUserToken, authMiddleware, requireAuthMiddleware, adminMiddleware, loginUser } from './auth.js';
import { createUser, listUsers, updateUser, findById } from './users.js';
import { createStripeCustomer, createPortalSession, createCheckoutSession, handleWebhook, stripeEnabled } from './stripe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const PORT = process.env.PORT || 3000;

const runScript = (name) =>
  new Promise((resolve, reject) => {
    const proc = spawn('node', [path.join(ROOT, 'scripts', name)], { cwd: ROOT, stdio: 'pipe' });
    let err = '';
    proc.stderr?.on('data', (d) => { err += d.toString(); });
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `Exit ${code}`))));
  });

const startServer = async () => {
  await kill(PORT).catch(() => {});

const app = express();

// Middleware
app.use(cors());
// Stripe webhook needs raw body – must be before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] || '';
  const result = await handleWebhook(req.body, sig);
  res.status(result.status).send(result.body);
});
app.use(express.json());

// Database paths (Currently using our local JSON 'moat', easy to swap for MongoDB URI later)
const DATA_DIR = path.join(__dirname, '../src/data');
const INTEL_DB = path.join(DATA_DIR, 'marketIntel.json');
const STATS_DB = path.join(DATA_DIR, 'market_stats.json');
const LISTINGS_DB = path.join(DATA_DIR, 'raw_listings.json');
const RENTALS_DB = path.join(DATA_DIR, 'raw_rentals.json');
const PRICE_HISTORY_DB = path.join(DATA_DIR, 'price_history.json');
const STRATEGY_FLOWS_DB = path.join(DATA_DIR, 'strategy_flows.json');

// Helper to Safely Read DB
const readDB = (filePath) => {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get ALL AI Intel (or filter by Town)
app.get('/api/intel', (req, res) => {
    const intelData = readDB(INTEL_DB);
    const { town } = req.query;

    if (town && intelData[town]) {
        return res.json(intelData[town]);
    }
    
    res.json(intelData);
});

// 2. Get AI Intel for a specific Deal Match (Town + Type)
app.get('/api/intel/:town/:type', (req, res) => {
    const intelData = readDB(INTEL_DB);
    const { town, type } = req.params;

    if (intelData[town] && intelData[town][type]) {
        return res.json(intelData[town][type]);
    }
    
    res.status(404).json({ error: "Intel not found for specific market" });
});

// 3. Get ALL Ground Truth Market Stats
app.get('/api/stats', (req, res) => {
    const statsData = readDB(STATS_DB);
    res.json(statsData);
});

// 4. Get specific Postcode/Type Stats (e.g. KA8_Flat)
app.get('/api/stats/:segment', (req, res) => {
    const statsData = readDB(STATS_DB);
    const { segment } = req.params;

    if (statsData[segment]) {
        return res.json(statsData[segment]);
    }

    res.status(404).json({ error: "Segment stats not found" });
});

// 5. Get Live Rightmove/Zoopla Listings
app.get('/api/listings', (req, res) => {
    const listingsData = readDB(LISTINGS_DB);
    // readDB returns {} if empty. The scraper saves an Array. 
    // If it's empty, we return [] instead of {}.
    const dataArray = Array.isArray(listingsData) ? listingsData : [];
    
    const { town } = req.query;
    if (town) {
        return res.json(dataArray.filter(l => l.town.toLowerCase() === town.toLowerCase()));
    }

    res.json(dataArray);
});

// 6. Get Live Rightmove/Zoopla Rentals
app.get('/api/rentals', (req, res) => {
    const rentalsData = readDB(RENTALS_DB);
    const dataArray = Array.isArray(rentalsData) ? rentalsData : [];
    
    const { town } = req.query;
    if (town) {
        return res.json(dataArray.filter(l => l.town.toLowerCase() === town.toLowerCase()));
    }

    res.json(dataArray);
});

// Auth
app.get('/api/auth/status', (req, res) => {
  const users = listUsers();
  res.json({ authRequired: authRequired(), userMode: users.length > 0 });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const result = createUser({ email, password });
  if (result.error) return res.status(400).json({ error: result.error });
  const u = result.user;
  if (stripeEnabled()) {
    try {
      const customerId = await createStripeCustomer(u.email);
      if (customerId) updateUser(u.id, { stripeCustomerId: customerId });
    } catch (err) {
      console.warn('[Stripe] createCustomer failed:', err.message);
    }
  }
  res.status(201).json({ token: createUserToken(u.id, u.role), user: { id: u.id, email: u.email, role: u.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (email && password) {
    const result = await loginUser(email, password);
    if (result.error) return res.status(401).json({ error: result.error });
    return res.json({ token: result.token, user: result.user });
  }
  if (authRequired() && verifyPassword(password)) return res.json({ token: createToken() });
  res.status(401).json({ error: 'Invalid credentials' });
});

// Admin — users (requires auth + admin)
app.get('/api/admin/users', requireAuthMiddleware, adminMiddleware, (req, res) => {
  res.json(listUsers());
});

app.patch('/api/admin/users/:id', requireAuthMiddleware, adminMiddleware, (req, res) => {
  const { status, role, onboardingStep } = req.body || {};
  const updated = updateUser(req.params.id, { status, role, onboardingStep });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...u } = updated;
  res.json(u);
});

// Admin — data browser (list sources, get raw data)
const DATA_SOURCES = {
  listings: { path: LISTINGS_DB, name: 'Sales Listings', getData: () => (Array.isArray(readDB(LISTINGS_DB)) ? readDB(LISTINGS_DB) : []) },
  rentals: { path: RENTALS_DB, name: 'Rentals', getData: () => (Array.isArray(readDB(RENTALS_DB)) ? readDB(RENTALS_DB) : []) },
  stats: { path: STATS_DB, name: 'Market Stats', getData: () => readDB(STATS_DB) },
  intel: { path: INTEL_DB, name: 'Market Intel', getData: () => readDB(INTEL_DB) },
  priceHistory: { path: PRICE_HISTORY_DB, name: 'Price History', getData: () => (Array.isArray(readDB(PRICE_HISTORY_DB)) ? readDB(PRICE_HISTORY_DB) : []) },
  strategies: { path: STRATEGY_FLOWS_DB, name: 'Strategy Flows', getData: () => readDB(STRATEGY_FLOWS_DB) },
  users: { path: null, name: 'Users', getData: () => listUsers() },
};

app.get('/api/admin/data-sources', requireAuthMiddleware, adminMiddleware, (req, res) => {
  const sources = Object.entries(DATA_SOURCES).map(([id, { name, getData }]) => {
    const data = getData();
    const count = Array.isArray(data) ? data.length : (typeof data === 'object' && data !== null ? Object.keys(data).length : 0);
    return { id, name, count };
  });
  res.json(sources);
});

app.get('/api/admin/data/:source', requireAuthMiddleware, adminMiddleware, (req, res) => {
  const src = DATA_SOURCES[req.params.source];
  if (!src) return res.status(404).json({ error: 'Unknown data source' });
  res.json(src.getData());
});

// Billing (requires auth)
app.get('/api/billing/portal', requireAuthMiddleware, async (req, res) => {
  if (!stripeEnabled()) return res.status(503).json({ error: 'Billing not configured' });
  const u = req.auth?.userId ? findById(req.auth.userId) : null;
  if (!u?.stripeCustomerId) return res.status(400).json({ error: 'No billing account' });
  const base = req.get('origin') || `http://localhost:${PORT}`;
  const url = await createPortalSession(u.stripeCustomerId, `${base}/`);
  if (!url) return res.status(500).json({ error: 'Failed to create portal session' });
  res.json({ url });
});

app.post('/api/billing/checkout', requireAuthMiddleware, async (req, res) => {
  if (!stripeEnabled()) return res.status(503).json({ error: 'Billing not configured' });
  const u = req.auth?.userId ? findById(req.auth.userId) : null;
  if (!u?.stripeCustomerId) return res.status(400).json({ error: 'No billing account' });
  const base = req.get('origin') || `http://localhost:${PORT}`;
  const url = await createCheckoutSession(u.stripeCustomerId, process.env.STRIPE_PRICE_ID, `${base}/?success`, `${base}/`);
  if (!url) return res.status(500).json({ error: 'STRIPE_PRICE_ID required' });
  res.json({ url });
});

// 7. Force Sync — Scraper + Stats + Intel
let syncInProgress = false;
app.post('/api/sync', authMiddleware, async (req, res) => {
  if (syncInProgress) return res.status(429).json({ error: 'Sync already in progress' });
  syncInProgress = true;
  try {
    await runScript('rightmoveScraper.js');
    await runScript('generateMarketStats.js');
    await runScript('generateRealIntel.js');
    await runScript('appendPriceHistory.js');
    res.json({ ok: true, message: 'Sync complete' });
  } catch (err) {
    console.error('[SYNC]', err);
    res.status(500).json({ error: err.message });
  } finally {
    syncInProgress = false;
  }
});

// 8. Donald Ross sync (direct fetch)
let donaldRossSyncInProgress = false;
app.post('/api/sync/donaldross', authMiddleware, async (req, res) => {
  if (donaldRossSyncInProgress) return res.status(429).json({ error: 'Donald Ross sync already in progress' });
  donaldRossSyncInProgress = true;
  try {
    await runScript('donaldRossScraper.js');
    await runScript('generateMarketStats.js');
    await runScript('generateRealIntel.js');
    await runScript('appendPriceHistory.js');
    res.json({ ok: true, message: 'Donald Ross sync complete' });
  } catch (err) {
    console.error('[DONALDROSS]', err);
    res.status(500).json({ error: err.message });
  } finally {
    donaldRossSyncInProgress = false;
  }
});

app.get('/api/donaldross-stats', (req, res) => {
  const metaPath = path.join(DATA_DIR, 'donaldross_meta.json');
  let meta = { lastRun: null, sales: 0, rentals: 0 };
  if (fs.existsSync(metaPath)) {
    try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch {}
  }
  const listings = Array.isArray(readDB(LISTINGS_DB)) ? readDB(LISTINGS_DB) : [];
  const rentals = Array.isArray(readDB(RENTALS_DB)) ? readDB(RENTALS_DB) : [];
  const drCount = [...listings, ...rentals].filter(d => d.source === 'donaldross').length;
  res.json({ ...meta, donaldRossCount: drCount });
});

// 9. Land Registry CSV pipeline (download + process → market_stats.json)
let landRegistrySyncInProgress = false;
app.post('/api/sync/landregistry', authMiddleware, async (req, res) => {
  if (landRegistrySyncInProgress) return res.status(429).json({ error: 'Land Registry sync already in progress' });
  landRegistrySyncInProgress = true;
  try {
    await runScript('processRealCSV.js');
    await runScript('generateRealIntel.js');
    await runScript('appendPriceHistory.js');
    res.json({ ok: true, message: 'Land Registry sync complete' });
  } catch (err) {
    console.error('[LANDREGISTRY]', err);
    res.status(500).json({ error: err.message });
  } finally {
    landRegistrySyncInProgress = false;
  }
});

// 10. Zoopla-only sync (Puppeteer headless)
let zooplaSyncInProgress = false;
const ZOOPLA_META = path.join(DATA_DIR, 'zoopla_meta.json');
app.post('/api/sync/zoopla', authMiddleware, async (req, res) => {
  if (zooplaSyncInProgress) return res.status(429).json({ error: 'Zoopla sync already in progress' });
  zooplaSyncInProgress = true;
  try {
    await runScript('zooplaScraper.js');
    await runScript('generateMarketStats.js');
    await runScript('generateRealIntel.js');
    await runScript('appendPriceHistory.js');
    res.json({ ok: true, message: 'Zoopla sync complete' });
  } catch (err) {
    console.error('[ZOOPLA]', err);
    res.status(500).json({ error: err.message });
  } finally {
    zooplaSyncInProgress = false;
  }
});

// Strategy flows (n8n-style builder)
app.get('/api/strategies', (req, res) => {
  const data = readDB(STRATEGY_FLOWS_DB);
  const flows = Array.isArray(data?.flows) ? data.flows : (data?.default ? [data.default] : []);
  const defaultId = data.defaultId ?? data.default?.id ?? 'default';
  const defaultFlow = flows.find((f) => (f.id || f.name) === defaultId) || flows[0];
  res.json({ flows, default: defaultFlow, defaultId });
});

app.post('/api/strategies', authMiddleware, (req, res) => {
  try {
    const { id, name, nodes, edges, setAsDefault } = req.body;
    let data = readDB(STRATEGY_FLOWS_DB);
    let flows = Array.isArray(data?.flows) ? data.flows : [];
    const flowId = id || `flow-${Date.now()}`;
    const payload = { id: flowId, name: name || 'Unnamed', nodes: nodes || [], edges: edges || [], updatedAt: new Date().toISOString() };
    const idx = flows.findIndex((f) => (f.id || f.name) === flowId);
    if (idx >= 0) flows[idx] = payload;
    else flows.push(payload);
    const defaultId = setAsDefault ? flowId : (data.defaultId ?? data.default?.id ?? 'default');
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STRATEGY_FLOWS_DB, JSON.stringify({ defaultId, flows }, null, 2), 'utf-8');
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/strategies/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    let data = readDB(STRATEGY_FLOWS_DB);
    let flows = Array.isArray(data?.flows) ? data.flows : [];
    flows = flows.filter((f) => (f.id || f.name) !== id);
    let defaultId = data.defaultId ?? data.default?.id ?? 'default';
    if (defaultId === id) defaultId = flows[0]?.id ?? flows[0]?.name ?? null;
    fs.writeFileSync(STRATEGY_FLOWS_DB, JSON.stringify({ defaultId, flows }, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/price-history', (req, res) => {
  const data = readDB(PRICE_HISTORY_DB);
  res.json(Array.isArray(data) ? data : []);
});

// MCP endpoint (Model Context Protocol — for Cursor, Claude, etc.)
app.post('/mcp', async (req, res) => {
  try {
    const { handleMcpRequest } = await import('../mcp/index.js');
    await handleMcpRequest(req, res);
  } catch (err) {
    console.error('[MCP]', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.get('/api/zoopla-stats', (req, res) => {
  let meta = { lastRun: null, sales: 0, rentals: 0 };
  if (fs.existsSync(ZOOPLA_META)) {
    try { meta = JSON.parse(fs.readFileSync(ZOOPLA_META, 'utf-8')); } catch {}
  }
  const listings = Array.isArray(readDB(LISTINGS_DB)) ? readDB(LISTINGS_DB) : [];
  const rentals = Array.isArray(readDB(RENTALS_DB)) ? readDB(RENTALS_DB) : [];
  const zooplaCount = [...listings, ...rentals].filter(d => d.source === 'zoopla').length;
  res.json({ ...meta, zooplaCount });
});

// ----------------------------------------------------
// CRON — full daily sync at midnight
// ----------------------------------------------------
console.log('⏱️  Cron: Full sync (Rightmove + Donald Ross + Zoopla) daily at midnight');
cron.schedule('0 0 * * *', async () => {
  console.log('🌙 [CRON] Starting full sync...');
  try {
    await runScript('rightmoveScraper.js');
    await runScript('donaldRossScraper.js');
    await runScript('zooplaScraper.js');
    await runScript('generateMarketStats.js');
    await runScript('generateRealIntel.js');
    await runScript('appendPriceHistory.js');
    console.log('✅ [CRON] Full sync complete');
  } catch (e) { console.error('[CRON]', e); }
});


// ----------------------------------------------------
// START SERVER
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Deal Engine API on http://localhost:${PORT}`);
  console.log(`- GET /api/intel?town=Ayr`);
  console.log(`- POST /mcp (MCP for Cursor/Claude)`);
});
};

startServer();
