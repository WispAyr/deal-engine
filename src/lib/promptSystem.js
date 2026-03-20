/**
 * Ayrshire Acquisitions - Prompt Architecture
 * This system normalizes inputs (Town, Property Type) into structured prompt sets 
 * that can be fed to an LLM (OpenAI/Claude/Local) to output consistent UI data.
 */

export const PROMPTS = {
  // 🧩 Master Prompt Template (Core)
  CORE: (town, propertyType) => `
You are a UK property investment analyst specialising in Ayrshire.
Analyse the following market:

Town: ${town}
Property Type: ${propertyType}

Return structured data for an investor looking for profitable opportunities.
Output strictly in JSON format with the following keys, no markdown, no conversational text:

{
  "buy_min": 0,
  "buy_max": 0,
  "rent_min": 0,
  "rent_max": 0,
  "yield_min": 0.0,
  "yield_max": 0.0,
  "micro_locations": [
     { "area": "postcode/neighbourhood", "notes": "rent differences/demand" }
  ],
  "strategy_primary": "BTL | Flip | BRRR",
  "strategy_secondary": "BTL | Flip | BRRR",
  "deal_rule": "Buy under X if rent exceeds Y",
  "why_this_works": ["trend 1", "demand 2"],
  "risks": ["risk 1", "risk 2"],
  "confidence": "High | Medium | Low"
}

Be realistic, conservative, and base estimates on typical UK secondary market conditions.
  `.trim(),

  // A. 🔍 Yield Optimisation
  YIELD_OPTIMISATION: (town, propertyType) => `
Focus on maximising rental yield for ${propertyType} in ${town}.
Identify the best possible yield scenario and realistic expectations.
Highlight:
- Best-case yield pockets
- Required purchase price to achieve 10%+
- Areas to avoid for yield
Keep it investor-focused and realistic. Return output matching the strict JSON schema.
  `.trim(),

  // B. 🔨 Flip Strategy
  FLIP_STRATEGY: (town, propertyType) => `
Focus on property flipping opportunities for ${propertyType} in ${town}.
Provide:
- Typical purchase price for below-market deals
- Refurb cost ranges
- Realistic GDV
- Expected profit margins
Also include a specific flip deal rule, time-to-sell estimate, and risk factors.
Be conservative and realistic. Return output matching the strict JSON schema.
  `.trim(),

  // C. 🔁 BRRR Strategy
  BRRR_STRATEGY: (town, propertyType) => `
Focus on BRRR strategy for ${propertyType} in ${town}.
Provide:
- Purchase price range
- Refurb cost estimate
- Post-refurb valuation (GDV)
- Rent estimate
Calculate whether capital can be recycled perfectly and ideal deal conditions.
Include specific BRRR risks and deal rules. Return output matching the strict JSON schema.
  `.trim(),

  // D. 📍 Micro-Location Deep Dive
  MICRO_LOCATION: (town) => `
Analyse micro-locations within ${town}.
Break down:
- Best postcode areas for investment
- Rent differences by area
- Tenant demand indicators
- Areas improving vs declining
Output clear investor insights fitting into the micro_locations array.
  `.trim(),

  // E. ⚠️ Risk Detection
  RISK_DETECTION: (town, propertyType) => `
Identify risks for investing in ${propertyType} in ${town}.
Highlight:
- Market risks
- Tenant risks
- Liquidity issues
- Overvaluation risks
Be brutally honest and realistic. Populate the risks array in the output.
  `.trim()
};

/**
 * Combine necessary prompts based on the specific analysis goal.
 */
export const buildPromptChain = (town, propertyType, strategy) => {
  let chain = PROMPTS.CORE(town, propertyType) + '\n\nAdditional Context Requirements:\n\n';
  
  if (strategy === 'YIELD') chain += PROMPTS.YIELD_OPTIMISATION(town, propertyType) + '\n';
  if (strategy === 'FLIP') chain += PROMPTS.FLIP_STRATEGY(town, propertyType) + '\n';
  if (strategy === 'BRRR') chain += PROMPTS.BRRR_STRATEGY(town, propertyType) + '\n';

  chain += '\n' + PROMPTS.MICRO_LOCATION(town) + '\n';
  // Always include risk detection for safety
  chain += '\n' + PROMPTS.RISK_DETECTION(town, propertyType);

  return chain;
};

/*
  Example usage loop for the 37 prompts (11 towns x 3 types = 33 + variations):
  const towns = ['Ayr', 'Kilmarnock', 'Irvine', ...];
  const types = ['1-bed flat', '2-bed flat', '2-bed house'];
  
  for(let t of towns) {
      for(let p of types) {
          const prompt = buildPromptChain(t, p, 'BRRR');
          // send prompt to LLM -> get JSON -> store in DB
      }
  }
*/
