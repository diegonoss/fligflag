import type { GameState, Round } from '../domain/types'

export class GameView {
  private flagDisplay: HTMLElement
  private timerDisplay: HTMLElement
  private scoreDisplay: HTMLElement
  private roundDisplay: HTMLElement

  constructor() {
    this.flagDisplay = document.getElementById('flag-display')!
    this.timerDisplay = document.getElementById('timer-display')!
    this.scoreDisplay = document.getElementById('score-display')!
    this.roundDisplay = document.getElementById('round-display')!
  }

  public showFlag(url: string, alt: string): void {
    this.flagDisplay.innerHTML = ''
    const img = document.createElement('img')
    img.src = url
    img.alt = alt
    this.flagDisplay.appendChild(img)
  }

  public hideFlag(): void {
    this.flagDisplay.innerHTML = ''
  }

  public showCountryName(name: string): void {
    const div = document.createElement('div')
    div.textContent = name
    this.flagDisplay.appendChild(div)
  }

  public updateTimer(secondsLeft: number): void {
    this.timerDisplay.textContent = `${secondsLeft}s`
  }

  public updateScore(score: number): void {
    this.scoreDisplay.textContent = `Score: ${score}`
  }

  public updateRound(current: number, total: number): void {
    this.roundDisplay.textContent = `Round ${current + 1}/${total}`
  }

  public showRoundResult(round: Round): void {
    if (!round.score) return
    const message = `Base: ${round.score.baseScore} | Time Bonus: ${round.score.timeBonus} | Total: ${round.score.totalScore}`
    const div = document.createElement('div')
    div.textContent = message
    this.flagDisplay.appendChild(div)
  }

  public update(state: GameState): void {
    this.updateScore(state.totalScore)
    this.updateRound(state.currentRound, state.config.rounds)
  }
}
