import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import DocumentsPage from './pages/DocumentsPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('documents');
  const [adminTab, setAdminTab] = useState('users');
  const [sidebarFilter, setSidebarFilter] = useState(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [breadcrumbPath, setBreadcrumbPath] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-[#667085]">
        <div className="w-8 h-8 border-2 border-[#D9DEE7] border-t-[#3157D5] rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium tracking-wide">Initializing DocuSphere DMS...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#172033]">
      {/* 40px Top Header — compact, like Windows Explorer */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        breadcrumbPath={breadcrumbPath}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />

      {/* Body: Left Sidebar + Main Content — flush, no padding */}
      <div className="flex-1 flex overflow-hidden bg-white">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          sidebarFilter={sidebarFilter}
          setSidebarFilter={setSidebarFilter}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Main Content Workspace — flush fill, no centering wrapper */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-white flex flex-col">
          {currentView === 'admin' ? (
            <div className="p-5 flex-1">
              <AdminPage setCurrentView={setCurrentView} initialTab={adminTab} />
            </div>
          ) : currentView === 'dashboard' ? (
            <DashboardPage setCurrentView={setCurrentView} setSidebarFilter={setSidebarFilter} setAdminTab={setAdminTab} />
          ) : (
            <DocumentsPage
              sidebarFilter={sidebarFilter}
              setSidebarFilter={setSidebarFilter}
              globalSearchQuery={globalSearchQuery}
              setGlobalSearchQuery={setGlobalSearchQuery}
              setBreadcrumbPath={setBreadcrumbPath}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
