import type { Difficulty } from './types'

export interface DifficultyConfig {
  timerSeconds: number | null
  flagVisibleSeconds: number | null
}

const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    timerSeconds: null,
    flagVisibleSeconds: null,
  },
  normal: {
    timerSeconds: 30,
    flagVisibleSeconds: null,
  },
  hard: {
    timerSeconds: 10,
    flagVisibleSeconds: 3,
  },
}

export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty]
}
