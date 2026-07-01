import type { GameConfig, GameState, Round, Guess, CountryTarget, LatLon, GameMode } from './types'
import { calculateScore } from './scoring'
import { getDifficultyConfig } from './difficulty'

const DELIMITER_SCORE_MULTIPLIER = 0.75

export function getTargetLatLon(target: CountryTarget, mode: GameMode): LatLon {
  return mode === 'capital' ? target.capitalLatLon : target.latLon
}

export function createGame(config: GameConfig): GameState {
  return {
    phase: 'setup',
    config,
    currentRound: 0,
    rounds: [],
    totalScore: 0,
  }
}

export function startGame(state: GameState, targets: CountryTarget[]): GameState {
  if (targets.length < state.config.rounds) {
    throw new Error('Not enough targets for requested rounds')
  }

  const rounds: Round[] = targets.slice(0, state.config.rounds).map((target, index) => ({
    index,
    target,
    startTime: 0,
  }))

  return {
    ...state,
    phase: 'playing',
    currentRound: 0,
    rounds,
    totalScore: 0,
  }
}

export function startRound(state: GameState, timestamp: number): GameState {
  if (state.phase !== 'playing') {
    throw new Error('Game not in playing state')
  }

  const rounds = state.rounds.map((round, index) => {
    if (index === state.currentRound) {
      return { ...round, startTime: timestamp }
    }
    return round
  })

  return { ...state, rounds }
}

export function submitGuess(state: GameState, guess: Guess): GameState {
  if (state.phase !== 'playing') {
    throw new Error('Game not in playing state')
  }

  const currentRound = state.rounds[state.currentRound]
  if (!currentRound) {
    throw new Error('No current round')
  }

  const difficultyConfig = getDifficultyConfig(state.config.difficulty)
  const elapsedSeconds = Math.floor((guess.timestamp - currentRound.startTime) / 1000)
  const secondsLeft = difficultyConfig.timerSeconds !== null
    ? Math.max(0, difficultyConfig.timerSeconds - elapsedSeconds)
    : 0

  const targetLatLon = getTargetLatLon(currentRound.target, state.config.mode)
  const scoreMultiplier = state.config.showCountryDelimiters ? DELIMITER_SCORE_MULTIPLIER : 1
  const targetGeometry = state.config.mode === 'country' ? currentRound.target.geometry : undefined

  const score = calculateScore(
    guess.latLon,
    targetLatLon,
    state.config.difficulty,
    secondsLeft,
    scoreMultiplier,
    targetGeometry
  )

  const rounds = state.rounds.map((round, index) => {
    if (index === state.currentRound) {
      return {
        ...round,
        guess,
        endTime: guess.timestamp,
        score,
      }
    }
    return round
  })

  return {
    ...state,
    rounds,
    totalScore: state.totalScore + score.totalScore,
  }
}

export function advanceRound(state: GameState): GameState {
  if (state.phase !== 'playing') {
    throw new Error('Game not in playing state')
  }

  const nextRound = state.currentRound + 1

  if (nextRound >= state.config.rounds) {
    return { ...state, phase: 'finished' }
  }

  return { ...state, currentRound: nextRound }
}

export function finishGame(state: GameState): GameState {
  return { ...state, phase: 'finished' }
}
