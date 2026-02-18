import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <div className={`
        flex-1 flex flex-col h-screen overflow-hidden relative
        transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>


        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative no-scrollbar pb-16 lg:pb-0">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
