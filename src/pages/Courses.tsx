import { useMemo, useState } from 'react';
import { useCourses } from '../hooks/useCourses';
import { useTasks } from '../hooks/useTasks';
import { CourseCard } from '../components/course/CourseCard';
import { FacultyTabs, type FacultyFilter } from '../components/course/FacultyTabs';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';

export function Courses() {
  const { data: courses, isLoading } = useCourses();
  const { data: tasks } = useTasks();
  const [filter, setFilter] = useState<FacultyFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    let cs = courses ?? [];
    if (filter !== 'all') cs = cs.filter((c) => c.faculty === filter);
    if (query.trim()) {
      const q = query.trim();
      cs = cs.filter((c) => c.name.includes(q) || (c.professor ?? '').includes(q));
    }
    return cs;
  }, [courses, filter, query]);

  const counts = useMemo(() => {
    const all = courses?.length ?? 0;
    const law = courses?.filter((c) => c.faculty === 'law').length ?? 0;
    const econ = courses?.filter((c) => c.faculty === 'economics').length ?? 0;
    return { all, law, economics: econ } as Partial<Record<FacultyFilter, number>>;
  }, [courses]);

  const tasksByCourse = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    (tasks ?? []).forEach((t) => {
      const arr = map.get(t.course_id) ?? [];
      arr.push(t);
      map.set(t.course_id, arr);
    });
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-display text-headline-md text-on-surface mb-xs">מאגר קורסים</h2>
          <p className="font-body text-body-md text-on-surface-variant">נהל את חומרי הסמסטר הנוכחי שלך.</p>
        </div>
        <div className="relative w-full md:w-96">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            <Icon name="search" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש קורסים או מרצים…"
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pr-10 pl-4 font-body text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      <FacultyTabs value={filter} onChange={setFilter} counts={counts} />

      {isLoading ? (
        <div className="flex justify-center py-xl"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {filtered.map((c) => (
            <CourseCard key={c.id} course={c} tasks={tasksByCourse.get(c.id) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-level-1 p-xl flex flex-col items-center gap-md text-center">
      <Icon name="folder_off" className="!text-5xl text-on-surface-variant" />
      <div>
        <h3 className="font-display text-title-sm text-primary mb-xs">אין קורסים להצגה</h3>
        <p className="font-body text-body-md text-on-surface-variant">נסה לשנות את הסינון או להוסיף קורס חדש בהגדרות.</p>
      </div>
    </div>
  );
}
