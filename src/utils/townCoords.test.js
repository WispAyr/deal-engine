import { describe, it, expect } from 'vitest'
import { getCoords, TOWN_CENTROIDS } from './townCoords'

describe('townCoords', () => {
  it('returns coords from listing with lat/lng', () => {
    const listing = { town: 'Ayr', latitude: 55.5, longitude: -4.5 }
    expect(getCoords(listing)).toEqual([55.5, -4.5])
  })

  it('falls back to town centroid when lat/lng missing', () => {
    const listing = { town: 'Ayr' }
    expect(getCoords(listing)).toEqual(TOWN_CENTROIDS.Ayr)
  })

  it('uses default for unknown town', () => {
    const listing = { town: 'Unknown' }
    expect(getCoords(listing)).toEqual([55.5, -4.6])
  })

  it('rejects NaN coords', () => {
    const listing = { town: 'Ayr', latitude: NaN, longitude: -4.5 }
    expect(getCoords(listing)).toEqual(TOWN_CENTROIDS.Ayr)
  })
})
