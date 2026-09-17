import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import WindowsFileIcon, {
  WindowsDriveIcon,
  WindowsDocumentsFolderIcon,
  WindowsPersonalFolderIcon,
  WindowsSharedFolderIcon,
  WindowsStarredFolderIcon,
  WindowsRecentFolderIcon,
  WindowsApprovalsFolderIcon,
} from '../components/WindowsFileIcon';
import {
  Download, Star, ChevronLeft, ChevronRight, ArrowUp, RefreshCw, Search, X, Check,
  SlidersHorizontal, HardDrive, Pin
} from 'lucide-react';
import WindowsContextMenu from '../components/WindowsContextMenu';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const winFont = { fontFamily: "system-ui, 'Segoe UI', sans-serif" };

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getFileTypeName(mimeType = '', filename = '') {
  const mime = (mimeType || '').toLowerCase();
  const lower = (filename || '').toLowerCase();
  const ext = lower.includes('.') ? lower.split('.').pop() : '';

  if (mime.includes('pdf') || ext === 'pdf') return 'PDF Document';
  if (mime.includes('word') || ['docx', 'doc', 'rtf'].includes(ext)) return 'Microsoft Word Document';
  if (mime.includes('spreadsheet') || mime.includes('excel') || ['xlsx', 'xls', 'csv'].includes(ext)) return 'Microsoft Excel Worksheet';
  if (mime.includes('presentation') || ['pptx', 'ppt'].includes(ext)) return 'PowerPoint Presentation';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'Image File';
  if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi'].includes(ext)) return 'Video File';
  if (mime.startsWith('audio/') || ['mp3', 'wav'].includes(ext)) return 'Audio File';
  if (mime.includes('zip') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Compressed Folder';
  if (mime.includes('json') || mime.includes('javascript') || ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py'].includes(ext)) return 'Code File';
  if (mime.startsWith('text/') || ext === 'txt') return 'Text Document';
  return `${(ext || 'File').toUpperCase()} File`;
}

export default function DashboardPage({ setCurrentView, setSidebarFilter, setAdminTab }) {
  const { isAdmin, token, user } = useAuth();

  const [favorites, setFavorites]           = useState([]);
  const [recentDocs, setRecentDocs]         = useState([]);
  const [stats, setStats]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [recentFilter, setRecentFilter]     = useState('all'); // all | word | excel | pdf | image | other
  const [searchFilter, setSearchFilter]     = useState('');

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'document',
    target: null,
  });

  const handleDocContextMenu = (e, doc) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'document',
      target: doc,
    });
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/favorites').then(r => r.data.success ? r.data.favorites : []).catch(() => []),
      api.get('/documents/search?limit=30&sortBy=created_at&sortDir=DESC').then(r => r.data.success ? r.data.documents : []).catch(() => []),
      api.get('/dashboard/stats').then(r => r.data.success ? r.data.stats : null).catch(() => null),
    ]).then(([favs, docs, st]) => {
      setFavorites(favs);
      setRecentDocs(docs);
      setStats(st);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const unfavorite = async (docId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/favorites/${docId}`);
      setFavorites(f => f.filter(d => d.id !== docId));
    } catch {}
  };

  const navigateTo = (view, filter = null) => {
    if (setSidebarFilter) setSidebarFilter(filter);
    setCurrentView(view);
  };

  // Filter recent docs by tab and search
  const filteredRecentDocs = recentDocs.filter(doc => {
    const mime = (doc.mime_type || '').toLowerCase();
    const name = (doc.original_filename || doc.title || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop() : '';

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      if (!name.includes(q) && !(doc.title || '').toLowerCase().includes(q)) return false;
    }

    if (recentFilter === 'all') return true;
    if (recentFilter === 'word') {
      return mime.includes('word') || ['docx', 'doc', 'rtf', 'txt'].includes(ext);
    }
    if (recentFilter === 'excel') {
      return mime.includes('spreadsheet') || mime.includes('excel') || ['xlsx', 'xls', 'csv'].includes(ext);
    }
    if (recentFilter === 'pdf') {
      return mime.includes('pdf') || ext === 'pdf';
    }
    if (recentFilter === 'image') {
      return mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext);
    }
    if (recentFilter === 'other') {
      return !mime.includes('word') && !mime.includes('spreadsheet') && !mime.includes('pdf') && !mime.startsWith('image/');
    }
    return true;
  });

  const totalQuota = 10 * 1024 * 1024 * 1024; // 10 GB
  const usedBytes = stats?.total_size || 0;
  const freeBytes = Math.max(0, totalQuota - usedBytes);
  const usedPercent = Math.min(100, Math.round((usedBytes / totalQuota) * 100));

  return (
    <div className="flex flex-col h-full bg-white select-none" style={{ ...winFont, fontSize: '13px' }}>
      
      {/* ── 1. WINDOWS FILE EXPLORER ADDRESS BAR ROW ─────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#D6D6D6] bg-white shrink-0">
        {/* Navigation Buttons: Back, Forward, Up, Refresh */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            disabled
            className="p-1 rounded text-[#9E9E9E] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-1 rounded text-[#9E9E9E] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-1 rounded text-[#9E9E9E] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Up to parent folder"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={loadData}
            className="p-1 rounded text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8] transition-colors"
            title="Refresh (F5)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0078D4]' : ''}`} />
          </button>
        </div>

        {/* Windows Explorer Address Bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-white border border-[#D6D6D6] hover:border-[#ABABAB] focus-within:border-[#0078D4] focus-within:ring-1 focus-within:ring-[#0078D4] rounded-[3px] px-2 py-0.5 text-xs transition-colors">
          {/* Windows Home Icon */}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M8 1.5L1 7.5V14.5H5.5V10H10.5V14.5H15V7.5L8 1.5Z" fill="#0078D4"/>
          </svg>
          <span className="text-[#1a1a1a] font-normal">Home</span>
          <span className="text-[#8F8F8F] text-[10px] ml-auto shrink-0 font-mono">
            {recentDocs.length} items
          </span>
        </div>

        {/* Search Home */}
        <div className="relative w-48 sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#9E9E9E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="explorer-search-input"
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search Home"
            className="w-full pl-8 pr-7 py-0.5 bg-white border border-[#D6D6D6] hover:border-[#ABABAB] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] rounded-[3px] text-xs text-[#1a1a1a] placeholder-[#9E9E9E] outline-none transition-colors"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#1a1a1a]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. SCROLLABLE CANVAS ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* ── SECTION: QUICK ACCESS ───────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Pin className="w-3.5 h-3.5 text-[#0078D4] rotate-45" />
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
              Quick access
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Quick Access Card: Documents */}
            <div
              onClick={() => navigateTo('documents', null)}
              className="flex items-center gap-3 p-2.5 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors group relative"
            >
              <WindowsDocumentsFolderIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                  Documents
                </div>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }} className="truncate">
                  Workspace root
                </div>
              </div>
              <Pin className="w-3 h-3 text-[#ABABAB] group-hover:text-[#0078D4] shrink-0 rotate-45" />
            </div>

            {/* Quick Access Card: My Files */}
            <div
              onClick={() => navigateTo('documents', 'my-files')}
              className="flex items-center gap-3 p-2.5 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors group relative"
            >
              <WindowsPersonalFolderIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                  My Files
                </div>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }} className="truncate">
                  Personal files
                </div>
              </div>
              <Pin className="w-3 h-3 text-[#ABABAB] group-hover:text-[#0078D4] shrink-0 rotate-45" />
            </div>

            {/* Quick Access Card: Shared with me */}
            <div
              onClick={() => navigateTo('documents', 'shared-with-me')}
              className="flex items-center gap-3 p-2.5 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors group relative"
            >
              <WindowsSharedFolderIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                  Shared with me
                </div>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }} className="truncate">
                  Collaborative
                </div>
              </div>
              <Pin className="w-3 h-3 text-[#ABABAB] group-hover:text-[#0078D4] shrink-0 rotate-45" />
            </div>

            {/* Quick Access Card: Approvals */}
            <div
              onClick={() => {
                if (isAdmin && setAdminTab) {
                  setAdminTab('approvals');
                  setCurrentView('admin');
                } else {
                  navigateTo('documents', 'approvals');
                }
              }}
              className="flex items-center gap-3 p-2.5 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors group relative"
            >
              <WindowsApprovalsFolderIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                  Approvals
                </div>
                <div style={{ fontSize: '11px', color: stats?.pending_approvals > 0 ? '#835B00' : '#5f5f5f' }} className="truncate font-medium">
                  {stats?.pending_approvals || 0} pending
                </div>
              </div>
              <Pin className="w-3 h-3 text-[#ABABAB] group-hover:text-[#0078D4] shrink-0 rotate-45" />
            </div>

            {/* Quick Access Card: Favorites */}
            <div
              onClick={() => navigateTo('documents', 'favorites')}
              className="flex items-center gap-3 p-2.5 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors group relative"
            >
              <WindowsStarredFolderIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                  Favorites
                </div>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }} className="truncate">
                  {favorites.length} starred
                </div>
              </div>
              <Pin className="w-3 h-3 text-[#ABABAB] group-hover:text-[#0078D4] shrink-0 rotate-45" />
            </div>

            {/* Quick Access Card: Recent */}
            <div
              onClick={() => navigateTo('documents', 'recent')}
              className="flex items-center gap-3 p-2.5 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors group relative"
            >
              <WindowsRecentFolderIcon className="w-8 h-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }} className="truncate">
                  Recent
                </div>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }} className="truncate">
                  Recent files
                </div>
              </div>
              <Pin className="w-3 h-3 text-[#ABABAB] group-hover:text-[#0078D4] shrink-0 rotate-45" />
            </div>
          </div>
        </div>

        {/* ── SECTION: DEVICES AND DRIVES (Windows Drive View) ────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
              Devices and drives
            </h2>
            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className="btn-secondary"
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                Admin Console
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Primary Cloud Storage Drive C: */}
            <div
              onClick={() => navigateTo('documents', null)}
              className="flex items-center gap-3.5 p-3 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors"
            >
              <WindowsDriveIcon className="w-10 h-10 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                    DocuSphere Cloud Storage (C:)
                  </span>
                  <span style={{ fontSize: '11px', color: '#5f5f5f' }}>
                    {stats?.total_documents ?? '—'} files
                  </span>
                </div>
                {/* Windows Drive Progress Bar */}
                <div className="w-full bg-[#E5E5E5] h-3.5 rounded-[2px] overflow-hidden border border-[#D6D6D6] p-[1px]">
                  <div
                    className="h-full rounded-[1px] transition-all duration-300"
                    style={{
                      width: `${Math.max(4, usedPercent)}%`,
                      background: usedPercent > 90 ? '#C42B1C' : '#0078D4'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5f5f5f]">
                  <span>{formatBytes(freeBytes)} free of {formatBytes(totalQuota)}</span>
                  <span>{usedPercent}% used ({formatBytes(usedBytes)})</span>
                </div>
              </div>
            </div>

            {/* Governance & Compliance Drive D: */}
            <div
              onClick={() => navigateTo('documents', 'approvals')}
              className="flex items-center gap-3.5 p-3 rounded-[3px] border border-[#E5E5E5] hover:border-[#CCE4F7] hover:bg-[#F3F9FE] cursor-pointer transition-colors"
            >
              <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10 shrink-0">
                <rect x="3" y="8" width="26" height="17" rx="2" fill="#E1E4E8" stroke="#9AA0A6" strokeWidth="1" />
                <rect x="5" y="10" width="22" height="11" rx="1" fill="#FFFFFF" />
                <path d="M12 12H20V19H12V12Z" fill="#107C10" fillOpacity="0.15" />
                <circle cx="16" cy="15.5" r="4.5" fill="#107C10" />
                <path d="M14.5 15.5L15.5 16.5L17.5 14.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="23" cy="15.5" r="1.5" fill="#0078D4" />
                <rect x="5" y="22" width="22" height="1.5" rx="0.5" fill="#BDC1C6" />
              </svg>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                    Governance &amp; Compliance (D:)
                  </span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#E6F4EA] text-[#107C10] font-medium">
                    Online
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-1 text-[#5f5f5f]">
                    <span className="w-2 h-2 rounded-full bg-[#835B00]" />
                    <span>Pending review: <strong className="text-[#1a1a1a]">{stats?.pending_approvals ?? 0}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-[#5f5f5f]">
                    <span className="w-2 h-2 rounded-full bg-[#C42B1C]" />
                    <span>Expiring soon: <strong className="text-[#1a1a1a]">{stats?.expiring_soon ?? 0}</strong></span>
                  </div>
                </div>
                <div className="text-[11px] text-[#5f5f5f]">
                  Audit trail active &bull; Enterprise role-based access
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION: FAVORITES ──────────────────────────────────────── */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#FFB300]" />
                <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                  Favorites
                </h2>
                <span style={{ fontSize: '11px', color: '#5f5f5f' }}>
                  ({favorites.length})
                </span>
              </div>
              <button
                onClick={() => navigateTo('documents', 'favorites')}
                className="text-[#0078D4] hover:underline text-xs"
              >
                View all in Documents &rarr;
              </button>
            </div>

            <div className="border border-[#D6D6D6] rounded-[2px] overflow-hidden bg-white">
              {/* Windows Explorer Table Header */}
              <div
                className="grid border-b border-[#D6D6D6] bg-[#F5F5F5] text-[#5f5f5f] text-xs font-normal"
                style={{ gridTemplateColumns: 'minmax(240px, 2fr) 150px 180px 90px' }}
              >
                <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Name</div>
                <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Date modified</div>
                <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Type</div>
                <div className="px-3 py-1.5">Size</div>
              </div>

              {/* Rows */}
              {favorites.slice(0, 8).map(doc => (
                <div
                  key={doc.id}
                  onClick={() => navigateTo('documents', null)}
                  onContextMenu={(e) => handleDocContextMenu(e, doc)}
                  className="grid items-center hover:bg-[#CCE4F7] border-b border-[#F0F0F0] last:border-0 cursor-pointer transition-colors group text-xs text-[#1a1a1a]"
                  style={{ gridTemplateColumns: 'minmax(240px, 2fr) 150px 180px 90px' }}
                >
                  <div className="flex items-center gap-2.5 px-3 py-1.5 min-w-0">
                    <WindowsFileIcon mimeType={doc.mime_type} filename={doc.original_filename} className="w-5 h-5 shrink-0" />
                    <span className="truncate font-medium">{doc.title}</span>
                  </div>
                  <div className="px-3 py-1.5 text-[#5f5f5f] truncate">
                    {new Date(doc.updated_at || doc.created_at).toLocaleDateString()} {new Date(doc.updated_at || doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="px-3 py-1.5 text-[#5f5f5f] truncate">
                    {getFileTypeName(doc.mime_type, doc.original_filename)}
                  </div>
                  <div className="px-3 py-1.5 text-[#5f5f5f] font-mono">
                    {formatBytes(doc.file_size)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION: RECENT ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
              Recent
            </h2>
            <button
              onClick={() => navigateTo('documents', 'recent')}
              className="text-[#0078D4] hover:underline text-xs"
            >
              See all in Documents &rarr;
            </button>
          </div>

          {/* Windows 11 Recent Category Tabs */}
          <div className="flex items-center gap-1 pb-2 flex-wrap">
            {[
              { id: 'all', label: 'All' },
              { id: 'word', label: 'Word & Text' },
              { id: 'excel', label: 'Spreadsheets' },
              { id: 'pdf', label: 'PDFs' },
              { id: 'image', label: 'Images' },
              { id: 'other', label: 'Other' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setRecentFilter(tab.id)}
                className={`px-3 py-1 text-xs rounded-[3px] transition-colors ${
                  recentFilter === tab.id
                    ? 'bg-[#CCE4F7] text-[#0078D4] font-semibold'
                    : 'text-[#5f5f5f] hover:bg-[#E8E8E8] hover:text-[#1a1a1a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Recent Files Table */}
          <div className="border border-[#D6D6D6] rounded-[2px] overflow-hidden bg-white">
            {/* Windows Explorer Table Header */}
            <div
              className="grid border-b border-[#D6D6D6] bg-[#F5F5F5] text-[#5f5f5f] text-xs font-normal"
              style={{ gridTemplateColumns: 'minmax(240px, 2fr) 150px 180px 90px 140px' }}
            >
              <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Name</div>
              <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Date modified</div>
              <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Type</div>
              <div className="px-3 py-1.5 border-r border-[#E0E0E0]">Size</div>
              <div className="px-3 py-1.5">Activity</div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-[#5f5f5f] text-xs space-y-2">
                <div className="w-5 h-5 border-2 border-[#D6D6D6] border-t-[#0078D4] rounded-full animate-spin mx-auto" />
                <p>Loading recent items...</p>
              </div>
            ) : filteredRecentDocs.length === 0 ? (
              <div className="p-8 text-center text-[#5f5f5f] text-xs">
                No recent documents found matching this filter.
              </div>
            ) : (
              filteredRecentDocs.slice(0, 15).map(doc => (
                <div
                  key={doc.id}
                  onClick={() => navigateTo('documents', null)}
                  onContextMenu={(e) => handleDocContextMenu(e, doc)}
                  className="grid items-center hover:bg-[#CCE4F7] border-b border-[#F0F0F0] last:border-0 cursor-pointer transition-colors group text-xs text-[#1a1a1a]"
                  style={{ gridTemplateColumns: 'minmax(240px, 2fr) 150px 180px 90px 140px' }}
                >
                  {/* Name + Icon */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 min-w-0">
                    <WindowsFileIcon mimeType={doc.mime_type} filename={doc.original_filename} className="w-5 h-5 shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-[#1a1a1a]">{doc.title}</span>
                      {doc.original_filename && doc.original_filename !== doc.title && (
                        <span className="text-[11px] text-[#8F8F8F] font-mono ml-2">
                          {doc.original_filename}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date modified */}
                  <div className="px-3 py-1.5 text-[#5f5f5f] truncate">
                    {new Date(doc.updated_at || doc.created_at).toLocaleDateString()} {new Date(doc.updated_at || doc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Type */}
                  <div className="px-3 py-1.5 text-[#5f5f5f] truncate">
                    {getFileTypeName(doc.mime_type, doc.original_filename)}
                  </div>

                  {/* Size */}
                  <div className="px-3 py-1.5 text-[#5f5f5f] font-mono">
                    {formatBytes(doc.file_size)}
                  </div>

                  {/* Activity */}
                  <div className="px-3 py-1.5 text-[#5f5f5f] truncate">
                    {doc.owner_first_name ? `${doc.owner_first_name} ${doc.owner_last_name || ''}` : formatRelative(doc.updated_at || doc.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── 3. WINDOWS FILE EXPLORER BOTTOM STATUS BAR ───────────────── */}
      <div
        className="h-6 px-3 border-t border-[#D6D6D6] bg-[#F5F5F5] flex items-center justify-between text-[11px] text-[#5f5f5f] shrink-0"
        style={winFont}
      >
        <div className="flex items-center gap-3">
          <span>6 items in Quick access</span>
          <span className="text-[#D6D6D6]">|</span>
          <span>{favorites.length} starred item{favorites.length !== 1 ? 's' : ''}</span>
          <span className="text-[#D6D6D6]">|</span>
          <span>Storage: {formatBytes(usedBytes)} used</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateTo('documents', null)}
            className="p-1 hover:bg-[#E8E8E8] rounded text-[#5f5f5f] hover:text-[#1a1a1a]"
            title="Details view"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <line x1="1" y1="2.5" x2="11" y2="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="1" y1="9.5" x2="11" y2="9.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </button>
          <button
            onClick={() => navigateTo('documents', null)}
            className="p-1 hover:bg-[#E8E8E8] rounded text-[#5f5f5f] hover:text-[#1a1a1a]"
            title="Large icons view"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="7" y="1" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="1" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
              <rect x="7" y="7" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Windows 11 Context Menu */}
      <WindowsContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        type={contextMenu.type}
        target={contextMenu.target}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        actions={{
          canManage: isAdmin,
          currentUserId: user?.id,
          isFavorite: (id) => favorites.some(f => f.id === id),
          onPreview: () => navigateTo('documents', null),
          onDownload: (doc) => {
            const a = document.createElement('a');
            a.href = `${API_BASE_URL}/documents/${doc.id}/download?token=${token}`;
            a.download = doc.original_filename || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          },
          onToggleFavorite: async (id) => {
            await unfavorite(id, { stopPropagation: () => {} });
          },
          onShare: () => navigateTo('documents', null),
          onRename: () => navigateTo('documents', null),
          onMove: () => navigateTo('documents', null),
          onHistory: () => navigateTo('documents', null),
          onDelete: () => navigateTo('documents', null),
          onProperties: () => navigateTo('documents', null),
        }}
      />

    </div>
  );
}
