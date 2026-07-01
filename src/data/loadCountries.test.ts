import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadCountries } from './loadCountries'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          'ISO3166-1-Alpha-3': 'DEU',
          'ISO3166-1-Alpha-2': 'DE',
          name: 'Germany',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[10, 50], [11, 50], [11, 51], [10, 51], [10, 50]]],
        },
      },
      {
        type: 'Feature',
        properties: {
          'ISO3166-1-Alpha-3': '-99',
          'ISO3166-1-Alpha-2': '-99',
          name: 'France',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[2, 46], [3, 46], [3, 47], [2, 47], [2, 46]]],
        },
      },
      {
        type: 'Feature',
        properties: {
          'ISO3166-1-Alpha-3': '-99',
          'ISO3166-1-Alpha-2': '-99',
          name: 'Norway',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[10, 60], [11, 60], [11, 61], [10, 61], [10, 60]]],
        },
      },
    ],
  }
}

describe('loadCountries', () => {
  it('loads countries matched by ISO alpha-3 code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeFeatureCollection()),
    }))

    const records = await loadCountries()
    const ids = records.map((r) => r.cca3)

    expect(ids).toContain('DEU')
  })

  it('loads France and Norway when GeoJSON ISO codes are -99', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(makeFeatureCollection()),
    }))

    const records = await loadCountries()
    const ids = records.map((r) => r.cca3)

    expect(ids).toContain('FRA')
    expect(ids).toContain('NOR')

    const france = records.find((r) => r.cca3 === 'FRA')
    const norway = records.find((r) => r.cca3 === 'NOR')

    expect(france?.geometry).toBeDefined()
    expect(norway?.geometry).toBeDefined()
  })
})
