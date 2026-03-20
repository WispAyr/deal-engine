const ShortlistPane = ({ shortlist, onRemove }) => {
  if (!shortlist.length) {
    return (
      <div className="no-data" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Your shortlist is empty</p>
        <p className="helper-text">Expand a property card and click the star to add deals to your shortlist.</p>
      </div>
    );
  }

  return (
    <div className="comps-pane" style={{ padding: '24px' }}>
      <div className="comps-table">
        <div className="table-header">
          <span className="col-address">DEAL</span>
          <span className="col-sold">PRICE</span>
          <span className="col-date">NOTES</span>
          <span style={{ width: 40 }}></span>
        </div>
        {shortlist.map(item => (
          <div className="table-row" key={item.id}>
            <div className="col-address">
              <a href={item.url} target="_blank" rel="noreferrer" style={{ color: 'white', textDecoration: 'none' }}>{item.address || item.title}</a>
              <span className="row-sub">{item.town} • {item.property_type} • {item.bedrooms} Beds</span>
            </div>
            <span className="col-sold cyan-label">£{item.price?.toLocaleString()}</span>
            <span className="col-date">{item.notes || '—'}</span>
            <button type="button" className="close-btn" onClick={() => onRemove(item.id)} aria-label="Remove">×</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortlistPane;
