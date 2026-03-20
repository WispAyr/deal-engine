import { useState } from 'react';

const inferStrategy = (item, intelData) => {
  const town = item.town;
  if (!town || !intelData?.[town]) return null;
  const pt = (item.property_type || '').toLowerCase();
  const beds = item.bedrooms || 1;
  const typeKey = pt.includes('flat') ? 'flat' : 'house';
  const segment = `${Math.min(beds, 4)}-bed ${typeKey}`;
  const intel = intelData[town][segment];
  return intel?.strategy_primary ?? null;
};

const CompsPane = ({ listings, rentals, intelData, search, strategyFilter, propTypeFilter, bedsFilter, onShortlistAdd }) => {
  const [tab, setTab] = useState('sales');

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
    if (strategyFilter && strategyFilter !== 'All') {
      const itemStrategy = inferStrategy(item, intelData);
      if (itemStrategy !== null && itemStrategy !== strategyFilter) ok = false;
    }
    return ok;
  };

  const filteredListings = listings.filter(matches);
  const filteredRentals = rentals.filter(matches);
  const data = tab === 'sales' ? filteredListings : filteredRentals;

  return (
    <div className="comps-pane" style={{ padding: '24px' }}>
      <div className="tabs secondary-tabs" style={{ marginBottom: 16 }}>
        <button className={`sub-tab-btn ${tab === 'sales' ? 'active' : ''}`} onClick={() => setTab('sales')}>Sales ({filteredListings.length})</button>
        <button className={`sub-tab-btn ${tab === 'rentals' ? 'active' : ''}`} onClick={() => setTab('rentals')}>Rentals ({filteredRentals.length})</button>
      </div>
      <div className="comps-table">
        <div className="table-header">
          <span className="col-address">ADDRESS</span>
          <span className="col-sold">{tab === 'sales' ? 'PRICE' : 'RENT PCM'}</span>
          <span className="col-date">TOWN</span>
          <span className="col-date">TYPE</span>
          {onShortlistAdd && <span style={{ width: 40 }}></span>}
        </div>
        {data.length === 0 ? (
          <div className="table-row"><span className="col-address" style={{ color: 'var(--text-muted)' }}>No matches</span></div>
        ) : (
          data.map(item => (
            <div className="table-row" key={item.id}>
              <div className="col-address">
                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'none' }}>{item.address?.substring(0, 50) || item.id}</a>
                <span className="row-sub">{item.property_type} • {item.bedrooms} Beds</span>
              </div>
              <span className="col-sold cyan-label" style={{ fontWeight: 700 }}>£{item.price?.toLocaleString()}</span>
              <span className="col-date">{item.town}</span>
              <span className="col-date">{item.property_type}</span>
              {onShortlistAdd && <button type="button" className="shortlist-btn" onClick={() => onShortlistAdd(item)} title="Add to shortlist">★</button>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CompsPane;
