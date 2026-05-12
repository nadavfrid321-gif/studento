import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, signInWithGoogle } from '../hooks/useAuth';
import { Spinner } from '../components/ui/Spinner';
import { Icon } from '../components/ui/Icon';

export function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-gutter bg-surface">
      <div className="w-full max-w-md card-level-1 p-xl flex flex-col items-center gap-lg">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
          <Icon name="school" filled className="text-on-primary !text-3xl" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-display-lg text-primary mb-xs">Studento</h1>
          <p className="font-body text-body-md text-on-surface-variant">
            ניהול משימות, קריאות ומבחנים — לתואר משולב משפטים וכלכלה.
          </p>
        </div>
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-3 rounded-lg font-display text-title-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Icon name="login" />
          <span>התחברות עם Google</span>
        </button>
        <p className="font-caption text-caption text-on-surface-variant text-center">
          בלחיצה על הכפתור אתה מאשר התחברות עם חשבון Google שלך (אישי או של בר-אילן).
        </p>
      </div>
    </div>
  );
}
