export class HelpModal {
  private overlay: HTMLElement | null = null
  private readonly container: HTMLElement
  private boundKeydown: ((e: KeyboardEvent) => void) | null = null

  constructor(container: HTMLElement) {
    this.container = container
  }

  public show(): void {
    if (this.overlay) return

    this.overlay = document.createElement('div')
    this.overlay.className = 'help-modal-overlay'
    this.overlay.innerHTML = this.renderContent()

    this.wireEvents()
    this.container.appendChild(this.overlay)

    // Focus trap: focus the close button (first focusable element)
    const closeButton = this.overlay.querySelector('.help-modal-close') as HTMLElement | null
    closeButton?.focus()
  }

  public hide(): void {
    if (!this.overlay) return
    this.teardownEvents()
    this.overlay.remove()
    this.overlay = null
  }

  public toggle(): void {
    if (this.overlay) {
      this.hide()
    } else {
      this.show()
    }
  }

  public isVisible(): boolean {
    return this.overlay !== null
  }

  private renderContent(): string {
    return `
      <div class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-modal-title">
        <button class="help-modal-close" aria-label="Close help">&times;</button>
        <div class="help-modal-content">
          <h2 id="help-modal-title">Controls</h2>
          <p class="help-modal-intro">Click on the globe to start. Use these controls:</p>
          <ul class="help-modal-controls">
            <li>
              <kbd>Left click</kbd> + drag or <kbd>Right click</kbd> + drag
              <span class="help-modal-desc">Move the globe</span>
            </li>
            <li>
              <kbd>Left click</kbd>
              <span class="help-modal-desc">Select guess</span>
            </li>
            <li>
              <kbd>Space</kbd>
              <span class="help-modal-desc">Restore zoom and rotation</span>
            </li>
          </ul>
        </div>
      </div>
    `
  }

  private wireEvents(): void {
    if (!this.overlay) return

    const closeButton = this.overlay.querySelector('.help-modal-close')
    closeButton?.addEventListener('click', () => this.hide())

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide()
      }
    })

    // Escape key → dismiss modal
    this.boundKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.hide()
    }
    document.addEventListener('keydown', this.boundKeydown)

    // Tab trap within modal
    this.overlay.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusableSelector =
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      const focusable = Array.from(
        this.overlay!.querySelectorAll(focusableSelector),
      ) as HTMLElement[]

      if (focusable.length === 0) return

      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    })
  }

  private teardownEvents(): void {
    if (this.boundKeydown) {
      document.removeEventListener('keydown', this.boundKeydown)
      this.boundKeydown = null
    }
  }
}
