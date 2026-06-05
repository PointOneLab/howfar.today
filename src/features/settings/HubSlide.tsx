import { useRef, useState } from 'react';
import type { DesignTokens } from '@/core/model/types';
import {
  MAX_CHECK_SCALE_PCT,
  MAX_FOCUS_SCALE_PCT,
  MAX_FONT_SCALE_PCT,
  MAX_MASK_OPACITY_PCT,
  MAX_SEGMENT_GAP_RATIO,
  MAX_TIME_SCALE_PCT,
  MIN_CHECK_SCALE_PCT,
  MIN_FOCUS_SCALE_PCT,
  MIN_FONT_SCALE_PCT,
  MIN_MASK_OPACITY_PCT,
  MIN_SEGMENT_GAP_RATIO,
  MIN_TIME_SCALE_PCT,
  MOTION_EASING_OPTIONS,
} from '@/core/model/defaults';
import { csvFileName, exportConfigToCsv, importConfigFromCsv } from '@/core/csv/csv';
import {
  buildSharePayload,
  mergeSharePayload,
  selectionToTags,
  tagsToLabel,
  type ShareSelection,
} from '@/core/share/payload';
import { buildShareUrl, decodeShareHash, encodeShareHash } from '@/core/share/codec';
import { Modal } from '@/components/Modal';
import { ShareQrPreview } from '@/components/ShareQrPreview';
import {
  EMPTY_SHARE_SELECTION,
  ShareSelectionFields,
} from '@/components/ShareSelectionFields';
import { ABOUT_SECTIONS } from '@/features/settings/aboutContent';
import { selectConfig, useConfigStore } from '@/state/store';

const SEGMENT_REDUCE_CONFIRM =
  'Lowering segments per hour permanently removes goals and completion status in the extra slots ' +
  '(for example, going from 4 segments to 1 keeps only the first segment of each hour). ' +
  'This cannot be undone. Continue?';

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
const SEGMENT_OPTIONS = [1, 2, 3, 4, 5, 6];

type HubModal = 'structure' | 'design' | 'data' | 'share' | 'about' | null;

interface HubSlideProps {
  onModalOpenChange: (open: boolean) => void;
}

