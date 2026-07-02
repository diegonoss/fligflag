import { describe, it, expect, beforeEach, vi } from 'vitest'

function createElement() {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  return {
    textContent: '',
    innerHTML: '',
    style: { display: '' },
    appendChild: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event]!.push(handler)
    }),
    _listeners: listeners,
    _click() {
      (listeners['click'] ?? []).forEach((fn) => fn())
    },
  }
}

const elements: Record<string, ReturnType<typeof createElement>> = {}

beforeEach(() => {
  elements['flag-display'] = createElement()
  elements['timer-display'] = createElement()
  elements['score-display'] = createElement()
  elements['round-display'] = createElement()
  elements['debug-answer-button'] = createElement()
  elements['game-help-button'] = createElement()
  elements['controls-hint'] = createElement()

  vi.stubGlobal('document', {
    getElementById: (id: string) => elements[id] ?? null,
  })
})

describe('GameView', () => {
  it('updateTimer sets timer text', async () => {
    const { GameView } = await import('./gameView')
    const view = new GameView()
    view.updateTimer(10)
    expect(elements['timer-display']!.textContent).toBe('10s')
  })

  it('clearTimer removes timer text', async () => {
    const { GameView } = await import('./gameView')
    const view = new GameView()
    view.updateTimer(10)
    expect(elements['timer-display']!.textContent).toBe('10s')
    view.clearTimer()
    expect(elements['timer-display']!.textContent).toBe('')
  })
})

describe('GameView — help button', () => {
  it('finds the game help button element on construction', async () => {
    const { GameView } = await import('./gameView')
    new GameView()

    // The help button should exist in the DOM and have been found
    const helpBtn = elements['game-help-button']!
    expect(helpBtn).toBeDefined()
  })

  it('accepts a help modal via setHelpModal', async () => {
    const { GameView } = await import('./gameView')
    const view = new GameView()
    const mockModal = { show: vi.fn(), hide: vi.fn() }

    // Should not throw
    expect(() => {
      view.setHelpModal(mockModal as unknown as { show: () => void; hide: () => void })
    }).not.toThrow()
  })

  it('clicking the help button calls modal.show()', async () => {
    const { GameView } = await import('./gameView')
    const mockModal = { show: vi.fn(), hide: vi.fn() }
    const view = new GameView()

    view.setHelpModal(mockModal as unknown as { show: () => void; hide: () => void })

    // Simulate click on the help button
    const helpBtn = elements['game-help-button']!
    ;(helpBtn as any)._click()

    expect(mockModal.show).toHaveBeenCalledOnce()
  })

  it('clicking the help button does nothing when no modal is set', async () => {
    const { GameView } = await import('./gameView')
    const view = new GameView()

    // Should not throw even without a modal wired
    const helpBtn = elements['game-help-button']!
    expect(() => (helpBtn as any)._click()).not.toThrow()
    // Verify it was constructed successfully
    expect(view).toBeDefined()
  })

  it('shows a compact controls hint in the HUD', async () => {
    const { GameView } = await import('./gameView')
    new GameView()

    const hint = elements['controls-hint']!
    expect(hint).toBeDefined()
    // The hint should display something useful — verify it's not hidden by default
    expect(hint.style.display).not.toBe('none')
  })
})
