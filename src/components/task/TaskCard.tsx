import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Task } from '../../types/database';
import { Icon } from '../ui/Icon';
import { friendlyRelative, isOverdue, daysUntil } from '../../lib/dates';
import { taskTypeIcon, taskTypeLabel } from '../../lib/labels';
import { useSetTaskStatus } from '../../hooks/useTasks';

interface Props {
  task: Task;
  showCourse?: string;
}

export function TaskCard({ task, showCourse }: Props) {
  const setStatus = useSetTaskStatus();
  const done = task.status === 'done';
  const overdue = !done && isOverdue(task.due_date);
  const d = daysUntil(task.due_date);
  const soon = !done && d !== null && d >= 0 && d <= 3;

  const accent = done ? 'done' : overdue ? 'late' : soon ? 'soon' : 'normal';

  return (
    <article
      className={clsx(
        'card-level-1 p-md flex items-start gap-md',
        accent === 'late' && 'border-r-4 border-r-error',
        accent === 'soon' && 'border-r-4 border-r-amber-500',
        done && 'opacity-60',
      )}
    >
      <button
        type="button"
        aria-label={done ? 'סמן כלא הושלם' : 'סמן כהושלם'}
        onClick={() =>
          setStatus.mutate({ id: task.id, status: done ? 'pending' : 'done' })
        }
        className={clsx(
          'mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
          done ? 'bg-emerald-600 border-emerald-600' : 'border-outline hover:border-primary',
        )}
      >
        {done && <Icon name="check" className="!text-base text-white" />}
      </button>

      <div className="min-w-0 flex-grow">
        <div className="flex items-center gap-xs mb-xs">
          <Icon name={taskTypeIcon[task.type]} className="!text-base text-on-surface-variant" />
          <span className="font-caption text-caption text-on-surface-variant">{taskTypeLabel[task.type]}</span>
          {showCourse && (
            <>
              <span className="text-on-surface-variant">·</span>
              <span className="font-caption text-caption text-on-surface-variant">{showCourse}</span>
            </>
          )}
          {task.weight != null && (
            <>
              <span className="text-on-surface-variant">·</span>
              <span className="font-caption text-caption text-on-surface-variant">{task.weight}% מהציון</span>
            </>
          )}
        </div>
        <Link to={`/tasks/${task.id}`} className="block">
          <h4 className={clsx('font-display text-title-sm text-primary truncate', done && 'line-through')}>
            {task.title}
          </h4>
        </Link>
        {task.description && (
          <p className="font-body text-body-md text-on-surface-variant line-clamp-2 mt-xs">{task.description}</p>
        )}
        <div className="mt-xs flex items-center gap-sm">
          <Icon name="schedule" className="!text-base text-on-surface-variant" />
          <span
            className={clsx(
              'font-caption text-caption',
              overdue ? 'text-error font-semibold' : soon ? 'text-amber-600' : 'text-on-surface-variant',
            )}
          >
            {task.due_date ? friendlyRelative(task.due_date) : 'ללא תאריך'}
          </span>
        </div>
      </div>
    </article>
  );
}
