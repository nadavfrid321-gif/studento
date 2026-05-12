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

    const initSession = async () => {
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setState({ session: data.session, user: data.session?.user ?? null, loading: false });
    };
    initSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
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
