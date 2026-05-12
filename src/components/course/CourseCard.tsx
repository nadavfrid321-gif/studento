import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { Course, Task } from '../../types/database';
import { Icon } from '../ui/Icon';
import { daysUntil, isOverdue } from '../../lib/dates';

interface Props {
  course: Course;
  tasks: Task[];
}

export function CourseCard({ course, tasks }: Props) {
  const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'done');
  const overdue = tasks.filter((t) => t.status !== 'done' && isOverdue(t.due_date));
  const soon = pending.filter((t) => {
    const d = daysUntil(t.due_date);
    return d !== null && d >= 0 && d <= 3;
  });

  const progress = tasks.length === 0 ? 0 : Math.round((done.length / tasks.length) * 100);

  const accent: 'late' | 'soon' | 'normal' = overdue.length > 0 ? 'late' : soon.length > 0 ? 'soon' : 'normal';

  return (
    <Link
      to={`/courses/${course.id}`}
      className={clsx(
        'card-level-1 p-lg flex flex-col cursor-pointer',
        course.faculty === 'law' ? 'faculty-stripe-law' : 'faculty-stripe-econ',
        accent === 'late' && 'border-r-4 border-r-error',
      )}
    >
      <div className="flex justify-between items-start mb-md border-b border-outline-variant pb-sm gap-sm">
        <div className="flex items-center gap-sm min-w-0">
          <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
            <Icon name="folder" className="folder-icon-outline absolute !text-4xl" />
            <Icon name={course.icon || 'folder'} filled className="folder-icon-inner relative z-10 !text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-title-sm text-primary truncate">{course.name}</h3>
            <span className="font-caption text-caption text-on-surface-variant block truncate">
              {course.code || (course.faculty === 'law' ? 'משפטים' : 'כלכלה')}
              {course.professor ? ` • ${course.professor}` : ''}
            </span>
          </div>
        </div>
        {overdue.length > 0 ? (
          <span className="badge-late font-caption text-label-caps px-2 py-1 rounded whitespace-nowrap">
            {overdue.length} באיחור
          </span>
        ) : soon.length > 0 ? (
          <span className="badge-soon font-caption text-label-caps px-2 py-1 rounded whitespace-nowrap">
            {soon.length} השבוע
          </span>
        ) : pending.length > 0 ? (
          <span className="badge-pending font-caption text-label-caps px-2 py-1 rounded whitespace-nowrap">
            {pending.length} ממתינים
          </span>
        ) : (
          <span className="badge-pending font-caption text-label-caps px-2 py-1 rounded whitespace-nowrap">מעודכן</span>
        )}
      </div>

      <div className="flex-grow mb-md">
        <NextTaskBlurb tasks={pending} />
      </div>

      <div className="mt-auto pt-sm">
        <div className="flex justify-between items-center mb-xs">
          <span className="font-caption text-caption text-on-surface-variant">התקדמות סמסטר</span>
          <span className="font-caption text-caption text-primary font-semibold tabular-nums">{progress}%</span>
        </div>
        <div className="w-full h-1.5 progress-track rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full',
              accent === 'late' ? 'progress-fill-late' : accent === 'soon' ? 'progress-fill-upcoming' : 'progress-fill',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function NextTaskBlurb({ tasks }: { tasks: Task[] }) {
  const upcoming = tasks
    .filter((t) => t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())[0];

  if (!upcoming) {
    return <p className="font-body text-body-md text-on-surface-variant">אין משימות פתוחות.</p>;
  }
  return (
    <p className="font-body text-body-md text-on-surface-variant line-clamp-2">
      <span className="font-semibold text-on-surface">הבא בתור:</span> {upcoming.title}
    </p>
  );
}
