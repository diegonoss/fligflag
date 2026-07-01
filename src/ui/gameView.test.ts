import { describe, it, expect, beforeEach, vi } from 'vitest'

function createElement() {
  return {
    textContent: '',
    innerHTML: '',
    style: { display: '' },
    appendChild: vi.fn(),
    addEventListener: vi.fn(),
  }
}

const elements: Record<string, ReturnType<typeof createElement>> = {}

beforeEach(() => {
  elements['flag-display'] = createElement()
  elements['timer-display'] = createElement()
  elements['score-display'] = createElement()
  elements['round-display'] = createElement()
  elements['debug-answer-button'] = createElement()

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
