/**
 * Shared Ayrshire towns config for scrapers, intel, map.
 * Rightmove REGION IDs from property-for-sale/TownName.html map links.
 */
export const AYRSHIRE_TOWNS = {
  Alloway: { region: 'REGION^74', postcode: 'KA7', slug: 'alloway', area: 'South Ayrshire', lat: 55.4317, lng: -4.6358 },
  Ayr: { region: 'REGION^74', postcode: 'KA8', slug: 'ayr', area: 'South Ayrshire', lat: 55.4589, lng: -4.6289 },
  Prestwick: { region: 'REGION^1099', postcode: 'KA9', slug: 'prestwick', area: 'South Ayrshire', lat: 55.4958, lng: -4.6142 },
  Troon: { region: 'REGION^1363', postcode: 'KA10', slug: 'troon', area: 'South Ayrshire', lat: 55.5406, lng: -4.6639 },
  Girvan: { region: 'REGION^549', postcode: 'KA26', slug: 'girvan', area: 'South Ayrshire', lat: 55.2428, lng: -4.8553 },
  Maybole: { region: 'REGION^921', postcode: 'KA19', slug: 'maybole', area: 'South Ayrshire', lat: 55.355, lng: -4.6819 },
  Kilmarnock: { region: 'REGION^740', postcode: 'KA1', slug: 'kilmarnock', area: 'East Ayrshire', lat: 55.6112, lng: -4.4956 },
  Cumnock: { region: 'REGION^395', postcode: 'KA18', slug: 'cumnock', area: 'East Ayrshire', lat: 55.4531, lng: -4.2644 },
  Irvine: { region: 'REGION^690', postcode: 'KA12', slug: 'irvine', area: 'North Ayrshire', lat: 55.6194, lng: -4.6551 },
  Kilwinning: { region: 'REGION^741', postcode: 'KA13', slug: 'kilwinning', area: 'North Ayrshire', lat: 55.655, lng: -4.7019 },
  Ardrossan: { region: 'REGION^47', postcode: 'KA22', slug: 'ardrossan', area: 'North Ayrshire', lat: 55.6431, lng: -4.8119 },
  Saltcoats: { region: 'REGION^1168', postcode: 'KA21', slug: 'saltcoats', area: 'North Ayrshire', lat: 55.6361, lng: -4.7856 },
  Largs: { region: 'REGION^774', postcode: 'KA30', slug: 'largs', area: 'North Ayrshire', lat: 55.7943, lng: -4.8647 },
};

export const TOWN_NAMES = Object.keys(AYRSHIRE_TOWNS);
// Rightmove: only towns with distinct regions (Alloway shares Ayr's region, skip to avoid duplicates)
const RIGHTMOVE_TOWNS = TOWN_NAMES.filter(t => t !== 'Alloway');
export const RIGHTMOVE_LOCATIONS = Object.fromEntries(
  RIGHTMOVE_TOWNS.map(t => [t, AYRSHIRE_TOWNS[t].region])
);
export const TOWN_CENTROIDS = Object.fromEntries(
  TOWN_NAMES.map(t => [t, [AYRSHIRE_TOWNS[t].lat, AYRSHIRE_TOWNS[t].lng]])
);
export const TOWN_POSTCODE = Object.fromEntries(
  TOWN_NAMES.map(t => [t, AYRSHIRE_TOWNS[t].postcode])
);
export const ZOOPLA_SLUGS = Object.fromEntries(
  TOWN_NAMES.map(t => [t, AYRSHIRE_TOWNS[t].slug])
);
