export interface LatLon {
  lat: number
  lon: number
}

export type CountryId = string

export interface CountryTarget {
  id: CountryId
  name: string
  capital: string
  latLon: LatLon
  capitalLatLon: LatLon
  flagUrl: string
  geometry: GeoJSON.Feature
}

export type GameMode = 'country' | 'capital'

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface GameConfig {
  mode: GameMode
  difficulty: Difficulty
  rounds: number
  showCountryDelimiters: boolean
}

export interface Round {
  index: number
  target: CountryTarget
  startTime: number
  endTime?: number
  guess?: Guess
  score?: ScoreBreakdown
}

export interface Guess {
  latLon: LatLon
  timestamp: number
}

export interface ScoreBreakdown {
  baseScore: number
  timeBonus: number
  totalScore: number
}

export type GamePhase = 'setup' | 'playing' | 'finished'

export interface GameState {
  phase: GamePhase
  config: GameConfig
  currentRound: number
  rounds: Round[]
  totalScore: number
}
