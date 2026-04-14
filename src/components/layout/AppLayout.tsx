import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import MobileTabBar from './MobileTabBar';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <MobileHeader />
      <main className="app-main">
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
