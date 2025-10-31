import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Recuperar estado do localStorage ou usar true como padrão
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('desktopSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Salvar estado no localStorage quando mudar
  const toggleDesktopSidebar = () => {
    setDesktopSidebarOpen((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('desktopSidebarOpen', JSON.stringify(newValue));
      return newValue;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        isDesktopOpen={desktopSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onDesktopMenuToggle={toggleDesktopSidebar}
          isDesktopSidebarOpen={desktopSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6" style={{ overscrollBehavior: 'none' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
