import { TOWN_CENTROIDS as _CENTROIDS } from '../data/ayrshireTowns.js';
export const TOWN_CENTROIDS = _CENTROIDS;

export function getCoords(listing) {
  const lat = listing?.latitude;
  const lng = listing?.longitude;
  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return [lat, lng];
  }
  const [fallbackLat, fallbackLng] = TOWN_CENTROIDS[listing?.town] ?? [55.5, -4.6];
  return [fallbackLat, fallbackLng];
}
