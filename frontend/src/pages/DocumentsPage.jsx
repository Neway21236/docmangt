import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import WindowsFileIcon, { WindowsFolderIcon } from '../components/WindowsFileIcon';
import WindowsContextMenu from '../components/WindowsContextMenu';
import {
  Folder, FolderOpen, FolderPlus, Upload, FileText, FileCode, FileSpreadsheet, FileArchive, Image as ImageIcon,
  ChevronRight, Home, Eye, Download, Pencil, FolderSymlink, Trash2, X, CheckCircle, AlertCircle,
  RefreshCw, Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ArrowUp, Clock,
  FileCheck, Star, Share2, MoreVertical, Check, ExternalLink, Calendar,
  User as UserIcon, CheckSquare, Filter, Layers, List, Grid, Columns3,
  Lock, Globe, Shield, Sparkles, HelpCircle, File
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date Uploaded' },
  { value: 'updated_at', label: 'Date Modified' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'file_size', label: 'File Size' },
  { value: 'owner', label: 'Uploaded By' },
  { value: 'mime_type', label: 'File Type' },
];

const MIME_CATEGORIES = [
  { value: '', label: 'All File Types' },
  { value: 'pdf', label: 'PDF Documents' },
  { value: 'document', label: 'Word / Text (.docx, .txt)' },
  { value: 'spreadsheet', label: 'Spreadsheets (.xlsx, .csv)' },
  { value: 'image', label: 'Images (.png, .jpg)' },
  { value: 'archive', label: 'Archives (.zip, .tar)' },
  { value: 'code', label: 'Code / JSON (.js, .json)' },
  { value: 'other', label: 'Other Types' },
];

const DEFAULT_COLUMNS = {
  type: true,
  status: true,
  version: true,
  owner: true,
  size: true,
  modified: true,
  created: false,
};

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeMeta(mimeType = '', filename = '') {
  const mime = (mimeType || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();
  const ext = lowerName.includes('.') ? lowerName.split('.').pop() : '';

  if (mime.includes('pdf') || ext === 'pdf') {
    return { ext: 'PDF', bg: '#FCE8E6', text: '#C53030', border: '#F7C5C0' };
  }
  if (mime.includes('spreadsheet') || mime.includes('excel') || ['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext)) {
    return { ext: 'XLSX', bg: '#E6F4EA', text: '#16803C', border: '#C3E8D0' };
  }
  if (mime.includes('word') || mime.includes('officedocument') || ['docx', 'doc', 'rtf', 'odt'].includes(ext)) {
    return { ext: 'DOCX', bg: '#E9EEFF', text: '#185ABD', border: '#C3D5FF' };
  }
  if (mime.includes('presentation') || mime.includes('powerpoint') || ['pptx', 'ppt', 'pps', 'odp'].includes(ext)) {
    return { ext: 'PPTX', bg: '#FEF3D6', text: '#D24726', border: '#FDE3A7' };
  }
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext)) {
    return { ext: 'IMG', bg: '#EBF4FF', text: '#0078D4', border: '#BFDBFE' };
  }
  if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm', 'flv'].includes(ext)) {
    return { ext: 'VIDEO', bg: '#EFF6FF', text: '#0063B1', border: '#DBEAFE' };
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma'].includes(ext)) {
    return { ext: 'AUDIO', bg: '#F3E8FF', text: '#7C3AED', border: '#E9D5FF' };
  }
  if (mime.includes('zip') || mime.includes('compressed') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
    return { ext: 'ZIP', bg: '#FEF3D6', text: '#B7791F', border: '#FDE3A7' };
  }
  if (mime.includes('json') || mime.includes('javascript') || mime.includes('html') || ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'sql', 'xml', 'sh'].includes(ext)) {
    return { ext: 'CODE', bg: '#EEF2FF', text: '#007ACC', border: '#C7D2FE' };
  }
  if (mime.startsWith('text/') || ['txt', 'log', 'md', 'ini', 'cfg'].includes(ext)) {
    return { ext: 'TXT', bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
  }
  return { ext: (ext || 'FILE').toUpperCase(), bg: '#F1F3F5', text: '#5B6880', border: '#D9DEE7' };
}

function FileTypeIcon({ mimeType, filename, className = 'w-6 h-6 shrink-0' }) {
  return (
    <WindowsFileIcon mimeType={mimeType} filename={filename} className={className} />
  );
}

function StatusBadge({ status }) {
  const st = (status || 'DRAFT').toUpperCase();
  if (st === 'APPROVED') {
    return (
      <span className="badge badge-approved gap-1">
        <Check className="w-3 h-3" strokeWidth={2.5} />
        Approved
      </span>
    );
  }
  if (st === 'PENDING') {
    return (
      <span className="badge badge-pending gap-1">
        <Clock className="w-3 h-3" strokeWidth={2} />
        Pending
      </span>
    );
  }
  if (st === 'REJECTED') {
    return (
      <span className="badge badge-rejected gap-1">
        <X className="w-3 h-3" strokeWidth={2.5} />
        Rejected
      </span>
    );
  }
  return (
    <span className="badge badge-draft">
      Draft
    </span>
  );
}

