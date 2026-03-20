import { Link } from 'react-router-dom';
import { Server, Map, Briefcase, Cpu, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Sidebar = ({ activeTown, setActiveTown, towns, onSync, syncing, onNav, activeNav }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiFetch, isAuthenticated } = useAuth();
  const isAdmin = location.pathname === '/admin';

  const openBilling = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/api/billing/portal`);
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else if (!res.ok) console.warn('Billing not configured');
    } catch {
      console.warn('Billing unavailable');
    }
  };

  return (
    <aside className="app-sidebar">
      <Link to="/" className="sidebar-header" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="logo-box">A</div>
        <div className="logo-text">
          <h2>Ayrshire Acq.</h2>
          <span>Deal Engine v2.0</span>
        </div>
      </Link>

      <div className="sidebar-group">
        <h3>MARKET PIPELINE</h3>
        <nav className="nav-menu">
          <button className={`nav-item ${!isAdmin && activeNav !== 'Shortlist' ? 'active' : ''}`} onClick={() => { navigate('/app'); onNav?.('Dashboard'); }}>
            <Map size={18} /> Live Intel
          </button>
          <button className={`nav-item ${activeNav === 'Shortlist' ? 'active' : ''}`} onClick={() => { navigate('/app'); onNav?.('Shortlist'); }}>
            <Briefcase size={18} /> Shortlist
          </button>
          
          <div style={{ padding: '12px 0 4px', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>SYSTEM</div>
          <button className={`nav-item ${isAdmin ? 'active' : ''}`} onClick={() => navigate('/admin')}>
            <Server size={18} /> Admin Dashboard
          </button>
          {isAuthenticated && (
            <button type="button" className="nav-item" onClick={openBilling}>
              <CreditCard size={18} /> Billing
            </button>
          )}
        </nav>
      </div>

      <div className="sidebar-group scrollable">
        <h3>TARGET TOWNS</h3>
        <ul className="town-list">
          {towns.map(t => (
            <motion.li 
              key={t}
              className={`town-item ${activeTown === t ? 'active' : ''}`}
              onClick={() => {
                setActiveTown(t);
                if (activeNav === 'Dashboard') onNav?.('Prompts');
              }}
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {t} {activeTown === t && <motion.div className="active-dot" layoutId="dot" />}
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="sidebar-bottom">
        <button className="run-engine-btn" onClick={onSync} disabled={syncing}>
           <Cpu size={16} /> {syncing ? 'Syncing...' : 'Force Sync DB'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
