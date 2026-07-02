import { describe, it, expect, beforeEach, vi } from 'vitest'

// --- Mock DOM elements ---
function createMockElement(): Record<string, unknown> {
  const children: unknown[] = []
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
    addEventListener: vi.fn(),
    querySelector: vi.fn((_selector: string) => null),
    querySelectorAll: vi.fn((_selector: string) => []),
    focus: vi.fn(),
  }
  return self
}

let container: ReturnType<typeof createMockElement>
let createdElements: ReturnType<typeof createMockElement>[]
let docKeydownHandler: ((e: { key: string }) => void) | null = null

beforeEach(() => {
  container = createMockElement()
  createdElements = []
  docKeydownHandler = null

  vi.stubGlobal('document', {
    createElement: vi.fn((_tag: string) => {
      const el = createMockElement()
      createdElements.push(el)
      return el
    }),
    addEventListener: vi.fn((event: string, handler: Function) => {
      if (event === 'keydown') {
        docKeydownHandler = handler as (e: { key: string }) => void
      }
    }),
    removeEventListener: vi.fn(),
    activeElement: null,
  })
})

describe('HelpModal', () => {
  it('show() creates an overlay and appends it to the container', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    expect(document.createElement).toHaveBeenCalledWith('div')
    expect(container.appendChild).toHaveBeenCalled()
    expect(modal.isVisible()).toBe(true)
  })

  it('hide() removes the overlay and sets invisible', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()
    expect(modal.isVisible()).toBe(true)

    modal.hide()
    expect(modal.isVisible()).toBe(false)
  })

  it('toggle() switches between visible and hidden', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    expect(modal.isVisible()).toBe(false)

    modal.toggle()
    expect(modal.isVisible()).toBe(true)

    modal.toggle()
    expect(modal.isVisible()).toBe(false)
  })

  it('show() does not create a second overlay if already visible', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()
    const firstCallCount = (document.createElement as ReturnType<typeof vi.fn>).mock.calls.length

    modal.show()
    expect((document.createElement as ReturnType<typeof vi.fn>).mock.calls.length).toBe(firstCallCount)
  })

  it('renders the modal with a close button', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    // The overlay should have been appended, and its innerHTML should contain a close button
    const overlay = createdElements[0]!
    expect(overlay.innerHTML).toContain('help-modal-close')
  })

  it('renders kbd elements for control keycaps', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    const overlay = createdElements[0]!
    expect(overlay.innerHTML).toContain('<kbd')
  })

  it('hide() is idempotent when called on an already hidden modal', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    // Should not throw when hiding an already hidden modal
    expect(() => modal.hide()).not.toThrow()
    expect(modal.isVisible()).toBe(false)
  })

  it('overlay receives the correct CSS class name', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    const overlay = createdElements[0]!
    expect(overlay.className).toBe('help-modal-overlay')
  })

  // --- Polish / Accessibility tests (RED phase — behaviour not yet implemented) ---

  it('dismisses the modal when Escape key is pressed', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()
    expect(modal.isVisible()).toBe(true)

    // The implementation should register a document keydown handler.
    // Trigger Escape — the modal MUST hide.
    expect(docKeydownHandler).not.toBeNull()
    docKeydownHandler!({ key: 'Escape' })

    expect(modal.isVisible()).toBe(false)
  })

  it('does NOT dismiss the modal on non-Escape keys', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()
    expect(modal.isVisible()).toBe(true)

    docKeydownHandler!({ key: 'Enter' })
    expect(modal.isVisible()).toBe(true)

    docKeydownHandler!({ key: 'Space' })
    expect(modal.isVisible()).toBe(true)

    docKeydownHandler!({ key: 'Tab' })
    expect(modal.isVisible()).toBe(true)
  })

  it('renders the dialog with role="dialog" and aria-modal="true"', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    const overlay = createdElements[0]!
    expect(overlay.innerHTML).toContain('role="dialog"')
    expect(overlay.innerHTML).toContain('aria-modal="true"')
  })

  it('links the dialog label to the heading via aria-labelledby', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    const overlay = createdElements[0]!
    expect(overlay.innerHTML).toContain('aria-labelledby="help-modal-title"')
    expect(overlay.innerHTML).toContain('id="help-modal-title"')
  })

  it('renders an introductory paragraph explaining the game mechanics', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    const overlay = createdElements[0]!
    expect(overlay.innerHTML).toContain('help-modal-intro')
  })

  it('focuses the close button when the modal opens', async () => {
    // Create a dedicated close-button mock so we can assert focus() was called
    const closeButton = createMockElement()
    const overlay = createMockElement()
    ;(overlay.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(closeButton)

    vi.stubGlobal('document', {
      createElement: vi.fn((_tag: string) => overlay),
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (event === 'keydown') {
          docKeydownHandler = handler as (e: { key: string }) => void
        }
      }),
      removeEventListener: vi.fn(),
      activeElement: null,
    })

    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    // The close button should have received focus
    expect(closeButton.focus).toHaveBeenCalled()
  })

  it('cleans up the document keydown listener when modal is hidden', async () => {
    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()
    expect(docKeydownHandler).not.toBeNull()

    // After hide, the handler should be removed
    modal.hide()
    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
  })

  it('traps Tab from last focusable back to first', async () => {
    const closeButton = createMockElement()
    const overlay = createMockElement()
    ;(overlay.querySelector as ReturnType<typeof vi.fn>).mockReturnValue(closeButton)
    ;(overlay.querySelectorAll as ReturnType<typeof vi.fn>).mockReturnValue([closeButton])

    // Capture overlay's keydown listener so we can trigger it
    let overlayKeydownHandler: ((e: { key: string; shiftKey?: boolean; preventDefault: () => void }) => void) | null = null
    const origAdd = overlay.addEventListener as ReturnType<typeof vi.fn>
    origAdd.mockImplementation((event: string, handler: Function) => {
      if (event === 'keydown') {
        overlayKeydownHandler = handler as typeof overlayKeydownHandler
      }
    })

    vi.stubGlobal('document', {
      createElement: vi.fn((_tag: string) => overlay),
      addEventListener: vi.fn((event: string, handler: Function) => {
        if (event === 'keydown') {
          docKeydownHandler = handler as (e: { key: string }) => void
        }
      }),
      removeEventListener: vi.fn(),
      activeElement: closeButton, // simulate: focus is on last (and only) focusable
    })

    const { HelpModal } = await import('./helpModal')
    const modal = new HelpModal(container as unknown as HTMLElement)

    modal.show()

    // Tab at last focusable should wrap to first
    const preventDefault = vi.fn()
    overlayKeydownHandler!({ key: 'Tab', shiftKey: false, preventDefault })

    expect(preventDefault).toHaveBeenCalled()
    expect(closeButton.focus).toHaveBeenCalled()
  })
})
