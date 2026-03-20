import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Math Utilities ---
const calculateAverage = (prices) => {
  if (prices.length === 0) return 0;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
};

const calculateMedian = (prices) => {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

const calculateQuartile = (prices, percentile) => {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = lower + 1;
  const weight = index % 1;
  if (upper >= sorted.length) return sorted[lower];
  return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
};

function mapType(type) {
  switch (type) {
    case 'F': return 'flat';
    case 'D': return 'detached';
    case 'S': return 'semi';
    case 'T': return 'terraced';
    default: return 'other';
  }
}

// --- Pipeline ---
const rawCSVPath = path.join(__dirname, 'ppd_data.csv');
const dataDir = path.join(__dirname, '../src/data');

// Land Registry Monthly Update URL
const LR_CSV_URL = 'http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-monthly-update-new-version.csv';

function processCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    console.log('📡 Processing Land Registry Data...');

    fs.createReadStream(rawCSVPath)
      .pipe(csv({
        headers: [
          'id','price','date','postcode','type','new_build',
          'tenure','locality','town','district','county'
        ]
      }))
      .on('data', (row) => {
        if (!row.postcode || !row.postcode.startsWith('KA')) return;
        results.push({
          price: parseInt(row.price, 10),
          date: row.date,
          postcode: row.postcode,
          type: mapType(row.type),
          town: row.town,
          district: row.district
        });
      })
      .on('end', () => {
        console.log(`✅ Filtered ${results.length} Ayrshire records from raw CSV.`);
        const groups = {};
        results.forEach(sale => {
          const prefix = sale.postcode.split(' ')[0];
          const key = `${prefix}_${sale.type}`;
          if (!groups[key]) groups[key] = { town: sale.town || 'Ayr', postcode: prefix, property_type: sale.type, prices: [] };
          groups[key].prices.push(sale.price);
        });
        const marketStats = {};
        Object.keys(groups).forEach(key => {
          const g = groups[key];
          if (g.prices.length < 2) return;
          marketStats[key] = {
            town: g.town,
            postcode: g.postcode,
            property_type: g.property_type,
            data_points: g.prices.length,
            metrics: {
              avg_price: calculateAverage(g.prices),
              median_price: calculateMedian(g.prices),
              lower_quartile: calculateQuartile(g.prices, 0.25),
              upper_quartile: calculateQuartile(g.prices, 0.75)
            },
            updated_at: new Date().toISOString()
          };
        });
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        const dbPath = path.join(dataDir, 'market_stats.json');
        fs.writeFileSync(dbPath, JSON.stringify(marketStats, null, 2), 'utf-8');
        console.log(`\n💾 Saved to ${dbPath}`);
        resolve();
      })
      .on('error', reject);
  });
}

async function run() {
  if (!fs.existsSync(rawCSVPath)) {
    console.log('📥 Downloading HM Land Registry monthly CSV...');
    const response = await fetch(LR_CSV_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(rawCSVPath, Buffer.from(buffer));
    console.log('✅ Download complete.');
  }
  await processCSV();
}

run().catch((err) => {
  console.error('Land Registry pipeline failed:', err);
  process.exit(1);
});
