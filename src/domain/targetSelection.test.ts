import { describe, it, expect } from 'vitest'
import { getCountrySelectionWeight, selectRoundTargets } from './targetSelection'
import type { CountryTarget } from './types'

function makeTarget(id: string, name: string): CountryTarget {
  return {
    id,
    name,
    capital: `${name} City`,
    latLon: { lat: 0, lon: 0 },
    capitalLatLon: { lat: 0, lon: 0 },
    flagUrl: '',
    geometry: { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
  }
}

const KNOWN = makeTarget('ARG', 'Argentina')
const UNKNOWN = makeTarget('BTN', 'Bhutan')

describe('getCountrySelectionWeight', () => {
  it('gives known country higher weight on easy', () => {
    expect(getCountrySelectionWeight(KNOWN, 'easy')).toBeGreaterThan(
      getCountrySelectionWeight(UNKNOWN, 'easy')
    )
  })

  it('gives known country lower weight on hard', () => {
    expect(getCountrySelectionWeight(KNOWN, 'hard')).toBeLessThan(
      getCountrySelectionWeight(UNKNOWN, 'hard')
    )
  })

  it('gives known country moderate weight on normal', () => {
    const easyWeight = getCountrySelectionWeight(KNOWN, 'easy')
    const normalWeight = getCountrySelectionWeight(KNOWN, 'normal')
    const hardWeight = getCountrySelectionWeight(KNOWN, 'hard')
    expect(normalWeight).toBeLessThanOrEqual(easyWeight)
    expect(normalWeight).toBeGreaterThanOrEqual(hardWeight)
  })
})

describe('selectRoundTargets', () => {
  const pool: CountryTarget[] = [
    KNOWN,
    UNKNOWN,
    makeTarget('ESP', 'Spain'),
    makeTarget('FRA', 'France'),
    makeTarget('USA', 'United States'),
    makeTarget('GBR', 'United Kingdom'),
    makeTarget('BRA', 'Brazil'),
    makeTarget('CAN', 'Canada'),
    makeTarget('MEX', 'Mexico'),
    makeTarget('DEU', 'Germany'),
  ]

  it('returns exactly requested round count', () => {
    const result = selectRoundTargets(pool, 'normal', 5)
    expect(result).toHaveLength(5)
  })

  it('returns unique country IDs', () => {
    const result = selectRoundTargets(pool, 'normal', 5)
    const ids = result.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('never produces adjacent duplicate IDs', () => {
    const result = selectRoundTargets(pool, 'normal', 5)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.id).not.toBe(result[i - 1]!.id)
    }
  })

  it('deduplicates input targets by ID', () => {
    const duped = [...pool, { ...KNOWN }]
    const result = selectRoundTargets(duped, 'normal', 5)
    const ids = result.map((t) => t.id)
    expect(ids.filter((id) => id === 'ARG').length).toBeLessThanOrEqual(1)
  })

  it('throws when unique targets fewer than requested rounds', () => {
    const small = [KNOWN, UNKNOWN]
    expect(() => selectRoundTargets(small, 'normal', 5)).toThrow()
  })

  it('accepts deterministic random function', () => {
    let callCount = 0
    const deterministicRandom = () => {
      callCount++
      return 0
    }
    const result = selectRoundTargets(pool, 'easy', 3, deterministicRandom)
    expect(result).toHaveLength(3)
    expect(callCount).toBeGreaterThan(0)
  })
})
