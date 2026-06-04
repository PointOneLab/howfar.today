import { useRef, useState } from 'react';
import type { DesignTokens } from '@/core/model/types';
import {
  MAX_FONT_SCALE_PCT,
  MAX_SEGMENT_GAP,
  MAX_SEGMENTS_PER_HOUR,
  MAX_TIME_SCALE_PCT,
  MIN_FONT_SCALE_PCT,
  MIN_SEGMENT_GAP,
  MIN_SEGMENTS_PER_HOUR,
  MIN_TIME_SCALE_PCT,
} from '@/core/model/defaults';
import { csvFileName, exportConfigToCsv, importConfigFromCsv } from '@/core/csv/csv';
import { selectConfig, useConfigStore } from '@/state/store';

const COLOR_FIELDS: { key: keyof DesignTokens; label: string }[] = [
  { key: 'bgApp', label: 'Background' },
  { key: 'colorRegular', label: 'Regular text' },
  { key: 'colorHighlight', label: 'Highlight text' },
  { key: 'colorInteract', label: 'Interactive' },
  { key: 'colorSecondary', label: 'Secondary' },
  { key: 'colorSuccess', label: 'Success' },
  { key: 'colorFailure', label: 'Failure' },
  { key: 'colorProgress', label: 'Active progress' },
  { key: 'colorVoid', label: 'Future void' },
  { key: 'colorGrid', label: 'Grid lines' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SettingsSlide() {
  const structure = useConfigStore((s) => s.structure);
  const tokens = useConfigStore((s) => s.tokens);
  const fontScalePct = useConfigStore((s) => s.fontScalePct);
  const timeScalePct = useConfigStore((s) => s.timeScalePct);
  const segmentGap = useConfigStore((s) => s.segmentGap);
  const statusColoring = useConfigStore((s) => s.behavior.statusColoring);

  const setStructure = useConfigStore((s) => s.setStructure);
  const setToken = useConfigStore((s) => s.setToken);
  const setFontScale = useConfigStore((s) => s.setFontScale);
  const setTimeScale = useConfigStore((s) => s.setTimeScale);
  const setSegmentGap = useConfigStore((s) => s.setSegmentGap);
  const setStatusColoring = useConfigStore((s) => s.setStatusColoring);
  const replaceConfig = useConfigStore((s) => s.replaceConfig);
  const resetContent = useConfigStore((s) => s.resetContent);
  const resetDesign = useConfigStore((s) => s.resetDesign);

  const fileRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string>('');

  const handleExport = () => {
    const csv = exportConfigToCsv(selectConfig(useConfigStore.getState()));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = csvFileName();
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const { config, warnings } = importConfigFromCsv(
        text,
        selectConfig(useConfigStore.getState()),
      );
      replaceConfig(config);
      setNote(
        warnings.length ? `Imported with ${warnings.length} warning(s).` : 'Imported successfully.',
      );
    } catch {
      setNote('Could not read that file.');
    }
  };

  const handleShare = async () => {
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setNote('Link copied to clipboard.');
      }
    } catch {
      /* user dismissed share sheet — no-op */
    }
  };

  return (
    <section className="slide settings" aria-label="Settings">
      <h1 className="settings__title">Settings</h1>

      <div className="settings__section">
        <h2 className="settings__heading">Structure</h2>
        <label className="field">
          <span className="field__label">Start hour</span>
          <span className="field__control">
            <select
              value={structure.startHour}
              onChange={(e) => setStructure({ startHour: Number(e.target.value) })}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </span>
        </label>
        <label className="field">
          <span className="field__label">End hour</span>
          <span className="field__control">
            <select
              value={structure.endHour}
              onChange={(e) => setStructure({ endHour: Number(e.target.value) })}
            >
              {HOURS.slice(1)
                .concat(24)
                .map((h) => (
                  <option key={h} value={h}>
                    {String(h % 24).padStart(2, '0')}:00
                  </option>
                ))}
            </select>
          </span>
        </label>
        <label className="field">
          <span className="field__label">Segments per hour</span>
          <span className="field__control">
            <input
              type="number"
              min={MIN_SEGMENTS_PER_HOUR}
              max={MAX_SEGMENTS_PER_HOUR}
              value={structure.segmentsPerHour}
              onChange={(e) => setStructure({ segmentsPerHour: Number(e.target.value) })}
            />
          </span>
        </label>
      </div>

      <div className="settings__section">
        <h2 className="settings__heading">Typography & spacing</h2>
        <label className="field">
          <span className="field__label">Goal text size</span>
          <span className="field__control">
            <input
              type="range"
              min={MIN_FONT_SCALE_PCT}
              max={MAX_FONT_SCALE_PCT}
              value={fontScalePct}
              onChange={(e) => setFontScale(Number(e.target.value))}
            />
            <span>{fontScalePct}%</span>
          </span>
        </label>
        <label className="field">
          <span className="field__label">Time indicator size</span>
          <span className="field__control">
            <input
              type="range"
              min={MIN_TIME_SCALE_PCT}
              max={MAX_TIME_SCALE_PCT}
              value={timeScalePct}
              onChange={(e) => setTimeScale(Number(e.target.value))}
            />
            <span>{timeScalePct}%</span>
          </span>
        </label>
        <label className="field">
          <span className="field__label">Segment gap</span>
          <span className="field__control">
            <input
              type="range"
              min={MIN_SEGMENT_GAP}
              max={MAX_SEGMENT_GAP}
              step={0.1}
              value={segmentGap}
              onChange={(e) => setSegmentGap(Number(e.target.value))}
            />
            <span>{segmentGap.toFixed(1)}vw</span>
          </span>
        </label>
      </div>

      <div className="settings__section">
        <h2 className="settings__heading">Colors</h2>
        <div className="swatches">
          {COLOR_FIELDS.map(({ key, label }) => (
            <label className="swatch" key={key}>
              <span>{label}</span>
              <input
                type="color"
                value={tokens[key] as string}
                onChange={(e) => setToken(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <label className="field">
          <span className="field__label">Grid stroke (px)</span>
          <span className="field__control">
            <input
              type="number"
              min={0}
              max={20}
              value={tokens.strokeGrid}
              onChange={(e) => setToken('strokeGrid', Number(e.target.value))}
            />
          </span>
        </label>
      </div>

      <div className="settings__section">
        <h2 className="settings__heading">Behavior</h2>
        <div className="field">
          <span className="field__label">Status coloring (missed segments fail)</span>
          <button
            type="button"
            className={`switch${statusColoring ? ' switch--on' : ''}`}
            role="switch"
            aria-checked={statusColoring}
            aria-label="Toggle status coloring"
            onClick={() => setStatusColoring(!statusColoring)}
          >
            <span className="switch__knob" />
          </button>
        </div>
      </div>

      <div className="settings__section">
        <h2 className="settings__heading">Data</h2>
        <div className="actions">
          <button type="button" className="btn" onClick={handleExport}>
            Export CSV
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
          <button type="button" className="btn" onClick={handleShare}>
            Share
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetContent}>
            Reset content
          </button>
          <button type="button" className="btn btn--ghost" onClick={resetDesign}>
            Reset design
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="visually-hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {note && <p className="import-status">{note}</p>}
      </div>

      <p className="credits">
        howfar.today — open source under MIT.{' '}
        <a href="https://github.com/PointOneLab/howfar.today" target="_blank" rel="noreferrer">
          source
        </a>
      </p>
    </section>
  );
}
