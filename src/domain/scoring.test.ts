import { describe, it, expect } from 'vitest'
import { calculateScore } from './scoring'
import type { LatLon, Difficulty } from './types'

describe('scoring', () => {
  const targetLatLon: LatLon = { lat: 40.4168, lon: -3.7038 } // Madrid, Spain
  
  it('returns 1000 base score when clicked inside target country', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0)
    expect(result.baseScore).toBe(1000)
  })

  it('returns lower base score when clicked far from target', () => {
    const guess: LatLon = { lat: -33.8688, lon: 151.2093 } // Sydney, Australia
    const result = calculateScore(guess, targetLatLon, 'easy', 0)
    expect(result.baseScore).toBeLessThan(1000)
    expect(result.baseScore).toBeGreaterThanOrEqual(0)
  })

  it('returns zero time bonus for easy mode', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const result = calculateScore(guess, targetLatLon, 'easy', 10)
    expect(result.timeBonus).toBe(0)
  })

  it('returns time bonus for normal mode', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const result = calculateScore(guess, targetLatLon, 'normal', 15)
    expect(result.timeBonus).toBeGreaterThan(0)
  })

  it('returns time bonus for hard mode', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const result = calculateScore(guess, targetLatLon, 'hard', 5)
    expect(result.timeBonus).toBeGreaterThan(0)
  })

  it('calculates total score correctly', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const result = calculateScore(guess, targetLatLon, 'normal', 10)
    expect(result.totalScore).toBe(result.baseScore + result.timeBonus)
  })
})
