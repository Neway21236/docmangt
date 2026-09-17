import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { RefreshCw, X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Eye, Download, FileText, Check, AlertCircle } from 'lucide-react';

const winFont = { fontFamily: "system-ui,'Segoe UI',sans-serif" };
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ACTION_OPTIONS = [
  'UPLOAD', 'DOWNLOAD', 'VIEW', 'DELETE', 'RENAME', 'MOVE', 'SHARE', 'UNSHARE',
  'APPROVAL_SUBMIT', 'APPROVAL_REVIEW', 'VERSION_UPLOAD', 'FAVORITE_ADD',
  'FOLDER_CREATE', 'FOLDER_DELETE', 'FOLDER_RENAME', 'FOLDER_MOVE',
];

/* Dot color for each action type */
const ACTION_DOT = {
  UPLOAD: '#0078D4', DOWNLOAD: '#5f5f5f', VIEW: '#5f5f5f',
  DELETE: '#C42B1C', RENAME: '#5f5f5f', MOVE: '#5f5f5f',
  SHARE: '#0078D4', UNSHARE: '#835B00',
  APPROVAL_SUBMIT: '#835B00', APPROVAL_REVIEW: '#107C10',
  VERSION_UPLOAD: '#6B2FBA', FAVORITE_ADD: '#835B00',
  FOLDER_CREATE: '#0078D4', FOLDER_DELETE: '#C42B1C',
  FOLDER_RENAME: '#5f5f5f', FOLDER_MOVE: '#5f5f5f',
};

function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleString();
}

/* Flat Windows panel header */
const PanelHeader = ({ title, right }) => (
  <div
    className="flex items-center justify-between px-3 border-b border-[#D6D6D6]"
    style={{ background: '#F5F5F5', padding: '5px 12px', ...winFont }}
  >
    <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
    {right}
  </div>
);

/* Windows-style tab button */
const TabBtn = ({ active, onClick, children, badge = null }) => (
  <button
    onClick={onClick}
    style={{
      ...winFont,
      fontSize: '13px',
      padding: '5px 14px',
      borderRadius: '3px 3px 0 0',
      border: active ? '1px solid #D6D6D6' : '1px solid transparent',
      borderBottom: active ? '1px solid #FFFFFF' : '1px solid #D6D6D6',
      background: active ? '#FFFFFF' : 'transparent',
      color: '#1a1a1a',
      cursor: 'pointer',
      marginBottom: '-1px',
      position: 'relative',
      zIndex: active ? 1 : 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
    }}
  >
    <span>{children}</span>
    {badge !== null && badge > 0 && (
      <span
        style={{
          background: '#C42B1C',
          color: 'white',
          fontSize: '10px',
          fontWeight: 700,
          padding: '1px 5px',
          borderRadius: '10px',
          lineHeight: '12px',
        }}
      >
        {badge}
      </span>
    )}
  </button>
);

