import { useEffect } from 'react';
import type { RefObject } from 'react';
import { applyEasing } from '@/core/motion/easing';

interface ScrollMaskOptions {
  maxMaskPct: number;
  motionEasing: string;
}

export function useScrollMask(
  deckRef: RefObject<HTMLDivElement>,
  { maxMaskPct, motionEasing }: ScrollMaskOptions,
): void {
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    const maxMask = Math.min(1, Math.max(0, maxMaskPct / 100));
    let frame = 0;

    const update = () => {
      frame = 0;
      const height = deck.clientHeight || 1;
      const scrollTop = deck.scrollTop;
      for (const child of Array.from(deck.children)) {
        const slide = child as HTMLElement;
        const distance = Math.min(1, Math.abs(slide.offsetTop - scrollTop) / height);
        const eased = applyEasing(distance, motionEasing);
        slide.style.setProperty('--mask-opacity', String(eased * maxMask));
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
  }, [deckRef, maxMaskPct, motionEasing]);
}
