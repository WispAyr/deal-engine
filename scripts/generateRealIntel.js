import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOWN_NAMES as TOWNS, TOWN_POSTCODE } from '../src/data/ayrshireTowns.js';
import { loadStrategyFlow, evaluateStrategyFlow } from './evaluateStrategyFlow.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../src/data');
const STATS_DB = path.join(DATA_DIR, 'market_stats.json');
const LISTINGS_DB = path.join(DATA_DIR, 'raw_listings.json');
const RENTALS_DB = path.join(DATA_DIR, 'raw_rentals.json');
const INTEL_DB = path.join(DATA_DIR, 'marketIntel.json');

// Helper to safely read JSON
const readJSON = (filePath) => {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const statsData = readJSON(STATS_DB);
const listingsArray = Array.isArray(readJSON(LISTINGS_DB)) ? readJSON(LISTINGS_DB) : [];
const rentalsArray = Array.isArray(readJSON(RENTALS_DB)) ? readJSON(RENTALS_DB) : [];

const TYPES = ['1-bed flat', '2-bed flat', '2-bed house', '3-bed house'];
const strategyFlow = loadStrategyFlow();

// Advanced Algorithmic Generator
const generateIntelForSegment = (town, propType) => {
    // 1. Extract postcodes & type keys
    const typeKey = propType.split('-')[1].split(' ')[0].toLowerCase(); // e.g., 'flat'
    const bedCount = parseInt(propType.charAt(0));

    // Find all postcode segments for this town (rough mapping)
    // In a real DB, we'd map towns to postcodes explicitly.
    // For Ayreshire, let's grab the first matching postcode from stats.
    let relevantStatKey = null;
    let relevantStats = null;
    const prefix = (TOWN_POSTCODE[town] || '') + '_';
    for (const [key, data] of Object.entries(statsData)) {
        if (key.startsWith(prefix) && key.includes(typeKey)) {
            relevantStatKey = key;
            relevantStats = data;
            break;
        }
    }

    // 2. Filter Scraped Data
    const localSales = listingsArray.filter(l => l.town === town && (l.property_type || '').toLowerCase().includes(typeKey) && l.bedrooms === bedCount);
    const localRentals = rentalsArray.filter(l => l.town === town && (l.property_type || '').toLowerCase().includes(typeKey) && l.bedrooms === bedCount);

    // 3. Math Computation
    let buyMin = 35000;
    let buyMax = 80000;
    if (relevantStats) {
        buyMin = relevantStats.metrics.lower_quartile || 35000;
        buyMax = relevantStats.metrics.upper_quartile || 80000;
    } else if (localSales.length > 0) {
        const prices = localSales.map(s => s.price).sort((a,b) => a-b);
        buyMin = prices[0];
        buyMax = prices[Math.floor(prices.length * 0.75)];
    }

    let rentMin = 400;
    let rentMax = 600;
    if (localRentals.length > 0) {
        const rPrices = localRentals.map(r => r.price).sort((a,b) => a-b);
        rentMin = rPrices[0] || rentMin;
        rentMax = rPrices[Math.floor(rPrices.length * 0.8)] || rentMax;
    }

    // Yield Calculations
    const yieldMax = ((rentMax * 12) / buyMin) * 100;
    const yieldMin = ((rentMin * 12) / buyMax) * 100;

    // 4. Algorithmic Intelligence Deductions
    const dataPoints = (relevantStats?.data_points || 0) + localSales.length + localRentals.length;
    const segment = { yieldMin, yieldMax, buyMin, buyMax, rentMin, rentMax, dataPoints };

    let strategy = "BTL";
    if (strategyFlow) {
      strategy = evaluateStrategyFlow(strategyFlow, segment);
    } else {
      if (yieldMax > 12) strategy = "BRRR";
      else if (buyMax > 200000) strategy = "Flip";
    }

    // Deal Rule Deduction
    const targetBuy = Math.floor(buyMin / 5000) * 5000; // Round to nearest 5k
    const targetRent = Math.floor(rentMax / 25) * 25;
    const dealRule = `Buy under £${targetBuy / 1000}k if rent exceeds £${targetRent}`;

    // Micro Locations logic
    // We group sales by their address prefix to find hot spots
    const areaCounts = {};
    localSales.forEach(s => {
        let prefix = s.address.split(',')[0].split(' ').pop();
        if (prefix.length > 3) {
            areaCounts[prefix] = (areaCounts[prefix] || 0) + 1;
        }
    });
    const hotAreas = Object.entries(areaCounts).sort((a,b) => b[1] - a[1]).slice(0, 2);
    
    const microLocations = [];
    if (hotAreas.length > 0) {
        microLocations.push({ area: hotAreas[0][0], description: `Highest local market liquidity (${hotAreas[0][1]} active properties). Focus viewing efforts here.` });
    }
    if (relevantStatKey) {
        microLocations.push({ area: relevantStatKey.split('_')[0], description: `Statistical anchor zone driven by ${relevantStats.data_points} HMLR historical data points.` });
    }
    if (microLocations.length === 0) {
        microLocations.push({ area: "Central", description: `Default focus zone due to lack of granular scraping volume in ${town}.` });
    }

    // Risk Generation
    const risks = [];
    if (localSales.length > 20) risks.push(`Oversupply risk: ${localSales.length} similar active properties.`);
    if (yieldMax > 14) risks.push(`Excessive yield implies higher localized socio-economic tenant turnover.`);
    if (localRentals.length < 2) risks.push(`Weak rental velocity data. Confidence restricted.`);
    if (risks.length === 0) risks.push("Stable market dynamics. Low structural risk.");

    const strategyRationale = {
      BRRR: `High yield (${yieldMin.toFixed(1)}–${yieldMax.toFixed(1)}%) enables refinance to recycle capital. Strong rental demand in ${town}.`,
      Flip: `Price appreciation potential and buyer demand in ${town}. Quick turnaround strategy.`,
      BTL: `Steady income. Buy band aligns with local rental demand. ${town} offers consistent tenant base.`,
    };
    const whyThisWorks = strategyRationale[strategy] ?? `Configured strategy fit for ${town} market. See Strategy Builder for rules.`;

    // Compile Object
    return {
        strategy_primary: strategy,
        deal_rule: dealRule,
        why_this_works: [whyThisWorks],
        confidence: localSales.length > 5 && localRentals.length > 3 ? "High" : "Medium",
        buy_min: buyMin,
        buy_max: buyMax,
        rent_min: rentMin,
        rent_max: rentMax,
        yield_min: isFinite(yieldMin) ? yieldMin : 5.0,
        yield_max: isFinite(yieldMax) ? yieldMax : 10.0,
        micro_locations: microLocations,
        risks: risks
    };
};

const masterRecord = {};

// Run the engine
TOWNS.forEach(town => {
    masterRecord[town] = {};
    TYPES.forEach(type => {
        masterRecord[town][type] = generateIntelForSegment(town, type);
    });
});

// Output
fs.writeFileSync(INTEL_DB, JSON.stringify(masterRecord, null, 2));
console.log(`🧠 [Intel Engine] Algorithmic intelligence generated for all active segments and saved to ${INTEL_DB}`);
