import { useLocation } from 'react-router-dom';
import { Icon } from '../ui/Icon';

const titles: Record<string, string> = {
  '/': 'לוח בקרה',
  '/courses': 'קורסים',
  '/calendar': 'יומן',
  '/notifications': 'התראות',
  '/settings': 'הגדרות',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? 'Studento';

  return (
    <header className="w-full top-0 sticky bg-surface border-b border-outline-variant flex items-center justify-between px-gutter py-sm z-30">
      <div className="flex items-center gap-md">
        <h1 className="font-display text-display-lg text-primary md:text-headline-md">{title}</h1>
      </div>
      <button
        type="button"
        className="text-primary hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 duration-150"
        aria-label="חיפוש"
      >
        <Icon name="search" />
      </button>
    </header>
  );
}
