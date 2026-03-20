import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import PropertyCard from './components/PropertyCard';
import Sidebar from './components/Sidebar';
import AdminDashboard from './components/AdminDashboard';
import StrategyBuilderPane from './components/StrategyBuilder/StrategyBuilderPane';
import CompsPane from './components/CompsPane';
import AuctionsPane from './components/AuctionsPane';
import BridgePane from './components/BridgePane';
import ShortlistPane from './components/ShortlistPane';
import TownsInfoPane from './components/TownsInfoPane';
import Dashboard from './components/Dashboard';
import { useShortlist } from './hooks/useShortlist';
import { useAuth } from './contexts/AuthContext';
import LoginModal from './components/LoginModal';
import MarketingPage from './components/MarketingPage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOWN_POSTCODE = { Ayr: 'KA8', Kilmarnock: 'KA1', Irvine: 'KA11' };

function App() {
  const [intelData, setIntelData] = useState({});
  const [statsData, setStatsData] = useState({});
  const [listingsData, setListingsData] = useState([]);
  const [rentalsData, setRentalsData] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [zooplaSyncing, setZooplaSyncing] = useState(false);
  const [donaldRossSyncing, setDonaldRossSyncing] = useState(false);
  const [landRegistrySyncing, setLandRegistrySyncing] = useState(false);
  const [adminSyncError, setAdminSyncError] = useState(null);

  const [activeTown, setActiveTown] = useState('Ayr');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [search, setSearch] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('All');
  const [propTypeFilter, setPropTypeFilter] = useState('All');
  const [bedsFilter, setBedsFilter] = useState('All');

  const navigate = useNavigate();
  const { items: shortlist, add: addToShortlist, remove: removeFromShortlist } = useShortlist();
  const { apiFetch, showLogin, setShowLogin, login, register, userMode } = useAuth();
  const [loginError, setLoginError] = useState(null);

  const handleNav = (name) => {
    setActiveNav(name);
    navigate('/app');
  };
  const availableTowns = intelData && Object.keys(intelData).length ? Object.keys(intelData) : ['Ayr'];

  const refetch = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/api/intel`),
      fetch(`${API_BASE}/api/stats`),
      fetch(`${API_BASE}/api/listings`),
      fetch(`${API_BASE}/api/rentals`),
      fetch(`${API_BASE}/api/price-history`)
    ]).then(([a, b, c, d, e]) => Promise.all([a.json(), b.json(), c.json(), d.json(), e.json()]))
      .then(([intel, stats, listings, rentals, history]) => {
        setIntelData(intel);
        setStatsData(stats);
        setListingsData(Array.isArray(listings) ? listings : []);
        setRentalsData(Array.isArray(rentals) ? rentals : []);
        setPriceHistory(Array.isArray(history) ? history : []);
      }).catch(() => {}).finally(() => setLoading(false));
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/sync`, { method: 'POST' });
      if (res.ok) refetch();
    } finally { setSyncing(false); }
  };

  const runZooplaSync = async () => {
    setZooplaSyncing(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/sync/zoopla`, { method: 'POST' });
      if (res.ok) refetch();
    } finally { setZooplaSyncing(false); }
  };

  const runDonaldRossSync = async () => {
    setDonaldRossSyncing(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/sync/donaldross`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) refetch();
      else throw new Error(data.error || `HTTP ${res.status}`);
    } catch (err) {
      setAdminSyncError(err.message || 'Sync failed');
    } finally { setDonaldRossSyncing(false); }
  };

  const runLandRegistrySync = async () => {
    setLandRegistrySyncing(true);
    setAdminSyncError(null);
    try {
      const res = await apiFetch(`${API_BASE}/api/sync/landregistry`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) refetch();
      else throw new Error(data.error || `HTTP ${res.status}`);
    } catch (err) {
      setAdminSyncError(err.message || 'Sync failed');
    } finally { setLandRegistrySyncing(false); }
  };

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        setLoading(true);
        setError(null);
        const [intelRes, statsRes, listingsRes, rentalsRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/api/intel`),
          fetch(`${API_BASE}/api/stats`),
          fetch(`${API_BASE}/api/listings`),
          fetch(`${API_BASE}/api/rentals`),
          fetch(`${API_BASE}/api/price-history`)
        ]);

        if (!intelRes.ok || !statsRes.ok) throw new Error('API request failed');

        const intelJson = await intelRes.json();
        const statsJson = await statsRes.json();
        const listingsJson = await listingsRes.json();
        const rentalsJson = await rentalsRes.json();
        const historyJson = await historyRes.json();

        setIntelData(intelJson);
        setStatsData(statsJson);
        setListingsData(Array.isArray(listingsJson) ? listingsJson : []);
        setRentalsData(Array.isArray(rentalsJson) ? rentalsJson : []);
        setPriceHistory(Array.isArray(historyJson) ? historyJson : []);
      } catch (err) {
        console.error("Failed to connect to backend", err);
        setError(err.message || 'Backend unavailable. Run: npm run start-server');
      } finally {
        setLoading(false);
      }
    };

    fetchDatabase();
  }, []);

  const townListings = listingsData.filter(l => l.town === activeTown);
  const townRentals = rentalsData.filter(r => r.town === activeTown);

  const filterPrompts = (townIntel) => {
    const entries = Object.entries(townIntel || {});
    return entries.filter(([propType, intel]) => {
      const s = (search || '').toLowerCase();
      const pt = (propTypeFilter || '').toLowerCase();
      if (s && !activeTown.toLowerCase().includes(s) && !propType.toLowerCase().includes(s) && !(intel.strategy_primary || '').toLowerCase().includes(s)) return false;
      if (strategyFilter !== 'All' && intel.strategy_primary !== strategyFilter) return false;
      if (pt && pt !== 'all' && !propType.toLowerCase().includes(pt)) return false;
      if (bedsFilter !== 'All') {
        const bedNum = parseInt(propType, 10) || 0;
        if (bedsFilter === '4') { if (bedNum < 4) return false; }
        else if (bedNum !== parseInt(bedsFilter, 10)) return false;
      }
      return true;
    });
  };

  const getCountDisplay = () => {
    if (activeNav === 'Dashboard') return `${listingsData.length + rentalsData.length}`;
    if (activeNav === 'Towns') return `${Object.keys(intelData).length || 12}`;
    if (activeNav === 'Shortlist') return `${shortlist.length}`;
    if (activeNav === 'Comps') {
      const inferStrategy = (item) => {
        const town = item.town;
        if (!town || !intelData?.[town]) return null;
        const pt = (item.property_type || '').toLowerCase();
        const beds = item.bedrooms || 1;
        const typeKey = pt.includes('flat') ? 'flat' : 'house';
        const segment = `${Math.min(beds, 4)}-bed ${typeKey}`;
        const intel = intelData[town]?.[segment];
        return intel?.strategy_primary ?? null;
      };
      const matches = (item) => {
        const s = (search || '').toLowerCase();
        const pt = (propTypeFilter || '').toLowerCase();
        if (s && !((item.address || '') + (item.town || '') + (item.summary || '')).toLowerCase().includes(s)) return false;
        if (pt && pt !== 'all' && !(item.property_type || '').toLowerCase().includes(pt)) return false;
        if (bedsFilter && bedsFilter !== 'All') {
          const b = parseInt(bedsFilter);
          if (b === 4 ? (item.bedrooms || 0) < 4 : (item.bedrooms || 0) !== b) return false;
        }
        if (strategyFilter && strategyFilter !== 'All') {
          const itemStrategy = inferStrategy(item);
          if (itemStrategy !== null && itemStrategy !== strategyFilter) return false;
        }
        return true;
      };
      const fl = listingsData.filter(matches);
      const fr = rentalsData.filter(matches);
      return `${fl.length + fr.length}/${listingsData.length + rentalsData.length}`;
    }
    if (activeNav === 'Auctions') {
      const au = listingsData.filter(l => (l.summary || '').toLowerCase().includes('auction'));
      return `${au.length}`;
    }
    if (activeNav === 'Bridge') {
      const bridgeKw = ['development', 'plot', 'land', 'renovation', 'investment', 'refurbishment', 'needs work', 'potential', 'planning'];
      const matches = (l) => {
        const pt = (propTypeFilter || '').toLowerCase();
        if (pt && pt !== 'all' && !(l.property_type || '').toLowerCase().includes(pt)) return false;
        if (bedsFilter && bedsFilter !== 'All') {
          const b = parseInt(bedsFilter);
          if (b === 4 ? (l.bedrooms || 0) < 4 : (l.bedrooms || 0) !== b) return false;
        }
        const s = (search || '').toLowerCase();
        if (s && !(l.address + l.town + (l.summary || '')).toLowerCase().includes(s)) return false;
        return true;
      };
      const br = listingsData.filter(l => {
        const text = ((l.summary || '') + ' ' + (l.features || []).map(f => f.description || '').join(' ')).toLowerCase();
        return bridgeKw.some(k => text.includes(k)) && matches(l);
      });
      const all = listingsData.filter(matches);
      return br.length > 0 ? `${br.length}` : `${all.length}`;
    }
    if (activeNav === 'Strategies') return 'Flow';
    const townIntel = intelData[activeTown];
    const filtered = filterPrompts(townIntel);
    const total = townIntel ? Object.keys(townIntel).length : 0;
    return `${filtered.length}/${total}`;
  };

  const FeedContent = () => {
    if (loading) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shimmer-container">
          <div className="shimmer-card"></div>
          <div className="shimmer-card" style={{ animationDelay: '0.1s' }}></div>
        </motion.div>
      );
    }

    if (error) {
      return (
        <div className="no-data" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚠️ Backend offline</p>
          <p>{error}</p>
        </div>
      );
    }

    const townIntel = intelData[activeTown];

    if (activeNav === 'Towns') {
      return (
        <TownsInfoPane
          listings={listingsData}
          rentals={rentalsData}
          statsData={statsData}
          priceHistory={priceHistory}
        />
      );
    }
    if (activeNav === 'Dashboard') {
      return (
        <Dashboard
          intelData={intelData}
          statsData={statsData}
          listings={listingsData}
          rentals={rentalsData}
          shortlistCount={shortlist.length}
        />
      );
    }
    if (activeNav === 'Shortlist') {
      return <ShortlistPane shortlist={shortlist} onRemove={removeFromShortlist} />;
    }
    if (activeNav === 'Comps') {
      return <CompsPane listings={listingsData} rentals={rentalsData} intelData={intelData} search={search} strategyFilter={strategyFilter} propTypeFilter={propTypeFilter} bedsFilter={bedsFilter} onShortlistAdd={addToShortlist} />;
    }
    if (activeNav === 'Auctions') {
      return <AuctionsPane listings={listingsData} search={search} propTypeFilter={propTypeFilter} bedsFilter={bedsFilter} onShortlistAdd={addToShortlist} />;
    }
    if (activeNav === 'Bridge') {
      return <BridgePane listings={listingsData} search={search} propTypeFilter={propTypeFilter} bedsFilter={bedsFilter} onShortlistAdd={addToShortlist} />;
    }
    if (activeNav === 'Strategies') {
      return <StrategyBuilderPane />;
    }

    if (!townIntel) {
      return <div className="no-data">No AI intel generated for {activeTown} yet. Run: <code>node scripts/generateRealIntel.js</code></div>;
    }

    const filteredEntries = filterPrompts(townIntel);
    return filteredEntries.map(([propType, intel], index) => {
      const typeKey = propType.split('-')[1].split(' ')[0];
      const postcode = TOWN_POSTCODE[activeTown] || 'KA8';
      const stats = statsData[`${postcode}_${typeKey}`] || statsData[`KA7_${typeKey}`] || null;

      // Extract real Buy Band from HM Land Registry
      const lqStr = stats?.metrics?.lower_quartile ? (stats.metrics.lower_quartile/1000).toFixed(0) : (intel.buy_min/1000).toFixed(0);
      const uqStr = stats?.metrics?.upper_quartile ? (stats.metrics.upper_quartile/1000).toFixed(0) : (intel.buy_max/1000).toFixed(0);
      
      // Extract real Rent PCM from Live Rightmove Scraper
      const typeLabel = propType.split('-')[1].split(' ')[0].toLowerCase();
      const relevantRentals = townRentals.filter(r => r.property_type && r.property_type.toLowerCase().includes(typeLabel));
      
      let realRentMin = intel.rent_min;
      let realRentMax = intel.rent_max;
      let rentDataSource = "LLM Estimate";

      if (relevantRentals.length > 2) {
          const prices = relevantRentals.map(r => r.price).sort((a,b) => a - b);
          realRentMin = prices[0];
          realRentMax = prices[Math.floor(prices.length * 0.8)]; // Exclude extreme outliers
          rentDataSource = "Live Scraper";
      }

      return (
        <motion.div 
          key={`${activeTown}-${propType}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1, type: 'spring', damping: 25 }}
        >
          <PropertyCard 
              id={`${activeTown}-${index}`} 
              rank={`0${index + 1}`} 
              title={`${activeTown} – ${propType.replace(/\b\w/g, l => l.toUpperCase())}`}
              yieldText={`${intel.yield_min.toFixed(1)}-${intel.yield_max.toFixed(1)}%`}
              icon="🏠"
              tags={[`Rightmove: ${stats?.data_points || 0} Sales, ${relevantRentals.length} Rentals`, intel.strategy_primary]}
              stats={[
                  { label: 'BUY BAND', value: `£${lqStr}k-£${uqStr}k` },
                  { label: `RENT PCM (${rentDataSource})`, value: `£${realRentMin}-£${realRentMax}` }
              ]}
              banner={`⬆️ ${intel.deal_rule} | Confidence: ${intel.confidence}`}
              expanded={expandedCard === `${activeTown}-${propType}`}
              onExpand={() => setExpandedCard(`${activeTown}-${propType}`)}
              onClose={() => setExpandedCard(null)}
              onShortlistAdd={() => addToShortlist({ id: `deal-${activeTown}-${propType}`, address: `${activeTown} – ${propType}`, town: activeTown, price: intel.buy_max, url: `https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION^${activeTown === 'Ayr' ? '74' : activeTown === 'Kilmarnock' ? '740' : '690'}`, property_type: propType })}
              intel={intel}
              ka8Stats={stats}
              ka7Stats={statsData['KA7_flat']} 
              listings={townListings}
              rentals={townRentals}
              town={activeTown}
              propType={propType}
          />
        </motion.div>
      );
    });
  };

  return (
    <>
      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} onLogin={login} onRegister={register} userMode={userMode} error={loginError} setError={setLoginError} />
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/app/*" element={
          <div className="app-container">
            <Sidebar activeTown={activeTown} setActiveTown={setActiveTown} towns={availableTowns} onSync={runSync} syncing={syncing} onNav={handleNav} activeNav={activeNav} />
            <div className="app-content">
              <Header
                activeNav={activeNav}
                onNav={handleNav}
                search={search}
                onSearch={setSearch}
                strategyFilter={strategyFilter}
                onStrategyFilter={setStrategyFilter}
                propTypeFilter={propTypeFilter}
                onPropTypeFilter={setPropTypeFilter}
                bedsFilter={bedsFilter}
                onBedsFilter={setBedsFilter}
                countDisplay={getCountDisplay()}
              />
              <main className="feed">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTown}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FeedContent />
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </div>
        } />
        <Route path="/admin" element={
          <div className="app-container">
            <Sidebar activeTown={activeTown} setActiveTown={setActiveTown} towns={availableTowns} onSync={runSync} syncing={syncing} onNav={handleNav} activeNav={activeNav} />
            <div className="app-content">
              <AdminDashboard onSync={runSync} syncing={syncing} onSyncZoopla={runZooplaSync} zooplaSyncing={zooplaSyncing} onSyncDonaldRoss={runDonaldRossSync} donaldRossSyncing={donaldRossSyncing} onSyncLandRegistry={runLandRegistrySync} landRegistrySyncing={landRegistrySyncing} syncError={adminSyncError} onClearSyncError={() => setAdminSyncError(null)} />
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;
