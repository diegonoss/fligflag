import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mock DOM elements ---
function createMockElement(): Record<string, unknown> {
  const children: unknown[] = []
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {}
  const self: Record<string, unknown> = {
    children,
    className: '',
    innerHTML: '',
    style: { display: '' },
    appendChild: vi.fn((child: unknown) => {
      children.push(child)
      return child
    }),
    remove: vi.fn(),
    addEventListener: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners[event]) listeners[event] = []
      listeners[event]!.push(handler)
    }),
    querySelector: vi.fn((_selector: string) => null),
    _listeners: listeners,
    _click: function () {
      (listeners['click'] ?? []).forEach((fn) => fn())
    },
  }
  return self
}

let panel: ReturnType<typeof createMockElement>
let allElements: Map<string, ReturnType<typeof createMockElement>>

beforeEach(() => {
  panel = createMockElement()
  allElements = new Map()

  vi.stubGlobal('document', {
    getElementById: vi.fn((id: string) => {
      if (id === 'settings-panel') return panel
      // Return a mock element for any other ID so SettingsView.render() can wire listeners
      if (!allElements.has(id)) {
        allElements.set(id, createMockElement())
      }
      return allElements.get(id)!
    }),
    createElement: vi.fn((_tag: string) => createMockElement()),
  })
})

describe('SettingsView — help integration', () => {
  it('renders a "How to Play" button in the settings panel', async () => {
    const { SettingsView } = await import('./settingsView')
    new SettingsView()

    // The render() method sets innerHTML — the button should be in the HTML
    expect(panel.innerHTML as string).toContain('How to Play')
    expect(panel.innerHTML as string).toContain('<button')
  })

  it('clicking the "How to Play" button calls modal.show() end-to-end', async () => {
    const { SettingsView } = await import('./settingsView')
    const mockModal = { show: vi.fn(), hide: vi.fn() }
    const view = new SettingsView()

    view.setHelpModal(mockModal as unknown as { show: () => void; hide: () => void })

    // Simulate clicking the help button — the mock element has _click()
    // that fires registered click listeners
    const helpButton = allElements.get('settings-help-button')!
    expect(typeof (helpButton as any)._click).toBe('function')

    ;(helpButton as any)._click()

    // The click should have triggered showHelp() → modal.show()
    expect(mockModal.show).toHaveBeenCalledOnce()
  })

  it('setHelpModal stores the modal reference and exposes it for wiring', async () => {
    const { SettingsView } = await import('./settingsView')
    const modal = { show: vi.fn(), hide: vi.fn() }
    const view = new SettingsView()

    view.setHelpModal(modal as unknown as { show: () => void; hide: () => void })

    // After setting the modal, calling a public method to show help
    // should delegate to modal.show()
    view.showHelp()
    expect(modal.show).toHaveBeenCalledOnce()
  })

  it('showHelp does nothing when no helpModal has been set', async () => {
    const { SettingsView } = await import('./settingsView')
    const view = new SettingsView()

    // Should not throw even without a helpModal
    expect(() => view.showHelp()).not.toThrow()
  })
})
