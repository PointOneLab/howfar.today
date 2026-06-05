import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

const MOUSE_WHEEL_STEP_THRESHOLD = 40;
const WHEEL_NAV_COOLDOWN_MS = 420;

function isEditingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

function isDiscreteMouseWheel(event: WheelEvent): boolean {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE || event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return true;
  }
  // Pixel-mode wheel events from classic mice are typically larger, bursty deltas.
  const absY = Math.abs(event.deltaY);
  const absX = Math.abs(event.deltaX);
  return absY >= MOUSE_WHEEL_STEP_THRESHOLD && absY >= absX * 1.2;
}

/**
 * Wires page-level slide navigation for a scroll-snap deck.
 *
 * Up/Down arrows move between full-screen slides, but only when the user is not
 * actively editing a grid input (so the grid keeps its own keyboard layer).
 * Returns a `goTo(index)` helper for programmatic navigation.
 */
export function useSlideNav(deckRef: RefObject<HTMLDivElement>): { goTo: (index: number) => void } {
  const goTo = useCallback(
    (index: number) => {
      const deck = deckRef.current;
      if (!deck) return;
      const slideHeight = deck.clientHeight;
      const count = deck.children.length;
      const clamped = Math.min(count - 1, Math.max(0, index));
      deck.scrollTo({ top: clamped * slideHeight, behavior: 'smooth' });
    },
    [deckRef],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.code === 'Space') {
        if (!isEditingTarget(document.activeElement)) {
          event.preventDefault();
        }
        return;
      }
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (isEditingTarget(document.activeElement)) return;
      const deck = deckRef.current;
      if (!deck) return;

      event.preventDefault();
      const current = Math.round(deck.scrollTop / deck.clientHeight);
      goTo(event.key === 'ArrowDown' ? current + 1 : current - 1);
    };

    let wheelLocked = false;
    let wheelUnlockTimer = 0;
    const onWheel = (event: WheelEvent) => {
      const deck = deckRef.current;
      if (!deck) return;
      if (isEditingTarget(document.activeElement)) return;
      if (!isDiscreteMouseWheel(event)) return;
      if (event.ctrlKey) return;

      event.preventDefault();
      if (wheelLocked) return;
      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
      if (direction === 0) return;

      const current = Math.round(deck.scrollTop / deck.clientHeight);
      goTo(current + direction);

      wheelLocked = true;
      wheelUnlockTimer = window.setTimeout(() => {
        wheelLocked = false;
      }, WHEEL_NAV_COOLDOWN_MS);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('wheel', onWheel);
      if (wheelUnlockTimer) window.clearTimeout(wheelUnlockTimer);
    };
  }, [deckRef, goTo]);

  return { goTo };
}
