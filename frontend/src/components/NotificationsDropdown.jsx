import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, AlertCircle, Share2, FileCheck, Clock } from 'lucide-react';
import api from '../api/client';

const TYPE_META = {
  EXPIRY_WARNING:    { icon: Clock,       color: '#B7791F', bg: '#FEF3D6' },
  EXPIRING_SOON:     { icon: Clock,       color: '#B7791F', bg: '#FEF3D6' },
  DOCUMENT_SHARED:   { icon: Share2,      color: '#3157D5', bg: '#E9EEFF' },
  APPROVAL_REQUEST:  { icon: FileCheck,   color: '#B7791F', bg: '#FEF3D6' },
  APPROVAL_DECISION: { icon: FileCheck,   color: '#16803C', bg: '#E6F4EA' },
  DEFAULT:           { icon: AlertCircle, color: '#667085', bg: '#F1F3F5' },
};

function formatRelative(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationsDropdown({ setCurrentView }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=20');
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch {}
  };

  const handleClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
    setIsOpen(false);
    if (notif.link) setCurrentView('documents');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(o => !o)}
        title="Notifications"
        aria-label="Notifications"
        className="btn-ghost relative p-2"
      >
        <Bell className="w-4 h-4 text-[#667085]" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] font-bold bg-[#C53030] text-white flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md bg-white border border-[#D9DEE7] shadow-lg overflow-hidden animate-fadeIn z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDF1F5] bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#172033]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#E9EEFF] text-[#3157D5]">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                title="Mark all as read"
                aria-label="Mark all as read"
                className="text-xs text-[#3157D5] hover:text-[#2647B7] flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-6 h-6 mx-auto text-[#D9DEE7]" strokeWidth={1.5} />
                <p className="text-xs text-[#8F9CAE]">You're all caught up</p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDF1F5]">
                {notifications.map(notif => {
                  const meta = TYPE_META[notif.type] || TYPE_META.DEFAULT;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors ${
                        notif.is_read ? 'hover:bg-[#F8FAFC]' : 'bg-[#F4F7FF]/60 hover:bg-[#EEF2FF]'
                      }`}
                    >
                      {/* Type icon */}
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: meta.bg }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} strokeWidth={1.75} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs leading-snug truncate ${notif.is_read ? 'font-normal text-[#667085]' : 'font-semibold text-[#172033]'}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1 bg-[#3157D5]" />
                          )}
                        </div>
                        <p className="text-xs mt-0.5 line-clamp-2 leading-relaxed text-[#667085]">
                          {notif.message}
                        </p>
                        <p className="text-[10px] mt-1 text-[#8F9CAE]" title={new Date(notif.created_at).toLocaleString()}>
                          {formatRelative(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
