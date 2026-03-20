# Market Intel

## What It Shows

Per town × property type (e.g. Ayr 2-bed flat):

- **Buy band** — Lower/upper quartile or target range (£)
- **Rent PCM** — Min–max monthly rent
- **Yield** — Rent/price as %
- **Strategy** — BTL, BRRR, Flip, HMO, SA
- **Deal rule** — e.g. "Buy under £45k if rent exceeds £500"
- **Confidence** — High/Medium (based on data volume)

## Data Sources

- **Buy band** — `market_stats.json` (from scrapers or Land Registry)
- **Rent** — Live rentals from scrapers
- **Strategy** — Strategy Builder flow or built-in rules

## Strategies

| Strategy | When Used |
|----------|-----------|
| BTL | Steady yield, income focus |
| BRRR | High yield, refinance potential |
| Flip | Higher price bands, quick sale |
| HMO | 4+ beds, multi-let |
| SA | Short-term, tourist areas |
