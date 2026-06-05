import { describe, expect, it } from 'vitest';
import { buildSharePayload } from './payload';
import { decodeShareHash, encodeShareHash } from './codec';
import { createDefaultConfig } from '../model/defaults';

describe('share codec', () => {
  it('round-trips an obfuscated payload without readable goals in the hash', () => {
    const config = createDefaultConfig();
    config.routines.default.goals = { 420: 'Write the quarterly report' };
    const payload = buildSharePayload(
      config,
      { structure: true, goals: true, status: false, design: false },
      {
        profileName: 'test',
        sharedAt: '2026-06-05T12:00:00.000Z',
        timezone: 'UTC',
      },
    );
    const hash = encodeShareHash(payload);
    expect(hash).toMatch(/^#v1\./);
    expect(hash.includes('Write')).toBe(false);
    const decoded = decodeShareHash(hash);
    expect(decoded?.goals?.[420]).toBe('Write the quarterly report');
  });
});
