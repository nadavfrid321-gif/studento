import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTask, useDeleteTask, useSetTaskStatus } from '../hooks/useTasks';
import { useCourse } from '../hooks/useCourses';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';
import { TaskForm } from '../components/task/TaskForm';
import { friendlyRelative, formatDateTimeHe, hebrewDateString } from '../lib/dates';
import { taskStatusLabel, taskTypeLabel } from '../lib/labels';

export function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(taskId);
  const { data: course } = useCourse(task?.course_id);
  const del = useDeleteTask();
  const setStatus = useSetTaskStatus();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <div className="flex justify-center py-xl"><Spinner /></div>;
  if (!task) return <p className="text-on-surface-variant">משימה לא נמצאה.</p>;

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <Link to={course ? `/courses/${course.id}` : '/courses'} className="text-on-surface-variant hover:text-primary flex items-center gap-xs">
        <Icon name="arrow_forward" /> חזרה {course ? `ל${course.name}` : 'לקורסים'}
      </Link>

      {editing ? (
        <TaskForm
          courseId={task.course_id}
          initial={task}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <article className="card-level-1 p-lg flex flex-col gap-md">
          <div className="flex items-start justify-between gap-md">
            <div className="min-w-0">
              <span className="font-caption text-caption text-on-surface-variant">{taskTypeLabel[task.type]}</span>
              <h2 className="font-display text-headline-md text-primary">{task.title}</h2>
            </div>
            <span className="badge-pending font-caption text-label-caps px-2 py-1 rounded whitespace-nowrap">
              {taskStatusLabel[task.status]}
            </span>
          </div>

          {task.description && (
            <p className="font-body text-body-md text-on-surface whitespace-pre-wrap">{task.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-md text-body-md">
            {task.due_date && (
              <>
                <div>
                  <dt className="font-caption text-caption text-on-surface-variant">תאריך יעד</dt>
                  <dd className="font-body">{formatDateTimeHe(task.due_date)}</dd>
                  <dd className="font-caption text-caption text-on-surface-variant">{hebrewDateString(task.due_date)}</dd>
                </div>
                <div>
                  <dt className="font-caption text-caption text-on-surface-variant">בעוד</dt>
                  <dd className="font-body">{friendlyRelative(task.due_date)}</dd>
                </div>
              </>
            )}
            {task.weight != null && (
              <div>
                <dt className="font-caption text-caption text-on-surface-variant">משקל בציון</dt>
                <dd className="font-body">{task.weight}%</dd>
              </div>
            )}
          </dl>

          <div className="flex flex-wrap gap-sm pt-sm border-t border-outline-variant">
            <button
              onClick={() =>
                setStatus.mutate({ id: task.id, status: task.status === 'done' ? 'pending' : 'done' })
              }
              className="flex items-center gap-xs px-3 py-2 rounded-lg bg-primary text-on-primary font-display text-body-md hover:opacity-90"
            >
              <Icon name={task.status === 'done' ? 'undo' : 'check'} />
              {task.status === 'done' ? 'בטל סימון' : 'סמן כהושלם'}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-xs px-3 py-2 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container"
            >
              <Icon name="edit" /> עריכה
            </button>
            <button
              onClick={async () => {
                if (!confirm('למחוק משימה זו?')) return;
                await del.mutateAsync(task.id);
                navigate(course ? `/courses/${course.id}` : '/courses');
              }}
              className="flex items-center gap-xs px-3 py-2 rounded-lg border border-outline-variant text-error hover:bg-error-container"
            >
              <Icon name="delete" /> מחק
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
