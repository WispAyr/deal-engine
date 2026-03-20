# Strategy Builder

Visual flow editor for configuring how the engine assigns investment strategies to market segments.

## Concepts

- **Input** — Segment data (yield, buy band, rent, data points)
- **Condition** — If-then: e.g. `yieldMax > 12` → true/false branches
- **Strategy** — Output: BTL, BRRR, Flip, HMO, SA, or custom

## Workflow

1. Open **Strategies** in the header
2. Connect: Input → Condition(s) → Strategy nodes
3. Condition **true** → one path (e.g. BRRR)
4. Condition **false** → next condition or default (e.g. BTL)
5. **Save** — persists to `strategy_flows.json`
6. **Default** — marks which flow `generateRealIntel` uses

## Condition Fields

| Field | Description |
|-------|-------------|
| Yield Max % | Upper yield for segment |
| Yield Min % | Lower yield |
| Buy Max £ | Upper buy price |
| Buy Min £ | Lower buy price |
| Rent Max £ | Upper rent PCM |
| Data Points | Number of comps |

## Operators

`>`, `>=`, `<`, `<=`, `=`

## Tips

- Order matters: first matching path wins
- Add multiple flows; set one as Default
- Delete flows from the dropdown → Delete
