import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import TopBar from '../components/TopBar.jsx';

export default function AppLayout() {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] relative selection:bg-brand-500/20">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10 w-full">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
          <div className="animate-fade-in h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
