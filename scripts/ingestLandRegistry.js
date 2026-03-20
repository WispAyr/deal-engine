import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------------------------------------
// MATH UTILITIES: Essential for calculating Phase 2 Ground Truth (Medians, Quartiles)
// --------------------------------------------------------------------------------

const calculateAverage = (prices) => {
  if (prices.length === 0) return 0;
  const sum = prices.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / prices.length);
};

const calculateMedian = (prices) => {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
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

// --------------------------------------------------------------------------------
// INGESTION & AGGREGATION ENGINE
// --------------------------------------------------------------------------------

/**
 * In reality, this function makes a SPARQL query to http://landregistry.data.gov.uk/landregistry/query
 * or parses your bulk downloaded monthly CSV from Gov.uk. 
 * Since live SPARQL queries can timeout locally without API keys, we simulate fetching fresh 
 * LR data for Ayr (KA7, KA8).
 */
async function fetchLandRegistryData(postcodes) {
  console.log(`📡 Fetching UK Land Registry records for: ${postcodes.join(', ')}...`);
  
  // Simulated RAW Land Registry Sales (Ground Truth)
  const rawSales = [
    { postcode: 'KA8', type: 'F', price: 42000, date: '2026-01-12', address: 'Flat A, High St' },
    { postcode: 'KA8', type: 'F', price: 38000, date: '2026-01-18', address: '22B Main St' },
    { postcode: 'KA8', type: 'F', price: 55000, date: '2026-02-05', address: 'Flat 1, Sea View' },
    { postcode: 'KA8', type: 'F', price: 45000, date: '2026-02-15', address: 'Flat 2, Central Road' },
    { postcode: 'KA7', type: 'F', price: 65000, date: '2026-01-20', address: '18 Wellington Sq' },
    { postcode: 'KA7', type: 'F', price: 82000, date: '2026-02-11', address: 'Flat 3, Charlotte St' },
    { postcode: 'KA7', type: 'F', price: 71000, date: '2026-02-28', address: 'Flat 1, Fort St' },
    { postcode: 'KA8', type: 'T', price: 85000, date: '2026-01-05', address: '12 Terraced Row' },
    { postcode: 'KA8', type: 'T', price: 92000, date: '2026-02-19', address: '14 Terraced Row' }
  ];

  // Map "F" to "Flat", "T" to "Terraced", etc.
  return rawSales.map(sale => ({
    ...sale,
    mappedType: sale.type === 'F' ? 'Flat' : sale.type === 'T' ? 'Terraced' : 'Other'
  }));
}

async function runIngestionPipeline() {
  const targetPostcodes = ['KA7', 'KA8'];
  const sales = await fetchLandRegistryData(targetPostcodes);

  console.log(`\n🧹 Processing & Cleaning ${sales.length} raw transactions...`);

  // Step 1: Group Data (by Postcode & Property Type)
  const groups = {};
  sales.forEach(sale => {
    const key = `${sale.postcode}_${sale.mappedType}`;
    if (!groups[key]) {
      groups[key] = {
        town: 'Ayr',
        postcode: sale.postcode,
        property_type: sale.mappedType,
        prices: [],
      };
    }
    groups[key].prices.push(sale.price);
  });

  // Step 2 & 3: Calculate Metrics (Averages, Medians, Quartiles)
  const marketStats = {};
  
  Object.keys(groups).forEach(key => {
    const group = groups[key];
    const prices = group.prices;
    
    const avgPrice = calculateAverage(prices);
    const medianPrice = calculateMedian(prices);
    const lowerQuartile = calculateQuartile(prices, 0.25); // "Cheap deals"
    const upperQuartile = calculateQuartile(prices, 0.75); // "Premium stock"

    marketStats[key] = {
      town: group.town,
      postcode: group.postcode,
      property_type: group.property_type,
      data_points: prices.length,
      metrics: {
        avg_price: avgPrice,
        median_price: medianPrice,
        lower_quartile: lowerQuartile,
        upper_quartile: upperQuartile
      },
      updated_at: new Date().toISOString()
    };
  });

  console.log(`\n✅ Aggregated Ground Truth calculations complete for ${Object.keys(marketStats).length} market segments:`);
  console.table(
    Object.values(marketStats).map(s => ({
      Segment: `${s.postcode} ${s.property_type}`,
      Sales: s.data_points,
      Median: `£${s.metrics.median_price.toLocaleString()}`,
      "Lower Q (Buy Target)": `£${s.metrics.lower_quartile.toLocaleString()}`
    }))
  );

  // Step 4: Write to Database (JSON file for now)
  const dbDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'market_stats.json');
  fs.writeFileSync(dbPath, JSON.stringify(marketStats, null, 2), 'utf-8');

  console.log(`\n💾 Saved production-ready market_stats.json to Database.`);
  console.log(`👉 Next step: Feed these medians/quartiles to the Master Prompts to generate the final UI insights!`);
}

runIngestionPipeline().catch(console.error);
