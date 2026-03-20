/**
 * Donald Ross Estate Agents scraper
 * Fetches sales and rentals from donaldross.co.uk — Ayrshire-wide agent
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOWN_CENTROIDS } from '../src/data/ayrshireTowns.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_SALES = path.join(__dirname, '../src/data/raw_listings.json');
const DEST_RENTALS = path.join(__dirname, '../src/data/raw_rentals.json');
const BASE = 'https://www.donaldross.co.uk';

const DR_TO_OUR_TOWN = {
  Ayr: 'Ayr',
  Alloway: 'Alloway',
  Irvine: 'Irvine',
  Kilmarnock: 'Kilmarnock',
  Cumnock: 'Cumnock',
  Prestwick: 'Prestwick',
  Maybole: 'Maybole',
  Troon: 'Troon',
  Ardrossan: 'Ardrossan',
  Kilwinning: 'Kilwinning',
  Girvan: 'Girvan',
  Mauchline: 'Kilmarnock',
  Darvel: 'Kilmarnock',
  Galston: 'Kilmarnock',
  Stevenston: 'Saltcoats',
  'West Kilbride': 'Largs',
  Saltcoats: 'Saltcoats',
  Largs: 'Largs',
};

function inferTown(locationStr, addressStr) {
  const loc = (locationStr || '').replace(/, United Kingdom$/i, '').trim();
  const addr = (addressStr || '').toLowerCase();
  if (addr.includes('alloway')) return 'Alloway';
  const our = DR_TO_OUR_TOWN[loc];
  return our || 'Ayr';
}

function extractListings(html, type) {
  const listings = [];
  const normalized = html.replace(/&pound;/g, '£');
  const linkRe = /href="(\/property\/([^"]+))"/g;
  let m;
  const seen = new Set();
  while ((m = linkRe.exec(normalized)) !== null) {
    const path = m[1];
    const slug = m[2].replace(/\/$/, '');
    if (seen.has(slug)) continue;
    seen.add(slug);
    const block = normalized.substring(m.index, m.index + 1800);
    const addrMatch = block.match(/title="([^"]{10,120})"/) || block.match(/>([^<]{10,80})<\/a>/);
    const address = addrMatch ? addrMatch[1].trim() : slug.replace(/-/g, ' ');
    const locMatch = block.match(/location-name[^>]*title="([^"]+)"/) || block.match(/>([A-Za-z\s]+),\s*United Kingdom</);
    const location = locMatch ? locMatch[1].trim() : '';
    const priceMatch = block.match(/(?:Offers in excess of|Fixed price)\s*[£]?([\d,]+)/) || block.match(/£([\d,]+)\s*per month/);
    let price = 0;
    if (priceMatch) price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
    const bedsBaths = block.match(/(\d+)\s*Bed\s*\|\s*(\d+)\s*Bath/);
    const bedrooms = bedsBaths ? parseInt(bedsBaths[1], 10) : null;
    const bathrooms = bedsBaths ? parseInt(bedsBaths[2], 10) : null;
    if (type === 'sales' && price < 1000) continue;
    if (type === 'rentals' && price < 50) continue;
    const town = inferTown(location, address);
    const [lat, lng] = TOWN_CENTROIDS[town] ?? [55.46, -4.63];
    const id = `dr_${slug.replace(/\//g, '_')}`;
    listings.push({
      id,
      source: 'donaldross',
      category: type,
      town,
      latitude: lat,
      longitude: lng,
      address,
      property_type: null,
      bedrooms,
      bathrooms,
      price,
      summary: null,
      estate_agent: 'Donald Ross',
      features: [],
      url: `${BASE}${path}`,
      added_date: new Date().toISOString(),
    });
  }
  return listings;
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function scrapePaginated(url, type, maxPages = 20) {
  const all = [];
  const seen = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const sep = url.includes('?') ? '&' : '?';
    const pageUrl = page === 1 ? url : `${url}${sep}page=${page}`;
    const html = await fetchPage(pageUrl);
    const listings = extractListings(html, type);
    const newOnes = listings.filter((l) => !seen.has(l.id));
    if (newOnes.length === 0) break;
    newOnes.forEach((l) => seen.add(l.id));
    all.push(...newOnes);
    await new Promise((r) => setTimeout(r, 400));
  }
  return [...new Map(all.map((l) => [l.id, l])).values()];
}

async function scrapeSales() {
  console.log('[Donald Ross] Fetching sales...');
  const listings = await scrapePaginated(`${BASE}/all-properties-for-sale`, 'sales');
  console.log(`✅ [Donald Ross] ${listings.length} sales`);
  return listings;
}

async function scrapeRentals() {
  console.log('[Donald Ross] Fetching rentals...');
  try {
    const listings = await scrapePaginated(`${BASE}/all-properties-for-rent`, 'rentals');
    console.log(`✅ [Donald Ross] ${listings.length} rentals`);
    return listings;
  } catch (e) {
    console.error('❌ [Donald Ross] Rentals:', e.message);
    return [];
  }
}

async function run() {
  console.log('🏠 Donald Ross scraper starting...\n');
  const [sales, rentals] = await Promise.all([scrapeSales(), scrapeRentals()]);

  let existingSales = [];
  let existingRentals = [];
  if (fs.existsSync(DEST_SALES)) {
    try {
      existingSales = JSON.parse(fs.readFileSync(DEST_SALES, 'utf-8'));
    } catch {}
  }
  if (fs.existsSync(DEST_RENTALS)) {
    try {
      existingRentals = JSON.parse(fs.readFileSync(DEST_RENTALS, 'utf-8'));
    } catch {}
  }

  const finalSales = [...(Array.isArray(existingSales) ? existingSales : []).filter((d) => d.source !== 'donaldross'), ...sales];
  const finalRentals = [...(Array.isArray(existingRentals) ? existingRentals : []).filter((d) => d.source !== 'donaldross'), ...rentals];

  if (!fs.existsSync(path.dirname(DEST_SALES))) {
    fs.mkdirSync(path.dirname(DEST_SALES), { recursive: true });
  }
  fs.writeFileSync(DEST_SALES, JSON.stringify(finalSales, null, 2));
  fs.writeFileSync(DEST_RENTALS, JSON.stringify(finalRentals, null, 2));

  const metaPath = path.join(__dirname, '../src/data/donaldross_meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({ lastRun: new Date().toISOString(), sales: sales.length, rentals: rentals.length }, null, 2));

  console.log(`\n💾 Donald Ross: ${sales.length} sales, ${rentals.length} rentals saved`);
}

run().catch((err) => {
  console.error('Donald Ross scraper failed:', err);
  process.exit(1);
});
