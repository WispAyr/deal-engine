const IntelPane = ({ intel, salesUrl, rentsUrl }) => {
  if (!intel) return null;

  const buyMin = intel.buy_min ?? 0;
  const buyMax = intel.buy_max ?? 0;
  const whyWorks = intel.why_this_works?.[0] ?? `Buy band £${(buyMin / 1000).toFixed(0)}k–£${(buyMax / 1000).toFixed(0)}k with rent £${intel.rent_min ?? 0}–£${intel.rent_max ?? 0} PCM yields ${(intel.yield_min ?? 0).toFixed(1)}–${(intel.yield_max ?? 0).toFixed(1)}% — suitable for ${intel.strategy_primary}.`;

  return (
    <div className="pane active">
        <div className="models-grid">
            <div className="model-box">
                <h3>{intel.strategy_primary} STRATEGY</h3>
                <p>{whyWorks}</p>
            </div>
            <div className="model-box dark-accent">
                <h3>DEAL RULE</h3>
                <p>{intel.deal_rule}</p>
            </div>
        </div>

        <div className="zones-grid">
            <div className="zone-box">
                <h3>🔥 MICRO LOCATIONS</h3>
                {intel.micro_locations.map((loc, i) => (
                    <p key={i}><strong>{loc.area}:</strong> {loc.description ?? loc.notes ?? ''}</p>
                ))}
            </div>
            <div className="zone-box">
                <h3>⛔ RISKS</h3>
                {intel.risks.map((risk, i) => (
                    <p key={i}>• {risk}</p>
                ))}
            </div>
        </div>

        <a href={salesUrl || 'https://www.rightmove.co.uk/property-for-sale.html'} target="_blank" rel="noreferrer" className="action-btn outline-cyan" style={{ textDecoration: 'none', display: 'inline-block' }}>
            🔗 Browse Rightmove Sales
        </a>
        {rentsUrl && (
          <a href={rentsUrl} target="_blank" rel="noreferrer" className="action-btn outline-cyan" style={{ textDecoration: 'none', display: 'inline-block', marginLeft: 8 }}>
            🔗 Browse Rightmove Rentals
          </a>
        )}
    </div>
  );
};

export default IntelPane;
