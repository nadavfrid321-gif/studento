import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { isPushActive, pushSupported, subscribeToPush, unsubscribeFromPush } from '../lib/push';
import { formatDateTimeHe } from '../lib/dates';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';

interface ReminderRow {
  id: string;
  task_id: string;
  offset_days: number;
  sent_at: string;
  tasks: { title: string; due_date: string | null; course_id: string } | null;
}

export function Notifications() {
  const [active, setActive] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void isPushActive().then(setActive);
  }, []);

  const { data: log, isLoading } = useQuery({
    queryKey: ['reminders-sent'],
    queryFn: async (): Promise<ReminderRow[]> => {
      const { data, error } = await supabase
        .from('reminders_sent')
        .select('id, task_id, offset_days, sent_at, tasks (title, due_date, course_id)')
        .order('sent_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as unknown as ReminderRow[]) ?? [];
    },
  });

  async function toggle() {
    setBusy(true);
    setErr(null);
    try {
      if (active) {
        await unsubscribeFromPush();
        setActive(false);
      } else {
        await subscribeToPush();
        setActive(true);
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <section className="card-level-1 p-lg flex flex-col gap-md">
        <div className="flex items-center gap-md">
          <Icon name="notifications" filled className="!text-3xl text-primary" />
          <div className="min-w-0">
            <h2 className="font-display text-title-sm text-primary">תזכורות דחיפה</h2>
            <p className="font-caption text-caption text-on-surface-variant">
              {!pushSupported()
                ? 'הדפדפן הזה לא תומך בדחיפות. נסה Chrome/Edge.'
                : active === null
                ? 'בודק…'
                : active
                ? 'פעיל. תקבל התראות 7 / 3 / 1 ימים לפני כל תאריך יעד.'
                : 'כבוי. הפעל כדי לקבל התראות לפני כל מבחן או מטלה.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={!pushSupported() || busy}
          onClick={toggle}
          className={
            'self-start px-4 py-2 rounded-lg font-display text-body-md transition-all disabled:opacity-50 ' +
            (active ? 'border border-outline-variant text-on-surface hover:bg-surface-container' : 'bg-primary text-on-primary hover:opacity-90')
          }
        >
          {active ? 'כבה דחיפות' : 'הפעל דחיפות'}
        </button>
        {err && <p className="text-error font-caption text-caption">{err}</p>}
      </section>

      <section className="flex flex-col gap-sm">
        <h3 className="font-display text-title-sm text-primary">היסטוריית תזכורות</h3>
        {isLoading ? (
          <Spinner />
        ) : !log || log.length === 0 ? (
          <p className="font-body text-body-md text-on-surface-variant">לא נשלחו עדיין תזכורות.</p>
        ) : (
          <ul className="flex flex-col gap-sm">
            {log.map((r) => (
              <li key={r.id} className="card-level-1 p-md flex items-start gap-md">
                <Icon name="alarm" className="text-on-surface-variant" />
                <div className="min-w-0 flex-grow">
                  <p className="font-display text-body-md text-primary truncate">{r.tasks?.title ?? 'משימה'}</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    {r.offset_days === 0 ? 'יום ההגשה' : `${r.offset_days} ימים לפני ההגשה`}
                    {' · '}נשלח: {formatDateTimeHe(r.sent_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
