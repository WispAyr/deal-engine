import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPromptChain } from '../src/lib/promptSystem.js';

// If you want to use the actual OpenAI SDK or your Local Liquid AI server:
// import OpenAI from 'openai';
// const openai = new OpenAI({ 
//    baseURL: process.env.LOCAL_AI_URL || 'https://api.openai.com/v1',
//    apiKey: process.env.OPENAI_API_KEY || 'local-key' 
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOWNS = [
  'Ayr', 'Kilmarnock', 'Irvine', 'Prestwick', 'Troon', 
  'Stevenston', 'Saltcoats', 'Ardrossan', 'Kilwinning', 'Largs', 'Girvan'
];

const PROPERTY_TYPES = [
  '1-bed flat', 
  '2-bed flat', 
  '2-bed house'
];

const STRATEGIES = ['BTL', 'FLIP', 'BRRR']; // We'll run one primary strategy per card by default

/**
 * MOCK LLM CALL 
 * In production, replace this with a real fetch() to your OpenWebUI/Ollama or OpenAI API.
 * It strictly returns the normalized JSON your UI expects.
 */
async function callLLMStub(prompt) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulated structured JSON output that an LLM would yield from your prompt
  return {
    buy_min: 35000 + Math.floor(Math.random() * 20000),
    buy_max: 80000 + Math.floor(Math.random() * 20000),
    rent_min: 450 + Math.floor(Math.random() * 100),
    rent_max: 625 + Math.floor(Math.random() * 100),
    yield_min: 7.5 + (Math.random() * 2),
    yield_max: 12.0 + (Math.random() * 4),
    micro_locations: [
      { area: "KA8 (Heathfield)", notes: "Strong tenant demand, classic first-time buyer zone" },
      { area: "KA7 (Central)", notes: "Premium rents, but tighter yields due to higher buy prices" }
    ],
    strategy_primary: "BTL",
    strategy_secondary: "BRRR",
    deal_rule: "Buy under £45k if rent exceeds £500",
    why_this_works: ["High local rental velocity", "Town centre regeneration pushing up floor prices"],
    risks: ["Oversupply in specific local blocks", "Higher than average turnover in 1-beds"],
    confidence: "High"
  };
}

async function generateProprietaryDataset() {
  console.log('🚀 Booting up the Ayrshire Deal Engine Prompt System...');
  console.log(`Targeting ${TOWNS.length} towns and ${PROPERTY_TYPES.length} property types.\n`);
  
  const dataset = {};

  let count = 1;
  const totalCalls = TOWNS.length * PROPERTY_TYPES.length;

  for (const town of TOWNS) {
    dataset[town] = {};
    for (const type of PROPERTY_TYPES) {
      console.log(`[${count}/${totalCalls}] Crunching data for ${town} | ${type}...`);
      
      // 1. Build the massive customized prompt combo using our prompt builder
      const finalPrompt = buildPromptChain(town, type, 'BTL');
      
      // 2. Query the LLM (Using our stub for now)
      // In prod: const completion = await openai.chat.completions.create({ ... })
      const aiResponseJSON = await callLLMStub(finalPrompt);

      // 3. Store normalized output
      dataset[town][type] = aiResponseJSON;
      count++;
    }
  }

  // 4. Save to a local database file (JSON engine)
  const dbDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'marketIntel.json');
  fs.writeFileSync(dbPath, JSON.stringify(dataset, null, 2), 'utf-8');

  console.log(`\n✅ Success! Generated proprietary dataset saved to:`);
  console.log(dbPath);
  console.log(`\nYour React UI can now simply import this JSON and map the cards perfectly!`);
}

generateProprietaryDataset().catch(console.error);
