import type { LatLon } from '../domain/types'

export interface CountryRecord {
  cca2: string
  cca3: string
  name: string
  capital: string
  countryLatLon: LatLon
  capitalLatLon: LatLon
  flagUrl: string
  geometry: GeoJSON.Feature
}
