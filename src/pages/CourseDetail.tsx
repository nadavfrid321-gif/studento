import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { useCourse } from '../hooks/useCourses';
import { useTasks } from '../hooks/useTasks';
import { useFiles, useUploadFile, useDeleteFile, downloadFile } from '../hooks/useFiles';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes';
import { TaskCard } from '../components/task/TaskCard';
import { TaskForm } from '../components/task/TaskForm';
import { ImportTaskDialog } from '../components/task/ImportTaskDialog';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { facultyLabel } from '../lib/labels';
import { formatDateTimeHe } from '../lib/dates';

type Tab = 'tasks' | 'files' | 'notes';

export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);
  const [tab, setTab] = useState<Tab>('tasks');

  if (isLoading) return <div className="flex justify-center py-xl"><Spinner /></div>;
  if (!course) return <p className="text-on-surface-variant">קורס לא נמצא.</p>;

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center gap-md">
        <Link to="/courses" className="text-on-surface-variant hover:text-primary"><Icon name="arrow_forward" /></Link>
        <div className="relative w-12 h-12 flex items-center justify-center">
          <Icon name="folder" className="folder-icon-outline absolute !text-5xl" />
          <Icon name={course.icon || 'folder'} filled className="folder-icon-inner relative z-10 !text-2xl" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-headline-md text-on-surface truncate">{course.name}</h2>
          <p className="font-caption text-caption text-on-surface-variant">
            {facultyLabel[course.faculty]}
            {course.code ? ` · ${course.code}` : ''}
            {course.professor ? ` · ${course.professor}` : ''}
          </p>
        </div>
      </div>

      <div className="border-b border-outline-variant flex gap-lg">
        {([
          { k: 'tasks', label: 'משימות', icon: 'task_alt' },
          { k: 'files', label: 'קבצים', icon: 'folder' },
          { k: 'notes', label: 'סיכומים', icon: 'sticky_note_2' },
        ] as { k: Tab; label: string; icon: string }[]).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={clsx(
              'flex items-center gap-xs py-3 px-2 -mb-px border-b-2 transition-colors',
              tab === t.k ? 'border-primary text-primary font-display' : 'border-transparent text-on-surface-variant hover:text-on-surface',
            )}
          >
            <Icon name={t.icon} filled={tab === t.k} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'tasks' && <TasksTab courseId={course.id} />}
      {tab === 'files' && <FilesTab courseId={course.id} />}
      {tab === 'notes' && <NotesTab courseId={course.id} />}
    </div>
  );
}

function TasksTab({ courseId }: { courseId: string }) {
  const { data: tasks, isLoading } = useTasks(courseId);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-md">
      {!showForm && (
        <div className="flex gap-xs flex-wrap">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-xs px-4 py-2 rounded-lg bg-primary text-on-primary font-display text-body-md hover:opacity-90"
          >
            <Icon name="add" /> משימה חדשה
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface font-display text-body-md hover:bg-surface-container"
          >
            <Icon name="auto_awesome" /> ייבוא מתמונה / טקסט / PDF
          </button>
        </div>
      )}
      {showForm && (
        <TaskForm courseId={courseId} onDone={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
      )}
      {showImport && <ImportTaskDialog defaultCourseId={courseId} onClose={() => setShowImport(false)} />}

      {(tasks ?? []).length === 0 ? (
        <p className="text-on-surface-variant py-md">אין משימות בקורס. הוסף משימה ראשונה.</p>
      ) : (
        <div className="flex flex-col gap-sm">
          {tasks!.map((t) => <TaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}

function FilesTab({ courseId }: { courseId: string }) {
  const { data: files, isLoading } = useFiles(courseId);
  const upload = useUploadFile(courseId);
  const del = useDeleteFile(courseId);

  function onFiles(list: FileList | null) {
    if (!list) return;
    Array.from(list).forEach((f) => upload.mutate(f));
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-md">
      <label className="self-start flex items-center gap-xs px-4 py-2 rounded-lg bg-primary text-on-primary font-display text-body-md cursor-pointer hover:opacity-90">
        <Icon name="upload" />
        העלאת קובץ
        <input type="file" hidden multiple onChange={(e) => onFiles(e.target.files)} />
      </label>

      {upload.isPending && <Spinner />}

      {(files ?? []).length === 0 ? (
        <p className="text-on-surface-variant py-md">לא הועלו קבצים עדיין.</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {files!.map((f) => (
            <li key={f.id} className="card-level-1 p-md flex items-center gap-md">
              <Icon name="description" className="text-on-surface-variant !text-2xl" />
              <div className="min-w-0 flex-grow">
                <p className="font-display text-body-md text-primary truncate">{f.name}</p>
                <p className="font-caption text-caption text-on-surface-variant">
                  {f.size_bytes ? `${(f.size_bytes / 1024).toFixed(1)} KB · ` : ''}
                  {formatDateTimeHe(f.created_at)}
                </p>
              </div>
              <button onClick={() => downloadFile(f)} className="p-2 rounded-full hover:bg-surface-container" aria-label="הורד">
                <Icon name="download" />
              </button>
              <button onClick={() => del.mutate(f)} className="p-2 rounded-full hover:bg-error-container hover:text-on-error-container" aria-label="מחק">
                <Icon name="delete" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotesTab({ courseId }: { courseId: string }) {
  const { data: notes, isLoading } = useNotes(courseId);
  const create = useCreateNote(courseId);
  const update = useUpdateNote(courseId);
  const del = useDeleteNote(courseId);
  const [draft, setDraft] = useState({ title: '', content: '' });

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-md">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!draft.title.trim() && !draft.content.trim()) return;
          await create.mutateAsync({ title: draft.title.trim() || undefined, content: draft.content.trim() || undefined });
          setDraft({ title: '', content: '' });
        }}
        className="card-level-1 p-md flex flex-col gap-sm"
      >
        <input
          type="text"
          placeholder="כותרת (אופציונלי)"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="bg-transparent border-b border-outline-variant py-2 px-1 font-display text-title-sm focus:outline-none focus:border-primary"
        />
        <textarea
          rows={3}
          placeholder="כתוב סיכום, רעיון או הערה…"
          value={draft.content}
          onChange={(e) => setDraft({ ...draft, content: e.target.value })}
          className="bg-transparent border-b border-outline-variant py-2 px-1 font-body text-body-md resize-y focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="self-start flex items-center gap-xs px-3 py-1.5 rounded-lg bg-primary text-on-primary font-display text-body-md hover:opacity-90"
        >
          <Icon name="add" /> הוסף סיכום
        </button>
      </form>

      {(notes ?? []).length === 0 ? (
        <p className="text-on-surface-variant py-md">אין סיכומים. כתוב את הסיכום הראשון למעלה.</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {notes!.map((n) => (
            <li key={n.id} className="card-level-1 p-md flex flex-col gap-xs">
              {n.title && <h4 className="font-display text-title-sm text-primary">{n.title}</h4>}
              <textarea
                defaultValue={n.content ?? ''}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (n.content ?? '')) update.mutate({ id: n.id, content: v });
                }}
                rows={Math.min(8, Math.max(2, (n.content ?? '').split('\n').length))}
                className="bg-transparent font-body text-body-md text-on-surface resize-y focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="font-caption text-caption text-on-surface-variant">
                  עודכן · {formatDateTimeHe(n.updated_at)}
                </span>
                <button
                  onClick={() => del.mutate(n.id)}
                  className="p-1 rounded hover:bg-error-container hover:text-on-error-container"
                  aria-label="מחק סיכום"
                >
                  <Icon name="delete" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
