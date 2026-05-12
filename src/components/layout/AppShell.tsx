import { Outlet } from 'react-router-dom';
import { NavDrawer } from './NavDrawer';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { Fab } from './Fab';
import { useSeedCourses } from '../../hooks/useSeedCourses';

export function AppShell() {
  useSeedCourses();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <NavDrawer />
      <main className="flex-grow flex flex-col min-w-0 pb-24 md:pb-0">
        <TopBar />
        <div className="px-gutter py-lg max-w-[1280px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      <Fab />
    </div>
  );
}
