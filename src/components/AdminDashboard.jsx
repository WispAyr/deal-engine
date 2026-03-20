import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Clock, RefreshCw, CheckCircle, AlertTriangle, Users, UserPlus, UserCheck, HardDrive, Download, Table } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const AdminDashboard = ({ onSync, syncing, onSyncZoopla, zooplaSyncing, onSyncDonaldRoss, donaldRossSyncing, onSyncLandRegistry, landRegistrySyncing, syncError, onClearSyncError }) => {
  const { apiFetch } = useAuth();
  const [salesCount, setSalesCount] = useState(0);
  const [rentalsCount, setRentalsCount] = useState(0);
  const [zooplaCount, setZooplaCount] = useState(0);
  const [zooplaLastRun, setZooplaLastRun] = useState(null);
  const [donaldRossCount, setDonaldRossCount] = useState(0);
  const [donaldRossLastRun, setDonaldRossLastRun] = useState(null);
  const [statsSegments, setStatsSegments] = useState(0);
  const [users, setUsers] = useState([]);
  const [userTab, setUserTab] = useState('registrations');
  const [dataSources, setDataSources] = useState([]);
  const [dataSource, setDataSource] = useState('');
  const [dataPreview, setDataPreview] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataView, setDataView] = useState('table');

  const refreshUsers = () => {
    apiFetch(`${API_BASE}/api/admin/users`).then(r => r.ok ? r.json() : []).then(setUsers).catch(() => setUsers([]));
  };

  const refreshDataSources = () => {
    apiFetch(`${API_BASE}/api/admin/data-sources`).then(r => r.ok ? r.json() : []).then(setDataSources).catch(() => setDataSources([]));
  };

  useEffect(() => { refreshUsers(); }, [userTab]);
  useEffect(() => { refreshDataSources(); }, []);

  const refresh = () => {
    const p1 = fetch(`${API_BASE}/api/listings`).then(r => r.json()).catch(() => []);
    const p2 = fetch(`${API_BASE}/api/rentals`).then(r => r.json()).catch(() => []);
    const p3 = fetch(`${API_BASE}/api/zoopla-stats`).then(r => r.json()).catch(() => ({}));
    const p4 = fetch(`${API_BASE}/api/donaldross-stats`).then(r => r.json()).catch(() => ({}));
    const p5 = fetch(`${API_BASE}/api/stats`).then(r => r.json()).catch(() => ({}));
    Promise.all([p1, p2, p3, p4, p5]).then(([sales, rentals, zooplaStats, drStats, stats]) => {
      setSalesCount(Array.isArray(sales) ? sales.length : 0);
      setRentalsCount(Array.isArray(rentals) ? rentals.length : 0);
      setZooplaCount(zooplaStats?.zooplaCount ?? 0);
      setZooplaLastRun(zooplaStats?.lastRun ?? null);
      setDonaldRossCount(drStats?.donaldRossCount ?? 0);
      setDonaldRossLastRun(drStats?.lastRun ?? null);
      setStatsSegments(typeof stats === 'object' && stats !== null ? Object.keys(stats).length : 0);
    });
  };

  useEffect(() => { refresh(); onClearSyncError?.(); }, [syncing, zooplaSyncing, donaldRossSyncing, landRegistrySyncing]);

  const triggerSync = () => { onClearSyncError?.(); onSync?.(); };
  const triggerZoopla = () => { onClearSyncError?.(); onSyncZoopla?.(); };
  const triggerDonaldRoss = () => { onClearSyncError?.(); onSyncDonaldRoss?.(); };
  const triggerLandRegistry = () => { onClearSyncError?.(); onSyncLandRegistry?.(); };

  const updateUser = async (id, updates) => {
    const res = await apiFetch(`${API_BASE}/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) refreshUsers();
  };

  const loadData = async (src) => {
    setDataSource(src);
    setDataLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/admin/data/${src}`);
      setDataPreview(res.ok ? await res.json() : null);
    } catch {
      setDataPreview(null);
    } finally {
      setDataLoading(false);
    }
  };

  const exportData = (format) => {
    if (!dataPreview) return;
    const name = dataSource || 'export';
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataPreview, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } else if (format === 'csv' && Array.isArray(dataPreview) && dataPreview.length > 0) {
      const keys = [...new Set(dataPreview.flatMap(o => Object.keys(o)))];
      const header = keys.map(k => `"${String(k).replace(/"/g, '""')}"`).join(',');
      const rows = dataPreview.map(row =>
        keys.map(k => {
          const v = row[k];
          if (v == null) return '';
          const s = typeof v === 'object' ? JSON.stringify(v).replace(/"/g, '""') : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        }).join(',')
      );
      const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');

  const isArrayData = Array.isArray(dataPreview);
  const tableRows = isArrayData && dataPreview.length > 0 ? dataPreview : [];
  const tableKeys = tableRows.length > 0 ? [...new Set(tableRows.flatMap(o => typeof o === 'object' && o !== null ? Object.keys(o) : []))] : [];

  return (
    <div className="admin-dashboard feed">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Data Command Center</h1>
        <p className="helper-text">Manage ingestion pipelines and automagical scheduled cron tasks.</p>
        {syncError && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color="var(--accent-red, #ef4444)" />
            <span>{syncError}</span>
            <button type="button" onClick={onClearSyncError} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
          </div>
        )}
        <div className="pipelines-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr', marginTop: '32px' }}>
          
          {/* Land Registry Card */}
          <div className="property-card active" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-cyan-pill)', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
                  <Database size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>HM Land Registry</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Standard Price Paid Data (Monthly CSV Pipeline)</p>
                </div>
              </div>
              <span className="pill cyan-bg" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12}/> ONLINE</span>
            </div>

            <div className="core-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div className="stat-box">
                <span className="stat-label">Schedule</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>Manual</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Segments</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>{statsSegments}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Output</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>market_stats.json</span>
              </div>
            </div>

            <button onClick={triggerLandRegistry} disabled={landRegistrySyncing} className="action-btn outline-cyan" style={{ margin: 0, display: 'inline-flex', width: 'auto' }}>
              <RefreshCw size={14} /> {landRegistrySyncing ? 'Syncing...' : 'Run Land Registry Sync'}
            </button>
          </div>

          {/* Rightmove Scraper Card */}
          <div className="property-card active" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-cyan-pill)', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
                  <ActivityIndicator />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Rightmove Next.js Engine</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Native State Extractor — Live Sales & Rentals</p>
                </div>
              </div>
              <span className="pill cyan-bg" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12}/> ONLINE</span>
            </div>

            <div className="core-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div className="stat-box">
                <span className="stat-label">Last Ingestion</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>Just now</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total DB Records</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>{salesCount + rentalsCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Schedule CRON</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>Midnight (0 0 * * *)</span>
              </div>
            </div>

            <button onClick={triggerSync} disabled={syncing} className="action-btn outline-cyan" style={{ margin: 0, display: 'inline-flex', width: 'auto' }}>
              <RefreshCw size={14} /> {syncing ? 'Syncing...' : 'Force Sync'}
            </button>
          </div>

          {/* Zoopla Headless Scraper */}
          <div className="property-card active" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'rgba(241, 196, 15, 0.1)', borderRadius: '8px', color: 'var(--accent-yellow)' }}>
                  <ActivityIndicator />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Zoopla Headless Scraper</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Puppeteer — Secondary Market DB (Ayr, Kilmarnock, Irvine)</p>
                </div>
              </div>
              <span className="pill cyan-bg" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12}/> {zooplaCount > 0 ? 'ONLINE' : 'READY'}</span>
            </div>

            <div className="core-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div className="stat-box">
                <span className="stat-label">Last Ingestion</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>{zooplaLastRun ? new Date(zooplaLastRun).toLocaleString() : 'Never'}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Total DB Records</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>{zooplaCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Schedule</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>Manual / CRON</span>
              </div>
            </div>

            <button onClick={triggerZoopla} disabled={zooplaSyncing} className="action-btn outline-cyan" style={{ margin: 0, display: 'inline-flex', width: 'auto' }}>
              <RefreshCw size={14} /> {zooplaSyncing ? 'Scraping...' : 'Run Zoopla Sync'}
            </button>
          </div>

          {/* Donald Ross — Alloway & exclusives */}
          <div className="property-card active" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#22c55e' }}>
                  <ActivityIndicator />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Donald Ross</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Direct fetch — Ayrshire-wide agent (Ayr, Irvine, Kilmarnock)</p>
                </div>
              </div>
              <span className="pill cyan-bg" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={12}/> {donaldRossCount > 0 ? 'ONLINE' : 'READY'}</span>
            </div>
            <div className="core-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div className="stat-box">
                <span className="stat-label">Last Ingestion</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>{donaldRossLastRun ? new Date(donaldRossLastRun).toLocaleString() : 'Never'}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Listings</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>{donaldRossCount}</span>
              </div>
              <div className="stat-box">
                <span className="stat-label">Schedule</span>
                <span className="stat-value" style={{ fontSize: '14px' }}>Manual</span>
              </div>
            </div>
            <button type="button" onClick={triggerDonaldRoss} disabled={donaldRossSyncing} className="action-btn outline-cyan" style={{ margin: 0, display: 'inline-flex', width: 'auto' }}>
              <RefreshCw size={14} /> {donaldRossSyncing ? 'Syncing...' : 'Run Donald Ross Sync'}
            </button>
          </div>

          {/* User Management */}
          <div className="property-card active" style={{ padding: '24px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '8px', color: '#a78bfa' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>User Management</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registrations, clients & onboarding</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button type="button" className={`toolbar-btn ${userTab === 'registrations' ? 'primary' : ''}`} onClick={() => setUserTab('registrations')}>
                <UserPlus size={14} /> Registrations ({pendingUsers.length})
              </button>
              <button type="button" className={`toolbar-btn ${userTab === 'clients' ? 'primary' : ''}`} onClick={() => setUserTab('clients')}>
                <UserCheck size={14} /> Clients ({activeUsers.length})
              </button>
              <button type="button" className={`toolbar-btn ${userTab === 'onboarding' ? 'primary' : ''}`} onClick={() => setUserTab('onboarding')}>
                Onboarding
              </button>
            </div>
            {userTab === 'registrations' && (
              <div className="user-list">
                {pendingUsers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No pending registrations</p>
                ) : (
                  pendingUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{u.email}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button type="button" className="toolbar-btn primary" style={{ padding: '6px 12px' }} onClick={() => updateUser(u.id, { status: 'active' })}>Approve</button>
                      <button type="button" className="toolbar-btn" style={{ padding: '6px 12px' }} onClick={() => updateUser(u.id, { status: 'rejected' })}>Reject</button>
                    </div>
                  ))
                )}
              </div>
            )}
            {userTab === 'clients' && (
              <div className="user-list">
                {activeUsers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No active clients</p>
                ) : (
                  activeUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{u.email}</span>
                        <span className="pill" style={{ marginLeft: 8, fontSize: 11 }}>{u.role}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>Last active: {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : '—'}</span>
                      </div>
                      <select className="strategy-input" style={{ width: 90, padding: '6px 8px' }} value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  ))
                )}
              </div>
            )}
            {userTab === 'onboarding' && (
              <div className="user-list">
                {users.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No users</p>
                ) : (
                  users.filter(u => u.status === 'active').map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{u.email}</span>
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>Step {u.onboardingStep ?? 0}</span>
                      </div>
                      <input type="number" min={0} max={10} className="strategy-input" style={{ width: 60, padding: '6px 8px' }} value={u.onboardingStep ?? 0} onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 0) updateUser(u.id, { onboardingStep: v }); }} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Database Browser */}
          <div className="property-card active" style={{ padding: '24px', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: 'rgba(52, 209, 180, 0.1)', borderRadius: '8px', color: 'var(--accent-cyan)' }}>
                  <HardDrive size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Database Browser</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>View & export all data sources</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {dataSources.map(s => (
                <button key={s.id} type="button" className={`toolbar-btn ${dataSource === s.id ? 'primary' : ''}`} onClick={() => loadData(s.id)}>
                  {s.name} ({s.count})
                </button>
              ))}
            </div>
            {dataSource && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <button type="button" className={`toolbar-btn ${dataView === 'table' ? 'primary' : ''}`} onClick={() => setDataView('table')} disabled={!isArrayData || tableRows.length === 0}>
                    <Table size={14} /> Table
                  </button>
                  <button type="button" className={`toolbar-btn ${dataView === 'json' ? 'primary' : ''}`} onClick={() => setDataView('json')}>
                    JSON
                  </button>
                  <button type="button" className="toolbar-btn" onClick={() => exportData('json')} disabled={!dataPreview}>
                    <Download size={14} /> Export JSON
                  </button>
                  <button type="button" className="toolbar-btn" onClick={() => exportData('csv')} disabled={!isArrayData || tableRows.length === 0}>
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                {dataLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : dataView === 'json' ? (
                  <pre style={{ background: 'var(--bg-input)', padding: 16, borderRadius: 8, overflow: 'auto', maxHeight: 400, fontSize: 12 }}>
                    {JSON.stringify(dataPreview, null, 2)}
                  </pre>
                ) : tableKeys.length > 0 ? (
                  <div className="comps-table" style={{ maxHeight: 400, overflow: 'auto' }}>
                    <div className="table-header" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      {tableKeys.slice(0, 8).map(k => <span key={k} style={{ flex: ['address', 'id', 'summary'].includes(k) ? 2 : 1, minWidth: 60, fontSize: 11 }}>{k}</span>)}
                    </div>
                    {tableRows.slice(0, 100).map((row, i) => (
                      <div key={i} className="table-row">
                        {tableKeys.slice(0, 8).map(k => {
                          const v = row[k];
                          const str = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
                          return (
                            <span key={k} style={{ flex: ['address', 'id', 'summary'].includes(k) ? 2 : 1, minWidth: 60, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }} title={str}>
                              {str.length > 60 ? str.slice(0, 57) + '…' : str}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                    {tableRows.length > 100 && (
                      <div style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                        Showing 100 of {tableRows.length} rows. Export for full data.
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No tabular data. Use JSON view.</p>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Generic icon component to prevent clutter
const ActivityIndicator = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

export default AdminDashboard;
