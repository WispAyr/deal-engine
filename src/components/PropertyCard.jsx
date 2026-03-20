import { useState } from 'react';
import IntelPane from './IntelPane';
import MarketPane from './MarketPane';

const RIGHTMOVE_REGIONS = { Ayr: '74', Kilmarnock: '740', Irvine: '690' };

const StrategyPane = ({ type, intel }) => {
  const content = {
    BTR: { title: 'Build to Rent', desc: 'New-build or conversion for institutional rental. Higher capex, stable yield.', tips: ['Target sites with planning for multi-unit', 'Yield 5–7% typical for BTR'] },
    BTF: { title: 'Build to Flip', desc: 'Develop, sell on completion. Requires development experience.', tips: ['Margin 15–25% on GDV', 'Control build costs'] },
    BRRR: { title: 'Buy Rehab Rent Refinance', desc: 'Buy below market, renovate, rent, refinance to recycle capital.', tips: ['Target: add 20%+ value', 'Refinance at 75% LTV to pull out equity'] },
    HMO: { title: 'House in Multiple Occupation', desc: 'Let individual rooms to multiple tenants. Higher yield, more management.', tips: ['Check local HMO licensing', '4+ beds often requires licence', 'Higher yield, higher turnover'] },
    SA: { title: 'Serviced Accommodation', desc: 'Short-term lets (Airbnb etc). Tourist areas suit best.', tips: ['Strong in Ayr, Troon, Prestwick', 'Higher yield but seasonal', 'Consider furniture & compliance'] },
  };
  const c = content[type] || {};
  const isRelevant = intel?.strategy_primary === type;
  return (
    <div className="pane active">
      <h3>{type} STRATEGY</h3>
      <p className="helper-text">{c.desc}</p>
      <ul>{c.tips?.map((t, i) => <li key={i}>{t}</li>)}</ul>
      {isRelevant && <p className="helper-text" style={{ marginTop: 12 }}>✓ This market suits {type} — see Intel tab.</p>}
    </div>
  );
};

const PropertyCard = ({ id, rank, title, yieldText, icon, tags, stats, banner, expanded, onExpand, onClose, onShortlistAdd, intel, ka8Stats, ka7Stats, listings, rentals, town, propType }) => {
  const [activeTab, setActiveTab] = useState('intel');
  const regionId = town && RIGHTMOVE_REGIONS[town] ? RIGHTMOVE_REGIONS[town] : '74';
  const salesUrl = `https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION^${regionId}`;
  const rentsUrl = `https://www.rightmove.co.uk/property-to-rent/find.html?locationIdentifier=REGION^${regionId}`;

  if (!expanded) {
    return (
      <article className="property-card" id={`card-${id}`} onClick={onExpand} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onExpand?.()}>
          <div className="card-top">
              <div className="card-top-left">
                  <span className="rank-id">#{rank}</span>
                  <span className="emoji-icon">{icon}</span>
              </div>
              <div className="card-top-right">
                  <span className="pill cyan-solid">{yieldText}</span>
              </div>
          </div>

          <div className="card-header">
              <h2>{title}</h2>
              <div className="tags">
                  {tags.map(t => <span key={t} className="pill cyan-bg">{t}</span>)}
              </div>
          </div>

          <div className="core-stats">
              {stats.map(s => (
                <div key={s.label} className="stat-box">
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-value">{s.value}</span>
                </div>
              ))}
          </div>

          <div className="info-banner">
              <span className="icon">⬆️</span> {banner}
          </div>
      </article>
    );
  }

  return (
    <article className="property-card active" id={`card-${id}`}>
        <div className="card-top">
            <div className="card-top-left">
                <span className="rank-id">#{rank}</span>
                <span className="emoji-icon">{icon}</span>
            </div>
            <div className="card-top-right">
                {onShortlistAdd && (
                  <button type="button" className="shortlist-btn" onClick={(e) => { e.stopPropagation(); onShortlistAdd(); }} title="Add to shortlist">★</button>
                )}
                <span className="pill cyan-solid">{yieldText}</span>
                <button className="close-btn" type="button" onClick={(e) => { e.stopPropagation(); onClose?.(); }} aria-label="Close">×</button>
            </div>
        </div>

        <div className="card-header">
            <h2>{title}</h2>
            <div className="tags">
                {tags.map(t => <span key={t} className="pill cyan-bg">{t}</span>)}
            </div>
        </div>

        <div className="core-stats">
            {stats.map(s => (
              <div key={s.label} className="stat-box">
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-value">{s.value}</span>
              </div>
            ))}
        </div>

        <div className="info-banner">
            <span className="icon">⬆️</span> {banner}
        </div>

        <div className="tabs primary-tabs">
            <button className={`tab-btn ${activeTab === 'intel' ? 'active' : ''}`} onClick={() => setActiveTab('intel')}>Intel</button>
            <button className={`tab-btn has-icon ${activeTab === 'mkt' ? 'active' : ''}`} onClick={() => setActiveTab('mkt')}>
                <span className="chart-icon">📊</span> Mkt
            </button>
            <button className={`tab-btn ${activeTab === 'btr' ? 'active' : ''}`} onClick={() => setActiveTab('btr')}>🏠 BTR</button>
            <button className={`tab-btn ${activeTab === 'btf' ? 'active' : ''}`} onClick={() => setActiveTab('btf')}>⚡ BTF</button>
            <button className={`tab-btn ${activeTab === 'brrr' ? 'active' : ''}`} onClick={() => setActiveTab('brrr')}>🔄 BRRR</button>
            <button className={`tab-btn ${activeTab === 'hmo' ? 'active' : ''}`} onClick={() => setActiveTab('hmo')}>🏠 HMO</button>
            <button className={`tab-btn ${activeTab === 'sa' ? 'active' : ''}`} onClick={() => setActiveTab('sa')}>📅 SA</button>
        </div>

        <div className="tab-contents">
            {activeTab === 'intel' && intel && <IntelPane intel={intel} salesUrl={salesUrl} rentsUrl={rentsUrl} town={town} propType={propType} />}
            {activeTab === 'mkt' && <MarketPane intel={intel} ka8Stats={ka8Stats} ka7Stats={ka7Stats} listings={listings} rentals={rentals} salesUrl={salesUrl} rentsUrl={rentsUrl} town={town} propType={propType} />}
            {activeTab === 'btr' && intel && <StrategyPane type="BTR" intel={intel} />}
            {activeTab === 'btf' && intel && <StrategyPane type="BTF" intel={intel} />}
            {activeTab === 'brrr' && intel && <StrategyPane type="BRRR" intel={intel} />}
            {activeTab === 'hmo' && intel && <StrategyPane type="HMO" intel={intel} />}
            {activeTab === 'sa' && intel && <StrategyPane type="SA" intel={intel} />}
        </div>
    </article>
  );
};

export default PropertyCard;
