import { describe, expect, it } from 'vitest';
import { exportConfigToCsv, importConfigFromCsv } from './csv';
import { createDefaultConfig } from '../model/defaults';

const ALL = { structure: true, goals: true, status: true, design: true };

describe('CSV round-trip', () => {
  it('preserves config, tokens, and goals', () => {
    const config = createDefaultConfig();
    config.structure = { startHour: 8, endHour: 18, segmentsPerHour: 2 };
    config.fontScalePct = 60;
    config.timeScalePct = 40;
    config.segmentGapRatio = 80;
    config.behavior.statusColoring = false;
    config.tokens.colorSuccess = '#00ff00';
    config.routines.default.goals = { 480: 'Deep work', 510: 'Email, and "stuff"' };
    config.completion = { windowDate: '2026-06-04', completed: [480] };

    const csv = exportConfigToCsv(config, ALL);
    const { config: restored, warnings } = importConfigFromCsv(csv, createDefaultConfig(), ALL);

    expect(warnings).toHaveLength(0);
    expect(restored.structure).toEqual(config.structure);
    expect(restored.fontScalePct).toBe(60);
    expect(restored.timeScalePct).toBe(40);
    expect(restored.segmentGapRatio).toBe(80);
    expect(restored.behavior.statusColoring).toBe(false);
    expect(restored.tokens.colorSuccess).toBe('#00ff00');
    expect(restored.routines.default.goals[480]).toBe('Deep work');
    expect(restored.routines.default.goals[510]).toBe('Email, and "stuff"');
    expect(restored.completion.completed).toContain(480);
  });

  it('rejects malformed values without throwing', () => {
    const csv = [
      'section,key,value',
      'config,startHour,99',
      'config,segmentsPerHour,12',
      'token,colorSuccess,not-a-color',
      'goal,99:99,Bad time',
      'goal,07:15,Good goal',
    ].join('\n');

    const { config, warnings } = importConfigFromCsv(csv, createDefaultConfig(), ALL);
    expect(config.structure.startHour).toBe(23);
    expect(config.structure.segmentsPerHour).toBe(6);
    expect(config.tokens.colorSuccess).toBe(createDefaultConfig().tokens.colorSuccess);
    expect(config.routines.default.goals[435]).toBe('Good goal');
    expect(warnings.length).toBeGreaterThan(0);
  });
});
