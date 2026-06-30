import { GlobeRenderer } from '../rendering/globeRenderer'
import { Starfield } from '../rendering/starfield'
import { GameView } from '../ui/gameView'
import { SettingsView } from '../ui/settingsView'
import { loadCountries } from '../data/loadCountries'
import type { CountryRecord } from '../data/countryTypes'
import { createGame, startGame, startRound, submitGuess, advanceRound, getTargetLatLon } from '../domain/gameEngine'
import { getDifficultyConfig } from '../domain/difficulty'
import type { GameConfig, GameState, CountryTarget, LatLon } from '../domain/types'

export class AppController {
  private countries: CountryRecord[] = []
  private gameState: GameState | null = null
  private globeRenderer: GlobeRenderer
  private starfield: Starfield
  private gameView: GameView
  private settingsView: SettingsView
  private timerInterval: number | null = null
  private flagTimeout: number | null = null

  constructor() {
    const container = document.getElementById('globe-container')!
    this.globeRenderer = new GlobeRenderer(container)
    this.starfield = new Starfield(this.globeRenderer.getScene())
    this.gameView = new GameView()
    this.settingsView = new SettingsView()

    this.settingsView.onStart((config) => this.startGame(config))
    this.globeRenderer.onClick((latLon) => this.handleGlobeClick(latLon))
    this.gameView.onDebugAnswer(() => this.handleDebugAnswer())
  }

  public async init(): Promise<void> {
    try {
      this.countries = await loadCountries()
    } catch (error) {
      console.error('Failed to load countries:', error)
      document.body.innerHTML = '<div style="color: red; padding: 20px;">Failed to load game data. Please refresh.</div>'
    }
  }

  private startGame(config: GameConfig): void {
    const shuffled = [...this.countries].sort(() => Math.random() - 0.5)
    const targets: CountryTarget[] = shuffled.map((country) => ({
      id: country.cca3,
      name: country.name,
      capital: country.capital,
      latLon: country.countryLatLon,
      capitalLatLon: country.capitalLatLon,
      flagUrl: country.flagUrl,
      geometry: country.geometry,
    }))

    this.gameState = createGame(config)
    this.gameState = startGame(this.gameState, targets)
    this.settingsView.hide()
    this.globeRenderer.setCountryDelimiters(targets, config.showCountryDelimiters)
    this.startCurrentRound()
  }

  private startCurrentRound(): void {
    if (!this.gameState) return

    this.gameState = startRound(this.gameState, Date.now())
    const round = this.gameState.rounds[this.gameState.currentRound]
    if (!round) return

    this.globeRenderer.clearAnswerMarker()
    this.gameView.update(this.gameState)
    this.gameView.showFlag(round.target.flagUrl, `Flag of ${round.target.name}`)
    this.gameView.setDebugButtonVisible(true)

    const config = getDifficultyConfig(this.gameState.config.difficulty)

    if (this.gameState.config.difficulty === 'easy') {
      if (this.gameState.config.mode === 'country') {
        this.gameView.showTargetHint(round.target.name)
      } else {
        this.gameView.showTargetHint(`${round.target.capital}, ${round.target.name}`)
      }
    }

    if (config.flagVisibleSeconds !== null) {
      this.flagTimeout = window.setTimeout(() => {
        this.gameView.hideFlag()
      }, config.flagVisibleSeconds * 1000)
    }

    if (config.timerSeconds !== null) {
      this.startTimer(config.timerSeconds)
    }
  }

  private startTimer(seconds: number): void {
    let remaining = seconds
    this.gameView.updateTimer(remaining)

    this.timerInterval = window.setInterval(() => {
      remaining--
      this.gameView.updateTimer(remaining)

      if (remaining <= 0) {
        this.stopTimer()
        this.handleTimeout()
      }
    }, 1000)
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  private handleTimeout(): void {
    if (!this.gameState) return

    const round = this.gameState.rounds[this.gameState.currentRound]
    if (!round) return

    this.gameView.showRoundResult(round)
    setTimeout(() => this.advanceToNextRound(), 2000)
  }

  private handleGlobeClick(latLon: LatLon): void {
    if (!this.gameState || this.gameState.phase !== 'playing') return

    const currentRound = this.gameState.rounds[this.gameState.currentRound]
    if (!currentRound || currentRound.guess) return

    this.stopTimer()
    if (this.flagTimeout !== null) {
      clearTimeout(this.flagTimeout)
      this.flagTimeout = null
    }

    const guess = {
      latLon,
      timestamp: Date.now(),
    }

    this.gameState = submitGuess(this.gameState, guess)
    const round = this.gameState.rounds[this.gameState.currentRound]
    if (round) {
      this.gameView.showRoundResult(round)
    }

    setTimeout(() => this.advanceToNextRound(), 2000)
  }

  private advanceToNextRound(): void {
    if (!this.gameState) return

    this.gameState = advanceRound(this.gameState)

    if (this.gameState.phase === 'finished') {
      this.showResults()
    } else {
      this.startCurrentRound()
    }
  }

  private handleDebugAnswer(): void {
    if (!this.gameState || this.gameState.phase !== 'playing') return

    const round = this.gameState.rounds[this.gameState.currentRound]
    if (!round) return

    const targetLatLon = getTargetLatLon(round.target, this.gameState.config.mode)
    this.globeRenderer.showAnswerMarker(targetLatLon)
  }

  private showResults(): void {
    if (!this.gameState) return

    this.gameView.setDebugButtonVisible(false)
    this.globeRenderer.clearAnswerMarker()

    const resultsPanel = document.getElementById('results-panel')!
    resultsPanel.innerHTML = `
      <h2>Game Over!</h2>
      <p>Final Score: ${this.gameState.totalScore}</p>
      <button id="play-again">Play Again</button>
    `

    const button = document.getElementById('play-again')!
    button.addEventListener('click', () => {
      resultsPanel.innerHTML = ''
      this.settingsView.show()
    })
  }
}
