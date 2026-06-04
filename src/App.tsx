import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useClock } from '@/hooks/useClock';
import { useDayView, useWindowSync } from '@/hooks/useDayView';
import { useSlideNav } from '@/hooks/useSlideNav';
import { useScrollMask } from '@/hooks/useScrollMask';
import { useConfigStore } from '@/state/store';
import { locateWindow, toLocalDateKey } from '@/core/engine/time';
import { applyTokens } from '@/services/tokens';
import { applyDocumentChrome } from '@/services/documentChrome';
import { FocusSlide } from '@/features/focus/FocusSlide';
import { VisualizerSlide } from '@/features/visualizer/VisualizerSlide';
import { SettingsSlide } from '@/features/settings/SettingsSlide';

/** Slide index the app opens on: the Day Visualizer (the main screen). */
const LANDING_SLIDE = 1;

export default function App() {
  const now = useClock(1000);
  useWindowSync(now);
  const view = useDayView(now);

  const tokens = useConfigStore((s) => s.tokens);
  const fontScalePct = useConfigStore((s) => s.fontScalePct);
  const timeScalePct = useConfigStore((s) => s.timeScalePct);
  const segmentGap = useConfigStore((s) => s.segmentGap);
  const structure = useConfigStore((s) => s.structure);
  const setCompleted = useConfigStore((s) => s.setCompleted);

  const deckRef = useRef<HTMLDivElement>(null);
  useSlideNav(deckRef);
  useScrollMask(deckRef);

  // Open on the main (visualizer) screen, instantly (no smooth-scroll animation).
  useLayoutEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const prev = deck.style.scrollBehavior;
    deck.style.scrollBehavior = 'auto';
    deck.scrollTop = LANDING_SLIDE * deck.clientHeight;
    deck.style.scrollBehavior = prev;
  }, []);

  // Completion may be toggled on active or past segments while in-window.
  const toggleComplete = useCallback(
    (minuteOfDay: number, currentlyCompleted: boolean) => {
      const position = locateWindow(structure, now);
      if (!position.windowStartDate) return;
      setCompleted(minuteOfDay, !currentlyCompleted, toLocalDateKey(position.windowStartDate));
    },
    [structure, now, setCompleted],
  );

  // Live theming: push tokens and layout scales to CSS custom properties.
  useEffect(() => {
    applyTokens(tokens, { fontScalePct, timeScalePct, segmentGap });
  }, [tokens, fontScalePct, timeScalePct, segmentGap]);

  // Live tab title + favicon.
  useEffect(() => {
    applyDocumentChrome(view, tokens);
  }, [view, tokens]);

  return (
    <div className="deck" ref={deckRef}>
      <FocusSlide view={view} onToggleComplete={toggleComplete} />
      <VisualizerSlide view={view} onToggleComplete={toggleComplete} />
      <SettingsSlide />
    </div>
  );
}
