import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Icon } from '../ui/Icon';

const items = [
  { to: '/', icon: 'dashboard', label: 'בקרה', end: true },
  { to: '/courses', icon: 'folder_open', label: 'קורסים' },
  { to: '/calendar', icon: 'calendar_month', label: 'יומן' },
  { to: '/notifications', icon: 'notifications', label: 'התראות' },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 flex justify-around items-center py-2 px-4 bg-surface border-t border-outline-variant z-50">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 px-4 py-1 rounded-full',
              isActive
                ? 'bg-secondary-container text-on-secondary-container'
                : 'text-on-surface-variant hover:bg-surface-container',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} />
              <span className="font-caption text-label-caps mt-1">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
