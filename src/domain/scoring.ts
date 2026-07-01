import { distance, point, booleanPointInPolygon, polygonToLine, nearestPointOnLine } from '@turf/turf'
import type { LatLon, Difficulty, ScoreBreakdown } from './types'
import { getDifficultyConfig } from './difficulty'

const BASE_SCORE = 1000
const PERFECT_DISTANCE_KM = 50
const MAX_SCORE_DISTANCE_KM = 3000
const TIME_BONUS_RATE = 0.1

export function calculateScore(
  guess: LatLon,
  target: LatLon,
  difficulty: Difficulty,
  secondsLeft: number,
  scoreMultiplier: number = 1,
  targetGeometry?: GeoJSON.Feature
): ScoreBreakdown {
  const guessPoint = point([guess.lon, guess.lat])
  const targetPoint = point([target.lon, target.lat])

  let distanceKm: number
  let insidePolygon = false

  if (targetGeometry) {
    const geomType = targetGeometry.geometry.type
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      insidePolygon = booleanPointInPolygon(guessPoint, targetGeometry as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)
    }
  }

  if (insidePolygon) {
    distanceKm = 0
  } else if (targetGeometry) {
    const geomType = targetGeometry.geometry.type
    if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
      distanceKm = nearestBoundaryDistance(guessPoint, targetGeometry as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>)
    } else {
      distanceKm = distance(guessPoint, targetPoint, { units: 'kilometers' })
    }
  } else {
    distanceKm = distance(guessPoint, targetPoint, { units: 'kilometers' })
  }

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
  if (distanceKm <= PERFECT_DISTANCE_KM) {
    return BASE_SCORE
  }
  
  const decay = Math.max(0, 1 - distanceKm / MAX_SCORE_DISTANCE_KM)
  return Math.floor(BASE_SCORE * decay * decay)
}

function nearestBoundaryDistance(
  guessPoint: GeoJSON.Feature<GeoJSON.Point>,
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
): number {
  const lines = polygonToLine(polygon)
  if (lines.type === 'FeatureCollection') {
    let minDist = Infinity
    for (const feature of lines.features) {
      const snapped = nearestPointOnLine(feature, guessPoint, { units: 'kilometers' })
      if (snapped.properties.pointDistance < minDist) {
        minDist = snapped.properties.pointDistance
      }
    }
    return minDist
  }
  const snapped = nearestPointOnLine(lines, guessPoint, { units: 'kilometers' })
  return snapped.properties.pointDistance
}

function calculateTimeBonus(
  baseScore: number,
  difficulty: Difficulty,
  secondsLeft: number
): number {
  if (difficulty === 'easy') {
    return 0
  }

  const config = getDifficultyConfig(difficulty)
  if (config.timerSeconds === null) {
    return 0
  }

  const clampedSeconds = Math.min(Math.max(0, secondsLeft), config.timerSeconds)
  return Math.floor(baseScore * TIME_BONUS_RATE * (clampedSeconds / config.timerSeconds))
}
