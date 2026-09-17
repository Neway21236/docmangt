import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────────────────────
   Windows File Explorer–style inline SVG icons
   Each icon is a 16×16 flat-color SVG matching the Windows 10/11 shell icon set
   ───────────────────────────────────────────────────────────────────────────── */

const IcoHome = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5L1 7.5V14.5H5.5V10H10.5V14.5H15V7.5L8 1.5Z" fill="#FFCA28"/>
    <path d="M8 2.4L1.8 8V14H5V9.5H11V14H14.2V8L8 2.4Z" fill="#FFB300"/>
    <rect x="5" y="9.5" width="6" height="4.5" fill="#E3F2FD"/>
    <rect x="6.5" y="11" width="3" height="3" fill="#90CAF9"/>
    <path d="M8 1L0.5 7.5H2.5L8 2.5L13.5 7.5H15.5L8 1Z" fill="#795548"/>
  </svg>
);

const IcoAllDocs = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Back document */}
    <rect x="3" y="4" width="9" height="11" rx="0.5" fill="#B0BEC5"/>
    {/* Mid document */}
    <rect x="4" y="2.5" width="9" height="11" rx="0.5" fill="#CFD8DC"/>
    {/* Front document */}
    <rect x="5" y="1" width="9" height="11" rx="0.5" fill="white" stroke="#90A4AE" strokeWidth="0.5"/>
    <path d="M8 4L13 4" stroke="#90A4AE" strokeWidth="1" strokeLinecap="round"/>
    <path d="M7 4L5 4" stroke="#42A5F5" strokeWidth="1" strokeLinecap="round"/>
    <path d="M5 6.5H13" stroke="#CFD8DC" strokeWidth="0.8" strokeLinecap="round"/>
    <path d="M5 8.5H11" stroke="#CFD8DC" strokeWidth="0.8" strokeLinecap="round"/>
    <path d="M5 10.5H12" stroke="#CFD8DC" strokeWidth="0.8" strokeLinecap="round"/>
  </svg>
);

const IcoFolder = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4.5C1 3.948 1.448 3.5 2 3.5H6.172C6.435 3.5 6.687 3.605 6.874 3.793L7.707 4.625C7.895 4.813 8.147 4.918 8.41 4.918H14C14.552 4.918 15 5.366 15 5.918V12.5C15 13.052 14.552 13.5 14 13.5H2C1.448 13.5 1 13.052 1 12.5V4.5Z" fill="#FFCA28"/>
    <path d="M1 6C1 5.448 1.448 5 2 5H14C14.552 5 15 5.448 15 6V12.5C15 13.052 14.552 13.5 14 13.5H2C1.448 13.5 1 13.052 1 12.5V6Z" fill="#FFD54F"/>
    <path d="M1 6.5H15" stroke="#FFB300" strokeWidth="0.5"/>
  </svg>
);

const IcoClock = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" fill="white" stroke="#90A4AE" strokeWidth="1"/>
    <circle cx="8" cy="8" r="6" fill="#F5F5F5"/>
    {/* Hour markers */}
    <rect x="7.6" y="2.5" width="0.8" height="1.5" rx="0.4" fill="#90A4AE"/>
    <rect x="7.6" y="12" width="0.8" height="1.5" rx="0.4" fill="#90A4AE"/>
    <rect x="2.5" y="7.6" width="1.5" height="0.8" rx="0.4" fill="#90A4AE"/>
    <rect x="12" y="7.6" width="1.5" height="0.8" rx="0.4" fill="#90A4AE"/>
    {/* Hands */}
    <line x1="8" y1="8" x2="8" y2="4.5" stroke="#212121" strokeWidth="1" strokeLinecap="round"/>
    <line x1="8" y1="8" x2="10.5" y2="9.5" stroke="#212121" strokeWidth="0.9" strokeLinecap="round"/>
    <circle cx="8" cy="8" r="0.8" fill="#212121"/>
  </svg>
);

const IcoStar = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5L9.854 5.254L14 5.927L11 8.854L11.708 13L8 11.046L4.292 13L5 8.854L2 5.927L6.146 5.254L8 1.5Z"
      fill="#FFB300" stroke="#E65100" strokeWidth="0.4" strokeLinejoin="round"/>
  </svg>
);

