import { distance, point } from '@turf/turf'
import type { LatLon, Difficulty, ScoreBreakdown } from './types'

const BASE_SCORE = 1000
const MAX_DISTANCE_KM = 20000
const TIME_BONUS_RATE = 0.1

export function calculateScore(
  guess: LatLon,
  target: LatLon,
  difficulty: Difficulty,
  secondsLeft: number,
  scoreMultiplier: number = 1
): ScoreBreakdown {
  const distanceKm = distance(
    point([guess.lon, guess.lat]),
    point([target.lon, target.lat]),
    { units: 'kilometers' }
  )

  const rawBaseScore = calculateBaseScore(distanceKm)
  const rawTimeBonus = calculateTimeBonus(rawBaseScore, difficulty, secondsLeft)

  const baseScore = Math.floor(rawBaseScore * scoreMultiplier)
  const timeBonus = Math.floor(rawTimeBonus * scoreMultiplier)
  const totalScore = baseScore + timeBonus

  return {
    baseScore,
    timeBonus,
    totalScore,
  }
}

function calculateBaseScore(distanceKm: number): number {
  if (distanceKm <= 50) {
    return BASE_SCORE
  }
  
  const decay = Math.max(0, 1 - distanceKm / MAX_DISTANCE_KM)
  return Math.floor(BASE_SCORE * decay)
}

function calculateTimeBonus(
  baseScore: number,
  difficulty: Difficulty,
  secondsLeft: number
): number {
  if (difficulty === 'easy') {
    return 0
  }
  
  return Math.floor(baseScore * TIME_BONUS_RATE * secondsLeft)
}
