import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOWN_POSTCODE, TOWN_NAMES } from '../src/data/ayrshireTowns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/data');
const LISTINGS_DB = path.join(DATA_DIR, 'raw_listings.json');
const RENTALS_DB = path.join(DATA_DIR, 'raw_rentals.json');
const STATS_DB = path.join(DATA_DIR, 'market_stats.json');

const readJSON = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Array.isArray(data) ? data : [];
};

const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(idx, sorted.length - 1)];
};

const listings = readJSON(LISTINGS_DB).filter(l => l.price && l.town && l.property_type);
const rentals = readJSON(RENTALS_DB).filter(r => r.price && r.town && r.property_type);

const stats = {};

TOWN_NAMES.forEach(town => {
  ['flat', 'house'].forEach(typeKey => {
    const sales = listings.filter(l => l.town === town && (l.property_type || '').toLowerCase().includes(typeKey));
    if (sales.length < 2) return;
    const prices = sales.map(s => s.price);
    const postcode = TOWN_POSTCODE[town] || town;
    const key = `${postcode}_${typeKey}`;
    stats[key] = {
      metrics: {
        lower_quartile: percentile(prices, 25),
        upper_quartile: percentile(prices, 75),
        avg_price: prices.reduce((a, b) => a + b, 0) / prices.length
      },
      data_points: prices.length
    };
  });
});

fs.writeFileSync(STATS_DB, JSON.stringify(stats, null, 2));
console.log(`📊 [Market Stats] Derived from ${listings.length} sales, ${rentals.length} rentals → ${STATS_DB}`);
