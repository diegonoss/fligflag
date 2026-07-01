import type { CountryTarget, Difficulty } from './types'

const KNOWN_COUNTRY_IDS: Set<string> = new Set([
  'ARG', 'ESP', 'FRA', 'USA', 'GBR', 'BRA', 'CAN', 'MEX',
  'DEU', 'ITA', 'JPN', 'CHN', 'IND', 'AUS', 'RUS', 'ZAF',
  'EGY', 'PRT', 'NLD', 'CHL', 'COL', 'PER', 'URY',
  'TUR', 'GRC', 'CHE', 'SWE', 'NOR', 'POL', 'UKR', 'THA',
  'VNM', 'KOR', 'PRK', 'IRN', 'IRQ', 'SAU', 'ISR', 'NGA',
  'KEN', 'MAR', 'NZL', 'IDN', 'PHL', 'MYS', 'SGP', 'PAK',
  'BGD', 'VEN', 'ECU', 'BOL', 'PRY', 'CUB', 'DOM', 'HTI',
  'JAM', 'TTO', 'GTM', 'HND', 'SLV', 'NIC', 'CRI', 'PAN',
])

const WEIGHT_CONFIGS: Record<Difficulty, { known: number; other: number }> = {
  easy: { known: 40, other: 1 },
  normal: { known: 4, other: 2 },
  hard: { known: 1, other: 4 },
}

export function getCountrySelectionWeight(
  target: CountryTarget,
  difficulty: Difficulty
): number {
  const config = WEIGHT_CONFIGS[difficulty]
  return KNOWN_COUNTRY_IDS.has(target.id) ? config.known : config.other
}

export function selectRoundTargets(
  targets: CountryTarget[],
  difficulty: Difficulty,
  rounds: number,
  random: () => number = Math.random
): CountryTarget[] {
  const seen = new Set<string>()
  const unique: CountryTarget[] = []
  for (const target of targets) {
    if (!seen.has(target.id)) {
      seen.add(target.id)
      unique.push(target)
    }
  }

  if (unique.length < rounds) {
    throw new Error('Not enough unique targets for requested rounds')
  }

  const pool = [...unique]
  const selected: CountryTarget[] = []

  for (let i = 0; i < rounds; i++) {
    const weights = pool.map((t) => getCountrySelectionWeight(t, difficulty))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let roll = random() * totalWeight

    let pickIndex = pool.length - 1
    for (let j = 0; j < pool.length; j++) {
      roll -= weights[j]!
      if (roll <= 0) {
        pickIndex = j
        break
      }
    }

    const picked = pool[pickIndex]!
    selected.push(picked)
    pool.splice(pickIndex, 1)
  }

  return selected
}
