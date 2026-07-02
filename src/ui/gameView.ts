import type { GameState, Round } from '../domain/types'

export class GameView {
  private flagDisplay: HTMLElement
  private timerDisplay: HTMLElement
  private scoreDisplay: HTMLElement
  private roundDisplay: HTMLElement
  private debugButton: HTMLElement
  private helpButton: HTMLElement
  private controlsHint: HTMLElement
  private debugCallback?: () => void
  private helpModal?: { show(): void; hide(): void }

  constructor() {
    this.flagDisplay = document.getElementById('flag-display')!
    this.timerDisplay = document.getElementById('timer-display')!
    this.scoreDisplay = document.getElementById('score-display')!
    this.roundDisplay = document.getElementById('round-display')!
    this.debugButton = document.getElementById('debug-answer-button')!
    this.helpButton = document.getElementById('game-help-button')!
    this.controlsHint = document.getElementById('controls-hint')!
    this.debugButton.style.display = 'none'
    this.debugButton.addEventListener('click', () => {
      if (this.debugCallback) this.debugCallback()
    })
    this.helpButton.addEventListener('click', () => this.showHelp())
    this.renderControlsHint()
  }

  public setHelpModal(modal: { show(): void; hide(): void }): void {
    this.helpModal = modal
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

  public showTargetHint(text: string): void {
    const div = document.createElement('div')
    div.textContent = text
    this.flagDisplay.appendChild(div)
  }

  public updateTimer(secondsLeft: number): void {
    this.timerDisplay.textContent = `${secondsLeft}s`
  }

  public clearTimer(): void {
    this.timerDisplay.textContent = ''
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

  public onDebugAnswer(callback: () => void): void {
    this.debugCallback = callback
  }

  public setDebugButtonVisible(visible: boolean): void {
    this.debugButton.style.display = visible ? 'block' : 'none'
  }

  public showHelp(): void {
    this.helpModal?.show()
  }

  private renderControlsHint(): void {
    this.controlsHint.innerHTML = `
      <span class="hint-icon">🖱️</span>
      <span>Click globe to guess</span>
      <span class="hint-separator">|</span>
      <span class="hint-icon">⌨️</span>
      <span>Space = reset view</span>
    `
  }
}