export default function AdminPage({ setCurrentView, initialTab = 'users' }) {
  const { user, isAdmin, setUser, token } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab || 'users');

  // Synchronize initialTab if parent changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Global messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Users state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // 2. Pending Approvals state
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalStats, setApprovalStats] = useState(null);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [reviewModalRequest, setReviewModalRequest] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // 3. Audit Logs state
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logPagination, setLogPagination] = useState(null);
  const [logError, setLogError] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [logPage, setLogPage] = useState(1);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve system users.');
    } finally { setLoading(false); }
  };

  // Fetch approvals
  const fetchApprovals = useCallback(async () => {
    setApprovalsLoading(true);
    try {
      const [pendingRes, statsRes] = await Promise.all([
        api.get('/approvals/pending'),
        api.get('/approvals/stats').catch(() => ({ data: { success: false } })),
      ]);
      if (pendingRes.data.success) {
        setPendingApprovals(pendingRes.data.approvals || []);
      }
      if (statsRes.data?.success) {
        setApprovalStats(statsRes.data);
      }
    } catch (err) {
      console.error('Fetch approvals error:', err);
    } finally {
      setApprovalsLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async (page = 1) => {
    setLogLoading(true); setLogError('');
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (filterAction) params.set('action', filterAction);
      if (filterUserId) params.set('userId', filterUserId);
      if (filterDateFrom) params.set('dateFrom', filterDateFrom);
      if (filterDateTo) params.set('dateTo', filterDateTo + 'T23:59:59');
      const res = await api.get(`/audit-logs?${params}`);
      if (res.data.success) {
        setLogs(res.data.logs);
        setLogPagination(res.data.pagination);
        setLogPage(page);
      }
    } catch (err) {
      setLogError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally { setLogLoading(false); }
  }, [filterAction, filterUserId, filterDateFrom, filterDateTo]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchApprovals();
    }
  }, [isAdmin, fetchApprovals]);

  // Tab switch effect
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'logs') fetchLogs(1);
    if (activeTab === 'approvals') fetchApprovals();
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, isAdmin, fetchLogs, fetchApprovals]);

  // Handle role change
  const handleRoleChange = async (targetUserId, newRole) => {
    setUpdatingId(targetUserId); setError(''); setSuccess('');
    try {
      const res = await api.patch(`/auth/users/${targetUserId}/role`, { role: newRole });
      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
        setSuccess(`User #${targetUserId} updated to ${newRole}.`);
        if (user && user.id === targetUserId) setUser({ ...user, role: newRole });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.');
    } finally { setUpdatingId(null); }
  };

  // Open review modal
  const openReviewModal = (req, decision) => {
    setReviewModalRequest(req);
    setReviewDecision(decision);
    setReviewComment('');
  };

  // Submit approval decision
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalRequest) return;
    setReviewSubmitting(true);
    setError(''); setSuccess('');
    try {
      const res = await api.post(`/approvals/${reviewModalRequest.id}/review`, {
        decision: reviewDecision,
        review_comment: reviewComment.trim(),
      });
      if (res.data.success) {
        setSuccess(res.data.message || `Document was ${reviewDecision.toLowerCase()}.`);
        setReviewModalRequest(null);
        fetchApprovals();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review decision.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ ...winFont, maxWidth: '400px', margin: '40px auto', border: '1px solid #D6D6D6', background: '#FFFFFF' }}>
        <PanelHeader title="Access Denied" />
        <div style={{ padding: '24px', textAlign: 'center', color: '#5f5f5f', fontSize: '13px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
          <p style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>Access Denied (403)</p>
          <p style={{ marginBottom: '16px' }}>Your role <strong>[{user?.role}]</strong> does not have administrative access.</p>
          <button onClick={() => setCurrentView('dashboard')} className="btn-secondary">
            ← Return to Overview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...winFont, fontSize: '13px' }} className="space-y-4">
      {/* Page title + tabs */}
      <div className="pb-1">
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
          Admin Console
        </div>

        {/* Windows-style tab strip */}
        <div style={{ borderBottom: '1px solid #D6D6D6', display: 'flex', gap: '2px' }}>
          <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            User Accounts
          </TabBtn>
          <TabBtn
            active={activeTab === 'approvals'}
            onClick={() => setActiveTab('approvals')}
            badge={pendingApprovals.length}
          >
            Pending Approvals
          </TabBtn>
          <TabBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>
            Audit Trail
          </TabBtn>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ padding: '6px 10px', background: '#FDE7E9', border: '1px solid #F4ACAF', color: '#C42B1C', fontSize: '12px', ...winFont }}>
          ⚠ {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '6px 10px', background: '#DFF6DD', border: '1px solid #A5D6A7', color: '#107C10', fontSize: '12px', ...winFont }}>
          ✓ {success}
        </div>
      )}

      {/* ── 1. USERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF' }}>
          <PanelHeader
            title={`Registered Users (${users.length})`}
            right={
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="btn-ghost"
                title="Refresh"
                style={{ padding: '2px 6px', fontSize: '12px' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            }
          />

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#5f5f5f', fontSize: '12px' }}>
              Loading users...
            </div>
          ) : (
            <table className="w-full text-left border-collapse" style={{ fontSize: '13px', ...winFont }}>
              <thead>
                <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #D6D6D6' }}>
                  {['ID', 'Name', 'Email', 'Status', 'Role', 'Change Role'].map(h => (
                    <th key={h} style={{ padding: '4px 10px', fontSize: '12px', color: '#5f5f5f', fontWeight: 400, borderRight: '1px solid #E8E8E8', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isUpdating = updatingId === u.id;
                  const initial = (u.first_name?.[0] || u.email[0] || '?').toUpperCase();
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#E8E8E8] transition-colors"
                      style={{ borderBottom: '1px solid #F0F0F0' }}
                    >
                      <td style={{ padding: '4px 10px', color: '#9E9E9E', fontFamily: 'Consolas,monospace', fontSize: '11px' }}>
                        #{u.id}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        <div className="flex items-center gap-2">
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: '#0078D4', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', fontWeight: 700, flexShrink: 0,
                          }}>
                            {initial}
                          </div>
                          <span style={{ color: '#1a1a1a' }}>{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '4px 10px', color: '#5f5f5f', fontFamily: 'Consolas,monospace', fontSize: '11px' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        <span className="flex items-center gap-1">
                          <span
                            style={{
                              width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                              background: u.is_active ? '#107C10' : '#C42B1C',
                            }}
                          />
                          <span style={{ fontSize: '11px', color: u.is_active ? '#107C10' : '#C42B1C' }}>
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </span>
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        <span
                          className={`badge ${
                            u.role === 'ADMIN' ? 'badge-role-admin' :
                            u.role === 'MANAGER' ? 'badge-role-manager' :
                            'badge-role-viewer'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '4px 10px' }}>
                        <div className="flex items-center gap-1">
                          <select
                            defaultValue={u.role}
                            disabled={isUpdating}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className="input"
                            style={{ fontSize: '11px', padding: '2px 4px', height: '24px', width: '95px' }}
                          >
                            <option value="VIEWER">Viewer</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {isUpdating && (
                            <RefreshCw className="w-3 h-3 animate-spin text-[#0078D4]" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── 2. PENDING APPROVALS TAB ───────────────────────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Quick stats banner */}
          {approvalStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }}>Pending Review</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#835B00', marginTop: '2px' }}>
                  {approvalStats.approval_requests?.pending ?? pendingApprovals.length}
                </div>
              </div>
              <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }}>Approved Overall</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#107C10', marginTop: '2px' }}>
                  {approvalStats.approval_requests?.approved ?? 0}
                </div>
              </div>
              <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#5f5f5f' }}>Rejected Overall</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#C42B1C', marginTop: '2px' }}>
                  {approvalStats.approval_requests?.rejected ?? 0}
                </div>
              </div>
            </div>
          )}

          {/* Pending requests table */}
          <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF' }}>
            <PanelHeader
              title={`Approval Queue (${pendingApprovals.length} requests awaiting review)`}
              right={
                <button
                  onClick={fetchApprovals}
                  disabled={approvalsLoading}
                  className="btn-ghost"
                  title="Refresh"
                  style={{ padding: '2px 6px', fontSize: '12px' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${approvalsLoading ? 'animate-spin' : ''}`} />
                </button>
              }
            />

            {approvalsLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#5f5f5f', fontSize: '12px' }}>
                Loading pending approvals...
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#5f5f5f', fontSize: '13px' }}>
                <CheckCircle2 className="w-8 h-8 mx-auto text-[#107C10] mb-2" />
                <p style={{ fontWeight: 600, color: '#1a1a1a' }}>All caught up!</p>
                <p style={{ fontSize: '12px', color: '#8F8F8F', marginTop: '2px' }}>
                  There are no documents currently awaiting administrative approval.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ fontSize: '13px', ...winFont }}>
                  <thead>
                    <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #D6D6D6' }}>
                      {['Document', 'Version', 'Requested By', 'Submitted', 'Notes', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '4px 10px', fontSize: '12px', color: '#5f5f5f', fontWeight: 400, borderRight: '1px solid #E8E8E8', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.map(req => (
                      <tr
                        key={req.id}
                        className="hover:bg-[#E8E8E8] transition-colors"
                        style={{ borderBottom: '1px solid #F0F0F0' }}
                      >
                        <td style={{ padding: '6px 10px' }}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#0078D4] shrink-0" />
                            <div>
                              <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{req.document_title}</div>
                              <div style={{ fontSize: '11px', color: '#8F8F8F', fontFamily: 'Consolas,monospace' }}>
                                {req.original_filename}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{ fontFamily: 'Consolas,monospace', fontSize: '12px', fontWeight: 600, color: '#5f5f5f' }}>
                            v{req.version_number}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div style={{ color: '#1a1a1a' }}>{req.requester_first_name} {req.requester_last_name}</div>
                          <div style={{ fontSize: '11px', color: '#8F8F8F', fontFamily: 'Consolas,monospace' }}>{req.requester_email}</div>
                        </td>
                        <td style={{ padding: '6px 10px', color: '#5f5f5f', whiteSpace: 'nowrap', fontSize: '11px' }}>
                          {formatRelative(req.created_at)}
                        </td>
                        <td style={{ padding: '6px 10px', maxWidth: '220px' }}>
                          {req.submission_note ? (
                            <span style={{ fontSize: '12px', color: '#1a1a1a' }} className="line-clamp-2 italic">
                              "{req.submission_note}"
                            </span>
                          ) : (
                            <span style={{ color: '#9E9E9E', fontSize: '11px' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <div className="flex items-center gap-1.5">
                            {/* Document Preview */}
                            <a
                              href={`${API_BASE_URL}/documents/${req.document_id}/view?token=${token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary"
                              title="Preview Document"
                              style={{ padding: '3px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </a>

                            {/* Approve Button */}
                            <button
                              onClick={() => openReviewModal(req, 'APPROVED')}
                              className="btn-primary"
                              title="Approve Document"
                              style={{ background: '#107C10', padding: '3px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>

                            {/* Reject Button */}
                            <button
                              onClick={() => openReviewModal(req, 'REJECTED')}
                              className="btn-danger"
                              title="Reject Document"
                              style={{ padding: '3px 8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. AUDIT TRAIL TAB ───────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filter card */}
          <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF' }}>
            <PanelHeader title="Filter" />
            <div style={{ padding: '10px 12px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label style={{ fontSize: '11px', color: '#5f5f5f', display: 'block', marginBottom: '3px', ...winFont }}>Action Type</label>
                  <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="input" style={{ fontSize: '12px' }}>
                    <option value="">All Actions</option>
                    {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#5f5f5f', display: 'block', marginBottom: '3px', ...winFont }}>User</label>
                  <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)} className="input" style={{ fontSize: '12px' }}>
                    <option value="">All Users</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#5f5f5f', display: 'block', marginBottom: '3px', ...winFont }}>From Date</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="input" style={{ fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#5f5f5f', display: 'block', marginBottom: '3px', ...winFont }}>To Date</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input" style={{ fontSize: '12px' }} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => fetchLogs(1)} className="btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }}>
                  Apply
                </button>
                <button
                  onClick={() => { setFilterAction(''); setFilterUserId(''); setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="btn-secondary"
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>
          </div>

          {logError && (
            <div style={{ padding: '6px 10px', background: '#FDE7E9', border: '1px solid #F4ACAF', color: '#C42B1C', fontSize: '12px', ...winFont }}>
              ⚠ {logError}
            </div>
          )}

          {/* Logs table */}
          <div style={{ border: '1px solid #D6D6D6', background: '#FFFFFF' }}>
            <PanelHeader
              title={`Audit Records${logPagination ? ` — ${logPagination.total.toLocaleString()} events` : ''}`}
              right={
                <button onClick={() => fetchLogs(logPage)} disabled={logLoading} className="btn-ghost" title="Refresh" style={{ padding: '2px 6px' }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${logLoading ? 'animate-spin' : ''}`} />
                </button>
              }
            />

            {logLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#5f5f5f', fontSize: '12px', ...winFont }}>
                Loading audit trail...
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9E9E9E', fontSize: '12px', ...winFont }}>
                No audit events match your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ fontSize: '12px', ...winFont }}>
                  <thead>
                    <tr style={{ background: '#F5F5F5', borderBottom: '1px solid #D6D6D6' }}>
                      {['ID', 'Action', 'User', 'Entity', 'Details', 'Timestamp'].map(h => (
                        <th key={h} style={{ padding: '4px 10px', color: '#5f5f5f', fontWeight: 400, borderRight: '1px solid #E8E8E8', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-[#E8E8E8] transition-colors" style={{ borderBottom: '1px solid #F0F0F0' }}>
                        <td style={{ padding: '4px 10px', color: '#9E9E9E', fontFamily: 'Consolas,monospace', fontSize: '11px' }}>
                          #{log.id}
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          <span className="flex items-center gap-1.5">
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACTION_DOT[log.action] || '#5f5f5f', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#1a1a1a' }}>{log.action}</span>
                          </span>
                        </td>
                        <td style={{ padding: '4px 10px' }}>
                          {log.first_name ? (
                            <div>
                              <div style={{ color: '#1a1a1a' }}>{log.first_name} {log.last_name}</div>
                              <div style={{ fontSize: '10px', color: '#9E9E9E', fontFamily: 'Consolas,monospace' }}>{log.email}</div>
                            </div>
                          ) : <span style={{ color: '#9E9E9E' }}>System</span>}
                        </td>
                        <td style={{ padding: '4px 10px', color: '#5f5f5f', fontFamily: 'Consolas,monospace', fontSize: '11px' }}>
                          {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                        </td>
                        <td style={{ padding: '4px 10px', maxWidth: '240px' }}>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div style={{ fontSize: '10px', color: '#5f5f5f', fontFamily: 'Consolas,monospace' }} className="truncate">
                              {Object.entries(log.details)
                                .filter(([, v]) => v !== null && v !== undefined && v !== '')
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '4px 10px', color: '#9E9E9E', whiteSpace: 'nowrap', fontSize: '11px' }}>
                          {formatRelative(log.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {logPagination && logPagination.totalPages > 1 && (
              <div
                className="flex items-center justify-between"
                style={{ padding: '6px 12px', borderTop: '1px solid #E8E8E8', background: '#F5F5F5', ...winFont, fontSize: '12px', color: '#5f5f5f' }}
              >
                <span>Page {logPagination.page} of {logPagination.totalPages}</span>
                <div className="flex gap-1">
                  <button
                    disabled={logPagination.page <= 1 || logLoading}
                    onClick={() => fetchLogs(logPagination.page - 1)}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '12px' }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={logPagination.page >= logPagination.totalPages || logLoading}
                    onClick={() => fetchLogs(logPagination.page + 1)}
                    className="btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '12px' }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── APPROVAL REVIEW MODAL ────────────────────────────────────────── */}
      {reviewModalRequest && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: '460px', ...winFont }}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                {reviewDecision === 'APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#107C10]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#C42B1C]" />
                )}
                <div>
                  <h3 className="modal-title">
                    {reviewDecision === 'APPROVED' ? 'Approve Document' : 'Reject Document'}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#5f5f5f', marginTop: '2px' }}>
                    {reviewModalRequest.document_title} (v{reviewModalRequest.version_number})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalRequest(null)}
                className="btn-ghost p-1"
                disabled={reviewSubmitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div className="modal-body space-y-3">
                <div style={{ background: '#F5F5F5', padding: '10px 12px', border: '1px solid #E8E8E8', borderRadius: '3px' }}>
                  <div style={{ fontSize: '11px', color: '#5f5f5f' }}>Submitted By</div>
                  <div style={{ fontWeight: 600, color: '#1a1a1a', marginTop: '1px' }}>
                    {reviewModalRequest.requester_first_name} {reviewModalRequest.requester_last_name}
                  </div>
                  {reviewModalRequest.submission_note && (
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#5f5f5f' }}>
                      <span style={{ fontWeight: 600 }}>Note: </span>
                      "{reviewModalRequest.submission_note}"
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a', display: 'block', marginBottom: '4px' }}>
                    {reviewDecision === 'APPROVED' ? 'Approval Note / Feedback (Optional)' : 'Rejection Reason (Required)'}
                  </label>
                  <textarea
                    rows={3}
                    required={reviewDecision === 'REJECTED'}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder={
                      reviewDecision === 'APPROVED'
                        ? 'e.g., Looks good to release for company-wide distribution.'
                        : 'Please explain what needs to be changed before re-submission...'
                    }
                    className="input w-full"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setReviewModalRequest(null)}
                  disabled={reviewSubmitting}
                  className="btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className={reviewDecision === 'APPROVED' ? 'btn-primary' : 'btn-danger'}
                  style={{
                    background: reviewDecision === 'APPROVED' ? '#107C10' : '#C42B1C',
                    color: 'white',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {reviewSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{reviewDecision === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
