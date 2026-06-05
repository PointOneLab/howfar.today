import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useClock } from '@/hooks/useClock';
import { useDayView, useWindowSync } from '@/hooks/useDayView';
import { useSlideNav } from '@/hooks/useSlideNav';
import { useScrollMask } from '@/hooks/useScrollMask';
import { useDeckScrollLock } from '@/hooks/useDeckScrollLock';
import { useConfigStore } from '@/state/store';
import { locateWindow, toLocalDateKey } from '@/core/engine/time';
import { applyTokens } from '@/services/tokens';
import { applyDocumentChrome } from '@/services/documentChrome';
import { FocusSlide } from '@/features/focus/FocusSlide';
import { VisualizerSlide } from '@/features/visualizer/VisualizerSlide';
import { applyIncomingShareHash, HubSlide } from '@/features/settings/HubSlide';

const LANDING_SLIDE = 1;

export default function App() {
  const now = useClock(1000);
  useWindowSync(now);
  const view = useDayView(now);

  const tokens = useConfigStore((s) => s.tokens);
  const fontScalePct = useConfigStore((s) => s.fontScalePct);
  const timeScalePct = useConfigStore((s) => s.timeScalePct);
  const segmentGapRatio = useConfigStore((s) => s.segmentGapRatio);
  const checkScalePct = useConfigStore((s) => s.checkScalePct);
  const focusGoalScalePct = useConfigStore((s) => s.focusGoalScalePct);
  const focusMetaScalePct = useConfigStore((s) => s.focusMetaScalePct);
  const focusCheckScalePct = useConfigStore((s) => s.focusCheckScalePct);
  const maskOpacityPct = useConfigStore((s) => s.maskOpacityPct);
  const motionEasing = useConfigStore((s) => s.motionEasing);
  const structure = useConfigStore((s) => s.structure);
  const setCompleted = useConfigStore((s) => s.setCompleted);

  const deckRef = useRef<HTMLDivElement>(null);
  const currentSlideRef = useRef(LANDING_SLIDE);
  const [modalOpen, setModalOpen] = useState(false);

  useSlideNav(deckRef);
  useScrollMask(deckRef, { maxMaskPct: maskOpacityPct, motionEasing });
  useDeckScrollLock(deckRef, modalOpen);

  useLayoutEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const prev = deck.style.scrollBehavior;
    deck.style.scrollBehavior = 'auto';
    deck.scrollTop = LANDING_SLIDE * deck.clientHeight;
    deck.style.scrollBehavior = prev;
    currentSlideRef.current = LANDING_SLIDE;
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    let scrollFrame = 0;
    let resizeFrame = 0;

    const updateCurrentSlide = () => {
      scrollFrame = 0;
      const height = deck.clientHeight || 1;
      const maxIndex = Math.max(0, deck.children.length - 1);
      currentSlideRef.current = Math.min(maxIndex, Math.max(0, Math.round(deck.scrollTop / height)));
    };

    const restoreSlidePosition = () => {
      resizeFrame = 0;
      const prevBehavior = deck.style.scrollBehavior;
      deck.style.scrollBehavior = 'auto';
      deck.scrollTop = currentSlideRef.current * deck.clientHeight;
      deck.style.scrollBehavior = prevBehavior;
    };

    updateCurrentSlide();
    const onScroll = () => {
      if (scrollFrame === 0) scrollFrame = window.requestAnimationFrame(updateCurrentSlide);
    };
    const onResize = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(restoreSlidePosition);
    };

    deck.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      deck.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    applyIncomingShareHash();
  }, []);

  const toggleComplete = useCallback(
    (minuteOfDay: number, currentlyCompleted: boolean) => {
      const position = locateWindow(structure, now);
      if (!position.windowStartDate) return;
      setCompleted(minuteOfDay, !currentlyCompleted, toLocalDateKey(position.windowStartDate));
    },
    [structure, now, setCompleted],
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--motion-easing', motionEasing);
    applyTokens(tokens, {
      fontScalePct,
      timeScalePct,
      segmentGapRatio,
      checkScalePct,
      focusGoalScalePct,
      focusMetaScalePct,
      focusCheckScalePct,
    });
  }, [
    tokens,
    fontScalePct,
    timeScalePct,
    segmentGapRatio,
    checkScalePct,
    focusGoalScalePct,
    focusMetaScalePct,
    focusCheckScalePct,
    motionEasing,
  ]);

  useEffect(() => {
    applyDocumentChrome(view, tokens);
  }, [view, tokens]);

  return (
    <div className="deck" ref={deckRef}>
      <FocusSlide view={view} onToggleComplete={toggleComplete} />
      <VisualizerSlide view={view} onToggleComplete={toggleComplete} />
      <HubSlide onModalOpenChange={setModalOpen} />
    </div>
  );
}
