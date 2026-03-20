const Header = ({ activeNav, onNav, search, onSearch, strategyFilter, onStrategyFilter, propTypeFilter, onPropTypeFilter, bedsFilter, onBedsFilter, countDisplay }) => {
  const navItems = [
    { name: 'Dashboard', icon: '📈' },
    { name: 'Towns', icon: '🏘️' },
    { name: 'Prompts', icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    { name: 'Shortlist', icon: '📋' },
    { name: 'Auctions', icon: '🔨' },
    { name: 'Bridge', icon: '🏗️' },
    { name: 'Comps', icon: '📊' },
    { name: 'Strategies', icon: '🔄' },
  ];

  return (
    <header className="top-nav">
      <div className="header-controls" style={{ width: '100%' }}>
        <nav style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {navItems.map(item => (
            <button
              key={item.name}
              className={`nav-btn ${activeNav === item.name ? 'active' : ''}`}
              onClick={() => onNav?.(item.name)}
            >
              <span className="icon">{item.icon}</span> {item.name}
            </button>
          ))}
        </nav>

        <div className="filters-bar" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flexGrow: 1, margin: 0, minWidth: 200 }}>
            <span className="search-icon" style={{ top: '8px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search towns, strategies, zones..."
              value={search || ''}
              onChange={(e) => onSearch?.(e.target.value)}
              style={{ maxWidth: '600px' }}
            />
          </div>
          <div className="dropdowns" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={strategyFilter || 'All'} onChange={(e) => onStrategyFilter?.(e.target.value)}>
              <option value="All">Strategy</option>
              <option value="BTL">BTL</option>
              <option value="BRRR">BRRR</option>
              <option value="Flip">Flip</option>
              <option value="HMO">HMO</option>
              <option value="SA">SA</option>
            </select>
            <select value={propTypeFilter || 'All'} onChange={(e) => onPropTypeFilter?.(e.target.value)}>
              <option value="All">Type</option>
              <option value="flat">Flat</option>
              <option value="house">House</option>
              <option value="detached">Detached</option>
              <option value="semi">Semi</option>
              <option value="terraced">Terraced</option>
            </select>
            <select value={bedsFilter || 'All'} onChange={(e) => onBedsFilter?.(e.target.value)}>
              <option value="All">#</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </select>
            <span className="count" style={{ paddingLeft: '8px', whiteSpace: 'nowrap' }}>{countDisplay}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
