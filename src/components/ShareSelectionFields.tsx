import type { ShareSelection } from '@/core/share/payload';

interface ShareSelectionFieldsProps {
  value: ShareSelection;
  onChange: (next: ShareSelection) => void;
  idPrefix?: string;
}

export function ShareSelectionFields({
  value,
  onChange,
  idPrefix = 'share',
}: ShareSelectionFieldsProps) {
  const set = (patch: Partial<ShareSelection>) => onChange({ ...value, ...patch });

  const onGoalsChange = (checked: boolean) => {
    if (!checked) {
      onChange({ ...value, goals: false, status: false });
      return;
    }
    set({ goals: true });
  };

  return (
    <fieldset className="share-fields">
      <label className="share-fields__row" htmlFor={`${idPrefix}-struct`}>
        <input
          id={`${idPrefix}-struct`}
          type="checkbox"
          checked={value.structure}
          onChange={(e) => set({ structure: e.target.checked })}
        />
        <span>Structure (start, end, segments per hour)</span>
      </label>
      <label className="share-fields__row" htmlFor={`${idPrefix}-goals`}>
        <input
          id={`${idPrefix}-goals`}
          type="checkbox"
          checked={value.goals}
          onChange={(e) => onGoalsChange(e.target.checked)}
        />
        <span>Goals</span>
      </label>
      <label
        className={`share-fields__row${value.goals ? '' : ' share-fields__row--disabled'}`}
        htmlFor={`${idPrefix}-status`}
      >
        <input
          id={`${idPrefix}-status`}
          type="checkbox"
          checked={value.status}
          disabled={!value.goals}
          onChange={(e) => set({ status: e.target.checked })}
        />
        <span>Completion status</span>
      </label>
      <label className="share-fields__row" htmlFor={`${idPrefix}-design`}>
        <input
          id={`${idPrefix}-design`}
          type="checkbox"
          checked={value.design}
          onChange={(e) => set({ design: e.target.checked })}
        />
        <span>Design (colors, typography, motion)</span>
      </label>
    </fieldset>
  );
}

export const EMPTY_SHARE_SELECTION: ShareSelection = {
  structure: false,
  goals: false,
  status: false,
  design: false,
};