export function HubSlide({ onModalOpenChange }: HubSlideProps) {
  const [modal, setModal] = useState<HubModal>(null);
  const [shareSel, setShareSel] = useState<ShareSelection>({ ...EMPTY_SHARE_SELECTION });
  const [csvExportSel, setCsvExportSel] = useState<ShareSelection>({
    structure: true,
    goals: true,
    status: true,
    design: true,
  });
  const [csvImportSel, setCsvImportSel] = useState<ShareSelection>({
    structure: true,
    goals: true,
    status: true,
    design: true,
  });
  const pendingImport = useRef<{ text: string; detected: ShareSelection } | null>(null);

  const structure = useConfigStore((s) => s.structure);
  const tokens = useConfigStore((s) => s.tokens);
  const profileName = useConfigStore((s) => s.profileName);
  const fontScalePct = useConfigStore((s) => s.fontScalePct);
  const timeScalePct = useConfigStore((s) => s.timeScalePct);
  const segmentGapRatio = useConfigStore((s) => s.segmentGapRatio);
  const checkScalePct = useConfigStore((s) => s.checkScalePct);
  const focusGoalScalePct = useConfigStore((s) => s.focusGoalScalePct);
  const focusMetaScalePct = useConfigStore((s) => s.focusMetaScalePct);
  const focusCheckScalePct = useConfigStore((s) => s.focusCheckScalePct);
  const maskOpacityPct = useConfigStore((s) => s.maskOpacityPct);
  const motionEasing = useConfigStore((s) => s.motionEasing);
  const statusColoring = useConfigStore((s) => s.behavior.statusColoring);

  const setStructure = useConfigStore((s) => s.setStructure);
  const setToken = useConfigStore((s) => s.setToken);
  const setProfileName = useConfigStore((s) => s.setProfileName);
  const setFontScale = useConfigStore((s) => s.setFontScale);
  const setTimeScale = useConfigStore((s) => s.setTimeScale);
  const setSegmentGapRatio = useConfigStore((s) => s.setSegmentGapRatio);
  const setCheckScale = useConfigStore((s) => s.setCheckScale);
  const setFocusGoalScale = useConfigStore((s) => s.setFocusGoalScale);
  const setFocusMetaScale = useConfigStore((s) => s.setFocusMetaScale);
  const setFocusCheckScale = useConfigStore((s) => s.setFocusCheckScale);
  const setMaskOpacity = useConfigStore((s) => s.setMaskOpacity);
  const setMotionEasing = useConfigStore((s) => s.setMotionEasing);
  const setStatusColoring = useConfigStore((s) => s.setStatusColoring);
  const replaceConfig = useConfigStore((s) => s.replaceConfig);
  const resetContent = useConfigStore((s) => s.resetContent);
  const resetDesign = useConfigStore((s) => s.resetDesign);

  const fileRef = useRef<HTMLInputElement>(null);

  const openModal = (next: HubModal) => {
    setModal(next);
    onModalOpenChange(next !== null);
  };

  const closeModal = () => {
    setModal(null);
    onModalOpenChange(false);
  };

  const confirmReset = (message: string, action: () => void) => {
    if (window.confirm(message)) action();
  };

  const shareMeta = () => ({
    profileName: profileName.trim() || 'default',
    sharedAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const handleSegmentsPerHourChange = (next: number) => {
    const prev = structure.segmentsPerHour;
    if (next < prev && !window.confirm(SEGMENT_REDUCE_CONFIRM)) return;
    setStructure({ segmentsPerHour: next });
  };

  const handleCopyLink = async () => {
    const hasAny = shareSel.structure || shareSel.goals || shareSel.status || shareSel.design;
    const includesSensitiveData = shareSel.goals || shareSel.status;
    if (
      includesSensitiveData &&
      !window.confirm(
        'This link will contain your selected data. Anyone with the link can view it. Continue?',
      )
    ) {
      return;
    }
    const url = hasAny
      ? buildShareUrl(
          window.location.origin,
          window.location.pathname,
          encodeShareHash(
            buildSharePayload(selectConfig(useConfigStore.getState()), shareSel, shareMeta()),
          ),
        )
      : buildShareUrl(window.location.origin, window.location.pathname, '');
    try {
      await navigator.clipboard.writeText(url);
      if (navigator.share) {
        try {
          await navigator.share({ url, title: 'howfar.today' });
        } catch {
          /* user dismissed share sheet — link is still copied */
        }
      }
      window.alert(hasAny ? `Link copied (${tagsToLabel(selectionToTags(shareSel))}).` : 'Link copied.');
    } catch {
      window.alert('Could not copy the link. Check clipboard permissions.');
    }
  };

  const handleExport = () => {
    const config = selectConfig(useConfigStore.getState());
    const csv = exportConfigToCsv(config, csvExportSel);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = csvFileName(config, csvExportSel);
    anchor.click();
    URL.revokeObjectURL(url);
    window.alert('CSV exported.');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const { detected } = importConfigFromCsv(
        text,
        selectConfig(useConfigStore.getState()),
        csvImportSel,
      );
      pendingImport.current = { text, detected };
      setCsvImportSel(detected);
      openModal('data');
      window.alert('Choose what to import, then tap Confirm import.');
    } catch {
      window.alert('Could not read that file.');
    }
  };

  const applyCsvImport = () => {
    const pending = pendingImport.current;
    if (!pending) return;
    const { config, warnings } = importConfigFromCsv(
      pending.text,
      selectConfig(useConfigStore.getState()),
      csvImportSel,
    );
    replaceConfig(config);
    pendingImport.current = null;
    window.alert(
      warnings.length ? `Imported with ${warnings.length} warning(s).` : 'Imported successfully.',
    );
  };

  return (
    <section className="slide hub" aria-label="Settings">
      <div className="slide__mask" aria-hidden="true" />
      <div className="hub__content">
        <h1 className="hub__brand">howfar.today</h1>
        <p className="hub__tagline">This hour is all it takes.</p>
        <nav className="hub__nav">
          <button type="button" className="btn" onClick={() => openModal('structure')}>
            Settings
          </button>
          <button type="button" className="btn" onClick={() => openModal('data')}>
            Export
          </button>
          <button type="button" className="btn" onClick={() => openModal('share')}>
            Share
          </button>
          <button type="button" className="btn" onClick={() => openModal('about')}>
            About
          </button>
        </nav>
        <p className="credits">
          Open source under MIT.{' '}
          <a href="https://github.com/PointOneLab/howfar.today" target="_blank" rel="noreferrer">
            source
          </a>
        </p>
      </div>

      <Modal title="Structure" open={modal === 'structure'} onClose={closeModal}>
        <label className="field">
          <span className="field__label">Profile name</span>
          <input
            className="field__text"
            type="text"
            value={profileName}
            maxLength={40}
            onChange={(e) => setProfileName(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field__label">Start hour</span>
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
        </label>
        <label className="field">
          <span className="field__label">End hour</span>
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
        </label>
        <label className="field">
          <span className="field__label">Segments per hour</span>
          <select
            value={structure.segmentsPerHour}
            onChange={(e) => handleSegmentsPerHourChange(Number(e.target.value))}
          >
            {SEGMENT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            confirmReset('Clear all goals and completion? This cannot be undone.', resetContent)
          }
        >
          Reset content
        </button>
        <div className="modal__footer-inline">
          <button type="button" className="btn btn--ghost" onClick={() => openModal('design')}>
            Design settings →
          </button>
        </div>
      </Modal>

      <Modal title="Design" open={modal === 'design'} onClose={closeModal}>
        <label className="field">
          <span className="field__label">Goal text size</span>
          <input
            type="range"
            min={MIN_FONT_SCALE_PCT}
            max={MAX_FONT_SCALE_PCT}
            value={fontScalePct}
            onChange={(e) => setFontScale(Number(e.target.value))}
          />
          <span>{fontScalePct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Time indicator size</span>
          <input
            type="range"
            min={MIN_TIME_SCALE_PCT}
            max={MAX_TIME_SCALE_PCT}
            value={timeScalePct}
            onChange={(e) => setTimeScale(Number(e.target.value))}
          />
          <span>{timeScalePct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Horizontal gap (× text size)</span>
          <input
            type="range"
            min={MIN_SEGMENT_GAP_RATIO}
            max={MAX_SEGMENT_GAP_RATIO}
            value={segmentGapRatio}
            onChange={(e) => setSegmentGapRatio(Number(e.target.value))}
          />
          <span>{segmentGapRatio}%</span>
        </label>
        <label className="field">
          <span className="field__label">Checkmark size (× goal text)</span>
          <input
            type="range"
            min={MIN_CHECK_SCALE_PCT}
            max={MAX_CHECK_SCALE_PCT}
            value={checkScalePct}
            onChange={(e) => setCheckScale(Number(e.target.value))}
          />
          <span>{checkScalePct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Focus goal size</span>
          <input
            type="range"
            min={MIN_FOCUS_SCALE_PCT}
            max={MAX_FOCUS_SCALE_PCT}
            value={focusGoalScalePct}
            onChange={(e) => setFocusGoalScale(Number(e.target.value))}
          />
          <span>{focusGoalScalePct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Focus time-left size</span>
          <input
            type="range"
            min={MIN_FOCUS_SCALE_PCT}
            max={MAX_FOCUS_SCALE_PCT}
            value={focusMetaScalePct}
            onChange={(e) => setFocusMetaScale(Number(e.target.value))}
          />
          <span>{focusMetaScalePct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Focus check size</span>
          <input
            type="range"
            min={MIN_FOCUS_SCALE_PCT}
            max={MAX_FOCUS_SCALE_PCT}
            value={focusCheckScalePct}
            onChange={(e) => setFocusCheckScale(Number(e.target.value))}
          />
          <span>{focusCheckScalePct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Swipe mask darkness</span>
          <input
            type="range"
            min={MIN_MASK_OPACITY_PCT}
            max={MAX_MASK_OPACITY_PCT}
            value={maskOpacityPct}
            onChange={(e) => setMaskOpacity(Number(e.target.value))}
          />
          <span>{maskOpacityPct}%</span>
        </label>
        <label className="field">
          <span className="field__label">Motion easing</span>
          <select value={motionEasing} onChange={(e) => setMotionEasing(e.target.value)}>
            {MOTION_EASING_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
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
          <input
            type="number"
            min={0}
            max={20}
            value={tokens.strokeGrid}
            onChange={(e) => setToken('strokeGrid', Number(e.target.value))}
          />
        </label>
        <div className="field">
          <span className="field__label">Status coloring</span>
          <button
            type="button"
            className={`switch${statusColoring ? ' switch--on' : ''}`}
            role="switch"
            aria-checked={statusColoring}
            onClick={() => setStatusColoring(!statusColoring)}
          >
            <span className="switch__knob" />
          </button>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() =>
            confirmReset('Reset all design settings to defaults?', resetDesign)
          }
        >
          Reset design
        </button>
      </Modal>

      <Modal
        title="Data"
        open={modal === 'data'}
        onClose={closeModal}
        footer={
          pendingImport.current ? (
            <button type="button" className="btn" onClick={applyCsvImport}>
              Confirm import
            </button>
          ) : undefined
        }
      >
        <p className="modal__hint">Choose what to include when exporting or importing.</p>
        <ShareSelectionFields
          idPrefix="csv"
          value={pendingImport.current ? csvImportSel : csvExportSel}
          onChange={pendingImport.current ? setCsvImportSel : setCsvExportSel}
        />
        <div className="actions">
          <button type="button" className="btn" onClick={handleExport}>
            Export CSV
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            Import CSV
          </button>
        </div>
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
      </Modal>

      <Modal
        title="Share"
        open={modal === 'share'}
        onClose={closeModal}
        footer={
          <button type="button" className="btn" onClick={() => void handleCopyLink()}>
            Copy link
          </button>
        }
      >
        <p className="modal__hint">
          Select what to encode in the link. The URL is obfuscated and does not show goal text. In
          WeChat, paste the full link if auto-detect truncates it.
        </p>
        <ShareSelectionFields value={shareSel} onChange={setShareSel} />
        <ShareQrPreview selection={shareSel} profileName={profileName} />
      </Modal>

      <Modal title="About" open={modal === 'about'} onClose={closeModal}>
        <article className="about-article">
          {ABOUT_SECTIONS.map((section, index) => {
            const Tag = `h${section.level}` as 'h1' | 'h2' | 'h3';
            return (
              <div key={index}>
                <Tag>{section.title}</Tag>
                <p>{section.body}</p>
              </div>
            );
          })}
        </article>
      </Modal>
    </section>
  );
}

/** Applies an incoming hash payload after user confirmation. */
export function applyIncomingShareHash(): boolean {
  const hash = window.location.hash;
  if (!hash.startsWith('#v1.')) return false;

  const payload = decodeShareHash(hash);
  if (!payload) return false;

  const hasData = Boolean(
    payload.structure ||
      payload.goals ||
      payload.completion ||
      payload.design ||
      (payload.goals && Object.keys(payload.goals).length > 0),
  );
  if (!hasData) {
    window.history.replaceState(null, '', window.location.pathname);
    return false;
  }

  const ok = window.confirm(
    'This link contains data that will replace your saved settings on this device. ' +
      'Export a CSV or save your own share link first if you want a backup. Open anyway?',
  );
  if (!ok) {
    window.history.replaceState(null, '', window.location.pathname);
    return false;
  }

  const base = selectConfig(useConfigStore.getState());
  useConfigStore.getState().replaceConfig(mergeSharePayload(base, payload));
  window.history.replaceState(null, '', window.location.pathname);
  return true;
}