const IcoSharedWithMe = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Back person */}
    <circle cx="11" cy="5.5" r="2.5" fill="#B0BEC5"/>
    <path d="M7.5 14C7.5 11.515 9.015 9.5 11 9.5C12.985 9.5 14.5 11.515 14.5 14" fill="#B0BEC5"/>
    {/* Front person */}
    <circle cx="6" cy="5.5" r="2.5" fill="#42A5F5"/>
    <path d="M1.5 14C1.5 11.515 3.515 9.5 6 9.5C8.485 9.5 10.5 11.515 10.5 14" fill="#42A5F5"/>
  </svg>
);

const IcoSharedByMe = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="5" r="2.5" fill="#42A5F5"/>
    <path d="M1 14C1 11.239 3.239 9 6 9C8.761 9 11 11.239 11 14" fill="#42A5F5"/>
    {/* Share arrow */}
    <circle cx="13" cy="4" r="1.5" fill="#66BB6A" stroke="white" strokeWidth="0.5"/>
    <circle cx="13" cy="10" r="1.5" fill="#66BB6A" stroke="white" strokeWidth="0.5"/>
    <path d="M11 5.5L11 4M11 4L13 4M11 4L11 5" stroke="#66BB6A" strokeWidth="1" strokeLinecap="round"/>
    <line x1="11" y1="8.5" x2="13" y2="10" stroke="#66BB6A" strokeWidth="1" strokeLinecap="round"/>
    <line x1="11" y1="5.5" x2="13" y2="4" stroke="#66BB6A" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const IcoApprovals = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="1.5" width="12" height="13" rx="1" fill="white" stroke="#90A4AE" strokeWidth="0.75"/>
    <path d="M4 5.5H12" stroke="#CFD8DC" strokeWidth="0.8" strokeLinecap="round"/>
    <path d="M4 7.5H10" stroke="#CFD8DC" strokeWidth="0.8" strokeLinecap="round"/>
    <path d="M4 9.5H11" stroke="#CFD8DC" strokeWidth="0.8" strokeLinecap="round"/>
    {/* Green checkmark badge */}
    <circle cx="12" cy="12" r="3.5" fill="#4CAF50"/>
    <path d="M10.2 12L11.5 13.3L13.8 11" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoAudit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Timeline lines */}
    <line x1="5" y1="4" x2="5" y2="14" stroke="#CFD8DC" strokeWidth="1"/>
    <circle cx="5" cy="4" r="1.5" fill="#42A5F5"/>
    <circle cx="5" cy="8" r="1.5" fill="#66BB6A"/>
    <circle cx="5" cy="12" r="1.5" fill="#FFB300"/>
    <rect x="7.5" y="3" width="7" height="1.5" rx="0.75" fill="#B0BEC5"/>
    <rect x="7.5" y="7" width="5.5" height="1.5" rx="0.75" fill="#B0BEC5"/>
    <rect x="7.5" y="11" width="6.5" height="1.5" rx="0.75" fill="#B0BEC5"/>
  </svg>
);

const IcoUsers = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="4.5" r="3" fill="#42A5F5"/>
    <path d="M2 14.5C2 11.186 4.686 8.5 8 8.5C11.314 8.5 14 11.186 14 14.5" fill="#42A5F5"/>
    {/* Shield badge */}
    <path d="M12 10.5L12 12.5C12 13.328 13 14 13 14C13 14 14 13.328 14 12.5V10.5L13 10L12 10.5Z" fill="#FFB300" stroke="#E65100" strokeWidth="0.4"/>
  </svg>
);

const IcoSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="2.5" fill="#607D8B"/>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8 1C7.45 1 7 1.45 7 2V2.5C6.27 2.71 5.61 3.09 5.06 3.59L4.62 3.35C4.14 3.08 3.53 3.25 3.26 3.73L2.26 5.46C1.99 5.94 2.16 6.55 2.64 6.82L3.08 7.07C3.03 7.38 3 7.69 3 8C3 8.31 3.03 8.62 3.08 8.93L2.64 9.18C2.16 9.45 1.99 10.06 2.26 10.54L3.26 12.27C3.53 12.75 4.14 12.92 4.62 12.65L5.06 12.41C5.61 12.91 6.27 13.29 7 13.5V14C7 14.55 7.45 15 8 15C8.55 15 9 14.55 9 14V13.5C9.73 13.29 10.39 12.91 10.94 12.41L11.38 12.65C11.86 12.92 12.47 12.75 12.74 12.27L13.74 10.54C14.01 10.06 13.84 9.45 13.36 9.18L12.92 8.93C12.97 8.62 13 8.31 13 8C13 7.69 12.97 7.38 12.92 7.07L13.36 6.82C13.84 6.55 14.01 5.94 13.74 5.46L12.74 3.73C12.47 3.25 11.86 3.08 11.38 3.35L10.94 3.59C10.39 3.09 9.73 2.71 9 2.5V2C9 1.45 8.55 1 8 1ZM8 10.5C6.62 10.5 5.5 9.38 5.5 8C5.5 6.62 6.62 5.5 8 5.5C9.38 5.5 10.5 6.62 10.5 8C10.5 9.38 9.38 10.5 8 10.5Z"
      fill="#90A4AE"/>
    <circle cx="8" cy="8" r="2" fill="#607D8B"/>
  </svg>
);

