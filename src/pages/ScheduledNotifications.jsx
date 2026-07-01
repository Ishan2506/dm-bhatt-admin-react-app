import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

export function ScheduledNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadNotifications = (page = 1) => {
        setLoading(true);
        const skip = (page - 1) * pageSize;
        const statusFilter = filterStatus !== 'all' ? `&status=${filterStatus}` : '';

        api.get(`/scheduled-notifications?skip=${skip}&limit=${pageSize}${statusFilter}`)
            .then(response => {
                setNotifications(response.data || response);
                setTotalCount(response.total || response.length);
                setCurrentPage(page);
            })
            .catch(err => {
                showToast('Failed to load scheduled notifications', 'error');
                console.error(err);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadNotifications(1);
    }, [filterStatus]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this scheduled notification?')) return;
        try {
            await api.del(`/scheduled-notifications/${id}`);
            showToast('Notification deleted successfully!', 'success');
            loadNotifications(currentPage);
        } catch (err) {
            showToast('Failed to delete notification', 'error');
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        // Use Asia/Kolkata timezone to display IST time correctly
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'background: #ffc107; color: #000;',
            sent: 'background: #28a745; color: #fff;',
            failed: 'background: #dc3545; color: #fff;'
        };
        return <span style={`${styles[status] || styles.pending} padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600;`}>{status}</span>;
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div class="materials-page">
            {toast && (
                <div class="toast-container">
                    <div class={`toast toast-${toast.type || 'info'}`}>
                        {toast.type === 'error' ? <Icons.Error /> : toast.type === 'success' ? <Icons.Success /> : <Icons.Info />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Clock /> Notifications</div>
                    <h1>Scheduled Notifications</h1>
                    <p class="page-subtitle">View and manage every scheduled push notification.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{totalCount.toLocaleString()}</span>
                            <span class="hm-label">Total</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={() => loadNotifications(currentPage)} disabled={loading}>
                        <Icons.Refresh /> {loading ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%;">
                        <div class="toolbar-group">
                            <div class="segmented">
                                {['all', 'pending', 'sent', 'failed'].map(s => (
                                    <button
                                        key={s}
                                        class={filterStatus === s ? 'active' : ''}
                                        onClick={() => setFilterStatus(s)}
                                    >
                                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {loading && !notifications.length ? (
                    <div class="loading-spinner" />
                ) : notifications.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Clock /></div>
                        <h3>No scheduled notifications</h3>
                        <p>Schedule notifications from the Notification Settings page.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Notification</th>
                                    <th>Target</th>
                                    <th>Scheduled For</th>
                                    <th>Status</th>
                                    <th>Sent At</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notifications.map(notif => (
                                    <tr key={notif._id}>
                                        <td style="max-width:320px;">
                                            <div class="identity-body">
                                                <div class="identity-name">{notif.title}</div>
                                                <div class="identity-sub" style="max-width:300px;">{notif.body}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="cell-chip">{notif.std === 'all' ? 'All Students' : `Std ${notif.std}`}</span>
                                        </td>
                                        <td style="font-size:var(--font-xs);">{formatDateTime(notif.scheduledTime)}</td>
                                        <td>{getStatusBadge(notif.status)}</td>
                                        <td style="font-size:var(--font-xs);color:var(--text-muted);">{notif.sentAt ? formatDateTime(notif.sentAt) : '—'}</td>
                                        <td>
                                            <div class="td-actions" style="justify-content:flex-end;">
                                                {notif.status === 'pending' && (
                                                    <button class="icon-btn danger" title="Delete" onClick={() => handleDelete(notif._id)}>
                                                        <Icons.Trash />
                                                    </button>
                                                )}
                                                {notif.status === 'failed' && (
                                                    <span title={notif.error} class="badge badge-danger" style="cursor:help;">Error</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div class="pagination" style="margin-top: 1rem; border-top: none;">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div class="pagination-controls">
                        <button onClick={() => loadNotifications(currentPage - 1)} disabled={currentPage === 1 || loading}>
                            <Icons.ChevronLeft />
                        </button>
                        <button onClick={() => loadNotifications(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                            <Icons.ChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
