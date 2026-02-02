"use client";

import * as React from "react";

interface UseHorizontalWheelScrollOptions {
  /** Scroll speed multiplier (default: 1) */
  sensitivity?: number;
  /** Callback when scrolling occurs */
  onScroll?: () => void;
}

/**
 * Converts vertical mouse wheel scrolling into horizontal scrolling for a container.
 * Handles edge cases like boundary detection to allow normal page scrolling when at edges.
 */
export function useHorizontalWheelScroll<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: UseHorizontalWheelScrollOptions = {},
): void {
  const { sensitivity = 1, onScroll } = options;

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      // Only intercept when horizontal scrolling is possible
      const canScrollHorizontally = element.scrollWidth > element.clientWidth;
      if (!canScrollHorizontally) return;

      // Only handle vertical wheel (deltaY), ignore horizontal (deltaX, e.g., trackpad)
      if (event.deltaY === 0) return;

      // Check if at boundaries
      const isAtLeftEdge = element.scrollLeft <= 0;
      const isAtRightEdge =
        element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;

      const isScrollingDown = event.deltaY > 0;
      const isScrollingUp = event.deltaY < 0;

      // Allow normal page scrolling when at edges
      if (
        (isAtLeftEdge && isScrollingUp) ||
        (isAtRightEdge && isScrollingDown)
      ) {
        return;
      }

      event.preventDefault();
      element.scrollLeft += event.deltaY * sensitivity;
      onScroll?.();
    };

    // Must use non-passive to be able to call preventDefault
    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, [ref, sensitivity, onScroll]);
}
