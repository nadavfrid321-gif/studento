import { supabase } from './supabase';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function subscribeToPush(): Promise<void> {
  if (!pushSupported()) throw new Error('הדפדפן לא תומך בדחיפות.');
  if (!VAPID_PUBLIC || VAPID_PUBLIC.startsWith('BPLACEHOLDER')) {
    throw new Error('VAPID public key חסר ב-.env.local — ראה README → "תזכורות push".');
  }

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('אישור התראות נדרש.');

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }

  const json = sub.toJSON();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('לא מחובר.');

  await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys!.p256dh!,
        auth: json.keys!.auth!,
      },
      { onConflict: 'endpoint' },
    );
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}

export async function isPushActive(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}
