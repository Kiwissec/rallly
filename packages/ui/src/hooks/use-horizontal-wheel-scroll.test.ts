import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useHorizontalWheelScroll } from "./use-horizontal-wheel-scroll";

function createMockElement(overrides: Partial<HTMLDivElement> = {}) {
  const listeners: Map<string, EventListener> = new Map();

  const element = {
    scrollWidth: 200,
    clientWidth: 100,
    scrollHeight: 100,
    clientHeight: 100,
    scrollLeft: 50,
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners.set(event, handler);
    }),
    removeEventListener: vi.fn((event: string) => {
      listeners.delete(event);
    }),
    dispatchWheel: (eventInit: WheelEventInit) => {
      const wheelHandler = listeners.get("wheel");
      if (wheelHandler) {
        const event = new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          ...eventInit,
        });
        wheelHandler(event);
        return event;
      }
      return null;
    },
    ...overrides,
  } as unknown as HTMLDivElement & {
    dispatchWheel: (init: WheelEventInit) => WheelEvent | null;
  };

  return element;
}

describe("useHorizontalWheelScroll", () => {
  let element: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    element = createMockElement();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ref callback", () => {
    it("should set element when ref callback is called with a node", () => {
      const { result } = renderHook(() => useHorizontalWheelScroll());

      expect(result.current.element).toBeNull();

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      expect(result.current.element).toBe(element);
    });

    it("should clear element when ref callback is called with null", () => {
      const { result } = renderHook(() => useHorizontalWheelScroll());

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      expect(result.current.element).toBe(element);

      act(() => {
        result.current.ref(null);
      });

      expect(result.current.element).toBeNull();
    });
  });

  describe("wheel event handling", () => {
    it("should convert vertical scroll to horizontal scroll", () => {
      const { result } = renderHook(() => useHorizontalWheelScroll());

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      const event = element.dispatchWheel({ deltaY: 10 });

      expect(event?.defaultPrevented).toBe(true);
      expect(element.scrollLeft).toBe(60);
    });

    it("should apply sensitivity multiplier", () => {
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ sensitivity: 2 }),
      );

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      element.dispatchWheel({ deltaY: 10 });

      expect(element.scrollLeft).toBe(70);
    });

    it("should call onScroll callback when scrolling", () => {
      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      element.dispatchWheel({ deltaY: 10 });

      expect(onScroll).toHaveBeenCalledTimes(1);
    });
  });

  describe("zoom gesture bypass", () => {
    it("should not intercept Ctrl+wheel (zoom gesture)", () => {
      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      const event = element.dispatchWheel({ deltaY: 10, ctrlKey: true });

      expect(event?.defaultPrevented).toBe(false);
      expect(element.scrollLeft).toBe(50);
      expect(onScroll).not.toHaveBeenCalled();
    });

    it("should not intercept Cmd+wheel (zoom gesture on macOS)", () => {
      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      const event = element.dispatchWheel({ deltaY: 10, metaKey: true });

      expect(event?.defaultPrevented).toBe(false);
      expect(element.scrollLeft).toBe(50);
      expect(onScroll).not.toHaveBeenCalled();
    });
  });

  describe("vertical scroll priority", () => {
    it("should not intercept when container can scroll vertically", () => {
      const verticalElement = createMockElement({
        scrollHeight: 200,
        clientHeight: 100,
      });

      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(verticalElement as unknown as HTMLDivElement);
      });

      const event = verticalElement.dispatchWheel({ deltaY: 10 });

      expect(event?.defaultPrevented).toBe(false);
      expect(onScroll).not.toHaveBeenCalled();
    });
  });

  describe("boundary detection", () => {
    it("should not intercept when at left edge and scrolling up", () => {
      const leftEdgeElement = createMockElement({ scrollLeft: 0 });

      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(leftEdgeElement as unknown as HTMLDivElement);
      });

      const event = leftEdgeElement.dispatchWheel({ deltaY: -10 });

      expect(event?.defaultPrevented).toBe(false);
      expect(onScroll).not.toHaveBeenCalled();
    });

    it("should intercept when at left edge and scrolling down", () => {
      const leftEdgeElement = createMockElement({ scrollLeft: 0 });

      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(leftEdgeElement as unknown as HTMLDivElement);
      });

      const event = leftEdgeElement.dispatchWheel({ deltaY: 10 });

      expect(event?.defaultPrevented).toBe(true);
      expect(onScroll).toHaveBeenCalled();
    });

    it("should not intercept when at right edge and scrolling down", () => {
      const rightEdgeElement = createMockElement({ scrollLeft: 100 });

      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(rightEdgeElement as unknown as HTMLDivElement);
      });

      const event = rightEdgeElement.dispatchWheel({ deltaY: 10 });

      expect(event?.defaultPrevented).toBe(false);
      expect(onScroll).not.toHaveBeenCalled();
    });

    it("should intercept when at right edge and scrolling up", () => {
      const rightEdgeElement = createMockElement({ scrollLeft: 100 });

      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(rightEdgeElement as unknown as HTMLDivElement);
      });

      const event = rightEdgeElement.dispatchWheel({ deltaY: -10 });

      expect(event?.defaultPrevented).toBe(true);
      expect(onScroll).toHaveBeenCalled();
    });
  });

  describe("trackpad horizontal scroll", () => {
    it("should ignore horizontal wheel events (deltaX from trackpad)", () => {
      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      const event = element.dispatchWheel({ deltaY: 0, deltaX: 10 });

      expect(event?.defaultPrevented).toBe(false);
      expect(element.scrollLeft).toBe(50);
      expect(onScroll).not.toHaveBeenCalled();
    });
  });

  describe("no horizontal overflow", () => {
    it("should not intercept when container has no horizontal overflow", () => {
      const noOverflowElement = createMockElement({
        scrollWidth: 100,
        clientWidth: 100,
      });

      const onScroll = vi.fn();
      const { result } = renderHook(() =>
        useHorizontalWheelScroll({ onScroll }),
      );

      act(() => {
        result.current.ref(noOverflowElement as unknown as HTMLDivElement);
      });

      const event = noOverflowElement.dispatchWheel({ deltaY: 10 });

      expect(event?.defaultPrevented).toBe(false);
      expect(onScroll).not.toHaveBeenCalled();
    });
  });

  describe("event listener cleanup", () => {
    it("should add event listener when element is set", () => {
      const { result } = renderHook(() => useHorizontalWheelScroll());

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      expect(element.addEventListener).toHaveBeenCalledWith(
        "wheel",
        expect.any(Function),
        { passive: false },
      );
    });

    it("should remove event listener when element is cleared", () => {
      const { result } = renderHook(() => useHorizontalWheelScroll());

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      act(() => {
        result.current.ref(null);
      });

      expect(element.removeEventListener).toHaveBeenCalledWith(
        "wheel",
        expect.any(Function),
      );
    });

    it("should remove event listener on unmount", () => {
      const { result, unmount } = renderHook(() => useHorizontalWheelScroll());

      act(() => {
        result.current.ref(element as unknown as HTMLDivElement);
      });

      unmount();

      expect(element.removeEventListener).toHaveBeenCalledWith(
        "wheel",
        expect.any(Function),
      );
    });
  });
});
