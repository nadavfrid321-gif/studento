import { useState } from 'react';
import { useCourses, useCreateCourse, useDeleteCourse, useUpdateCourse } from '../hooks/useCourses';
import { useAuth, signOut } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { facultyLabel } from '../lib/labels';
import type { Course, Faculty } from '../types/database';

export function Settings() {
  const { user } = useAuth();
  const { data: courses, isLoading } = useCourses();
  const create = useCreateCourse();
  const del = useDeleteCourse();
  const update = useUpdateCourse();

  const [draft, setDraft] = useState({ name: '', faculty: 'law' as Faculty, professor: '', code: '' });

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <section className="card-level-1 p-lg flex items-center gap-md">
        <Icon name="person" filled className="!text-3xl text-primary" />
        <div className="min-w-0 flex-grow">
          <p className="font-display text-title-sm text-primary">{user?.user_metadata?.full_name ?? user?.email}</p>
          <p className="font-caption text-caption text-on-surface-variant">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-xs px-3 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container"
        >
          <Icon name="logout" /> התנתק
        </button>
      </section>

      <section className="flex flex-col gap-md">
        <h3 className="font-display text-title-sm text-primary">קורסים</h3>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            await create.mutateAsync({
              name: draft.name.trim(),
              faculty: draft.faculty,
              professor: draft.professor.trim() || undefined,
              code: draft.code.trim() || undefined,
            });
            setDraft({ name: '', faculty: 'law', professor: '', code: '' });
          }}
          className="card-level-1 p-md grid grid-cols-1 md:grid-cols-2 gap-sm"
        >
          <input
            type="text"
            placeholder="שם הקורס"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body"
          />
          <select
            value={draft.faculty}
            onChange={(e) => setDraft({ ...draft, faculty: e.target.value as Faculty })}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body"
          >
            <option value="law">משפטים</option>
            <option value="economics">כלכלה</option>
          </select>
          <input
            type="text"
            placeholder="מרצה (אופציונלי)"
            value={draft.professor}
            onChange={(e) => setDraft({ ...draft, professor: e.target.value })}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body"
          />
          <input
            type="text"
            placeholder="קוד קורס (אופציונלי)"
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value })}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body"
          />
          <button
            type="submit"
            className="md:col-span-2 self-start flex items-center gap-xs px-3 py-2 rounded-lg bg-primary text-on-primary font-display text-body-md hover:opacity-90"
          >
            <Icon name="add" /> הוסף קורס
          </button>
        </form>

        {isLoading ? (
          <Spinner />
        ) : (
          <ul className="flex flex-col gap-sm">
            {(courses ?? []).map((c) => (
              <CourseRow key={c.id} course={c} onDelete={() => del.mutate(c.id)} onRename={(name) => update.mutate({ id: c.id, name })} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CourseRow({ course, onDelete, onRename }: { course: Course; onDelete: () => void; onRename: (n: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(course.name);

  return (
    <li className="card-level-1 p-md flex items-center gap-md">
      <Icon name={course.icon || 'folder'} filled className={course.faculty === 'law' ? 'text-faculty-law' : 'text-faculty-econ'} />
      {editing ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== course.name) onRename(name.trim());
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className="bg-transparent border-b border-primary py-1 px-1 font-body text-body-md flex-grow focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="font-display text-body-md text-primary text-right flex-grow truncate"
        >
          {course.name}
        </button>
      )}
      <span className="font-caption text-caption text-on-surface-variant whitespace-nowrap">{facultyLabel[course.faculty]}</span>
      <button
        onClick={() => {
          if (confirm(`למחוק את הקורס "${course.name}"? כל המשימות והקבצים שלו יימחקו.`)) onDelete();
        }}
        className="p-1 rounded hover:bg-error-container hover:text-on-error-container"
        aria-label="מחק קורס"
      >
        <Icon name="delete" />
      </button>
    </li>
  );
}
