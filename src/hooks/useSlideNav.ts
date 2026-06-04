import { useCallback, useEffect } from 'react';
import type { RefObject } from 'react';

function isEditingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
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
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      if (isEditingTarget(document.activeElement)) return;
      const deck = deckRef.current;
      if (!deck) return;

      event.preventDefault();
      const current = Math.round(deck.scrollTop / deck.clientHeight);
      goTo(event.key === 'ArrowDown' ? current + 1 : current - 1);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deckRef, goTo]);

  return { goTo };
}
