import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Faculty } from '../types/database';
import { useAuth } from './useAuth';

interface SeedCourse {
  name: string;
  faculty: Faculty;
  icon: string;
}

const SEED: SeedCourse[] = [
  // משפטים
  { name: 'דיני עונשין', faculty: 'law', icon: 'gavel' },
  { name: 'משפט מינהלי', faculty: 'law', icon: 'account_balance' },
  { name: 'משפט עברי', faculty: 'law', icon: 'menu_book' },
  { name: 'מיומנויות כתיבה', faculty: 'law', icon: 'edit_note' },
  { name: 'דיני נזיקין', faculty: 'law', icon: 'balance' },
  // כלכלה
  { name: 'מבוא למאקרו', faculty: 'economics', icon: 'monitoring' },
  { name: 'מתמטיקה לכלכלנים ב׳', faculty: 'economics', icon: 'functions' },
  { name: 'מבוא לסטטיסטיקה ב׳', faculty: 'economics', icon: 'bar_chart' },
];

/**
 * Seeds the 8 semester courses for the user on their very first login.
 * Idempotent: relies on `profiles.seeded` flag so re-runs are no-ops.
 */
export function useSeedCourses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (!user || ran.current) return;
    ran.current = true;

    (async () => {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('seeded')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr) {
        console.error('seed: failed to read profile', profileErr);
        return;
      }
      if (profile?.seeded) return;

      const rows = SEED.map((c) => ({ ...c, user_id: user.id }));
      const { error: insertErr } = await supabase.from('courses').insert(rows);
      if (insertErr) {
        console.error('seed: failed to insert courses', insertErr);
        return;
      }

      const { error: updateErr } = await supabase.from('profiles').update({ seeded: true }).eq('id', user.id);
      if (updateErr) console.error('seed: failed to mark profile seeded', updateErr);

      qc.invalidateQueries({ queryKey: ['courses'] });
    })();
  }, [user, qc]);
}
