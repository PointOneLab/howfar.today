import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Disables deck scroll-snap while a modal is open. */
export function useDeckScrollLock(deckRef: RefObject<HTMLDivElement>, locked: boolean): void {
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    if (locked) {
      deck.style.overflow = 'hidden';
      deck.style.scrollSnapType = 'none';
    } else {
      deck.style.overflow = '';
      deck.style.scrollSnapType = '';
    }
    return () => {
      deck.style.overflow = '';
      deck.style.scrollSnapType = '';
    };
  }, [deckRef, locked]);
}
