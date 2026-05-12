import { useState } from 'react';
import type { Task, TaskType } from '../../types/database';
import { taskTypeLabel } from '../../lib/labels';
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { Icon } from '../ui/Icon';

interface Props {
  courseId: string;
  initial?: Task;
  onDone?: () => void;
  onCancel?: () => void;
}

const TYPES: TaskType[] = ['reading', 'assignment', 'exam', 'quiz', 'event'];

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TaskForm({ courseId, initial, onDone, onCancel }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const isEdit = !!initial?.id;

  const [type, setType] = useState<TaskType>(initial?.type ?? 'reading');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(toDateInput(initial?.due_date));
  const [weight, setWeight] = useState<string>(initial?.weight?.toString() ?? '');

  const submitting = create.isPending || update.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      weight: weight ? Number(weight) : null,
    };
    if (!payload.title) return;

    if (isEdit) {
      await update.mutateAsync({ id: initial.id, ...payload });
    } else {
      await create.mutateAsync({ course_id: courseId, ...payload });
    }
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="card-level-1 p-lg flex flex-col gap-md">
      <h3 className="font-display text-title-sm text-primary">{isEdit ? 'עריכת משימה' : 'משימה חדשה'}</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-xs">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={
              'px-3 py-2 rounded-lg border text-body-md font-display transition-colors ' +
              (type === t
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container')
            }
          >
            {taskTypeLabel[t]}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-xs">
        <span className="font-caption text-caption text-on-surface-variant">כותרת</span>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === 'reading' ? 'פסק דין מרבורי נ׳ מדיסון' : 'שם המשימה'}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </label>

      <label className="flex flex-col gap-xs">
        <span className="font-caption text-caption text-on-surface-variant">תיאור (אופציונלי)</span>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="הערות, מספר עמודים, פרק…"
          className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <label className="flex flex-col gap-xs">
          <span className="font-caption text-caption text-on-surface-variant">תאריך + שעה</span>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </label>
        {(type === 'exam' || type === 'quiz' || type === 'assignment') && (
          <label className="flex flex-col gap-xs">
            <span className="font-caption text-caption text-on-surface-variant">משקל בציון (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="לדוגמה 30"
              className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
        )}
      </div>

      <div className="flex justify-end gap-sm">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-display text-body-md text-on-surface-variant hover:bg-surface-container"
          >
            ביטול
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-display text-body-md flex items-center gap-xs disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all"
        >
          <Icon name="save" />
          {isEdit ? 'עדכן' : 'הוסף'}
        </button>
      </div>
    </form>
  );
}
