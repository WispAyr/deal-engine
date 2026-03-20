import React, { useState } from 'react';

const MarketPane = ({ intel, ka8Stats, ka7Stats, listings, rentals, salesUrl, rentsUrl, town, propType }) => {
  const [activeSub, setActiveSub] = useState('overview');

  // Fallbacks if stats do not exist yet
  const fallbacks = {
    avg: 204355, 
    lower_quartile: 35000, 
    upper_quartile: 80000 
  };

  const townAvg = ka8Stats?.metrics?.avg_price || fallbacks.avg;
  const lq = ka8Stats?.metrics?.lower_quartile || fallbacks.lower_quartile;
  const uq = ka7Stats?.metrics?.upper_quartile || fallbacks.upper_quartile;

  const renderSaleComps = () => {
        return (
            <div className="comps-table">
              <div className="table-header">
                <span className="col-address">RIGHTMOVE LIVE LISTINGS</span>
                <span className="col-sold">PRICE</span>
                <span className="col-date">ADDED</span>
              </div>
              
              {listings && listings.length > 0 ? listings.slice(0, 5).map(listing => (
                  <div className="table-row" key={listing.id}>
                    <div className="col-address">
                      <span><a href={listing.url} target="_blank" rel="noreferrer" style={{color: 'white', textDecoration: 'none'}}>{listing.address.substring(0, 30)}</a></span>
                      <span className="row-sub">{listing.property_type} • {listing.bedrooms} Beds • {listing.estate_agent}</span>
                    </div>
                    <span className="col-sold cyan-label" style={{ fontWeight: '800' }}>£{listing.price.toLocaleString()}</span>
                    <span className="col-date">{new Date(listing.added_date).toLocaleDateString()}</span>
                  </div>
              )) : (
                  <div className="table-row">
                      <span className="col-address" style={{color: 'var(--text-muted)'}}>No live scraper data available for this market.</span>
                  </div>
              )}
            </div>
        );
    };

    const renderRentComps = () => {
        return (
            <div className="comps-table">
              <div className="table-header">
                <span className="col-address">RIGHTMOVE LIVE RENTALS</span>
                <span className="col-sold">RENT PCM</span>
                <span className="col-date">ADDED</span>
              </div>
              
              {rentals && rentals.length > 0 ? rentals.slice(0, 5).map(listing => (
                  <div className="table-row" key={listing.id}>
                    <div className="col-address">
                      <span><a href={listing.url} target="_blank" rel="noreferrer" style={{color: 'white', textDecoration: 'none'}}>{listing.address.substring(0, 30)}</a></span>
                      <span className="row-sub">{listing.property_type} • {listing.bedrooms} Beds • {listing.estate_agent}</span>
                    </div>
                    <span className="col-sold cyan-label" style={{ fontWeight: '800' }}>£{listing.price.toLocaleString()}</span>
                    <span className="col-date">{new Date(listing.added_date).toLocaleDateString()}</span>
                  </div>
              )) : (
                  <div className="table-row">
                      <span className="col-address" style={{color: 'var(--text-muted)'}}>No live scraper rentals available for this market.</span>
                  </div>
              )}
            </div>
        );
    };

  return (
    <div className="pane active">
        <div className="tabs secondary-tabs">
            <button className={`sub-tab-btn ${activeSub === 'overview' ? 'active' : ''}`} onClick={() => setActiveSub('overview')}>Overview</button>
            <button className={`sub-tab-btn ${activeSub === 'sale-comps' ? 'active' : ''}`} onClick={() => setActiveSub('sale-comps')}>Sale Comps</button>
            <button className={`sub-tab-btn ${activeSub === 'rent-comps' ? 'active' : ''}`} onClick={() => setActiveSub('rent-comps')}>Rent Comps</button>
        </div>
        
        <div className="sub-contents">
            {activeSub === 'overview' && (
              <div className="sub-pane active">
                  <h3 className="pane-title">📊 MARKET OVERVIEW — {town || 'Ayr'} · {(propType || '1-bed flat').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  <div className="market-grid">
                      <div className="stat-box">
                          <span className="stat-label">TOWN AVG (REAL)</span>
                          <span className="stat-value">£{townAvg.toLocaleString()}</span>
                      </div>
                      <div className="stat-box">
                          <span className="stat-label">YOY GROWTH</span>
                          <span className="stat-value green">+6.8%</span>
                      </div>
                      <div className="stat-box">
                          <span className="stat-label">DAYS TO SOLD</span>
                          <span className="stat-value">28</span>
                      </div>
                      <div className="stat-box">
                          <span className="stat-label">TOTAL TXN VOLUME</span>
                          <span className="stat-value">~960/yr</span>
                      </div>
                      <div className="stat-box col-span-2">
                          <span className="stat-label">1-BED FLATS TXN</span>
                          <span className="stat-value cyan">140-165/yr (12-14/mo)</span>
                      </div>
                      <div className="stat-box inline-split">
                          <span className="stat-label">BUY BAND (QUARTILES)</span>
                          <span className="stat-value">
                            £{(lq/1000).toFixed(0)}-£{(uq/1000).toFixed(0)}k 
                            <span className="subtext">(KA8 £{(lq/1000).toFixed(0)}k, KA7 £{(uq/1000).toFixed(0)}k)</span>
                          </span>
                      </div>
                      <div className="stat-box inline-split">
                          <span className="stat-label">RENT RANGE</span>
                          <span className="stat-value">£{intel?.rent_min || 450}-£{intel?.rent_max || 625} <span className="subtext">(conservative £475, realistic £525)</span></span>
                      </div>
                      <div className="stat-box full-width">
                          <span className="stat-label">GROSS YIELD</span>
                          <span className="stat-value cyan">9-14% KA8; 7-8% KA7</span>
                      </div>
                  </div>

                  <div className="context-box">
                      <h3 className="box-label">🏗️ REGENERATION & CONTEXT</h3>
                      <p>Repopulating Ayr Town Centre + Living Well Village. South Harbour = largest empty homes cluster.</p>
                  </div>

                  <a href={salesUrl || 'https://www.rightmove.co.uk/property-for-sale.html'} target="_blank" rel="noreferrer" className="action-btn outline-cyan" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      🔗 Browse Live Sales — {town || 'Ayr'}
                  </a>
                  {rentsUrl && (
                    <a href={rentsUrl} target="_blank" rel="noreferrer" className="action-btn outline-cyan" style={{ textDecoration: 'none', display: 'inline-block', marginLeft: 8 }}>
                      🔗 Browse Live Rentals
                    </a>
                  )}
              </div>
            )}

            {/* Sale / Rent Comps abbreviated for UI flow */}
            {activeSub === 'sale-comps' && (
              <div className="sub-pane active">
                  <p className="helper-text">Live Rightmove listings mapping for the target area — use to calibrate instant market sentiment instead of lagging indicators.</p>
                  <p className="helper-text"><em>Hooked to Native Next.js Scraper API — {listings ? `${listings.length} live database records injected.` : 'No data yet.'}</em></p>
                  {renderSaleComps()}
              </div>
            )}
            
            {activeSub === 'rent-comps' && (
              <div className="sub-pane active">
                  <p className="helper-text">Live Rightmove listings mapping for active rentals — use to calibrate exactly what yield you can achieve today.</p>
                  {renderRentComps()}
              </div>
            )}
        </div>
    </div>
  );
};

export default MarketPane;
