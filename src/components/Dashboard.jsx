import { useMemo } from 'react';
import MapView from './MapView';

export default function Dashboard({ intelData = {}, statsData = {}, listings = [], rentals = [], shortlistCount = 0 }) {
  const stats = useMemo(() => {
    const towns = Object.keys(intelData);
    const totalListings = listings.length;
    const totalRentals = rentals.length;
    const totalPrompts = towns.reduce((acc, t) => acc + Object.keys(intelData[t] || {}).length, 0);
    const salesByTown = towns.reduce((acc, t) => {
      acc[t] = listings.filter(l => l.town === t).length;
      return acc;
    }, {});
    const rentalsByTown = towns.reduce((acc, t) => {
      acc[t] = rentals.filter(r => r.town === t).length;
      return acc;
    }, {});
    return {
      totalListings,
      totalRentals,
      totalPrompts,
      towns,
      salesByTown,
      rentalsByTown
    };
  }, [intelData, listings, rentals]);

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="stat-label">Listings</div>
          <div className="stat-value">{stats.totalListings}</div>
          <div className="stat-sublabel">Sales</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-label">Rentals</div>
          <div className="stat-value">{stats.totalRentals}</div>
          <div className="stat-sublabel">To Let</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-label">Intel Prompts</div>
          <div className="stat-value">{stats.totalPrompts}</div>
          <div className="stat-sublabel">Deal types</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="stat-label">Shortlist</div>
          <div className="stat-value">{shortlistCount}</div>
          <div className="stat-sublabel">Saved</div>
        </div>
      </div>
      <div className="dashboard-town-grid">
        {stats.towns.map(t => (
          <div key={t} className="dashboard-town-card">
            <div className="town-name">{t}</div>
            <div className="town-stats">
              {stats.salesByTown[t] ?? 0} sales · {stats.rentalsByTown[t] ?? 0} rentals
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-map-wrap">
        <MapView listings={listings} rentals={rentals} />
      </div>
    </div>
  );
}
