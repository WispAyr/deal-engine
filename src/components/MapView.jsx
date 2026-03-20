import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getCoords } from '../utils/townCoords';

// Fix default marker icon in Vite/bundler (Leaflet requires explicit path)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function FitBounds({ listings }) {
  const map = useMap();
  useEffect(() => {
    if (!listings?.length) return;
    const coords = listings.map(l => getCoords(l)).filter(Boolean);
    if (coords.length === 0) return;
    map.fitBounds(coords, { padding: [30, 30], maxZoom: 12 });
  }, [map, listings]);
  return null;
}

export default function MapView({ listings = [], rentals = [], onMarkerClick }) {
  const all = useMemo(() => {
    const sales = (listings || []).map(l => ({ ...l, category: 'sales' }));
    const lets = (rentals || []).map(r => ({ ...r, category: 'rentals' }));
    return [...sales, ...lets];
  }, [listings, rentals]);

  return (
    <div className="map-view" style={{ height: '100%', minHeight: 320, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer
        center={[55.52, -4.6]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds listings={all} />
        {all.map((item) => {
          const [lat, lng] = getCoords(item);
          if (lat == null || lng == null) return null;
          return (
            <Marker
              key={item.id}
              position={[lat, lng]}
              eventHandlers={{ click: () => onMarkerClick?.(item) }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <strong>{item.address || item.town}</strong>
                  <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                    {item.town} · {item.category === 'rentals' ? 'Rental' : 'Sale'}
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 600 }}>
                    £{(item.price || 0).toLocaleString()}
                  </div>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, display: 'block', fontSize: 12 }}>
                      View listing →
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
