import countries from 'world-countries'
import type { CountryRecord } from './countryTypes'
import type { LatLon } from '../domain/types'

interface WorldCountry {
  cca2: string
  cca3: string
  name: {
    common: string
  }
  capital?: string[]
  latlng: [number, number]
  flag: string
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: {
    'ISO3166-1-Alpha-3'?: string
    'ISO3166-1-Alpha-2'?: string
  }
  geometry: GeoJSON.Geometry
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

export async function loadCountries(): Promise<CountryRecord[]> {
  const geoResponse = await fetch('/data/countries.geojson')
  if (!geoResponse.ok) {
    throw new Error('Failed to load GeoJSON data')
  }

  const geoData: GeoJSONFeatureCollection = await geoResponse.json()
  const geoMap = new Map<string, GeoJSONFeature>()

  for (const feature of geoData.features) {
    const alpha3 = feature.properties['ISO3166-1-Alpha-3']
    if (alpha3) {
      geoMap.set(alpha3, feature)
    }
  }

  const records: CountryRecord[] = []
  let skipped = 0

  for (const country of countries as WorldCountry[]) {
    const geometry = geoMap.get(country.cca3)
    const capital = country.capital?.[0]
    
    if (!geometry || !capital) {
      skipped++
      continue
    }

    const countryLatLon: LatLon = {
      lat: country.latlng[0],
      lon: country.latlng[1],
    }

    // TODO: world-countries doesn't provide capital coordinates
    // Using country centroid as fallback until a capital coordinates source is added
    const capitalLatLon: LatLon = {
      lat: country.latlng[0],
      lon: country.latlng[1],
    }

    const flagUrl = `https://flagcdn.com/w320/${country.cca2.toLowerCase()}.png`

    records.push({
      cca2: country.cca2,
      cca3: country.cca3,
      name: country.name.common,
      capital,
      countryLatLon,
      capitalLatLon,
      flagUrl,
      geometry: {
        type: 'Feature',
        properties: {},
        geometry: geometry.geometry,
      },
    })
  }

  if (import.meta.env.DEV) {
    console.log(`Loaded ${records.length} countries, skipped ${skipped}`)
  }

  return records
}
