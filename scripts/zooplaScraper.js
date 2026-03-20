import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOWN_NAMES as TOWNS, ZOOPLA_SLUGS, TOWN_CENTROIDS } from '../src/data/ayrshireTowns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEST_SALES = path.join(__dirname, '../src/data/raw_listings.json');
const DEST_RENTALS = path.join(__dirname, '../src/data/raw_rentals.json');

const buildUrl = (town, type) => {
  const slug = ZOOPLA_SLUGS[town] || town.toLowerCase();
  const base = type === 'rentals' ? 'to-rent' : 'for-sale';
  return `https://www.zoopla.co.uk/${base}/property/${slug}/`;
};

function extractFromNextData(html, town, type) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!match) return [];
  try {
    const data = JSON.parse(match[1]);
    const listings = data?.props?.pageProps?.initialData?.listings ?? data?.props?.pageProps?.listings ?? [];
    const items = Array.isArray(listings) ? listings : (listings?.listing ?? []);
    const [lat, lng] = TOWN_CENTROIDS[town] ?? [55.5, -4.6];
    return items.map((p, i) => ({
      id: `zoopla_${p.listingId ?? p.id ?? i}`,
      source: 'zoopla',
      category: type,
      town,
      latitude: p.latitude ?? p.location?.latitude ?? lat,
      longitude: p.longitude ?? p.location?.longitude ?? lng,
      address: p.displayAddress ?? p.address ?? p.title ?? `${town} property`,
      property_type: p.propertyType ?? p.property_sub_type ?? null,
      bedrooms: p.numBedrooms ?? p.bedrooms ?? null,
      bathrooms: p.numBathrooms ?? p.bathrooms ?? null,
      price: p.price ?? p.amount ?? 0,
      summary: p.description ?? p.summary ?? null,
      estate_agent: p.branchName ?? p.agent_name ?? null,
      features: p.keyFeatures ?? [],
      url: p.url ?? (p.listingId ? `https://www.zoopla.co.uk/for-sale/details/${p.listingId}` : 'https://www.zoopla.co.uk'),
      added_date: p.firstVisibleDate ?? p.publishedDate ?? new Date().toISOString()
    })).filter(l => l.price > 0);
  } catch {
    return [];
  }
}

