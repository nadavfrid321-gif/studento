import { useState } from 'react';
import clsx from 'clsx';
import { Icon } from '../ui/Icon';
import { Spinner } from '../ui/Spinner';
import { extractTask, fileToImagePart, pdfToImageParts, type ExtractedTask } from '../../lib/extract';
import { TaskForm } from './TaskForm';
import { useCourses } from '../../hooks/useCourses';

type Mode = 'image' | 'text' | 'pdf';

interface Props {
  defaultCourseId?: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function ImportTaskDialog({ defaultCourseId, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>('image');
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [extracted, setExtracted] = useState<ExtractedTask | null>(null);
  const [matchedCourseId, setMatchedCourseId] = useState<string | undefined>(defaultCourseId);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data: courses } = useCourses();

  function matchCourse(hint?: string): string | undefined {
    if (!hint || !courses) return defaultCourseId;
    const lower = hint.toLowerCase();
    const exact = courses.find((c) => c.name.toLowerCase() === lower);
    if (exact) return exact.id;
    const partial = courses.find((c) => lower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(lower));
    return partial?.id ?? defaultCourseId;
  }

  async function run() {
    setErr(null);
    setLoading(true);
    try {
      let result: ExtractedTask;
      if (mode === 'text') {
        if (!text.trim()) throw new Error('הדבק טקסט תחילה.');
        result = await extractTask({ text });
      } else if (mode === 'image') {
        if (files.length === 0) throw new Error('בחר תמונה.');
        const images = await Promise.all(files.slice(0, 4).map(fileToImagePart));
        result = await extractTask({ images });
      } else {
        if (files.length === 0) throw new Error('בחר PDF.');
        const images = await pdfToImageParts(files[0], 4);
        result = await extractTask({ images });
      }
      setExtracted(result);
      setMatchedCourseId(matchCourse(result.course_name_hint));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (extracted) {
    return (
      <Dialog onClose={onClose} title="אישור משימה שחולצה">
        <p className="font-caption text-caption text-on-surface-variant mb-md">
          ביטחון מודל: {(extracted.confidence * 100).toFixed(0)}%
          {extracted.course_name_hint && ` · רמז קורס: ${extracted.course_name_hint}`}
        </p>
        <label className="flex flex-col gap-xs mb-md">
          <span className="font-caption text-caption text-on-surface-variant">קורס</span>
          <select
            value={matchedCourseId ?? ''}
            onChange={(e) => setMatchedCourseId(e.target.value || undefined)}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body"
          >
            <option value="">— בחר קורס —</option>
            {(courses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.faculty === 'law' ? 'משפטים' : 'כלכלה'})
              </option>
            ))}
          </select>
        </label>
        {matchedCourseId ? (
          <TaskForm
            courseId={matchedCourseId}
            initial={{
              id: '',
              course_id: matchedCourseId,
              user_id: '',
              type: extracted.type,
              title: extracted.title,
              description: extracted.description ?? null,
              due_date: extracted.due_date ?? null,
              weight: extracted.weight ?? null,
              status: 'pending',
              completed_at: null,
              created_at: '',
              updated_at: '',
            }}
            onDone={() => {
              onCreated?.();
              onClose();
            }}
            onCancel={onClose}
          />
        ) : (
          <p className="text-error">בחר קורס כדי להמשיך.</p>
        )}
      </Dialog>
    );
  }

  return (
    <Dialog onClose={onClose} title="ייבוא משימה מתמונה / טקסט / PDF">
      <div className="flex gap-xs mb-md">
        {(['image', 'text', 'pdf'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setFiles([]);
              setText('');
              setErr(null);
            }}
            className={clsx(
              'flex items-center gap-xs px-3 py-2 rounded-lg text-body-md font-display transition-colors',
              mode === m ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container',
            )}
          >
            <Icon name={m === 'image' ? 'image' : m === 'text' ? 'text_snippet' : 'picture_as_pdf'} />
            {m === 'image' ? 'תמונה' : m === 'text' ? 'טקסט' : 'PDF'}
          </button>
        ))}
      </div>

      {mode === 'text' && (
        <textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="הדבק כאן טקסט מאימייל, סילבוס או הודעת מודל…"
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 px-3 font-body text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}

      {(mode === 'image' || mode === 'pdf') && (
        <label className="block">
          <div className="border-2 border-dashed border-outline-variant rounded-lg p-lg text-center cursor-pointer hover:bg-surface-container transition-colors">
            <Icon name={mode === 'image' ? 'add_a_photo' : 'upload_file'} className="!text-4xl text-on-surface-variant" />
            <p className="font-body text-body-md text-on-surface-variant mt-xs">
              {mode === 'image' ? 'בחר תמונות (PNG / JPG / HEIC, עד 4)' : 'בחר קובץ PDF (יקרא עד 4 עמודים ראשונים)'}
            </p>
            {files.length > 0 && (
              <ul className="mt-sm text-caption text-on-surface-variant">
                {files.map((f) => <li key={f.name}>{f.name}</li>)}
              </ul>
            )}
          </div>
          <input
            type="file"
            hidden
            multiple={mode === 'image'}
            accept={mode === 'image' ? 'image/*,.heic,.heif' : '.pdf,application/pdf'}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>
      )}

      {err && <p className="text-error font-caption text-caption mt-md">{err}</p>}

      <div className="flex justify-end gap-sm mt-md">
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container font-display text-body-md">
          ביטול
        </button>
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary font-display text-body-md flex items-center gap-xs disabled:opacity-50 hover:opacity-90"
        >
          {loading ? <Spinner size={18} /> : <Icon name="auto_awesome" />}
          {loading ? 'מנתח…' : 'חלץ משימה'}
        </button>
      </div>
    </Dialog>
  );
}

function Dialog({ children, title, onClose }: { children: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-xl shadow-card max-w-xl w-full p-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-md">
          <h3 className="font-display text-title-sm text-primary">{title}</h3>
          <button onClick={onClose} aria-label="סגור" className="p-1 rounded hover:bg-surface-container">
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
