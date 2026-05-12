import { useMemo } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCourses } from '../hooks/useCourses';
import { TaskCard } from '../components/task/TaskCard';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { daysUntil, isOverdue } from '../lib/dates';
import { facultyLabel } from '../lib/labels';

export function Dashboard() {
  const { data: tasks, isLoading } = useTasks();
  const { data: courses } = useCourses();

  const courseMap = useMemo(() => new Map((courses ?? []).map((c) => [c.id, c])), [courses]);

  const overdue = useMemo(
    () => (tasks ?? []).filter((t) => t.status !== 'done' && isOverdue(t.due_date)),
    [tasks],
  );
  const thisWeek = useMemo(
    () =>
      (tasks ?? []).filter((t) => {
        if (t.status === 'done') return false;
        const d = daysUntil(t.due_date);
        return d !== null && d >= 0 && d <= 7;
      }),
    [tasks],
  );
  const exams = useMemo(
    () =>
      (tasks ?? [])
        .filter((t) => (t.type === 'exam' || t.type === 'quiz') && t.status !== 'done' && t.due_date)
        .slice(0, 5),
    [tasks],
  );

  if (isLoading) return <div className="flex justify-center py-xl"><Spinner /></div>;

  const stats = {
    lawPending: (tasks ?? []).filter((t) => t.status !== 'done' && courseMap.get(t.course_id)?.faculty === 'law').length,
    econPending: (tasks ?? []).filter((t) => t.status !== 'done' && courseMap.get(t.course_id)?.faculty === 'economics')
      .length,
    overdue: overdue.length,
    done: (tasks ?? []).filter((t) => t.status === 'done').length,
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
        <StatCard icon="warning" label="באיחור" value={stats.overdue} accent={stats.overdue > 0 ? 'late' : 'normal'} />
        <StatCard icon="gavel" label="פתוחים — משפטים" value={stats.lawPending} />
        <StatCard icon="monitoring" label="פתוחים — כלכלה" value={stats.econPending} />
        <StatCard icon="check_circle" label="הושלמו" value={stats.done} accent="done" />
      </div>

      <Section title="באיחור" empty="אין משימות באיחור — כל הכבוד." items={overdue} courseMap={courseMap} />
      <Section title="השבוע שלך" empty="אין משימות לשבוע הקרוב." items={thisWeek} courseMap={courseMap} />
      <Section title="מבחנים ובחנים קרובים" empty="אין מבחנים בקרוב." items={exams} courseMap={courseMap} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  accent?: 'late' | 'done' | 'normal';
}) {
  const tone =
    accent === 'late'
      ? 'text-error'
      : accent === 'done'
      ? 'text-emerald-600'
      : 'text-primary';
  return (
    <div className="card-level-1 p-md flex flex-col gap-xs">
      <div className={'flex items-center gap-xs ' + tone}>
        <Icon name={icon} filled />
        <span className="font-caption text-caption text-on-surface-variant">{label}</span>
      </div>
      <span className="font-display text-headline-md text-on-surface tabular-nums">{value}</span>
    </div>
  );
}

function Section({
  title,
  empty,
  items,
  courseMap,
}: {
  title: string;
  empty: string;
  items: ReturnType<typeof useTasks>['data'];
  courseMap: Map<string, ReturnType<typeof useCourses>['data'] extends (infer U)[] | undefined ? U : never>;
}) {
  return (
    <section className="flex flex-col gap-sm">
      <h3 className="font-display text-title-sm text-primary">{title}</h3>
      {!items || items.length === 0 ? (
        <p className="font-body text-body-md text-on-surface-variant">{empty}</p>
      ) : (
        <div className="flex flex-col gap-sm">
          {items.map((t) => {
            const c = courseMap.get(t.course_id);
            return <TaskCard key={t.id} task={t} showCourse={c ? `${facultyLabel[c.faculty]} · ${c.name}` : undefined} />;
          })}
        </div>
      )}
    </section>
  );
}
