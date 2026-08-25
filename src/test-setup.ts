import '@testing-library/jest-dom'

// Mock clipboard API globally for tests
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// jsdom has no layout engine, so it has no ResizeObserver either. Anything that measures itself to
// fit - the park, which scales to the panel it is given - throws on mount without this. It reports
// nothing, which is honest: in jsdom every box is zero by zero.
if (!('ResizeObserver' in globalThis)) {
  (globalThis as any).ResizeObserver = class {
    observe() { /* nothing to report: jsdom does not lay anything out */ }
    unobserve() { /* as above */ }
    disconnect() { /* as above */ }
  };
}

// Nor does it have PointerEvent, so a drag cannot be acted out without this. It is MouseEvent plus
// a pointerId, which is all a drag handler reads.
if (!('PointerEvent' in globalThis)) {
  (globalThis as any).PointerEvent = class extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
    }
  };
}

// Declare vi globally for test setup
declare global {
  const vi: any;
}