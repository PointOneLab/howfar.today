import type { AppConfig } from '../model/types';

/**
 * Persistence abstraction. The app depends only on this interface, so the
 * localStorage adapter can later be swapped for (or composed with) a cloud
 * sync adapter without touching business logic or UI.
 */
export interface ConfigStorage {
  load(): AppConfig | null;
  save(config: AppConfig): void;
  clear(): void;
}
