import { describe, it, expect } from 'vitest'
import { latLonToVector3, vector3ToLatLon } from './coordinates'
import type { LatLon } from '../domain/types'

describe('coordinates', () => {
  function round(n: number): number {
    return Math.round(n * 1000) / 1000
  }

  it('round-trips Moscow coordinates correctly', () => {
    const input: LatLon = { lat: 55.7, lon: 37.6 }
    const vector = latLonToVector3(input)
    const output = vector3ToLatLon(vector)
    expect(round(output.lat)).toBe(input.lat)
    expect(round(output.lon)).toBe(input.lon)
  })

  it('round-trips Riyadh coordinates correctly', () => {
    const input: LatLon = { lat: 24.7, lon: 46.7 }
    const vector = latLonToVector3(input)
    const output = vector3ToLatLon(vector)
    expect(round(output.lat)).toBe(input.lat)
    expect(round(output.lon)).toBe(input.lon)
  })

  it('round-trips Madrid coordinates correctly', () => {
    const input: LatLon = { lat: 40.4, lon: -3.7 }
    const vector = latLonToVector3(input)
    const output = vector3ToLatLon(vector)
    expect(round(output.lat)).toBe(input.lat)
    expect(round(output.lon)).toBe(input.lon)
  })

  it('round-trips Tokyo coordinates correctly', () => {
    const input: LatLon = { lat: 35.7, lon: 139.7 }
    const vector = latLonToVector3(input)
    const output = vector3ToLatLon(vector)
    expect(round(output.lat)).toBe(input.lat)
    expect(round(output.lon)).toBe(input.lon)
  })

  it('round-trips Sydney coordinates correctly', () => {
    const input: LatLon = { lat: -33.9, lon: 151.2 }
    const vector = latLonToVector3(input)
    const output = vector3ToLatLon(vector)
    expect(round(output.lat)).toBe(input.lat)
    expect(round(output.lon)).toBe(input.lon)
  })
})
