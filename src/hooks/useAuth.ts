import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true });

  useEffect(() => {
    let mounted = true;
    console.log('[auth] init. URL=', window.location.href);

    supabase.auth.getSession().then(({ data, error }) => {
      console.log('[auth] getSession err=', error ? JSON.stringify(error) : 'null', 'session=', data.session ? 'EXISTS user=' + data.session.user?.email : 'NULL');
      if (!mounted) return;
      setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[auth] state change event=', event, 'session=', session ? 'EXISTS user=' + session.user?.email : 'NULL');
      setState({ session, user: session?.user ?? null, loading: false });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
