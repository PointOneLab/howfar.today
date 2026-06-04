import type { AppConfig } from '../model/types';
import { sanitizeConfig } from '../model/validate';
import type { ConfigStorage } from './storage';

const STORAGE_KEY = 'howfar.today/config';

/**
 * Returns a {@link ConfigStorage} backed by `localStorage`. Falls back to a
 * no-op in-memory store when `localStorage` is unavailable (e.g. SSR, private
 * mode), so the app degrades gracefully rather than crashing.
 */
export function createLocalStorageAdapter(key: string = STORAGE_KEY): ConfigStorage {
  const available = (() => {
    try {
      const probe = '__howfar_probe__';
      window.localStorage.setItem(probe, probe);
      window.localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  })();

  let memory: string | null = null;

  return {
    load(): AppConfig | null {
      const raw = available ? window.localStorage.getItem(key) : memory;
      if (!raw) return null;
      try {
        return sanitizeConfig(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    save(config: AppConfig): void {
      const raw = JSON.stringify(config);
      if (available) {
        try {
          window.localStorage.setItem(key, raw);
        } catch {
          memory = raw;
        }
      } else {
        memory = raw;
      }
    },
    clear(): void {
      memory = null;
      if (available) window.localStorage.removeItem(key);
    },
  };
}
