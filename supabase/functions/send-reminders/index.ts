// Supabase Edge Function: send-reminders
// Runs daily via pg_cron. For each pending task with due_date in {7,3,1,0} days,
// sends a Web Push to all of the owning user's push subscriptions.
//
// Required environment variables (set via `supabase secrets set`):
//   SUPABASE_URL                — auto-set
//   SUPABASE_SERVICE_ROLE_KEY   — auto-set
//   VAPID_PUBLIC_KEY            — paste from `npx web-push generate-vapid-keys`
//   VAPID_PRIVATE_KEY           — same
//   VAPID_SUBJECT               — "mailto:you@example.com"
//
// Deploy: supabase functions deploy send-reminders --no-verify-jwt

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')!;
const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@studento.app';

webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

const OFFSETS = [7, 3, 1, 0] as const;

interface PendingTask {
  id: string;
  user_id: string;
  title: string;
  due_date: string;
  course_id: string;
  type: string;
}

interface Sub {
  endpoint: string;
  p256dh: string;
  auth: string;
}

function offsetLabel(d: number): string {
  if (d === 0) return 'היום זה היום!';
  if (d === 1) return 'מחר!';
  return `בעוד ${d} ימים`;
}

function typeLabel(t: string): string {
  return {
    reading: 'קריאה',
    assignment: 'מטלה',
    exam: 'מבחן',
    quiz: 'בוחן',
    event: 'אירוע',
  }[t] ?? 'משימה';
}

Deno.serve(async (req) => {
  try {
    // Mark overdue first
    await supabase.rpc('mark_overdue_tasks').catch(() => {});

    const now = new Date();
    const results: { offset: number; sent: number; skipped: number }[] = [];

    for (const offset of OFFSETS) {
      const dayStart = new Date(now);
      dayStart.setUTCHours(0, 0, 0, 0);
      dayStart.setUTCDate(dayStart.getUTCDate() + offset);
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, user_id, title, due_date, course_id, type')
        .eq('status', 'pending')
        .gte('due_date', dayStart.toISOString())
        .lt('due_date', dayEnd.toISOString());

      if (error) throw error;

      let sent = 0, skipped = 0;

      for (const task of (tasks ?? []) as PendingTask[]) {
        // Dedupe via reminders_sent unique (task_id, offset_days)
        const { error: insErr } = await supabase
          .from('reminders_sent')
          .insert({ task_id: task.id, offset_days: offset });
        if (insErr) {
          skipped++;
          continue;
        }

        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', task.user_id);

        const payload = JSON.stringify({
          title: `${typeLabel(task.type)} — ${offsetLabel(offset)}`,
          body: task.title,
          url: `/tasks/${task.id}`,
          tag: `task-${task.id}-${offset}`,
        });

        for (const s of (subs ?? []) as Sub[]) {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload,
            );
            sent++;
          } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
            }
            console.error('push failed', err);
          }
        }
      }

      results.push({ offset, sent, skipped });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
});