function extractFromDom(html, town, type) {
  const out = [];
  const [lat, lng] = TOWN_CENTROIDS[town] ?? [55.5, -4.6];
  // Match both /for-sale/details/ and /to-rent/details/
  const pathPrefix = type === 'rentals' ? '/to-rent/details/' : '/for-sale/details/';
  const linkRegex = new RegExp(`href="(${pathPrefix.replace(/\//g, '\\/')}\\d+[^"]*)"`, 'g');
  const idRegex = /\/details\/(\d+)/;
  let m;
  const seen = new Set();
  while ((m = linkRegex.exec(html)) !== null) {
    const idMatch = m[1].match(idRegex);
    const id = idMatch ? idMatch[1] : m[1];
    if (seen.has(id)) continue;
    seen.add(id);
    const after = html.substring(Math.max(0, m.index - 200), m.index + 1000);
    const priceMatch = after.match(/£([\d,]+)/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
    if (price < 1000) continue;
    const addrMatch = after.match(/>([^<]{5,120})</g);
    const addr = addrMatch ? addrMatch.map(s => s.replace(/^>|<$/g, '').trim()).find(s => s.length > 10 && s.length < 100 && !s.includes('£')) : null;
    out.push({
      id: `zoopla_${id}`,
      source: 'zoopla',
      category: type,
      town,
      latitude: lat,
      longitude: lng,
      address: addr ?? `${town} property`,
      property_type: null,
      bedrooms: null,
      bathrooms: null,
      price,
      summary: null,
      estate_agent: null,
      features: [],
      url: `https://www.zoopla.co.uk${m[1].split('"')[0]}`,
      added_date: new Date().toISOString()
    });
  }
  return out;
}

async function extractFromPageDOM(page, town, type) {
  const [lat, lng] = TOWN_CENTROIDS[town] ?? [55.5, -4.6];
  const pathPrefix = type === 'rentals' ? '/to-rent/details/' : '/for-sale/details/';
  const raw = await page.evaluate(({ pathPrefix, town }) => {
    const out = [];
    const links = document.querySelectorAll(`a[href*="${pathPrefix}"]`);
    const seen = new Set();
    links.forEach(a => {
      const href = (a.getAttribute('href') || '').split('?')[0];
      const idMatch = href.match(/\/details\/(\d+)/);
      if (!idMatch) return;
      const id = idMatch[1];
      if (seen.has(id)) return;
      seen.add(id);
      const card = a.closest('article, [class*="card"], [class*="listing"], [data-testid*="listing"]') || a.parentElement?.parentElement || a;
      const text = (card?.textContent || a.textContent || '').replace(/\s+/g, ' ');
      const priceMatch = text.match(/£([\d,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
      if (price < 1000) return;
      const addrEl = card?.querySelector('address, [class*="address"], [class*="title"], h2');
      const address = addrEl?.textContent?.trim() || text.slice(0, 80).trim() || `${town} property`;
      out.push({ id, price, address, url: 'https://www.zoopla.co.uk' + (href.startsWith('/') ? href : '/' + href) });
    });
    return out;
  }, { pathPrefix, town });
  return raw.map(o => ({
    id: `zoopla_${o.id}`,
    source: 'zoopla',
    category: type,
    town,
    latitude: lat,
    longitude: lng,
    address: o.address,
    property_type: null,
    bedrooms: null,
    bathrooms: null,
    price: o.price,
    summary: null,
    estate_agent: null,
    features: [],
    url: o.url,
    added_date: new Date().toISOString()
  }));
}

async function scrapeZoopla() {
  let browser;
  try {
    const puppeteer = (await import('puppeteer-extra')).default;
    const StealthPlugin = (await import('puppeteer-extra-plugin-stealth')).default;
    puppeteer.use(StealthPlugin());
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-blink-features=AutomationControlled']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    let allSales = [];
    let allRentals = [];

    for (const town of TOWNS) {
      for (const type of ['sales', 'rentals']) {
        const url = buildUrl(town, type);
        console.log(`[Zoopla] Fetching ${type} for ${town}...`);
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await new Promise(r => setTimeout(r, 4000));

          const html = await page.content();
          let listings = extractFromNextData(html, town, type);
          if (listings.length === 0) listings = extractFromDom(html, town, type);
          if (listings.length === 0) listings = await extractFromPageDOM(page, town, type);

          if (type === 'sales') allSales = [...allSales, ...listings];
          else allRentals = [...allRentals, ...listings];
          console.log(`✅ [Zoopla] ${listings.length} ${type} for ${town}`);
        } catch (e) {
          console.error(`❌ [Zoopla] ${town} ${type}:`, e.message);
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    let existingSales = [];
    let existingRentals = [];
    if (fs.existsSync(DEST_SALES)) {
      const raw = fs.readFileSync(DEST_SALES, 'utf-8');
      try { existingSales = JSON.parse(raw); } catch {}
    }
    if (fs.existsSync(DEST_RENTALS)) {
      const raw = fs.readFileSync(DEST_RENTALS, 'utf-8');
      try { existingRentals = JSON.parse(raw); } catch {}
    }

    const finalSales = [...(Array.isArray(existingSales) ? existingSales : []).filter(d => d.source !== 'zoopla'), ...allSales];
    const finalRentals = [...(Array.isArray(existingRentals) ? existingRentals : []).filter(d => d.source !== 'zoopla'), ...allRentals];

    if (!fs.existsSync(path.dirname(DEST_SALES))) {
      fs.mkdirSync(path.dirname(DEST_SALES), { recursive: true });
    }
    fs.writeFileSync(DEST_SALES, JSON.stringify(finalSales, null, 2));
    fs.writeFileSync(DEST_RENTALS, JSON.stringify(finalRentals, null, 2));

    const count = allSales.length + allRentals.length;
    const metaPath = path.join(__dirname, '../src/data/zoopla_meta.json');
    fs.writeFileSync(metaPath, JSON.stringify({ lastRun: new Date().toISOString(), sales: allSales.length, rentals: allRentals.length }, null, 2));
    console.log(`\n💾 Zoopla: ${allSales.length} sales, ${allRentals.length} rentals saved`);
    return { sales: allSales.length, rentals: allRentals.length };
  } finally {
    if (browser) await browser.close();
  }
}

scrapeZoopla().catch(err => {
  console.error('Zoopla scraper failed:', err);
  process.exit(1);
});
