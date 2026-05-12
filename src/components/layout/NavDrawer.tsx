import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Icon } from '../ui/Icon';
import { useAuth, signOut } from '../../hooks/useAuth';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
}

const items: NavItem[] = [
  { to: '/', icon: 'dashboard', label: 'לוח בקרה', end: true },
  { to: '/courses', icon: 'folder_open', label: 'קורסים' },
  { to: '/calendar', icon: 'calendar_month', label: 'יומן' },
  { to: '/notifications', icon: 'notifications', label: 'התראות' },
];

const secondaryItems: NavItem[] = [
  { to: '/settings', icon: 'settings', label: 'הגדרות' },
];

export function NavDrawer() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'סטודנט';
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <nav className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-surface-container-lowest border-l border-outline-variant shadow-sm p-lg z-40">
      <div className="flex items-center gap-sm mb-xl">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant flex-shrink-0 flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name="person" filled className="text-on-surface-variant" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-display text-title-sm text-primary truncate">{name}</span>
          <span className="font-caption text-caption text-on-surface-variant">משפטים + כלכלה</span>
        </div>
      </div>

      <ul className="flex flex-col gap-xs flex-grow">
        {items.map((item) => (
          <li key={item.to}>
            <NavItemLink {...item} />
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col gap-xs">
        {secondaryItems.map((item) => (
          <NavItemLink key={item.to} {...item} />
        ))}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-md px-4 py-3 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant font-body text-body-md text-right w-full"
        >
          <Icon name="logout" />
          <span>התנתק</span>
        </button>
      </div>
    </nav>
  );
}

function NavItemLink({ to, icon, label, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-md px-4 py-3 rounded-lg transition-colors',
          isActive
            ? 'bg-secondary-container text-on-secondary-container font-display text-title-sm'
            : 'text-on-surface-variant font-body text-body-md hover:bg-surface-container',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} filled={isActive} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
