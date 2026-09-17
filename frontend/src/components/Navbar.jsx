import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronDown, PanelLeft } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';

const winFont = { fontFamily: "system-ui,'Segoe UI',sans-serif" };

export default function Navbar({
  currentView,
  setCurrentView,
  setIsMobileOpen,
  breadcrumbPath,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) {
  const { user, logout, isAdmin } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Windows Explorer search shortcuts: Ctrl+E, Ctrl+F, or Ctrl+K focus the active Address Bar search box
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'f' || e.key === 'e')) {
        const searchInput = document.getElementById('explorer-search-input');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getSectionTitle = () => {
    if (breadcrumbPath) return breadcrumbPath;
    if (currentView === 'dashboard') return 'Home';
    if (currentView === 'admin') return 'Settings & Administration';
    return 'Documents';
  };

  const roleBadge = {
    ADMIN: { label: 'Admin', color: '#6B2FBA', bg: '#F4EFFE' },
    MANAGER: { label: 'Manager', color: '#0063B1', bg: '#EFF6FC' },
    VIEWER: { label: 'Viewer', color: '#107C10', bg: '#DFF6DD' },
  }[user?.role?.toUpperCase()] || { label: user?.role, color: '#5f5f5f', bg: '#F0F0F0' };

  return (
    /* Windows Explorer top bar: gray gradient, compact 40px */
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#D6D6D6]"
      style={{
        height: '40px',
        background: '#F5F5F5',
        padding: '0 12px',
        ...winFont,
      }}
    >
      {/* ── Left: Mobile Sidebar Toggle + Location ───────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={() => setIsMobileOpen(prev => !prev)}
          className="lg:hidden p-1.5 rounded hover:bg-[#E8E8E8] text-[#5f5f5f] transition-colors"
          title="Toggle Navigation Menu"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 text-xs text-[#5f5f5f] truncate font-medium">
          <span className="hidden sm:inline">DocuSphere</span>
          <span className="hidden sm:inline text-[#ABABAB]">›</span>
          <span className="text-[#1a1a1a]">{getSectionTitle()}</span>
        </div>
      </div>

      {/* ── Right: Notifications + User ───────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        <NotificationsDropdown setCurrentView={setCurrentView} />

        <div style={{ width: '1px', height: '20px', background: '#D6D6D6', margin: '0 2px' }} />

        {/* User profile button */}
        {user && (
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 rounded hover:bg-[#E8E8E8] transition-colors"
              style={{ padding: '3px 6px', border: '1px solid transparent', cursor: 'pointer', ...winFont }}
              title={`${user.first_name} ${user.last_name}`}
            >
              {/* Windows-style user avatar circle */}
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: '#0078D4', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700, flexShrink: 0,
              }}>
                {(user.first_name?.[0] || user.email[0]).toUpperCase()}
              </div>

              <div className="hidden md:flex flex-col items-start">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>
                  {user.first_name} {user.last_name}
                </span>
                <span style={{ fontSize: '10px', color: '#5f5f5f', lineHeight: 1.2 }}>
                  {user.role}
                </span>
              </div>

              <ChevronDown style={{ width: '11px', height: '11px', color: '#5f5f5f' }} />
            </button>

            {/* Profile dropdown — Windows dialog style */}
            {isProfileMenuOpen && (
              <div
                className="absolute right-0 mt-0.5 animate-fadeIn"
                style={{
                  width: '220px',
                  background: '#FFFFFF',
                  border: '1px solid #ABABAB',
                  borderRadius: '3px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  ...winFont,
                }}
              >
                {/* User info header */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #E8E8E8', background: '#F5F5F5' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                    {user.first_name} {user.last_name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#5f5f5f', marginTop: '1px', fontFamily: 'Consolas,monospace' }}>
                    {user.email}
                  </div>
                  <div
                    style={{
                      marginTop: '5px',
                      display: 'inline-block',
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '2px',
                      background: roleBadge.bg,
                      color: roleBadge.color,
                      border: `1px solid ${roleBadge.color}40`,
                      fontWeight: 600,
                    }}
                  >
                    {roleBadge.label}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => { setCurrentView('admin'); setIsProfileMenuOpen(false); }}
                    className="w-full text-left hover:bg-[#E8E8E8] transition-colors"
                    style={{ padding: '6px 12px', fontSize: '13px', color: '#1a1a1a', display: 'block', cursor: 'pointer', ...winFont }}
                  >
                    🔧 Admin Console
                  </button>
                )}

                <div style={{ height: '1px', background: '#E8E8E8', margin: '2px 0' }} />

                <button
                  onClick={() => { setIsProfileMenuOpen(false); logout(); }}
                  className="w-full text-left hover:bg-[#FDE7E9] transition-colors"
                  style={{ padding: '6px 12px', fontSize: '13px', color: '#C42B1C', display: 'block', cursor: 'pointer', ...winFont }}
                >
                  ⏻ Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
