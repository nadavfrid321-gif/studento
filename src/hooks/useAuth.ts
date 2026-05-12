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

    const hash = window.location.hash;
    const initSession = async () => {
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        console.log('[auth] found hash tokens, calling setSession');
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          console.log('[auth] setSession result err=', error ? JSON.stringify(error) : 'null', 'session=', data.session ? 'EXISTS' : 'NULL');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
      const { data, error } = await supabase.auth.getSession();
      console.log('[auth] getSession err=', error ? JSON.stringify(error) : 'null', 'session=', data.session ? 'EXISTS user=' + data.session.user?.email : 'NULL');
      if (!mounted) return;
      setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    };
    initSession();

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
