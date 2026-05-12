import clsx from 'clsx';
import type { Faculty } from '../../types/database';

export type FacultyFilter = 'all' | Faculty;

const tabs: { key: FacultyFilter; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'law', label: 'משפטים' },
  { key: 'economics', label: 'כלכלה' },
];

interface Props {
  value: FacultyFilter;
  onChange: (v: FacultyFilter) => void;
  counts?: Partial<Record<FacultyFilter, number>>;
}

export function FacultyTabs({ value, onChange, counts }: Props) {
  return (
    <div className="inline-flex bg-surface-container rounded-full p-1 gap-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'px-4 py-2 rounded-full text-body-md font-display transition-colors',
            value === t.key
              ? 'bg-primary text-on-primary'
              : 'text-on-surface-variant hover:bg-surface-container-high',
          )}
        >
          {t.label}
          {counts?.[t.key] !== undefined && <span className="mr-1 tabular-nums opacity-70">({counts[t.key]})</span>}
        </button>
      ))}
    </div>
  );
}
