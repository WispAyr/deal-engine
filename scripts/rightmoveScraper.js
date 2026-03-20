import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RIGHTMOVE_LOCATIONS as LOCATIONS, TOWN_CENTROIDS } from '../src/data/ayrshireTowns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEST_SALES = path.join(__dirname, '../src/data/raw_listings.json');
const DEST_RENTALS = path.join(__dirname, '../src/data/raw_rentals.json');

const buildSearchUrl = (regionId, type = 'sales') => {
    // Basic search: Sales or Rentals, Any property type, Default radius
    if (type === 'rentals') {
        return `https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier=${regionId}&sortType=6&propertyTypes=&includeLetAgreed=false&mustHave=&dontShow=&furnishTypes=&keywords=`;
    }
    return `https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=${regionId}&sortType=6&propertyTypes=&includeSSTC=false&mustHave=&dontShow=&furnishTypes=&keywords=`;
};

const scrapeRightmoveRegion = async (townName, regionId, type = 'sales') => {
    console.log(`[Rightmove] Fetching ${type} data for ${townName}...`);
    const url = buildSearchUrl(regionId, type);
    
    try {
        const response = await fetch(url, {
            headers: {
                // Mimic a real browser to bypass basic blocks
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.9'
            }
        });

        if (!response.ok) {
            console.error(`❌ Failed to fetch ${townName}: HTTP ${response.status}`);
            return [];
        }

        const html = await response.text();

        // Rightmove injects the ENTIRE search result state into a JSON object in the Next.js script tag.
        // We regex it out instead of parsing HTML with Cheerio. It is infinitely faster and more reliable.
        const stateMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        
        if (!stateMatch || !stateMatch[1]) {
            console.error(`❌ Could not isolate __NEXT_DATA__ for ${townName}`);
            return [];
        }

        const stateJson = JSON.parse(stateMatch[1]);
        const listings = stateJson.props?.pageProps?.searchResults?.properties || [];
        
        console.log(`✅ [Rightmove] Extracted ${listings.length} live ${type} listings for ${townName}.`);

        // Normalize data to our Deal Engine schema
        return listings.map(prop => {
            const lat = prop.location?.latitude ?? TOWN_CENTROIDS[townName]?.[0];
            const lng = prop.location?.longitude ?? TOWN_CENTROIDS[townName]?.[1];
            return {
            id: `rm_${prop.id}`,
            source: 'rightmove',
            category: type,
            town: townName,
            latitude: lat,
            longitude: lng,
            address: prop.displayAddress,
            property_type: prop.propertySubType, // e.g., 'Flat', 'Terraced'
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            price: prop.price?.amount || prop.price?.frequency === 'monthly' ? prop.price?.amount : Math.round((prop.price?.amount || 0) * 4.33), // Convert weekly to monthly if needed
            summary: prop.summary,
            estate_agent: prop.customer?.brandPlusLogoURI ? prop.customer.branchName : 'Unknown',
            features: prop.keyFeatures || [], // Rightmove exposes features directly here often!
            url: `https://www.rightmove.co.uk${prop.propertyUrl}`,
            image: prop.propertyImages?.mainImageSrc || null,
            added_date: prop.firstVisibleDate
        };
        });

    } catch (err) {
        console.error(`❌ [Rightmove] Scraper exploded on ${townName} (${type}):`, err.message);
        return [];
    }
};

const runContinuousScraper = async () => {
    console.log('🚀 Starting Rightmove Deal Engine Scraper...\n');
    let allSales = [];
    let allRentals = [];

    // Loop through our core target towns for SALES
    for (const [town, regionId] of Object.entries(LOCATIONS)) {
        const townSales = await scrapeRightmoveRegion(town, regionId, 'sales');
        allSales = [...allSales, ...townSales];
        await new Promise(r => setTimeout(r, 1500)); // Rate limit
    }

    // Loop through our core target towns for RENTALS
    for (const [town, regionId] of Object.entries(LOCATIONS)) {
        const townRentals = await scrapeRightmoveRegion(town, regionId, 'rentals');
        allRentals = [...allRentals, ...townRentals];
        await new Promise(r => setTimeout(r, 1500)); // Rate limit
    }

    // Determine current DB state so we don't completely overwrite Zoopla data if it exists
    let existingSales = [];
    if (fs.existsSync(DEST_SALES)) existingSales = JSON.parse(fs.readFileSync(DEST_SALES, 'utf-8'));
    
    let existingRentals = [];
    if (fs.existsSync(DEST_RENTALS)) existingRentals = JSON.parse(fs.readFileSync(DEST_RENTALS, 'utf-8'));

    // Filter out old rightmove listings, replace with fresh ones
    const finalSales = [...existingSales.filter(d => d.source !== 'rightmove'), ...allSales];
    const finalRentals = [...existingRentals.filter(d => d.source !== 'rightmove'), ...allRentals];

    // Ensure the data directory exists
    if (!fs.existsSync(path.dirname(DEST_SALES))) {
        fs.mkdirSync(path.dirname(DEST_SALES), { recursive: true });
    }

    fs.writeFileSync(DEST_SALES, JSON.stringify(finalSales, null, 2));
    fs.writeFileSync(DEST_RENTALS, JSON.stringify(finalRentals, null, 2));
    
    console.log(`\n💾 Successfully saved ${allSales.length} total live Sales listings to raw_listings.json`);
    console.log(`💾 Successfully saved ${allRentals.length} total live Rental listings to raw_rentals.json`);
};

runContinuousScraper();
