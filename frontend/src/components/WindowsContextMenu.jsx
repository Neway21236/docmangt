import React, { useEffect, useRef, useState } from 'react';
import {
  Eye, Download, Star, Share2, Pencil, FolderSymlink, Trash2,
  SlidersHorizontal, CheckSquare, RefreshCw, FolderPlus, Upload,
  Copy, Scissors, ArrowUpDown, Grid, List, Check, Clock, Info, CheckCircle2
} from 'lucide-react';

const winFont = { fontFamily: "system-ui, 'Segoe UI', sans-serif" };

export default function WindowsContextMenu({
  isOpen,
  x,
  y,
  type, // 'document' | 'folder' | 'canvas'
  target, // document object, folder object, or null
  onClose,
  actions,
}) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: y, left: x });
  const [activeSubmenu, setActiveSubmenu] = useState(null); // 'view' | 'sort'

  // Viewport boundary adjustment
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();

    let newLeft = x;
    let newTop = y;

    if (x + rect.width > window.innerWidth - 8) {
      newLeft = Math.max(8, window.innerWidth - rect.width - 12);
    }
    if (y + rect.height > window.innerHeight - 8) {
      newTop = Math.max(8, window.innerHeight - rect.height - 12);
    }

    setPos({ top: newTop, left: newLeft });
  }, [isOpen, x, y]);

  // Click outside and escape listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScrollOrResize = () => {
      onClose();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const MenuItem = ({ icon: Icon, label, shortcut, onClick, danger, disabled, bold, hasSubmenu, active }) => (
    <button
      onClick={() => {
        if (disabled) return;
        onClick?.();
        onClose();
      }}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between px-3 py-1.5 text-xs text-left rounded-[4px] select-none transition-colors
        ${disabled ? 'opacity-40 cursor-default' : 'cursor-pointer'}
        ${danger
          ? 'text-[#C42B1C] hover:bg-[#FCE8E6]'
          : active
          ? 'bg-[#CCE4F7] text-[#0078D4]'
          : 'text-[#1a1a1a] hover:bg-[#E8E8E8]'
        }
      `}
      style={winFont}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon className={`w-4 h-4 shrink-0 ${danger ? 'text-[#C42B1C]' : 'text-[#5f5f5f]'}`} />}
        <span className={`truncate ${bold ? 'font-semibold text-[#1a1a1a]' : 'font-normal'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-4">
        {shortcut && (
          <span className="text-[11px] text-[#8F8F8F] font-mono">
            {shortcut}
          </span>
        )}
        {hasSubmenu && (
          <span className="text-[10px] text-[#8F8F8F]">▶</span>
        )}
      </div>
    </button>
  );

  const Divider = () => <div className="h-px bg-[#E5E5E5] my-1 mx-1.5" />;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-[#D6D6D6] rounded-[6px] shadow-2xl p-1 animate-fadeIn"
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
        minWidth: '220px',
        maxWidth: '280px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
        ...winFont,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── 1. DOCUMENT CONTEXT MENU ───────────────────────────────── */}
      {type === 'document' && target && (
        <>
          <MenuItem
            icon={Eye}
            label="Preview"
            bold
            shortcut="Enter"
            onClick={() => actions.onPreview?.(target)}
          />
          <MenuItem
            icon={Download}
            label="Download"
            onClick={() => actions.onDownload?.(target)}
          />

          <Divider />

          <MenuItem
            icon={Star}
            label={actions.isFavorite?.(target.id) ? 'Remove from favorites' : 'Add to favorites'}
            onClick={() => actions.onToggleFavorite?.(target.id)}
          />
          <MenuItem
            icon={Share2}
            label="Share..."
            onClick={() => actions.onShare?.(target)}
          />
          {actions.canSubmitApproval?.(target) && (
            <MenuItem
              icon={CheckSquare}
              label="Submit for approval..."
              onClick={() => actions.onSubmitApproval?.(target)}
            />
          )}

          <Divider />

          <MenuItem
            icon={Pencil}
            label="Rename"
            shortcut="F2"
            disabled={!actions.canManage && target.owner_id !== actions.currentUserId}
            onClick={() => actions.onRename?.(target)}
          />
          <MenuItem
            icon={FolderSymlink}
            label="Move to folder..."
            disabled={!actions.canManage && target.owner_id !== actions.currentUserId}
            onClick={() => actions.onMove?.(target)}
          />
          <MenuItem
            icon={Clock}
            label="Version history"
            onClick={() => actions.onHistory?.(target)}
          />

          <Divider />

          <MenuItem
            icon={Trash2}
            label="Delete"
            shortcut="Del"
            danger
            disabled={!actions.canManage && target.owner_id !== actions.currentUserId}
            onClick={() => actions.onDelete?.(target)}
          />

          <Divider />

          <MenuItem
            icon={Info}
            label="Properties"
            shortcut="Alt+Enter"
            onClick={() => actions.onProperties?.(target)}
          />
        </>
      )}

      {/* ── 2. FOLDER CONTEXT MENU ─────────────────────────────────── */}
      {type === 'folder' && target && (
        <>
          <MenuItem
            icon={Eye}
            label="Open folder"
            bold
            shortcut="Enter"
            onClick={() => actions.onOpenFolder?.(target.id)}
          />

          <Divider />

          <MenuItem
            icon={Pencil}
            label="Rename folder"
            shortcut="F2"
            disabled={!actions.canManage && target.owner_id !== actions.currentUserId}
            onClick={() => actions.onRenameFolder?.(target)}
          />
          <MenuItem
            icon={Trash2}
            label="Delete folder"
            shortcut="Del"
            danger
            disabled={!actions.canManage && target.owner_id !== actions.currentUserId}
            onClick={() => actions.onDeleteFolder?.(target)}
          />

          <Divider />

          <MenuItem
            icon={Info}
            label="Properties"
            shortcut="Alt+Enter"
            onClick={() => actions.onPropertiesFolder?.(target)}
          />
        </>
      )}

      {/* ── 3. CANVAS BACKGROUND CONTEXT MENU ──────────────────────── */}
      {type === 'canvas' && (
        <>
          {/* View Mode submenu trigger */}
          <div
            className="relative"
            onMouseEnter={() => setActiveSubmenu('view')}
            onMouseLeave={() => setActiveSubmenu(null)}
          >
            <div
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-[4px] cursor-pointer hover:bg-[#E8E8E8] ${activeSubmenu === 'view' ? 'bg-[#E8E8E8]' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <Grid className="w-4 h-4 text-[#5f5f5f]" />
                <span>View</span>
              </div>
              <span className="text-[10px] text-[#8F8F8F]">▶</span>
            </div>

            {/* View flyout menu */}
            {activeSubmenu === 'view' && (
              <div
                className="absolute left-full top-0 ml-1 bg-white border border-[#D6D6D6] rounded-[6px] shadow-2xl p-1 min-w-[150px] animate-fadeIn"
                style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
              >
                <button
                  onClick={() => { actions.onChangeView?.('comfortable'); onClose(); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-[3px] hover:bg-[#E8E8E8] ${actions.viewDensity === 'comfortable' ? 'font-semibold text-[#0078D4]' : 'text-[#1a1a1a]'}`}
                >
                  <div className="flex items-center gap-2">
                    <List className="w-3.5 h-3.5" />
                    <span>Details</span>
                  </div>
                  {actions.viewDensity === 'comfortable' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { actions.onChangeView?.('compact'); onClose(); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-[3px] hover:bg-[#E8E8E8] ${actions.viewDensity === 'compact' ? 'font-semibold text-[#0078D4]' : 'text-[#1a1a1a]'}`}
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Compact</span>
                  </div>
                  {actions.viewDensity === 'compact' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { actions.onChangeView?.('grid'); onClose(); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-[3px] hover:bg-[#E8E8E8] ${actions.viewDensity === 'grid' ? 'font-semibold text-[#0078D4]' : 'text-[#1a1a1a]'}`}
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5" />
                    <span>Large icons</span>
                  </div>
                  {actions.viewDensity === 'grid' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <MenuItem
            icon={RefreshCw}
            label="Refresh"
            shortcut="F5"
            onClick={() => actions.onRefresh?.()}
          />

          <Divider />

          {actions.canManage && (
            <>
              <MenuItem
                icon={FolderPlus}
                label="New folder"
                onClick={() => actions.onNewFolder?.()}
              />
              <MenuItem
                icon={Upload}
                label="Upload files"
                onClick={() => actions.onUpload?.()}
              />
              <Divider />
            </>
          )}

          <MenuItem
            icon={CheckCircle2}
            label="Select all"
            shortcut="Ctrl+A"
            onClick={() => actions.onSelectAll?.()}
          />
        </>
      )}
    </div>
  );
}