export default function DocumentsPage({
  sidebarFilter,
  setSidebarFilter,
  globalSearchQuery,
  setGlobalSearchQuery,
  setBreadcrumbPath
}) {
  const { user, token, isAdmin, isManager } = useAuth();
  const canManage = isAdmin || isManager;
  const canDeleteDoc = (doc) => isAdmin || (user && doc.owner_id === user.id);
  const canDeleteFolder = (f) => isAdmin || (user && f.owner_id === user.id);
  const canUploadVersion = (doc) => isAdmin || isManager || (user && doc.owner_id === user.id);

  // View & Mode state
  const [mode, setMode] = useState('browse');
  const [viewDensity, setViewDensity] = useState('comfortable'); // 'comfortable' | 'compact' | 'grid'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'shared' | 'recent' | 'favorites' | 'approvals'

  // Columns visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('doc_columns_pref');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
    } catch {
      return DEFAULT_COLUMNS;
    }
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Browse state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMime, setFilterMime] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchResults, setSearchResults] = useState([]);
  const [searchPagination, setSearchPagination] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [owners, setOwners] = useState([]);

  // Bulk Selection state
  const [selectedDocIds, setSelectedDocIds] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Right-Side Details Panel Inspector
  const [selectedDocForDetails, setSelectedDocForDetails] = useState(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  // Dropdowns & Modals
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [allFolders, setAllFolders] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  // Two-Pane Document Preview Workspace
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewTextContent, setPreviewTextContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Favorites
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  // Share state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUsers, setShareUsers] = useState([]);
  const [docShares, setDocShares] = useState([]);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [sharePermission, setSharePermission] = useState('VIEW');
  const [shareLoading, setShareLoading] = useState(false);

  // Versioning & Approval Modals
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isSubmitApprovalModalOpen, setIsSubmitApprovalModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [activeApprovalRequest, setActiveApprovalRequest] = useState(null);
  const [docHistoryData, setDocHistoryData] = useState({ versions: [], history: [], document: null });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form input states
  const [folderNameInput, setFolderNameInput] = useState('');
  const [renameInput, setRenameInput] = useState('');
  const [renameExpiresAt, setRenameExpiresAt] = useState('');
  const [targetMoveFolderId, setTargetMoveFolderId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadExpiresAt, setUploadExpiresAt] = useState('');
  const [versionChangeNotes, setVersionChangeNotes] = useState('');
  const [submissionNote, setSubmissionNote] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewDecision, setReviewDecision] = useState('APPROVED');

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const fileInputRef = useRef(null);
  const filterPopoverRef = useRef(null);
  const columnPickerRef = useRef(null);

  // Windows Right-Click Context Menu State
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'canvas', // 'document' | 'folder' | 'canvas'
    target: null,
  });

  const handleDocumentContextMenu = (e, doc) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedDocIds.has(doc.id)) {
      setSelectedDocIds(new Set([doc.id]));
    }
    setSelectedDocForDetails(doc);
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'document',
      target: doc,
    });
  };

  const handleFolderContextMenu = (e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'folder',
      target: folder,
    });
  };

  const handleCanvasContextMenu = (e) => {
    if (e.target.closest('button, input, select, textarea, a, .table-row, [data-interactive="true"]')) return;
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      type: 'canvas',
      target: null,
    });
  };

  // Persist column preferences
  const toggleColumn = (colKey) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [colKey]: !prev[colKey] };
      try { localStorage.setItem('doc_columns_pref', JSON.stringify(next)); } catch { }
      return next;
    });
  };

  // Load favorites on mount
  useEffect(() => {
    api.get('/favorites').then(r => {
      if (r.data.success) setFavoritedIds(new Set(r.data.favorites.map(f => f.id)));
    }).catch(() => { });
  }, []);

  // Fetch owners list for filters
  useEffect(() => {
    api.get('/users').then(r => {
      if (r.data.success) setOwners(r.data.users);
    }).catch(() => { });
  }, []);

  // Synchronize sidebar filter with quick view tabs
  useEffect(() => {
    if (sidebarFilter) {
      if (sidebarFilter === 'my-files') setActiveTab('my');
      else if (sidebarFilter === 'shared-with-me') setActiveTab('shared');
      else if (sidebarFilter === 'recent') setActiveTab('recent');
      else if (sidebarFilter === 'favorites') setActiveTab('favorites');
      else if (sidebarFilter === 'approvals') setActiveTab('approvals');
    }
  }, [sidebarFilter]);

  // Synchronize global search from header
  useEffect(() => {
    if (globalSearchQuery !== undefined && globalSearchQuery !== null) {
      if (globalSearchQuery.trim()) {
        setMode('search');
        setSearchQuery(globalSearchQuery);
      } else if (mode === 'search' && !globalSearchQuery.trim() && !searchQuery.trim()) {
        setMode('browse');
      }
    }
  }, [globalSearchQuery]);

  // Click outside handlers for popovers
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeDropdown && !e.target.closest('.dropdown-menu-container')) {
        setActiveDropdown(null);
      }
      if (showFilterPopover && filterPopoverRef.current && !filterPopoverRef.current.contains(e.target)) {
        setShowFilterPopover(false);
      }
      if (showColumnPicker && columnPickerRef.current && !columnPickerRef.current.contains(e.target)) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeDropdown, showFilterPopover, showColumnPicker]);


  // Load Folder Contents
  const loadFolderContents = useCallback(async (folderId = currentFolderId) => {
    setBrowseLoading(true);
    setBrowseError('');
    setActionSuccess('');
    try {
      const folderParam = folderId ? `?parentId=${folderId}` : '';
      const docParam = folderId ? `?folderId=${folderId}` : '';
      const [foldersRes, docsRes] = await Promise.all([
        api.get(`/folders${folderParam}`),
        api.get(`/documents${docParam}`),
      ]);

      setFolders(foldersRes.data.folders || []);
      setDocuments(docsRes.data.documents || []);

      if (folderId) {
        const [currRes, breadRes] = await Promise.all([
          api.get(`/folders/${folderId}`),
          api.get(`/folders/${folderId}/breadcrumbs`),
        ]);
        setCurrentFolder(currRes.data.folder);
        setBreadcrumbs(breadRes.data.breadcrumbs || []);
        if (setBreadcrumbPath) {
          const pathStr = ['Home', 'Documents', ...(breadRes.data.breadcrumbs || []).map(b => b.name)].join(' / ');
          setBreadcrumbPath(pathStr);
        }
      } else {
        setCurrentFolder(null);
        setBreadcrumbs([]);
        if (setBreadcrumbPath) {
          setBreadcrumbPath('Home / Documents');
        }
      }
    } catch (err) {
      console.error('Failed to load directory:', err);
      setBrowseError('Unable to connect to document storage. Please check your network and try again.');
    } finally {
      setBrowseLoading(false);
    }
  }, [currentFolderId, setBreadcrumbPath]);

  // Execute Search
  const executeSearch = useCallback(async () => {
    setSearchLoading(true);
    setBrowseError('');
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (filterMime) params.append('mime_type', filterMime);
      if (filterOwner) params.append('owner_id', filterOwner);
      if (filterDateFrom) params.append('date_from', filterDateFrom);
      if (filterDateTo) params.append('date_to', filterDateTo);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);
      params.append('page', page);
      params.append('pageSize', pageSize);

      const res = await api.get(`/documents/search?${params.toString()}`);
      setSearchResults(res.data.documents || []);
      setSearchPagination(res.data.pagination);
    } catch (err) {
      console.error('Search error:', err);
      setBrowseError('Search query failed. Please verify criteria.');
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, filterMime, filterOwner, filterDateFrom, filterDateTo, sortBy, sortDir, page, pageSize]);

  useEffect(() => {
    if (mode === 'browse') {
      loadFolderContents(currentFolderId);
    } else {
      executeSearch();
    }
  }, [mode, currentFolderId, executeSearch, loadFolderContents]);

  const refreshData = () => {
    if (mode === 'browse') loadFolderContents(currentFolderId);
    else executeSearch();
  };

  const handleNavigateFolder = (folderId) => {
    setCurrentFolderId(folderId);
    setSelectedDocIds(new Set());
    setMode('browse');
  };

  const loadAllFolders = async () => {
    try {
      const res = await api.get('/folders/all');
      setAllFolders(res.data.folders || []);
    } catch (err) {
      console.error('Failed to load folders list:', err);
    }
  };

  // Inspect document in right-side details panel
  const handleSelectDocForDetails = (doc) => {
    setSelectedDocForDetails(doc);
    setIsDetailsPanelOpen(true);
    loadHistory(doc.id);
  };

  // Open Document Preview in full 2-pane workspace
  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewTextContent('');
    setPreviewLoading(true);
    loadHistory(doc.id);

    if (doc.mime_type?.startsWith('text/') || doc.mime_type?.includes('json') || doc.mime_type?.includes('csv')) {
      try {
        const res = await api.get(`/documents/${doc.id}/view`, { responseType: 'text' });
        setPreviewTextContent(res.data);
      } catch {
        setPreviewTextContent('Unable to display text content preview.');
      }
    }
    setPreviewLoading(false);
  };

  // Load History & Approvals for inspector
  const loadHistory = async (docId) => {
    if (!docId) return;
    setHistoryLoading(true);
    try {
      const [versionsRes, historyRes] = await Promise.all([
        api.get(`/documents/${docId}/versions`).catch(() => ({ data: { versions: [] } })),
        api.get(`/approvals/document/${docId}`).catch(() => ({ data: { history: [], document: null } })),
      ]);
      setDocHistoryData({
        versions: versionsRes.data.versions || [],
        history: historyRes.data.history || [],
        document: historyRes.data.document || null,
      });
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Document Operations
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;
    setModalLoading(true); setModalError('');
    try {
      await api.post('/folders', { name: folderNameInput.trim(), parent_id: currentFolderId });
      setIsFolderModalOpen(false);
      setFolderNameInput('');
      setActionSuccess(`Folder "${folderNameInput.trim()}" created.`);
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create folder.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setModalLoading(true); setModalError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadTitle.trim()) formData.append('title', uploadTitle.trim());
    if (currentFolderId) formData.append('folder_id', currentFolderId);
    if (uploadExpiresAt) formData.append('expires_at', uploadExpiresAt);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadExpiresAt('');
      setActionSuccess('Document uploaded successfully.');
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!activeItem || !renameInput.trim()) return;
    setModalLoading(true); setModalError('');
    try {
      if (activeItem.type === 'folder') {
        await api.patch(`/folders/${activeItem.data.id}/rename`, { name: renameInput.trim() });
        setActionSuccess('Folder renamed.');
      } else {
        await api.patch(`/documents/${activeItem.data.id}`, {
          title: renameInput.trim(),
          expires_at: renameExpiresAt || null,
        });
        setActionSuccess('Document updated.');
        if (selectedDocForDetails?.id === activeItem.data.id) {
          setSelectedDocForDetails(prev => ({ ...prev, title: renameInput.trim() }));
        }
      }
      setIsRenameModalOpen(false);
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to rename.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleMove = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    setModalLoading(true); setModalError('');
    try {
      const targetId = targetMoveFolderId ? parseInt(targetMoveFolderId, 10) : null;
      if (activeItem.type === 'folder') {
        await api.patch(`/folders/${activeItem.data.id}/move`, { target_parent_id: targetId });
        setActionSuccess('Folder moved.');
      } else {
        await api.patch(`/documents/${activeItem.data.id}/move`, { target_folder_id: targetId });
        setActionSuccess('Document moved.');
      }
      setIsMoveModalOpen(false);
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to move.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeItem) return;
    setModalLoading(true); setModalError('');
    try {
      if (activeItem.type === 'folder') {
        await api.delete(`/folders/${activeItem.data.id}`);
        setActionSuccess('Folder deleted.');
      } else {
        await api.delete(`/documents/${activeItem.data.id}`);
        setActionSuccess('Document deleted.');
        if (selectedDocForDetails?.id === activeItem.data.id) {
          setSelectedDocForDetails(null);
          setIsDetailsPanelOpen(false);
        }
      }
      setIsDeleteModalOpen(false);
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleFavorite = async (docId) => {
    try {
      const res = await api.post(`/favorites/${docId}`);
      if (res.data.success) {
        setFavoritedIds(prev => {
          const next = new Set(prev);
          if (res.data.favorited) next.add(docId);
          else next.delete(docId);
          return next;
        });
        setActionSuccess(res.data.message);
      }
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  // Bulk operations handlers
  const toggleSelectAll = () => {
    if (selectedDocIds.size === displayedDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(displayedDocuments.map(d => d.id)));
    }
  };

  const handleBulkDownload = () => {
    selectedDocIds.forEach(id => {
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/documents/${id}/download?token=${token}`;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    setActionSuccess(`Initiated download for ${selectedDocIds.size} document(s).`);
  };

  const handleBulkStar = async () => {
    setBulkActionLoading(true);
    try {
      for (const id of selectedDocIds) {
        await api.post(`/favorites/${id}`);
      }
      const res = await api.get('/favorites');
      if (res.data.success) setFavoritedIds(new Set(res.data.favorites.map(f => f.id)));
      setActionSuccess(`Updated favorites for ${selectedDocIds.size} document(s).`);
    } catch (err) {
      console.error('Bulk favorite error:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setModalLoading(true); setModalError('');
    try {
      for (const id of selectedDocIds) {
        await api.delete(`/documents/${id}`);
      }
      setIsBulkDeleteModalOpen(false);
      setActionSuccess(`Deleted ${selectedDocIds.size} document(s).`);
      setSelectedDocIds(new Set());
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed during bulk deletion.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleBulkMove = async (e) => {
    e.preventDefault();
    setModalLoading(true); setModalError('');
    try {
      const targetId = targetMoveFolderId ? parseInt(targetMoveFolderId, 10) : null;
      for (const id of selectedDocIds) {
        await api.patch(`/documents/${id}/move`, { target_folder_id: targetId });
      }
      setIsBulkMoveModalOpen(false);
      setActionSuccess(`Moved ${selectedDocIds.size} document(s).`);
      setSelectedDocIds(new Set());
      refreshData();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed during bulk move.');
    } finally {
      setModalLoading(false);
    }
  };

  // Share handlers
  const openShareModal = async (doc) => {
    setActiveItem({ type: 'document', data: doc });
    setIsShareModalOpen(true);
    setShareSearchQuery('');
    setSharePermission('VIEW');
    setModalError('');
    setShareLoading(true);
    try {
      const [usersRes, sharesRes] = await Promise.all([
        api.get('/users'),
        api.get(`/documents/${doc.id}/shares`),
      ]);
      if (usersRes.data.success) setShareUsers(usersRes.data.users.filter(u => u.id !== user.id));
      if (sharesRes.data.success) setDocShares(sharesRes.data.shares);
    } catch (err) {
      setModalError('Failed to load sharing permissions.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleShare = async (targetUserId) => {
    if (!activeItem) return;
    setModalLoading(true); setModalError('');
    try {
      const res = await api.post(`/documents/${activeItem.data.id}/shares`, { user_id: targetUserId, permission: sharePermission });
      if (res.data.success) {
        setDocShares(prev => {
          const existing = prev.findIndex(s => s.user_id === targetUserId);
          if (existing >= 0) { const next = [...prev]; next[existing] = res.data.share; return next; }
          return [...prev, res.data.share];
        });
        setActionSuccess(res.data.message);
      }
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to share document.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUnshare = async (targetUserId) => {
    if (!activeItem) return;
    try {
      await api.delete(`/documents/${activeItem.data.id}/shares/${targetUserId}`);
      setDocShares(prev => prev.filter(s => s.user_id !== targetUserId));
      setActionSuccess('Access revoked.');
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to remove access.');
    }
  };

  const openHistoryModal = (doc) => {
    setActiveItem({ type: 'document', data: doc });
    setIsHistoryModalOpen(true);
    loadHistory(doc.id);
  };

  const handleUploadNewVersion = async (e) => {
    e.preventDefault();
    if (!activeItem || !selectedFile) return;
    setModalLoading(true); setModalError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('change_notes', versionChangeNotes.trim());
    try {
      const res = await api.post(`/documents/${activeItem.data.id}/versions`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setIsVersionModalOpen(false); setSelectedFile(null); setVersionChangeNotes('');
        setActionSuccess(`New version created for "${activeItem.data.title}".`);
        refreshData();
        if (isHistoryModalOpen) loadHistory(activeItem.data.id);
        if (selectedDocForDetails?.id === activeItem.data.id) loadHistory(activeItem.data.id);
      }
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to upload new version.'); }
    finally { setModalLoading(false); }
  };

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    setModalLoading(true); setModalError('');
    try {
      const res = await api.post(`/approvals/${activeItem.data.id}/submit`, { submission_note: submissionNote });
      if (res.data.success) {
        setIsSubmitApprovalModalOpen(false); setSubmissionNote('');
        setActionSuccess('Submitted for approval.');
        refreshData();
        if (isHistoryModalOpen) loadHistory(activeItem.data.id);
      }
    } catch (err) { setModalError(err.response?.data?.message || 'Failed to submit approval.'); }
    finally { setModalLoading(false); }
  };

  const handleReviewApproval = async (requestId, decision, comment = '') => {
    try {
      const res = await api.post(`/approvals/${requestId}/review`, {
        decision,
        review_comment: comment,
      });
      if (res.data.success) {
        setActionSuccess(`Document ${decision.toLowerCase()} successfully.`);
        refreshData();
        if (activeItem?.data?.id) loadHistory(activeItem.data.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to review approval.');
    }
  };

  // Filter documents based on active tab and filters
  const rawList = mode === 'search' ? searchResults : documents;
  const displayedDocuments = rawList.filter(doc => {
    // Quick View Tab filtering
    if (activeTab === 'my') {
      if (doc.owner_id !== user?.id) return false;
    } else if (activeTab === 'favorites') {
      if (!favoritedIds.has(doc.id)) return false;
    } else if (activeTab === 'approvals') {
      if (!['PENDING', 'APPROVED'].includes(doc.approval_status)) return false;
    }

    // Status filter
    if (filterStatus && doc.approval_status !== filterStatus) return false;

    return true;
  });

  // Calculate active filter count
  const activeFiltersCount = (filterMime ? 1 : 0) + (filterOwner ? 1 : 0) + (filterStatus ? 1 : 0) + (filterDateFrom || filterDateTo ? 1 : 0);

  const clearAllFilters = () => {
    setFilterMime('');
    setFilterOwner('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // Windows Explorer Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        if (contextMenu.isOpen) {
          setContextMenu(prev => ({ ...prev, isOpen: false }));
        } else if (selectedDocIds.size > 0) {
          setSelectedDocIds(new Set());
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedDocIds(new Set(displayedDocuments.map(d => d.id)));
        return;
      }

      if (e.key === 'Delete') {
        if (selectedDocIds.size > 1) {
          e.preventDefault();
          setIsBulkDeleteModalOpen(true);
        } else if (selectedDocIds.size === 1) {
          const docId = Array.from(selectedDocIds)[0];
          const doc = displayedDocuments.find(d => d.id === docId);
          if (doc && canDeleteDoc(doc)) {
            e.preventDefault();
            setActiveItem({ type: 'document', data: doc });
            setIsDeleteModalOpen(true);
          }
        }
        return;
      }

      if (e.key === 'F2') {
        if (selectedDocIds.size === 1) {
          const docId = Array.from(selectedDocIds)[0];
          const doc = displayedDocuments.find(d => d.id === docId);
          if (doc && canDeleteDoc(doc)) {
            e.preventDefault();
            setActiveItem({ type: 'document', data: doc });
            setRenameInput(doc.title);
            setRenameExpiresAt(doc.expires_at ? doc.expires_at.slice(0, 16) : '');
            setIsRenameModalOpen(true);
          }
        }
        return;
      }

      if (e.key === 'Enter') {
        if (selectedDocIds.size === 1) {
          const docId = Array.from(selectedDocIds)[0];
          const doc = displayedDocuments.find(d => d.id === docId);
          if (doc) {
            e.preventDefault();
            handleOpenPreview(doc);
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDocIds, displayedDocuments, contextMenu.isOpen]);


  return (
    <div className="flex flex-col h-full">
      {/* ── 1. WINDOWS 11 FILE EXPLORER ADDRESS BAR ─── */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#D6D6D6] bg-white shrink-0" style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}>
        {/* Navigation buttons: Back, Forward, Up, Refresh */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => currentFolderId ? handleNavigateFolder(breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null) : null}
            disabled={!currentFolderId}
            className="p-1 rounded text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled
            className="p-1 rounded text-[#5f5f5f] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent"
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => currentFolderId ? handleNavigateFolder(breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].id : null) : null}
            disabled={!currentFolderId}
            className="p-1 rounded text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Up to parent folder"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => refreshData()}
            className="p-1 rounded text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(browseLoading || searchLoading) ? 'animate-spin text-[#0078D4]' : ''}`} />
          </button>
        </div>

        {/* Address / Breadcrumb bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-white border border-[#D6D6D6] hover:border-[#ABABAB] focus-within:border-[#0078D4] focus-within:ring-1 focus-within:ring-[#0078D4] rounded-[3px] px-2 py-0.5 text-xs min-w-0 transition-colors">
          <button
            onClick={() => handleNavigateFolder(null)}
            className="flex items-center gap-1 text-[#5f5f5f] hover:text-[#0078D4] shrink-0 transition-colors"
          >
            <Home className="w-3.5 h-3.5 text-[#0078D4]" />
          </button>
          <ChevronRight className="w-3 h-3 text-[#ABABAB] shrink-0" />
          <button
            onClick={() => handleNavigateFolder(null)}
            className={`hover:text-[#0078D4] transition-colors ${!currentFolderId ? 'text-[#1a1a1a] font-semibold' : 'text-[#5f5f5f]'}`}
          >
            Documents
          </button>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={b.id}>
              <ChevronRight className="w-3 h-3 text-[#ABABAB] shrink-0" />
              <button
                onClick={() => handleNavigateFolder(b.id)}
                className={`truncate max-w-[120px] hover:text-[#0078D4] transition-colors ${idx === breadcrumbs.length - 1 ? 'text-[#1a1a1a] font-semibold' : 'text-[#5f5f5f]'}`}
              >
                {b.name}
              </button>
            </React.Fragment>
          ))}
          <span className="text-[#8F8F8F] text-[10px] ml-auto shrink-0 font-mono">
            {displayedDocuments.length} item{displayedDocuments.length !== 1 ? 's' : ''}
            {folders.length > 0 ? `, ${folders.length} folder${folders.length !== 1 ? 's' : ''}` : ''}
          </span>
        </div>

        {/* Inline Search Bar */}
        <div className="relative w-48 sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-[#9E9E9E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="explorer-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setGlobalSearchQuery?.(val);
              if (val.trim()) { setMode('search'); setPage(1); }
              else { setMode('browse'); }
            }}
            placeholder="Search documents"
            className="w-full pl-8 pr-7 py-0.5 bg-white border border-[#D6D6D6] hover:border-[#ABABAB] focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] rounded-[3px] text-xs text-[#1a1a1a] placeholder-[#9E9E9E] outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setGlobalSearchQuery?.(''); setMode('browse'); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#1a1a1a]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. WINDOWS 11 COMMAND BAR (Toolbar) ─── */}
      <div className="flex items-center gap-1 px-3 py-1 border-b border-[#D6D6D6] bg-white shrink-0 text-xs" style={{ fontFamily: "system-ui, 'Segoe UI', sans-serif" }}>
        {/* + New dropdown (Folder / Upload) */}
        {canManage && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { setSelectedFile(null); setUploadTitle(''); setModalError(''); setIsUploadModalOpen(true); }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] transition-colors font-medium"
              title="Upload file"
            >
              <Upload className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>New</span>
            </button>
            <button
              onClick={() => { setFolderNameInput(''); setModalError(''); setIsFolderModalOpen(true); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] transition-colors"
              title="New folder"
            >
              <FolderPlus className="w-3.5 h-3.5 text-[#D97706]" />
              <span className="hidden sm:inline">Folder</span>
            </button>
            <div className="h-4 w-px bg-[#D6D6D6] mx-1" />
          </div>
        )}

        {/* Windows Explorer Action Bar: Download, Share, Move, Rename, Delete */}
        <div className="flex items-center gap-0.5">
          {/* Download Selected */}
          <button
            onClick={handleBulkDownload}
            disabled={selectedDocIds.size === 0}
            className="p-1.5 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title={selectedDocIds.size > 0 ? `Download selected (${selectedDocIds.size})` : 'Download'}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Favorite Selected */}
          <button
            onClick={handleBulkStar}
            disabled={selectedDocIds.size === 0 || bulkActionLoading}
            className="p-1.5 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title={selectedDocIds.size > 0 ? `Favorite selected (${selectedDocIds.size})` : 'Favorite'}
          >
            <Star className="w-3.5 h-3.5" />
          </button>

          {/* Share */}
          <button
            onClick={() => {
              if (selectedDocIds.size === 1) {
                const docId = Array.from(selectedDocIds)[0];
                const doc = displayedDocuments.find(d => d.id === docId);
                if (doc) openShareModal(doc);
              }
            }}
            disabled={selectedDocIds.size !== 1}
            className="p-1.5 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Move */}
          {canManage && (
            <button
              onClick={() => {
                if (selectedDocIds.size > 1) {
                  loadAllFolders();
                  setTargetMoveFolderId('');
                  setIsBulkMoveModalOpen(true);
                } else if (selectedDocIds.size === 1) {
                  const docId = Array.from(selectedDocIds)[0];
                  const doc = displayedDocuments.find(d => d.id === docId);
                  if (doc) {
                    setActiveItem({ type: 'document', data: doc });
                    loadAllFolders();
                    setTargetMoveFolderId('');
                    setIsMoveModalOpen(true);
                  }
                }
              }}
              disabled={selectedDocIds.size === 0}
              className="p-1.5 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Move to"
            >
              <FolderSymlink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Rename */}
          <button
            onClick={() => {
              if (selectedDocIds.size === 1) {
                const docId = Array.from(selectedDocIds)[0];
                const doc = displayedDocuments.find(d => d.id === docId);
                if (doc && canDeleteDoc(doc)) {
                  setActiveItem({ type: 'document', data: doc });
                  setRenameInput(doc.title);
                  setRenameExpiresAt(doc.expires_at ? doc.expires_at.slice(0, 16) : '');
                  setIsRenameModalOpen(true);
                }
              }
            }}
            disabled={selectedDocIds.size !== 1}
            className="p-1.5 rounded-[3px] text-[#1a1a1a] hover:bg-[#E8E8E8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Rename"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (selectedDocIds.size > 1) {
                setIsBulkDeleteModalOpen(true);
              } else if (selectedDocIds.size === 1) {
                const docId = Array.from(selectedDocIds)[0];
                const doc = displayedDocuments.find(d => d.id === docId);
                if (doc) {
                  setActiveItem({ type: 'document', data: doc });
                  setIsDeleteModalOpen(true);
                }
              }
            }}
            disabled={selectedDocIds.size === 0}
            className="p-1.5 rounded-[3px] text-[#C42B1C] hover:bg-[#FCE8E6] disabled:text-[#1a1a1a] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {selectedDocIds.size > 0 && (
          <span className="text-[11px] text-[#5f5f5f] font-mono px-1">
            {selectedDocIds.size} selected
          </span>
        )}

        <div className="h-4 w-px bg-[#D6D6D6] mx-1" />

        {/* Sort */}
        <div className="flex items-center gap-0.5">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="py-1 px-1.5 bg-transparent border-0 text-[#1a1a1a] text-xs cursor-pointer hover:bg-[#E8E8E8] rounded-[3px] outline-none"
            title="Sort by"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDir(d => d === 'ASC' ? 'DESC' : 'ASC')}
            className="p-1 rounded-[3px] text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8]"
            title={`Sort ${sortDir === 'ASC' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#D6D6D6] mx-1" />

        {/* View Switcher */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setViewDensity('comfortable')}
            className={`p-1 rounded-[3px] transition-colors ${viewDensity === 'comfortable' ? 'bg-[#CCE4F7] text-[#0078D4]' : 'text-[#5f5f5f] hover:bg-[#E8E8E8]'}`}
            title="Details view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewDensity('grid')}
            className={`p-1 rounded-[3px] transition-colors ${viewDensity === 'grid' ? 'bg-[#CCE4F7] text-[#0078D4]' : 'text-[#5f5f5f] hover:bg-[#E8E8E8]'}`}
            title="Large icons view"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-[#D6D6D6] mx-1" />

        {/* Filter Popover */}
        <div className="relative" ref={filterPopoverRef}>
          <button
            onClick={() => setShowFilterPopover(v => !v)}
            className={`flex items-center gap-1 px-2 py-1 rounded-[3px] transition-colors ${activeFiltersCount > 0
              ? 'text-[#0078D4] bg-[#CCE4F7] font-semibold'
              : 'text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8]'
              }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#0078D4] text-white text-[9px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {showFilterPopover && (
            <div className="absolute left-0 mt-1.5 w-80 rounded-[3px] bg-white border border-[#D6D6D6] shadow-xl p-4 z-40 animate-fadeIn text-xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-2">
                <span className="font-semibold text-[#1a1a1a]">Filter Documents</span>
                <button onClick={clearAllFilters} className="text-[11px] text-[#0078D4] hover:underline font-medium">Clear all</button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5f5f5f] mb-1">File Type</label>
                <select
                  value={filterMime}
                  onChange={e => { setFilterMime(e.target.value); setMode('search'); }}
                  className="input py-1 text-xs"
                >
                  {MIME_CATEGORIES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#5f5f5f] mb-1">Approval Status</label>
                <select
                  value={filterStatus}
                  onChange={e => { setFilterStatus(e.target.value); setMode('search'); }}
                  className="input py-1 text-xs"
                >
                  {['', 'DRAFT', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (
                    <option key={s} value={s}>{s || 'All Statuses'}</option>
                  ))}
                </select>
              </div>

              {owners.length > 0 && (
                <div>
                  <label className="block text-[11px] font-medium text-[#5f5f5f] mb-1">Owner</label>
                  <select
                    value={filterOwner}
                    onChange={e => { setFilterOwner(e.target.value); setMode('search'); }}
                    className="input py-1 text-xs"
                  >
                    <option value="">All Owners</option>
                    {owners.map(o => (
                      <option key={o.id} value={String(o.id)}>{o.first_name} {o.last_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#5f5f5f] mb-1">From Date</label>
                  <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setMode('search'); }} className="input py-1 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#5f5f5f] mb-1">To Date</label>
                  <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setMode('search'); }} className="input py-1 text-xs" />
                </div>
              </div>

              <button onClick={() => setShowFilterPopover(false)} className="btn-primary w-full justify-center">
                Apply Filters
              </button>
            </div>
          )}
        </div>

        {/* Right side: Column Picker + Details Pane Toggle */}
        <div className="ml-auto flex items-center gap-1">
          <div className="relative" ref={columnPickerRef}>
            <button
              onClick={() => setShowColumnPicker(v => !v)}
              className="p-1 rounded-[3px] text-[#5f5f5f] hover:text-[#1a1a1a] hover:bg-[#E8E8E8]"
              title="Customize columns"
            >
              <Columns3 className="w-3.5 h-3.5" />
            </button>

            {showColumnPicker && (
              <div className="absolute right-0 mt-1.5 w-48 rounded-[3px] bg-white border border-[#D6D6D6] shadow-xl p-3 z-40 animate-fadeIn text-xs space-y-2">
                <div className="font-semibold text-[#1a1a1a] pb-1 border-b border-[#E8E8E8]">Toggle Columns</div>
                {Object.entries(visibleColumns).map(([colKey, isVis]) => (
                  <label key={colKey} className="flex items-center gap-2 cursor-pointer hover:bg-[#F5F5F5] py-1 px-1 rounded">
                    <input
                      type="checkbox"
                      checked={isVis}
                      onChange={() => toggleColumn(colKey)}
                      className="rounded border-[#D6D6D6] text-[#0078D4] focus:ring-0"
                    />
                    <span className="capitalize text-[#1a1a1a]">{colKey}</span>
                  </label>
                ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap text-xs px-3 py-1 border-b border-[#EDF1F5] bg-white shrink-0">
          <span className="text-[#8F9CAE]">Filters:</span>
          {filterMime && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C3D5FF] text-[#3157D5]">
              Type: {filterMime.toUpperCase()}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-[#C53030]" onClick={() => setFilterMime('')} />
            </span>
          )}
          {filterStatus && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C3D5FF] text-[#3157D5]">
              Status: {filterStatus}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-[#C53030]" onClick={() => setFilterStatus('')} />
            </span>
          )}
          {filterOwner && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C3D5FF] text-[#3157D5]">
              Owner: {owners.find(o => String(o.id) === String(filterOwner))?.first_name || 'Selected'}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-[#C53030]" onClick={() => setFilterOwner('')} />
            </span>
          )}
          {(filterDateFrom || filterDateTo) && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EEF2FF] border border-[#C3D5FF] text-[#3157D5]">
              Date: {filterDateFrom || 'Start'} → {filterDateTo || 'End'}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-[#C53030]" onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }} />
            </span>
          )}
          <button onClick={clearAllFilters} className="text-[#667085] hover:text-[#C53030] text-[11px] ml-1">Clear all</button>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT AREA ─────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" onContextMenu={handleCanvasContextMenu}>
        <div className="p-3 space-y-2">



          {/* ── 5. STATUS / SUCCESS / ERROR ALERTS ──────────────────────── */}
          {actionSuccess && (
            <div className="p-3 rounded bg-[#E6F4EA] border border-[#C3E8D0] flex items-center justify-between text-xs text-[#16803C] animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-[#16803C]" />
                <span>{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess('')} className="text-[#16803C] hover:opacity-75">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {browseError && (
            <div className="p-3 rounded bg-[#FCE8E6] border border-[#F7C5C0] flex items-center justify-between text-xs text-[#C53030] animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{browseError}</span>
              </div>
              <button onClick={refreshData} className="btn-secondary py-1 px-2 text-[11px]">
                Retry
              </button>
            </div>
          )}

          {/* ── 6. COMPACT FOLDER NAVIGATION STRIP (STREAMLINED) ────────── */}
          {mode === 'browse' && folders.length > 0 && (
            <div className="bg-white border border-[#D9DEE7] rounded p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#8F9CAE] uppercase tracking-wider px-1">
                <span>Subfolders ({folders.length})</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {folders.map(f => (
                  <div
                    key={f.id}
                    onClick={() => handleNavigateFolder(f.id)}
                    onContextMenu={(e) => handleFolderContextMenu(e, f)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-[#D6D6D6] bg-white hover:bg-[#CCE4F7] hover:border-[#0078D4] cursor-pointer transition-colors group shrink-0"
                  >
                    <WindowsFolderIcon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-semibold text-[#172033] group-hover:text-[#3157D5] max-w-[160px] truncate">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-[#8F9CAE] font-mono">
                      ({f.document_count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. MAIN WORKSPACE & DOCKED RIGHT INSPECTOR PANEL ──────────── */}
          <div className="flex gap-4 items-start">
            {/* Document Data Table / Grid */}
            <div className="flex-1 min-w-0">
              {browseLoading || searchLoading ? (
                /* Skeleton Loading State */
                <div className="table-container">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="table-header">
                        <th className="w-8"></th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Version</th>
                        <th>Owner</th>
                        <th>Modified</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF1F5]">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td className="p-3"><div className="w-4 h-4 bg-[#EDF1F5] rounded" /></td>
                          <td className="p-3"><div className="h-4 bg-[#EDF1F5] rounded w-48 mb-1" /><div className="h-3 bg-[#EDF1F5] rounded w-24" /></td>
                          <td className="p-3"><div className="h-4 bg-[#EDF1F5] rounded w-12" /></td>
                          <td className="p-3"><div className="h-4 bg-[#EDF1F5] rounded w-16" /></td>
                          <td className="p-3"><div className="h-4 bg-[#EDF1F5] rounded w-8" /></td>
                          <td className="p-3"><div className="h-4 bg-[#EDF1F5] rounded w-24" /></td>
                          <td className="p-3"><div className="h-4 bg-[#EDF1F5] rounded w-20" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : displayedDocuments.length === 0 ? (
                /* Enterprise Empty State */
                <div className="card p-12 text-center max-w-md mx-auto space-y-3">
                  <FileText className="w-8 h-8 text-[#B0B9C9] mx-auto" strokeWidth={1.5} />
                  <h3 className="text-sm font-bold text-[#172033]">
                    {mode === 'search' ? 'No matching documents' : 'No documents in this workspace'}
                  </h3>
                  <p className="text-xs text-[#667085] leading-relaxed">
                    {mode === 'search'
                      ? 'No documents matched your criteria. Try adjusting keywords or clearing active filters.'
                      : 'Upload a document or create a subfolder to get started.'}
                  </p>
                  {canManage && mode === 'browse' && (
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => { setSelectedFile(null); setUploadTitle(''); setIsUploadModalOpen(true); }}
                        className="btn-primary"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload document</span>
                      </button>
                      <button
                        onClick={() => { setFolderNameInput(''); setIsFolderModalOpen(true); }}
                        className="btn-secondary"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>New folder</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : viewDensity === 'grid' ? (
                /* Grid View Option */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {displayedDocuments.map(doc => {
                    const isSelected = selectedDocIds.has(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleSelectDocForDetails(doc)}
                        onDoubleClick={() => handleOpenPreview(doc)}
                        onContextMenu={(e) => handleDocumentContextMenu(e, doc)}
                        className={`p-3 rounded-[3px] border flex flex-col justify-between cursor-pointer transition-all ${isSelected
                          ? 'border-[#0078D4] bg-[#CCE4F7]'
                          : 'border-[#D6D6D6] bg-white hover:border-[#0078D4] hover:bg-[#CCE4F7]/25'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileTypeIcon mimeType={doc.mime_type} filename={doc.original_filename} className="w-8 h-8 shrink-0" />
                            <span className="text-xs font-semibold text-[#172033] truncate">
                              {doc.title}
                            </span>
                          </div>

                        </div>
                        <div className="text-[11px] font-mono text-[#8F9CAE] truncate mb-2">
                          {doc.original_filename}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#EDF1F5]">
                          <StatusBadge status={doc.approval_status} />
                          <span className="font-mono text-[11px] text-[#667085]">
                            {formatBytes(doc.file_size)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* High-Density Enterprise Data Table */
                <div className="table-container">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="table-header">
                        <th>Name</th>
                        {visibleColumns.type && <th>Type</th>}
                        {visibleColumns.status && <th>Status</th>}
                        {visibleColumns.version && <th>Version</th>}
                        {visibleColumns.owner && <th>Owner</th>}
                        {visibleColumns.modified && <th>Modified</th>}
                        {visibleColumns.created && <th>Created</th>}
                        {visibleColumns.size && <th>Size</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF1F5]">
                      {displayedDocuments.map(doc => {
                        const isSelected = selectedDocIds.has(doc.id) || selectedDocForDetails?.id === doc.id;
                        const rowPaddingClass = viewDensity === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-3';

                        return (
                          <tr
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocIds(prev => {
                                const next = new Set(prev);
                                if (next.has(doc.id) && next.size === 1) next.clear();
                                else { next.clear(); next.add(doc.id); }
                                return next;
                              });
                            }}
                            onDoubleClick={() => handleOpenPreview(doc)}
                            onContextMenu={(e) => handleDocumentContextMenu(e, doc)}
                            className={`table-row cursor-pointer transition-colors ${isSelected ? 'selected' : ''}`}
                          >

                            {/* Name (Dominant) + File type icon */}
                            <td className={`${rowPaddingClass} max-w-sm sm:max-w-md`}>
                              <div className="flex items-center gap-2.5">
                                <FileTypeIcon mimeType={doc.mime_type} filename={doc.original_filename} />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#172033] hover:text-[#3157D5] truncate leading-tight">
                                    {doc.title}
                                  </div>
                                  <div className="text-[11px] text-[#8F9CAE] font-mono truncate mt-0.5">
                                    {doc.original_filename}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Type column */}
                            {visibleColumns.type && (
                              <td className={`${rowPaddingClass} text-[#667085] whitespace-nowrap`}>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#5B6880] border border-[#D9DEE7]">
                                  {typeMeta.ext}
                                </span>
                              </td>
                            )}

                            {/* Status column */}
                            {visibleColumns.status && (
                              <td className={`${rowPaddingClass} whitespace-nowrap`}>
                                <StatusBadge status={doc.approval_status} />
                              </td>
                            )}

                            {/* Version column */}
                            {visibleColumns.version && (
                              <td className={`${rowPaddingClass} whitespace-nowrap`} onClick={e => { e.stopPropagation(); openHistoryModal(doc); }}>
                                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white hover:bg-[#E9EEFF] hover:text-[#3157D5] border border-[#D9DEE7] text-[#667085] cursor-pointer" title="View Version History">
                                  v{doc.current_version || 1}
                                </span>
                              </td>
                            )}

                            {/* Owner column */}
                            {visibleColumns.owner && (
                              <td className={`${rowPaddingClass} whitespace-nowrap`}>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-[#172033] font-medium">
                                    {doc.owner_first_name} {doc.owner_last_name}
                                  </span>
                                  {doc.owner_role && (
                                    <span className={`text-[10px] font-medium px-1 rounded ${doc.owner_role === 'ADMIN' ? 'bg-[#EDE7F6] text-[#5E35B1]' :
                                      doc.owner_role === 'MANAGER' ? 'bg-[#EFF6FF] text-[#1D4ED8]' :
                                        'bg-[#E6F4EA] text-[#0D8A5E]'
                                      }`}>
                                      {doc.owner_role.toLowerCase()}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Modified column */}
                            {visibleColumns.modified && (
                              <td className={`${rowPaddingClass} text-[#667085] whitespace-nowrap text-xs font-mono`}>
                                {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
                              </td>
                            )}

                            {/* Created column */}
                            {visibleColumns.created && (
                              <td className={`${rowPaddingClass} text-[#667085] whitespace-nowrap text-xs font-mono`}>
                                {new Date(doc.created_at).toLocaleDateString()}
                              </td>
                            )}

                            {/* Size column */}
                            {visibleColumns.size && (
                              <td className={`${rowPaddingClass} text-[#667085] font-mono whitespace-nowrap text-xs`}>
                                {formatBytes(doc.file_size)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── 8. DOCKED RIGHT-SIDE DETAILS INSPECTOR PANEL ─────────────── */}
            {isDetailsPanelOpen && selectedDocForDetails && (
              <div className="w-80 lg:w-96 bg-white border border-[#D9DEE7] rounded shadow-sm flex flex-col shrink-0 animate-fadeIn overflow-hidden sticky top-20 max-h-[85vh]">
                {/* Header */}
                <div className="p-3.5 border-b border-[#EDF1F5] bg-white flex items-center justify-between">
                  <span className="font-bold text-xs text-[#172033] uppercase tracking-wider">
                    Document Details
                  </span>
                  <button
                    onClick={() => setIsDetailsPanelOpen(false)}
                    className="btn-ghost p-1"
                    title="Close details"
                  >
                    <X className="w-4 h-4 text-[#667085]" />
                  </button>
                </div>

                {/* Content Body */}
                <div className="p-4 space-y-4 text-xs overflow-y-auto flex-1">
                  {/* Title & Type Badge */}
                  <div className="flex items-start gap-3">
                    <FileTypeIcon mimeType={selectedDocForDetails.mime_type} filename={selectedDocForDetails.original_filename} className="w-10 h-10 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-[#172033] leading-snug">
                        {selectedDocForDetails.title}
                      </h3>
                      <div className="font-mono text-[11px] text-[#8F9CAE] mt-0.5 break-all">
                        {selectedDocForDetails.original_filename}
                      </div>
                    </div>
                  </div>

                  {/* Status & Version */}
                  <div className="flex items-center gap-2 pt-1">
                    <StatusBadge status={selectedDocForDetails.approval_status} />
                    <span className="font-mono text-[11px] px-1.5 py-0.5 bg-white border border-[#D9DEE7] text-[#172033] rounded">
                      Version {selectedDocForDetails.current_version || 1}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EDF1F5]">
                    <button
                      onClick={() => handleOpenPreview(selectedDocForDetails)}
                      className="btn-secondary justify-center py-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    <a
                      href={`${API_BASE_URL}/documents/${selectedDocForDetails.id}/download?token=${token}`}
                      download
                      className="btn-primary justify-center py-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>

                  {/* Metadata Grid */}
                  <div className="space-y-2.5 pt-2 border-t border-[#EDF1F5]">
                    <div className="text-[11px] font-bold text-[#8F9CAE] uppercase tracking-wider">
                      Metadata &amp; Access
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-[#8F9CAE]">Size</span>
                        <div className="font-mono font-medium text-[#172033]">
                          {formatBytes(selectedDocForDetails.file_size)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#8F9CAE]">Access Level</span>
                        <div className="font-medium text-[#172033] flex items-center gap-1 mt-0.5">
                          <Lock className="w-3 h-3 text-[#667085]" />
                          <span>Organization</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-[#8F9CAE]">Owner</span>
                      <div className="font-medium text-[#172033]">
                        {selectedDocForDetails.owner_first_name} {selectedDocForDetails.owner_last_name}
                      </div>
                      <div className="text-[10px] text-[#8F9CAE] font-mono">
                        {selectedDocForDetails.owner_email}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-[#8F9CAE]">Uploaded</span>
                        <div className="text-[#172033] font-mono text-[11px]">
                          {new Date(selectedDocForDetails.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#8F9CAE]">Modified</span>
                        <div className="text-[#172033] font-mono text-[11px]">
                          {new Date(selectedDocForDetails.updated_at || selectedDocForDetails.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Version History Summary */}
                  <div className="space-y-2 pt-2 border-t border-[#EDF1F5]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#8F9CAE] uppercase tracking-wider">
                        Version History
                      </span>
                      <button
                        onClick={() => openHistoryModal(selectedDocForDetails)}
                        className="text-[11px] text-[#3157D5] hover:underline font-semibold"
                      >
                        View all &rarr;
                      </button>
                    </div>

                    {historyLoading ? (
                      <div className="py-2 text-center text-[#8F9CAE] text-xs">Loading revisions...</div>
                    ) : docHistoryData.versions.length > 0 ? (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {docHistoryData.versions.slice(0, 3).map(v => (
                          <div key={v.id} className="p-2 rounded bg-white border border-[#EDF1F5] text-xs">
                            <div className="flex items-center justify-between font-medium text-[#172033]">
                              <span>Version {v.version_number}</span>
                              <span className="text-[10px] text-[#8F9CAE]">{new Date(v.created_at).toLocaleDateString()}</span>
                            </div>
                            {v.change_notes && (
                              <p className="text-[11px] text-[#667085] italic mt-0.5 truncate">
                                "{v.change_notes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#8F9CAE] italic">Current version is v1.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>



          {/* ── WINDOWS 11 RIGHT-CLICK CONTEXT MENU ─────────────────── */}
          <WindowsContextMenu
            isOpen={contextMenu.isOpen}
            x={contextMenu.x}
            y={contextMenu.y}
            type={contextMenu.type}
            target={contextMenu.target}
            onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
            actions={{
              canManage,
              currentUserId: user?.id,
              viewDensity,
              isFavorite: (id) => favoritedIds.has(id),
              canSubmitApproval: (doc) => doc.approval_status === 'DRAFT' && (canManage || doc.owner_id === user?.id),
              onPreview: handleOpenPreview,
              onDownload: (doc) => {
                const a = document.createElement('a');
                a.href = `${API_BASE_URL}/documents/${doc.id}/download?token=${token}`;
                a.download = doc.original_filename || 'download';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              },
              onToggleFavorite: handleToggleFavorite,
              onShare: openShareModal,
              onRename: (doc) => {
                setActiveItem({ type: 'document', data: doc });
                setRenameInput(doc.title);
                setRenameExpiresAt(doc.expires_at ? doc.expires_at.slice(0, 16) : '');
                setIsRenameModalOpen(true);
              },
              onMove: (doc) => {
                setActiveItem({ type: 'document', data: doc });
                loadAllFolders();
                setTargetMoveFolderId('');
                setIsMoveModalOpen(true);
              },
              onHistory: openHistoryModal,
              onSubmitApproval: (doc) => {
                setActiveItem({ type: 'document', data: doc });
                setSubmissionNote('');
                setIsSubmitApprovalModalOpen(true);
              },
              onDelete: (doc) => {
                setActiveItem({ type: 'document', data: doc });
                setIsDeleteModalOpen(true);
              },
              onProperties: (doc) => {
                setSelectedDocForDetails(doc);
                setIsDetailsPanelOpen(true);
                loadHistory(doc.id);
              },
              onOpenFolder: (folderId) => {
                handleNavigateFolder(folderId);
              },
              onRenameFolder: (f) => {
                setActiveItem({ type: 'folder', data: f });
                setFolderNameInput(f.name);
                setIsFolderModalOpen(true);
              },
              onDeleteFolder: (f) => {
                setActiveItem({ type: 'folder', data: f });
                setIsDeleteModalOpen(true);
              },
              onPropertiesFolder: (f) => {
                handleNavigateFolder(f.id);
              },
              onRefresh: refreshData,
              onUpload: () => {
                setSelectedFile(null);
                setUploadTitle('');
                setModalError('');
                setIsUploadModalOpen(true);
              },
              onNewFolder: () => {
                setFolderNameInput('');
                setModalError('');
                setIsFolderModalOpen(true);
              },
              onSelectAll: () => {
                setSelectedDocIds(new Set(displayedDocuments.map(d => d.id)));
              },
              onChangeView: setViewDensity,
            }}
          />

          {/* ── 9. TWO-PANE WORKSPACE MODAL (FULL PREVIEW) ──────────────── */}
          {previewDoc && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 animate-fadeIn">
              <div className="bg-white border border-[#D9DEE7] rounded-lg shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="h-14 px-5 border-b border-[#D9DEE7] bg-white flex items-center justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setPreviewDoc(null)}
                      className="btn-secondary px-2.5 py-1 text-xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to documents</span>
                    </button>

                    <div className="h-4 w-px bg-[#D9DEE7]" />

                    <div className="flex items-center gap-2 truncate">
                      <FileTypeIcon mimeType={previewDoc.mime_type} filename={previewDoc.original_filename} />
                      <span className="font-semibold text-sm text-[#172033] truncate">
                        {previewDoc.title}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openShareModal(previewDoc)}
                      className="btn-secondary"
                      title="Share document"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#667085]" />
                      <span>Share</span>
                    </button>

                    <a
                      href={`${API_BASE_URL}/documents/${previewDoc.id}/download?token=${token}`}
                      download
                      className="btn-primary"
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5 text-white" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => setPreviewDoc(null)}
                      className="btn-ghost p-2"
                      title="Close preview"
                    >
                      <X className="w-4 h-4 text-[#667085]" />
                    </button>
                  </div>
                </div>

                {/* Two-Pane Preview Body */}
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 bg-white p-4 lg:p-6 overflow-auto flex items-center justify-center">
                    {previewDoc.mime_type?.startsWith('image/') ? (
                      <img
                        src={`${API_BASE_URL}/documents/${previewDoc.id}/view?token=${token}`}
                        alt={previewDoc.title}
                        className="max-w-full max-h-[75vh] object-contain rounded border border-[#D9DEE7] shadow-sm bg-white"
                      />
                    ) : previewDoc.mime_type === 'application/pdf' ? (
                      <iframe
                        src={`${API_BASE_URL}/documents/${previewDoc.id}/view?token=${token}#toolbar=1`}
                        title={previewDoc.title}
                        className="w-full h-full rounded border border-[#D9DEE7] shadow-sm bg-white"
                      />
                    ) : previewDoc.mime_type?.startsWith('text/') || previewDoc.mime_type?.includes('json') || previewDoc.mime_type?.includes('csv') ? (
                      <div className="w-full h-full p-4 bg-white rounded border border-[#D9DEE7] shadow-sm overflow-auto">
                        <pre className="font-mono text-xs text-[#172033] whitespace-pre-wrap leading-relaxed">
                          {previewTextContent || 'Loading content...'}
                        </pre>
                      </div>
                    ) : (
                      <div className="card p-10 text-center max-w-sm space-y-3">
                        <Download className="w-10 h-10 text-[#8F9CAE] mx-auto" strokeWidth={1.5} />
                        <h4 className="text-sm font-semibold text-[#172033]">Direct Preview Unavailable</h4>
                        <p className="text-xs text-[#667085]">
                          This binary format ({previewDoc.mime_type || 'file'}) cannot be displayed inline. Download the file to view it locally.
                        </p>
                        <a
                          href={`${API_BASE_URL}/documents/${previewDoc.id}/download?token=${token}`}
                          download
                          className="btn-primary inline-flex mt-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download File</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right panel metadata */}
                  <div className="w-80 lg:w-96 bg-white border-l border-[#D9DEE7] flex flex-col shrink-0 overflow-y-auto p-5 space-y-4 text-xs">
                    <div className="font-bold text-[#172033] uppercase tracking-wider border-b border-[#EDF1F5] pb-2">
                      Document Metadata
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8F9CAE]">Title</div>
                      <div className="font-semibold text-[#172033]">{previewDoc.title}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8F9CAE]">Original Filename</div>
                      <div className="font-mono text-[11px] text-[#667085] break-all">{previewDoc.original_filename}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[11px] text-[#8F9CAE]">Size</div>
                        <div className="font-mono font-semibold text-[#172033]">{formatBytes(previewDoc.file_size)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#8F9CAE]">Version</div>
                        <div className="font-mono font-semibold text-[#172033]">v{previewDoc.current_version || 1}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8F9CAE]">Governance Status</div>
                      <div className="mt-1"><StatusBadge status={previewDoc.approval_status} /></div>
                    </div>
                    <div>
                      <div className="text-[11px] text-[#8F9CAE]">Owner</div>
                      <div className="font-medium text-[#172033]">{previewDoc.owner_first_name} {previewDoc.owner_last_name}</div>
                      <div className="text-[10px] text-[#667085] font-mono">{previewDoc.owner_email}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 10. MODALS: NEW FOLDER, UPLOAD, RENAME, MOVE, BULK ACTIONS ── */}
          {isFolderModalOpen && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Create New Folder</h3>
                  <button onClick={() => setIsFolderModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <form onSubmit={handleCreateFolder} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Folder Name</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={folderNameInput}
                        onChange={e => setFolderNameInput(e.target.value)}
                        placeholder="e.g. Legal Agreements"
                        className="input"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsFolderModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading} className="btn-primary">{modalLoading ? 'Creating...' : 'Create Folder'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {isUploadModalOpen && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Upload Document</h3>
                  <button onClick={() => setIsUploadModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <form onSubmit={handleUploadDocument} className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#D9DEE7] hover:border-[#3157D5] rounded-md p-6 text-center cursor-pointer bg-white hover:bg-[#E9EEFF]/20 transition-all"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                      />
                      <Upload className="w-7 h-7 text-[#3157D5] mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-xs font-semibold text-[#172033]">
                        {selectedFile ? selectedFile.name : 'Click to choose a file'}
                      </p>
                      <p className="text-[11px] text-[#8F9CAE] mt-1">
                        {selectedFile ? formatBytes(selectedFile.size) : 'PDF, Word, Excel, Images up to 50 MB'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Display Title (optional)</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={e => setUploadTitle(e.target.value)}
                        placeholder="Defaults to original filename"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Expiration Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={uploadExpiresAt}
                        onChange={e => setUploadExpiresAt(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsUploadModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading || !selectedFile} className="btn-primary disabled:opacity-50">
                        {modalLoading ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {isRenameModalOpen && activeItem && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Rename {activeItem.type === 'folder' ? 'Folder' : 'Document'}</h3>
                  <button onClick={() => setIsRenameModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <form onSubmit={handleRename} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">New Title</label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={renameInput}
                        onChange={e => setRenameInput(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsRenameModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading} className="btn-primary">{modalLoading ? 'Saving...' : 'Save Title'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {isMoveModalOpen && activeItem && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Move {activeItem.type === 'folder' ? 'Folder' : 'Document'}</h3>
                  <button onClick={() => setIsMoveModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <form onSubmit={handleMove} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Destination Folder</label>
                      <select
                        value={targetMoveFolderId}
                        onChange={e => setTargetMoveFolderId(e.target.value)}
                        className="input"
                      >
                        <option value="">Root Directory (/)</option>
                        {allFolders
                          .filter(f => activeItem.type !== 'folder' || f.id !== activeItem.data.id)
                          .map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsMoveModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading} className="btn-primary">{modalLoading ? 'Moving...' : 'Move Now'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {isBulkMoveModalOpen && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Move {selectedDocIds.size} Document(s)</h3>
                  <button onClick={() => setIsBulkMoveModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <form onSubmit={handleBulkMove} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Select Target Directory</label>
                      <select
                        value={targetMoveFolderId}
                        onChange={e => setTargetMoveFolderId(e.target.value)}
                        className="input"
                      >
                        <option value="">Root Directory (/)</option>
                        {allFolders.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsBulkMoveModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading} className="btn-primary">{modalLoading ? 'Moving...' : 'Move All Selected'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {isDeleteModalOpen && activeItem && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#C53030]">Confirm Deletion</h3>
                  <button onClick={() => setIsDeleteModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-3">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <p className="text-xs text-[#172033]">
                    Are you sure you want to delete this {activeItem.type}:
                  </p>
                  <div className="p-3 rounded bg-white border border-[#D9DEE7] font-semibold text-xs text-[#172033]">
                    {activeItem.type === 'folder' ? activeItem.data.name : activeItem.data.title}
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={handleDelete} disabled={modalLoading} className="btn-danger">
                      {modalLoading ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBulkDeleteModalOpen && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#C53030]">Confirm Bulk Deletion</h3>
                  <button onClick={() => setIsBulkDeleteModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-3">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <p className="text-xs text-[#172033]">
                    You are about to permanently delete <strong className="text-[#C53030]">{selectedDocIds.size}</strong> selected document(s).
                  </p>
                  <p className="text-[11px] text-[#667085]">
                    This action is audited and cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2 pt-3">
                    <button type="button" onClick={() => setIsBulkDeleteModalOpen(false)} className="btn-secondary">Cancel</button>
                    <button type="button" onClick={handleBulkDelete} disabled={modalLoading} className="btn-danger">
                      {modalLoading ? 'Deleting...' : `Delete ${selectedDocIds.size} Documents`}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share Modal */}
          {isShareModalOpen && activeItem?.type === 'document' && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">Share Document</h3>
                    <p className="text-[11px] text-[#667085] truncate max-w-sm mt-0.5">{activeItem.data.title}</p>
                  </div>
                  <button onClick={() => setIsShareModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}

                  <div>
                    <label className="block text-[11px] font-semibold text-[#667085] mb-1">Add People</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={shareSearchQuery}
                        onChange={e => setShareSearchQuery(e.target.value)}
                        className="input text-xs"
                      />
                      <select
                        value={sharePermission}
                        onChange={e => setSharePermission(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-[#D9DEE7] rounded text-xs text-[#172033]"
                      >
                        <option value="VIEW">View only</option>
                        <option value="EDIT">Can edit</option>
                      </select>
                    </div>

                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto divide-y divide-[#EDF1F5] border border-[#EDF1F5] rounded">
                      {shareUsers
                        .filter(u => {
                          const q = shareSearchQuery.toLowerCase();
                          return !q || u.email.toLowerCase().includes(q) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
                        })
                        .filter(u => !docShares.some(s => s.user_id === u.id))
                        .map(u => (
                          <div key={u.id} className="flex items-center justify-between p-2 hover:bg-[#F8FAFC]">
                            <div className="text-xs">
                              <span className="font-medium text-[#172033]">{u.first_name} {u.last_name}</span>
                              <span className="text-[10px] text-[#8F9CAE] ml-1">({u.email})</span>
                            </div>
                            <button
                              onClick={() => handleShare(u.id)}
                              disabled={modalLoading}
                              className="btn-secondary py-1 px-2 text-[11px]"
                            >
                              Share
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {docShares.length > 0 && (
                    <div className="pt-2 border-t border-[#EDF1F5]">
                      <label className="block text-[11px] font-bold text-[#667085] uppercase tracking-wider mb-2">
                        Currently Shared With ({docShares.length})
                      </label>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {docShares.map(share => (
                          <div key={share.user_id} className="flex items-center justify-between p-2 rounded bg-white border border-[#EDF1F5]">
                            <div className="text-xs">
                              <div className="font-medium text-[#172033]">{share.first_name} {share.last_name}</div>
                              <div className="text-[10px] text-[#8F9CAE]">{share.email}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E9EEFF] text-[#3157D5]">
                                {share.permission}
                              </span>
                              <button
                                onClick={() => handleUnshare(share.user_id)}
                                className="btn-ghost p-1 text-[#C53030] hover:bg-[#FCE8E6]"
                                title="Revoke access"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History & Approvals Modal */}
          {isHistoryModalOpen && activeItem && (
            <div className="modal-overlay">
              <div className="modal-container modal-container-lg h-[80vh] flex flex-col p-0">
                <div className="modal-header shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">Document Version &amp; Approval History</h3>
                    <p className="text-[11px] text-[#667085] truncate max-w-md mt-0.5">{activeItem.data.title}</p>
                  </div>
                  <button onClick={() => setIsHistoryModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Approval workflow */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider border-b border-[#EDF1F5] pb-1.5">
                      Approval Audit Records
                    </h4>
                    {docHistoryData.history.length === 0 ? (
                      <p className="text-xs text-[#8F9CAE] italic">No approval requests submitted for this document.</p>
                    ) : (
                      <div className="space-y-2">
                        {docHistoryData.history.map(req => (
                          <div key={req.id} className="p-3 rounded border border-[#EDF1F5] bg-white text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={req.status} />
                                <span className="font-mono text-[#667085]">v{req.version_number}</span>
                              </div>
                              <span className="text-[10px] text-[#8F9CAE]">{new Date(req.created_at).toLocaleString()}</span>
                            </div>
                            <div className="text-[#172033] mt-2">
                              Requested by <span className="font-medium">{req.requester_first_name} {req.requester_last_name}</span>
                            </div>
                            {req.submission_note && (
                              <div className="mt-1 text-[#667085] bg-white p-2 rounded border border-[#EDF1F5]">"{req.submission_note}"</div>
                            )}
                            {req.reviewed_by && (
                              <div className="mt-2 pt-2 border-t border-[#EDF1F5] text-[#667085]">
                                Decision by <span className="font-medium text-[#172033]">{req.reviewer_first_name} {req.reviewer_last_name}</span> at {new Date(req.reviewed_at).toLocaleString()}
                                {req.review_comment && <div className="italic mt-0.5">"{req.review_comment}"</div>}
                              </div>
                            )}
                            {req.status === 'PENDING' && isAdmin && (
                              <div className="mt-3 pt-2 border-t border-[#EDF1F5] flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const comment = window.prompt('Approval comment / note (optional):') ?? '';
                                    handleReviewApproval(req.id, 'APPROVED', comment);
                                  }}
                                  className="btn-primary py-1 px-2.5 text-xs bg-[#107C10] hover:bg-[#0E680E] text-white rounded-[3px]"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const comment = window.prompt('Rejection reason (required):');
                                    if (comment !== null && comment.trim()) {
                                      handleReviewApproval(req.id, 'REJECTED', comment.trim());
                                    }
                                  }}
                                  className="btn-danger py-1 px-2.5 text-xs bg-[#FDE7E9] text-[#C42B1C] border border-[#F4ACAF] hover:bg-[#FCD8DB] rounded-[3px]"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Version archive */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider border-b border-[#EDF1F5] pb-1.5">
                      Version History
                    </h4>
                    <div className="space-y-2">
                      {docHistoryData.versions.map(v => (
                        <div key={v.id} className="p-3 rounded border border-[#EDF1F5] bg-white flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#172033]">Version {v.version_number}</span>
                              {v.is_current && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#3157D5] text-white">CURRENT</span>}
                              <span className="text-[11px] text-[#8F9CAE] font-mono">{formatBytes(v.file_size)}</span>
                            </div>
                            <div className="text-[11px] text-[#667085] mt-1">
                              Uploaded by {v.first_name} {v.last_name} on {new Date(v.created_at).toLocaleDateString()}
                            </div>
                            {v.change_notes && <div className="text-[11px] text-[#5B6880] italic mt-1">"{v.change_notes}"</div>}
                          </div>
                          <a
                            href={`${API_BASE_URL}/documents/${activeItem.data.id}/versions/${v.version_number}/download?token=${token}`}
                            download
                            className="btn-secondary py-1 px-2.5 text-xs inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Version Upload Modal */}
          {isVersionModalOpen && activeItem && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Upload New Version</h3>
                  <button onClick={() => setIsVersionModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <p className="text-xs text-[#667085]">
                    Upload revised file for <span className="font-semibold text-[#172033]">"{activeItem.data.title}"</span>. The current revision will be archived in version history.
                  </p>
                  <form onSubmit={handleUploadNewVersion} className="space-y-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#D9DEE7] hover:border-[#3157D5] rounded-md p-6 text-center cursor-pointer bg-white hover:bg-[#E9EEFF]/20"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
                      />
                      <Upload className="w-6 h-6 text-[#3157D5] mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#172033]">
                        {selectedFile ? selectedFile.name : 'Select updated file'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Change Notes (optional)</label>
                      <textarea
                        value={versionChangeNotes}
                        onChange={e => setVersionChangeNotes(e.target.value)}
                        placeholder="Describe changes in this revision..."
                        className="input resize-none h-20"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsVersionModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading || !selectedFile} className="btn-primary disabled:opacity-50">
                        {modalLoading ? 'Uploading...' : 'Publish Version'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Submit Approval Modal */}
          {isSubmitApprovalModalOpen && activeItem && (
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h3 className="text-sm font-bold text-[#172033]">Submit for Governance Approval</h3>
                  <button onClick={() => setIsSubmitApprovalModalOpen(false)} className="btn-ghost p-1"><X className="w-4 h-4 text-[#667085]" /></button>
                </div>
                <div className="modal-body space-y-4">
                  {modalError && <div className="p-2.5 rounded bg-[#FCE8E6] border border-[#F7C5C0] text-xs text-[#C53030]">{modalError}</div>}
                  <p className="text-xs text-[#667085]">
                    Submit <span className="font-semibold text-[#172033]">"{activeItem.data.title}"</span> (v{activeItem.data.current_version || 1}) for administrative review.
                  </p>
                  <form onSubmit={handleSubmitApproval} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[#172033] mb-1">Submission Note (optional)</label>
                      <textarea
                        value={submissionNote}
                        onChange={e => setSubmissionNote(e.target.value)}
                        placeholder="Provide context for review..."
                        className="input resize-none h-20"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setIsSubmitApprovalModalOpen(false)} className="btn-secondary">Cancel</button>
                      <button type="submit" disabled={modalLoading} className="btn-primary">
                        {modalLoading ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
