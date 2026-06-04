import { useEffect, useState } from 'react';

/**
 * Returns the current time, refreshed on a fixed interval (default every
 * second). A single shared timer drives all time-aware UI.
 */
export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
