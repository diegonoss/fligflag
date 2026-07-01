import { describe, it, expect } from 'vitest'
import { calculateScore } from './scoring'
import type { LatLon } from './types'

describe('polygon scoring', () => {
  const russiaPolygon: GeoJSON.Feature = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [30, 50],
        [180, 50],
        [180, 75],
        [30, 75],
        [30, 50],
      ]],
    },
  }

  const targetLatLon: LatLon = { lat: 60, lon: 100 }

  it('returns 1000 base score when guess is inside target polygon', () => {
    const guess: LatLon = { lat: 65, lon: 50 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0, 1, russiaPolygon)
    expect(result.baseScore).toBe(1000)
  })

  it('returns low base score when guess is outside polygon but far from target point', () => {
    const guess: LatLon = { lat: 40, lon: -3 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0, 1, russiaPolygon)
    expect(result.baseScore).toBeLessThan(250)
    expect(result.baseScore).toBeGreaterThanOrEqual(0)
  })

  it('returns 1000 base score when guess is inside polygon even if target point is far', () => {
    const guess: LatLon = { lat: 70, lon: 150 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0, 1, russiaPolygon)
    expect(result.baseScore).toBe(1000)
  })

  it('applies score multiplier to polygon hit', () => {
    const guess: LatLon = { lat: 65, lon: 50 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0, 0.75, russiaPolygon)
    expect(result.baseScore).toBe(750)
  })

  it('falls back to distance scoring when no geometry provided', () => {
    const guess: LatLon = { lat: 65, lon: 50 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0, 1)
    expect(result.baseScore).toBeLessThan(1000)
  })

  it('scores near-border misses against polygon boundary, not representative point', () => {
    const largePolygon: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [95, 50],
          [105, 50],
          [105, 55],
          [95, 55],
          [95, 50],
        ]],
      },
    }
    const representativePoint: LatLon = { lat: 52.5, lon: 100 }
    const guess: LatLon = { lat: 49.5, lon: 100 }
    const result = calculateScore(guess, representativePoint, 'easy', 0, 1, largePolygon)
    expect(result.baseScore).toBeGreaterThan(800)
    expect(result.baseScore).toBeLessThan(1000)
  })
})
