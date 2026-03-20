const BRIDGE_KEYWORDS = ['development', 'plot', 'land', 'renovation', 'investment', 'refurbishment', 'needs work', 'potential', 'planning'];

const BridgePane = ({ listings, search, propTypeFilter, bedsFilter, onShortlistAdd }) => {
  const matches = (item) => {
    const s = (search || '').toLowerCase();
    const pt = (propTypeFilter || '').toLowerCase();
    const addr = (item.address || '').toLowerCase();
    const town = (item.town || '').toLowerCase();
    const summary = (item.summary || '').toLowerCase();
    const propType = (item.property_type || '').toLowerCase();
    const features = (item.features || []).map(f => (f.description || '').toLowerCase()).join(' ');
    let ok = true;
    if (s && !addr.includes(s) && !town.includes(s) && !summary.includes(s) && !features.includes(s)) ok = false;
    if (pt && pt !== 'all' && !propType.includes(pt)) ok = false;
    if (bedsFilter && bedsFilter !== 'All') {
      const b = parseInt(bedsFilter);
      if (b === 4 ? (item.bedrooms || 0) < 4 : (item.bedrooms || 0) !== b) ok = false;
    }
    return ok;
  };

  const bridgeListings = listings.filter(l => {
    const text = ((l.summary || '') + ' ' + (l.features || []).map(f => f.description || '').join(' ')).toLowerCase();
    return BRIDGE_KEYWORDS.some(kw => text.includes(kw));
  });
  const filtered = bridgeListings.filter(matches);
  const fallback = filtered.length === 0 ? listings.filter(matches) : filtered;
  const showingFallback = filtered.length === 0 && fallback.length > 0;

  return (
    <div className="comps-pane" style={{ padding: '24px' }}>
      <p className="helper-text" style={{ marginBottom: 16 }}>
        Properties suited to bridge finance: development, refurbishment, land, investment potential.
        {showingFallback && ' No bridge-suitable matches; showing all listings.'}
      </p>
      <div className="comps-table">
        <div className="table-header">
          <span className="col-address">ADDRESS</span>
          <span className="col-sold">PRICE</span>
          <span className="col-date">TOWN</span>
          {onShortlistAdd && <span style={{ width: 40 }}></span>}
        </div>
        {fallback.length === 0 ? (
          <div className="table-row"><span className="col-address" style={{ color: 'var(--text-muted)' }}>No listings found</span></div>
        ) : (
          fallback.map(item => (
            <div className="table-row" key={item.id}>
              <div className="col-address">
                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'none' }}>{item.address?.substring(0, 50) || item.id}</a>
                <span className="row-sub">{item.property_type} • {item.bedrooms} Beds</span>
              </div>
              <span className="col-sold cyan-label" style={{ fontWeight: 700 }}>£{item.price?.toLocaleString()}</span>
              <span className="col-date">{item.town}</span>
              {onShortlistAdd && <button type="button" className="shortlist-btn" onClick={() => onShortlistAdd(item)} title="Add to shortlist">★</button>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BridgePane;
