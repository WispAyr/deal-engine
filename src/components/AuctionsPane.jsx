const AuctionsPane = ({ listings, search, propTypeFilter, bedsFilter, onShortlistAdd }) => {
  const matches = (item) => {
    const s = (search || '').toLowerCase();
    const pt = (propTypeFilter || '').toLowerCase();
    const addr = (item.address || '').toLowerCase();
    const town = (item.town || '').toLowerCase();
    const summary = (item.summary || '').toLowerCase();
    const propType = (item.property_type || '').toLowerCase();
    let ok = true;
    if (s && !addr.includes(s) && !town.includes(s) && !summary.includes(s)) ok = false;
    if (pt && pt !== 'all' && !propType.includes(pt)) ok = false;
    if (bedsFilter && bedsFilter !== 'All') {
      const b = parseInt(bedsFilter);
      if (b === 4 ? (item.bedrooms || 0) < 4 : (item.bedrooms || 0) !== b) ok = false;
    }
    return ok;
  };

  const auctionListings = listings.filter(l =>
    (l.summary || '').toLowerCase().includes('auction') ||
    (l.features || []).some(f => (f.description || '').toLowerCase().includes('auction'))
  );
  const filtered = auctionListings.filter(matches);

  return (
    <div className="comps-pane" style={{ padding: '24px' }}>
      <p className="helper-text" style={{ marginBottom: 16 }}>Properties listed for auction. Data from Rightmove.</p>
      <div className="comps-table">
        <div className="table-header">
          <span className="col-address">ADDRESS</span>
          <span className="col-sold">GUIDE PRICE</span>
          <span className="col-date">TOWN</span>
          {onShortlistAdd && <span style={{ width: 40 }}></span>}
        </div>
        {filtered.length === 0 ? (
          <div className="table-row"><span className="col-address" style={{ color: 'var(--text-muted)' }}>No auction listings found</span></div>
        ) : (
          filtered.map(item => (
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

export default AuctionsPane;
