import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOWN_NAMES, TOWN_POSTCODE } from '../src/data/ayrshireTowns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');
const HISTORY_PATH = path.join(DATA_DIR, 'price_history.json');
const LISTINGS_PATH = path.join(DATA_DIR, 'raw_listings.json');
const RENTALS_PATH = path.join(DATA_DIR, 'raw_rentals.json');
const STATS_PATH = path.join(DATA_DIR, 'market_stats.json');

const MAX_ENTRIES = 90; // ~3 months daily, or 90 weekly syncs

const readJSON = (p) => {
  if (!fs.existsSync(p)) return [];
  try {
    const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
};

const readStats = (p) => {
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return {};
  }
};

const today = () => new Date().toISOString().slice(0, 10);

function run() {
  const listings = readJSON(LISTINGS_PATH);
  const rentals = readJSON(RENTALS_PATH);
  const stats = readStats(STATS_PATH);

  const towns = {};
  for (const town of TOWN_NAMES) {
    const postcode = TOWN_POSTCODE[town];
    const townSales = listings.filter(l => l.town === town && l.price > 0);
    const townRentals = rentals.filter(r => r.town === town && r.price > 0);

    const salePrices = townSales.map(s => s.price);
    const rentPrices = townRentals.map(r => r.price);

    const flatStats = stats[`${postcode}_flat`];
    const houseStats = stats[`${postcode}_house`];

    const avgSale = salePrices.length
      ? Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
      : (flatStats?.metrics?.avg_price || houseStats?.metrics?.avg_price) || null;
    const avgRent = rentPrices.length
      ? Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length)
      : null;

    towns[town] = {
      avgSale,
      avgRent,
      salesCount: townSales.length,
      rentalsCount: townRentals.length,
      lowerQuartile: flatStats?.metrics?.lower_quartile || houseStats?.metrics?.lower_quartile || null,
      upperQuartile: flatStats?.metrics?.upper_quartile || houseStats?.metrics?.upper_quartile || null,
    };
  }

  let history = [];
  if (fs.existsSync(HISTORY_PATH)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    } catch {}
  }
  if (!Array.isArray(history)) history = [];

  history.push({ date: today(), towns });
  if (history.length > MAX_ENTRIES) {
    history = history.slice(-MAX_ENTRIES);
  }

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  console.log(`📅 [Price History] Appended snapshot for ${today()} → ${HISTORY_PATH}`);
}

run();
