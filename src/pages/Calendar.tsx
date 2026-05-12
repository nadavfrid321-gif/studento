import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { he } from 'date-fns/locale';
import { useTasks } from '../hooks/useTasks';
import { useCourses } from '../hooks/useCourses';
import { Icon } from '../components/ui/Icon';
import { hebrewDateString } from '../lib/dates';
import { facultyLabel, taskTypeIcon } from '../lib/labels';

export function Calendar() {
  const [cursor, setCursor] = useState(new Date());
  const { data: tasks } = useTasks();
  const { data: courses } = useCourses();

  const courseMap = useMemo(() => new Map((courses ?? []).map((c) => [c.id, c])), [courses]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const arr: Date[] = [];
    let d = start;
    while (d <= end) {
      arr.push(d);
      d = addDays(d, 1);
    }
    return arr;
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    (tasks ?? []).forEach((t) => {
      if (!t.due_date) return;
      const key = format(new Date(t.due_date), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <button onClick={() => setCursor(subMonths(cursor, 1))} className="p-2 rounded-full hover:bg-surface-container">
          <Icon name="chevron_right" />
        </button>
        <h2 className="font-display text-headline-md text-primary">
          {format(cursor, 'MMMM yyyy', { locale: he })}
        </h2>
        <button onClick={() => setCursor(addMonths(cursor, 1))} className="p-2 rounded-full hover:bg-surface-container">
          <Icon name="chevron_left" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-caption text-caption text-on-surface-variant">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) ?? [];
          const isThisMonth = isSameMonth(d, cursor);
          const isToday = isSameDay(d, new Date());

          return (
            <div
              key={key}
              className={clsx(
                'min-h-[88px] p-1 rounded-lg border text-right flex flex-col gap-1 transition-colors',
                isThisMonth ? 'bg-surface-container-lowest border-outline-variant' : 'bg-surface border-transparent opacity-60',
                isToday && 'ring-2 ring-primary',
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-caption text-caption text-on-surface-variant tabular-nums">
                  {hebrewDateString(d).split(' ')[0]}
                </span>
                <span className={clsx('font-display text-body-md tabular-nums', isToday ? 'text-primary font-bold' : 'text-on-surface')}>
                  {format(d, 'd')}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map((t) => {
                  const c = courseMap.get(t.course_id);
                  const facultyColor = c?.faculty === 'law' ? 'bg-faculty-law' : 'bg-faculty-econ';
                  return (
                    <Link
                      key={t.id}
                      to={`/tasks/${t.id}`}
                      className={clsx('text-white text-[10px] truncate px-1 py-0.5 rounded', facultyColor)}
                      title={`${c ? facultyLabel[c.faculty] + ' · ' + c.name + ' · ' : ''}${t.title}`}
                    >
                      <Icon name={taskTypeIcon[t.type]} className="!text-[10px]" /> {t.title}
                    </Link>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-on-surface-variant">+{dayTasks.length - 3} עוד</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
