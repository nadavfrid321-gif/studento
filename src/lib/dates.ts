import { HDate } from '@hebcal/core';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInCalendarDays } from 'date-fns';
import { he } from 'date-fns/locale';

export function formatDateHe(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return format(d, 'EEEE, d בMMMM yyyy', { locale: he });
}

export function formatDateTimeHe(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return format(d, 'd בMMMM yyyy · HH:mm', { locale: he });
}

export function hebrewDateString(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const h = new HDate(d);
  return h.renderGematriya();
}

/** Returns a friendly Hebrew relative phrase if the date is within a week, otherwise the absolute date. */
export function friendlyRelative(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (isToday(d)) return 'היום';
  if (isTomorrow(d)) return 'מחר';
  const diff = differenceInCalendarDays(d, new Date());
  if (diff > 1 && diff <= 7) return `בעוד ${diff} ימים`;
  if (diff < 0 && diff >= -7) return `${formatDistanceToNow(d, { locale: he })} מאוחר`;
  return formatDateHe(d);
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return isPast(new Date(iso));
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return differenceInCalendarDays(new Date(iso), new Date());
}
