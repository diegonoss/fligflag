import type { GameConfig, Difficulty, GameMode } from '../domain/types'

export class SettingsView {
  private panel: HTMLElement
  private onStartCallback?: (config: GameConfig) => void
  private helpModal?: { show(): void; hide(): void }

  constructor() {
    this.panel = document.getElementById('settings-panel')!
    this.render()
  }

  private render(): void {
    this.panel.innerHTML = `
      <div class="settings-title">
        <h1>FligFlag</h1>
        <p class="settings-subtitle">Geography Challenge</p>
      </div>
      <div class="settings-section">
        <h3 class="settings-section-title">Difficulty &amp; Mode</h3>
        <div>
          <label for="difficulty">Difficulty:</label>
          <select id="difficulty">
            <option value="easy">Easy</option>
            <option value="normal" selected>Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label for="mode">Mode:</label>
          <select id="mode">
            <option value="country" selected>Country</option>
            <option value="capital">Capital</option>
          </select>
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section-title">Game Settings</h3>
        <div>
          <label for="rounds">Rounds:</label>
          <select id="rounds">
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
        <div>
          <label>
            <input type="checkbox" id="country-delimiters" />
            Show country borders (score reduced to 75%)
          </label>
        </div>
      </div>
      <div class="settings-actions">
        <button id="start-game" class="primary-button">Start Game</button>
        <button id="settings-help-button" class="help-trigger-button">How to Play</button>
      </div>
    `

    const button = document.getElementById('start-game')!
    button.addEventListener('click', () => this.handleStart())

    const helpButton = document.getElementById('settings-help-button')!
    helpButton.addEventListener('click', () => this.showHelp())
  }

  private handleStart(): void {
    const difficulty = (document.getElementById('difficulty') as HTMLSelectElement).value as Difficulty
    const mode = (document.getElementById('mode') as HTMLSelectElement).value as GameMode
    const rounds = parseInt((document.getElementById('rounds') as HTMLSelectElement).value, 10)
    const showCountryDelimiters = (document.getElementById('country-delimiters') as HTMLInputElement).checked

    if (![5, 10, 20, 50].includes(rounds)) {
      alert('Invalid rounds count')
      return
    }

    if (this.onStartCallback) {
      this.onStartCallback({ difficulty, mode, rounds, showCountryDelimiters })
    }
  }

  public onStart(callback: (config: GameConfig) => void): void {
    this.onStartCallback = callback
  }

  public hide(): void {
    this.panel.style.display = 'none'
  }

  public show(): void {
    this.panel.style.display = 'block'
  }

  public setHelpModal(modal: { show(): void; hide(): void }): void {
    this.helpModal = modal
  }

  public showHelp(): void {
    this.helpModal?.show()
  }
}
