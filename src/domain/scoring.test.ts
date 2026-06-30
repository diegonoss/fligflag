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

  it('applies score multiplier to base score', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const result = calculateScore(guess, targetLatLon, 'easy', 0, 0.75)
    expect(result.baseScore).toBe(750)
  })

  it('applies score multiplier to time bonus', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const withoutMultiplier = calculateScore(guess, targetLatLon, 'normal', 10)
    const withMultiplier = calculateScore(guess, targetLatLon, 'normal', 10, 0.75)
    expect(withMultiplier.baseScore).toBe(Math.floor(withoutMultiplier.baseScore * 0.75))
    expect(withMultiplier.timeBonus).toBe(Math.floor(withoutMultiplier.timeBonus * 0.75))
    expect(withMultiplier.totalScore).toBe(withMultiplier.baseScore + withMultiplier.timeBonus)
  })

  it('defaults multiplier to 1 when not provided', () => {
    const guess: LatLon = { lat: 40.4168, lon: -3.7038 }
    const defaultResult = calculateScore(guess, targetLatLon, 'easy', 0)
    const explicitResult = calculateScore(guess, targetLatLon, 'easy', 0, 1)
    expect(defaultResult.baseScore).toBe(explicitResult.baseScore)
    expect(defaultResult.totalScore).toBe(explicitResult.totalScore)
  })
})
