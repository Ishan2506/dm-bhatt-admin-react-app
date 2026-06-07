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
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
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

            <div class="table-header" style="margin-bottom: 1.5rem;">
                <div>
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 0.75rem;">
                        <Icons.Clock /> Scheduled Notifications
                    </h2>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        View and manage all scheduled push notifications
                    </p>
                </div>
                <button class="btn btn-outline btn-sm" onClick={() => loadNotifications(currentPage)} disabled={loading}>
                    {loading ? <div class="loading-spinner-xs" /> : <Icons.Refresh />} {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div style="margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: center;">
                <label style="font-weight: 600; font-size: 0.9rem;">Filter by Status:</label>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-input); color: var(--text-primary);"
                >
                    <option value="all">All Notifications</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {loading && !notifications.length ? (
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading scheduled notifications...</p>
                </div>
            ) : notifications.length === 0 ? (
                <div class="empty-state">
                    <div class="empty-icon"><Icons.Clock /></div>
                    <p>No scheduled notifications found</p>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
                        Schedule notifications from the Notification Configuration page
                    </p>
                </div>
            ) : (
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Message</th>
                                <th>Target</th>
                                <th>Scheduled For</th>
                                <th>Status</th>
                                <th>Sent At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map(notif => (
                                <tr key={notif._id}>
                                    <td class="font-bold" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                        {notif.title}
                                    </td>
                                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary);">
                                        {notif.body}
                                    </td>
                                    <td>
                                        <span style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">
                                            {notif.std === 'all' ? 'All Students' : `Std ${notif.std}`}
                                        </span>
                                    </td>
                                    <td class="font-mono text-xs">
                                        {formatDateTime(notif.scheduledTime)}
                                    </td>
                                    <td>
                                        {getStatusBadge(notif.status)}
                                    </td>
                                    <td class="font-mono text-xs">
                                        {notif.sentAt ? formatDateTime(notif.sentAt) : '—'}
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            {notif.status === 'pending' && (
                                                <button
                                                    class="btn btn-icon btn-outline btn-danger btn-sm"
                                                    title="Delete"
                                                    onClick={() => handleDelete(notif._id)}
                                                >
                                                    <Icons.Trash />
                                                </button>
                                            )}
                                            {notif.status === 'failed' && (
                                                <span title={notif.error} style="color: #dc3545; font-size: 0.75rem; cursor: help;">
                                                    Error
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div class="pagination" style="margin-top: 1.5rem;">
                    <button
                        class="btn btn-outline btn-sm"
                        onClick={() => loadNotifications(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                    >
                        Previous
                    </button>
                    <span style="padding: 0.5rem 1rem;">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        class="btn btn-outline btn-sm"
                        onClick={() => loadNotifications(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