const IcoHelp = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="6.5" fill="white" stroke="#90A4AE" strokeWidth="1"/>
    <path d="M6.2 6C6.2 4.897 7.012 4 8 4C8.988 4 9.8 4.897 9.8 6C9.8 7.103 9.2 7.6 8.5 8.2C8.2 8.45 8 8.8 8 9.2V9.5" stroke="#42A5F5" strokeWidth="1.1" strokeLinecap="round"/>
    <circle cx="8" cy="11.5" r="0.7" fill="#42A5F5"/>
  </svg>
);

const IcoChevronLeft = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M7.5 9L4.5 6L7.5 3" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M4.5 3L7.5 6L4.5 9" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* Expand arrow for collapsible sections (like Windows Explorer tree) */
const IcoExpand = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
    <path
      d={open ? 'M2 3.5L5 6.5L8 3.5' : 'M3.5 2L6.5 5L3.5 8'}
      stroke="#6B6B6B"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Main Sidebar Component
   ───────────────────────────────────────────────────────────────────────────── */

export default function Sidebar({
  currentView,
  setCurrentView,
  adminTab = 'users',
  setAdminTab,
  sidebarFilter,
  setSidebarFilter,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  setIsCollapsed,
}) {
  const { isAdmin } = useAuth();

  // Track which sections are expanded (all open by default)
  const [openSections, setOpenSections] = useState({
    workspace: true,
    collaboration: true,
    governance: true,
    administration: true,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNav = (viewId, filterId = null, tabId = null) => {
    setCurrentView(viewId);
    if (viewId === 'admin' && tabId && setAdminTab) {
      setAdminTab(tabId);
    }
    if (setSidebarFilter) setSidebarFilter(filterId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const isItemActive = (viewId, filterId = null, tabId = null) => {
    if (viewId === 'documents') {
      if (filterId) return currentView === 'documents' && sidebarFilter === filterId;
      return currentView === 'documents' && !sidebarFilter;
    }
    if (viewId === 'admin') {
      if (tabId) return currentView === 'admin' && adminTab === tabId;
      return currentView === 'admin';
    }
    return currentView === viewId;
  };

  /* ── Single nav item ─────────────────────────────────────────────────── */
  const NavItem = ({ viewId, filterId = null, tabId = null, Icon, label }) => {
    const active = isItemActive(viewId, filterId, tabId);
    return (
      <button
        onClick={() => handleNav(viewId, filterId, tabId)}
        title={isCollapsed ? label : undefined}
        style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}
        className={`
          w-full flex items-center rounded-[3px] transition-colors duration-100 relative group select-none
          ${isCollapsed ? 'justify-center px-0 py-[5px]' : 'gap-[7px] px-[8px] py-[4px]'}
          ${active
            ? 'bg-[#CCE4F7] text-[#1a1a1a]'
            : 'text-[#1a1a1a] hover:bg-[#E8E8E8]'
          }
        `}
      >
        <Icon />
        {!isCollapsed && (
          <span style={{ fontSize: '13px', fontWeight: 400, lineHeight: '20px' }} className="truncate">
            {label}
          </span>
        )}

        {/* Tooltip in collapsed mode */}
        {isCollapsed && (
          <span
            className="pointer-events-none absolute left-full ml-2 px-2 py-1 z-50 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: '#1a1a1a',
              color: 'white',
              fontSize: '12px',
              borderRadius: '3px',
              fontFamily: "system-ui, 'Segoe UI', sans-serif",
            }}
          >
            {label}
          </span>
        )}
      </button>
    );
  };

  /* ── Collapsible section header (like Windows Explorer tree root) ─────── */
  const Section = ({ sectionKey, label, children }) => {
    const isOpen = openSections[sectionKey];
    if (isCollapsed) {
      return (
        <>
          <div className="h-px bg-[#E0E0E0] my-1.5 mx-1" />
          {children}
        </>
      );
    }
    return (
      <div>
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center gap-1 px-2 py-[3px] hover:bg-[#E8E8E8] rounded-[3px] transition-colors group"
          style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}
        >
          <IcoExpand open={isOpen} />
          <span style={{
            fontSize: '11px',
            fontWeight: 400,
            color: '#5f5f5f',
            lineHeight: '18px',
            userSelect: 'none',
          }}>
            {label}
          </span>
        </button>
        {isOpen && (
          <div className="pl-3 space-y-[1px]">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 z-40 h-full bg-white border-r border-[#d6d6d6]
          flex flex-col shrink-0 transition-all duration-150 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'w-[44px]' : 'w-[210px]'}
        `}
        style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}
      >
        {/* Header: App name + collapse toggle */}
        <div
          className={`h-10 flex items-center border-b border-[#d6d6d6] shrink-0 ${
            isCollapsed ? 'justify-center' : 'px-2 justify-between'
          }`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2 min-w-0 pl-1">
              {/* Windows-style app icon: folder with "D" */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M1 5C1 4.448 1.448 4 2 4H7L8.5 5.5H16C16.552 5.5 17 5.948 17 6.5V14C17 14.552 16.552 15 16 15H2C1.448 15 1 14.552 1 14V5Z" fill="#FFD54F"/>
                <path d="M1 7H17V14C17 14.552 16.552 15 16 15H2C1.448 15 1 14.552 1 14V7Z" fill="#FFCA28"/>
                <text x="8" y="13" textAnchor="middle" fontSize="7" fontWeight="700" fill="#795548" fontFamily="Segoe UI,sans-serif">D</text>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1 }}>
                DocuSphere
              </span>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="w-7 h-7 flex items-center justify-center rounded-[3px] hover:bg-[#E8E8E8] transition-colors shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <IcoChevronRight /> : <IcoChevronLeft />}
          </button>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden py-1.5 space-y-[1px] ${isCollapsed ? 'px-1' : 'px-1.5'}`}>

          <Section sectionKey="workspace" label="Quick access">
            <NavItem viewId="dashboard"             filterId={null}           Icon={IcoHome}        label="Overview" />
            <NavItem viewId="documents"             filterId={null}           Icon={IcoAllDocs}     label="All Documents" />
            <NavItem viewId="documents"             filterId="my-files"       Icon={IcoFolder}      label="My Files" />
            <NavItem viewId="documents"             filterId="recent"         Icon={IcoClock}       label="Recent" />
            <NavItem viewId="documents"             filterId="favorites"      Icon={IcoStar}        label="Favorites" />
          </Section>

          <Section sectionKey="collaboration" label="Shared">
            <NavItem viewId="documents" filterId="shared-with-me" Icon={IcoSharedWithMe} label="Shared with me" />
            <NavItem viewId="documents" filterId="shared-by-me"  Icon={IcoSharedByMe}  label="Shared by me" />
          </Section>

          <Section sectionKey="governance" label="Governance">
            {isAdmin ? (
              <NavItem viewId="admin" tabId="approvals" Icon={IcoApprovals} label="Approvals" />
            ) : (
              <NavItem viewId="documents" filterId="approvals" Icon={IcoApprovals} label="Approvals" />
            )}
            {isAdmin && (
              <NavItem viewId="admin" tabId="logs" Icon={IcoAudit} label="Audit Trail" />
            )}
          </Section>

          {isAdmin && (
            <Section sectionKey="administration" label="Administration">
              <NavItem viewId="admin" tabId="users" Icon={IcoUsers} label="Users & Roles" />
            </Section>
          )}
        </div>

        {/* Bottom utility */}
        <div className={`border-t border-[#d6d6d6] py-1.5 space-y-[1px] ${isCollapsed ? 'px-1' : 'px-1.5'}`}>
          <NavItem viewId="admin" tabId="users" Icon={IcoSettings} label="Settings" />
          {!isCollapsed ? (
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-[7px] px-[8px] py-[4px] rounded-[3px] hover:bg-[#E8E8E8] transition-colors"
              style={{ fontSize: '13px', color: '#1a1a1a', fontFamily: "system-ui, 'Segoe UI', sans-serif" }}
            >
              <IcoHelp />
              <span style={{ fontSize: '13px', fontWeight: 400 }}>Help</span>
            </a>
          ) : (
            <button
              title="Help"
              className="w-full flex justify-center py-[5px] rounded-[3px] hover:bg-[#E8E8E8] transition-colors relative group"
            >
              <IcoHelp />
              <span
                className="pointer-events-none absolute left-full ml-2 px-2 py-1 z-50 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: '#1a1a1a', color: 'white', fontSize: '12px', borderRadius: '3px' }}
              >
                Help
              </span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
