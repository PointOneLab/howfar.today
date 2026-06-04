import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Peak darkness applied to a slide once it is a full screen out of view. */
const MAX_MASK = 0.6;

/**
 * Darkens slides as they leave the viewport and lightens them as they enter,
 * producing a "fade through black" transition during swipes. Each slide's
 * `--mask-opacity` custom property is updated directly (no React re-render) on
 * scroll, throttled with requestAnimationFrame.
 */
export function useScrollMask(deckRef: RefObject<HTMLDivElement>): void {
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const height = deck.clientHeight || 1;
      const scrollTop = deck.scrollTop;
      for (const child of Array.from(deck.children)) {
        const slide = child as HTMLElement;
        const distance = Math.min(1, Math.abs(slide.offsetTop - scrollTop) / height);
        slide.style.setProperty('--mask-opacity', String(distance * MAX_MASK));
      }
    };

    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    update();
    deck.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      deck.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [deckRef]);
}
