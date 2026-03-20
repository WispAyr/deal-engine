import { useMemo } from 'react';
import { AYRSHIRE_TOWNS, TOWN_NAMES } from '../data/ayrshireTowns';

const RIGHTMOVE_BASE = 'https://www.rightmove.co.uk/property-for-sale';

function TownCard({ town, meta, current, history }) {
  const info = AYRSHIRE_TOWNS[town] || {};
  const rightmoveUrl = info.region
    ? `${RIGHTMOVE_BASE}/find.html?locationIdentifier=${encodeURIComponent(info.region)}`
    : null;

  const historyPoints = useMemo(() => {
    if (!history?.length) return [];
    return history
      .map((h) => {
        const t = h.towns?.[town];
        if (!t?.avgSale) return null;
        return { date: h.date, avgSale: t.avgSale, avgRent: t.avgRent };
      })
      .filter(Boolean);
  }, [history, town]);

  return (
    <div
      className="town-info-card"
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border-subtle)',
        padding: 20,
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', margin: 0, marginBottom: 4 }}>{town}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{info.area} · {info.postcode}</span>
        </div>
        {rightmoveUrl && (
          <a
            href={rightmoveUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--accent-cyan)' }}
          >
            Browse Rightmove →
          </a>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Avg Sale Price</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {current?.avgSale ? `£${(current.avgSale / 1000).toFixed(0)}k` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Avg Rent PCM</div>
          <div style={{ fontWeight: 700 }}>
            {current?.avgRent ? `£${current.avgRent}` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Price Band</div>
          <div style={{ fontSize: 13 }}>
            {current?.lowerQuartile && current?.upperQuartile
              ? `£${(current.lowerQuartile / 1000).toFixed(0)}k–£${(current.upperQuartile / 1000).toFixed(0)}k`
              : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Listings</div>
          <div style={{ fontSize: 13 }}>
            {current ? `${current.salesCount} sales · ${current.rentalsCount} rentals` : '—'}
          </div>
        </div>
      </div>

      {historyPoints.length >= 2 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Avg sale price over time</div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              alignItems: 'flex-end',
              height: 60,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {historyPoints.map((p, i) => {
              const max = Math.max(...historyPoints.map((x) => x.avgSale));
              const h = max > 0 ? Math.max(8, (p.avgSale / max) * 50) : 8;
              return (
                <div
                  key={p.date}
                  title={`${p.date}: £${(p.avgSale / 1000).toFixed(0)}k`}
                  style={{
                    flex: 1,
                    minWidth: 24,
                    height: h,
                    background: 'var(--accent-cyan)',
                    borderRadius: 4,
                    opacity: 0.8,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>{historyPoints[0]?.date}</span>
            <span>{historyPoints[historyPoints.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TownsInfoPane({ listings = [], rentals = [], statsData = {}, priceHistory = [] }) {
  const townStats = useMemo(() => {
    const out = {};
    for (const town of TOWN_NAMES) {
      const info = AYRSHIRE_TOWNS[town];
      if (!info) continue;
      const postcode = info.postcode;
      const townSales = listings.filter((l) => l.town === town && l.price > 0);
      const townRentals = rentals.filter((r) => r.town === town && r.price > 0);
      const salePrices = townSales.map((s) => s.price);
      const rentPrices = townRentals.map((r) => r.price);

      const flatStats = statsData[`${postcode}_flat`];
      const houseStats = statsData[`${postcode}_house`];

      const avgSale = salePrices.length
        ? Math.round(salePrices.reduce((a, b) => a + b, 0) / salePrices.length)
        : flatStats?.metrics?.avg_price || houseStats?.metrics?.avg_price || null;
      const avgRent = rentPrices.length
        ? Math.round(rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length)
        : null;

      out[town] = {
        avgSale,
        avgRent,
        salesCount: townSales.length,
        rentalsCount: townRentals.length,
        lowerQuartile: flatStats?.metrics?.lower_quartile || houseStats?.metrics?.lower_quartile || null,
        upperQuartile: flatStats?.metrics?.upper_quartile || houseStats?.metrics?.upper_quartile || null,
      };
    }
    return out;
  }, [listings, rentals, statsData]);

  const areas = useMemo(() => {
    const map = {};
    for (const town of TOWN_NAMES) {
      const area = AYRSHIRE_TOWNS[town]?.area || 'Other';
      if (!map[area]) map[area] = [];
      map[area].push(town);
    }
    return map;
  }, []);

  return (
    <div className="towns-info-pane" style={{ padding: 24 }}>
      <p className="helper-text" style={{ marginBottom: 24 }}>
        Town-level market stats from live listings. Price history builds over time as you run sync.
      </p>

      {Object.entries(areas).map(([area, towns]) => (
        <div key={area} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {area}
          </h2>
          {towns.map((town) => (
            <TownCard
              key={town}
              town={town}
              meta={AYRSHIRE_TOWNS[town]}
              current={townStats[town]}
              history={priceHistory}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
