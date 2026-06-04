import { useCallback, useEffect, useRef } from 'react';
import { useClock } from '@/hooks/useClock';
import { useDayView, useWindowSync } from '@/hooks/useDayView';
import { useSlideNav } from '@/hooks/useSlideNav';
import { useConfigStore } from '@/state/store';
import { locateWindow, toLocalDateKey } from '@/core/engine/time';
import { applyTokens } from '@/services/tokens';
import { applyDocumentChrome } from '@/services/documentChrome';
import { FocusSlide } from '@/features/focus/FocusSlide';
import { VisualizerSlide } from '@/features/visualizer/VisualizerSlide';
import { SettingsSlide } from '@/features/settings/SettingsSlide';

export default function App() {
  const now = useClock(1000);
  useWindowSync(now);
  const view = useDayView(now);

  const tokens = useConfigStore((s) => s.tokens);
  const fontScalePct = useConfigStore((s) => s.fontScalePct);
  const structure = useConfigStore((s) => s.structure);
  const setCompleted = useConfigStore((s) => s.setCompleted);

  const deckRef = useRef<HTMLDivElement>(null);
  useSlideNav(deckRef);

  // Completion may only be toggled on the active segment (Focus or grid).
  const toggleActiveComplete = useCallback(() => {
    if (!view.active) return;
    const position = locateWindow(structure, now);
    if (!position.windowStartDate) return;
    setCompleted(
      view.active.segment.minuteOfDay,
      !view.active.isCompleted,
      toLocalDateKey(position.windowStartDate),
    );
  }, [view.active, structure, now, setCompleted]);

  // Live theming: push tokens to CSS custom properties.
  useEffect(() => {
    applyTokens(tokens, fontScalePct);
  }, [tokens, fontScalePct]);

  // Live tab title + favicon.
  useEffect(() => {
    applyDocumentChrome(view, tokens);
  }, [view, tokens]);

  return (
    <div className="deck" ref={deckRef}>
      <FocusSlide view={view} onToggleComplete={toggleActiveComplete} />
      <VisualizerSlide view={view} onToggleActiveComplete={toggleActiveComplete} />
      <SettingsSlide />
    </div>
  );
}
