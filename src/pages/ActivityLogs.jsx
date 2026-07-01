import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

export function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

    const load = async (page = 1) => {
        setLoading(true);
        try {
            const skip = (page - 1) * pageSize;
            const data = await api.get(`/logs?skip=${skip}&limit=${pageSize}`);
            setLogs(data.data || data);
            setTotalCount(data.total || data.length);
            setCurrentPage(page);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
    }, []);

    const totalPages = Math.ceil(totalCount / pageSize);

    const actionBadge = (action) => {
        switch (action) {
            case 'Added': return 'badge-success';
            case 'Updated': return 'badge-info';
            case 'Deleted': return 'badge-danger';
            default: return 'badge-neutral';
        }
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://103.212.121.139:5000/${path}`;
    };

    return (
        <div>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Activity /> Reports</div>
                    <h1>Activity Logs</h1>
                    <p class="page-subtitle">A chronological audit trail of every change made across the platform.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{totalCount.toLocaleString()}</span>
                            <span class="hm-label">Total Events</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={() => load(currentPage)}>
                        <Icons.Refresh /> Refresh
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%;">
                        <div class="toolbar-group">
                            <h3 style="font-size:var(--font-md);font-weight:600;">Recent Activity</h3>
                        </div>
                        <div class="toolbar-group">
                            <select
                                class="form-control"
                                value={pageSize}
                                onChange={(e) => {
                                    const newPageSize = parseInt(e.target.value);
                                    setPageSize(newPageSize);
                                    setCurrentPage(1);
                                    api.get(`/logs?skip=0&limit=${newPageSize}`)
                                        .then(res => {
                                            setLogs(res.data || res);
                                            setTotalCount(res.total || res.length);
                                        })
                                        .catch(err => console.error('Failed to fetch logs:', err));
                                }}
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div class="loading-spinner" />
                ) : logs.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Activity /></div>
                        <h3>No activity yet</h3>
                        <p>Changes made across the admin panel will appear here.</p>
                    </div>
                ) : (
                    <>
                        <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Performed By</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th>Target</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const img = getAvatarUrl(log.performedByImg);
                                    return (
                                        <tr key={log._id}>
                                            <td>
                                                <div class="identity">
                                                    {img ? (
                                                        <img src={img} alt={log.performedBy}
                                                            style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-full)', objectFit: 'cover', flexShrink: 0 }}
                                                            onError={(e) => { e.target.outerHTML = '<div class="avatar avatar-sm" style="background:var(--text-muted)">' + (log.performedBy || '?').charAt(0).toUpperCase() + '</div>'; }}
                                                        />
                                                    ) : (
                                                        <div class="avatar avatar-sm" style={{ background: 'var(--text-secondary)' }}>
                                                            {log.performedBy === 'Admin App' ? <Icons.Activity /> : (log.performedBy || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div class="identity-name">{log.performedBy}</div>
                                                </div>
                                            </td>
                                            <td><span class={`badge ${actionBadge(log.action)}`}>{log.action}</span></td>
                                            <td class="text-muted">{log.entityType}</td>
                                            <td style="font-weight:600;color:var(--text-primary);">{log.targetName}</td>
                                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                                                {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                        {totalPages > 1 && (
                        <div class="pagination">
                            <span>Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount.toLocaleString()}</span>
                            <div class="pagination-controls">
                                <button onClick={() => load(currentPage - 1)} disabled={currentPage === 1}><Icons.ChevronLeft /></button>
                                {Array.from({ length: totalPages }, (_, i) => {
                                    const pageNum = i + 1;
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <button key={pageNum} class={pageNum === currentPage ? 'active' : ''} onClick={() => load(pageNum)}>
                                                {pageNum}
                                            </button>
                                        );
                                    } else if ((pageNum === 2 && currentPage > 3) || (pageNum === totalPages - 1 && currentPage < totalPages - 2)) {
                                        return <span key={pageNum}>…</span>;
                                    }
                                    return null;
                                })}
                                <button onClick={() => load(currentPage + 1)} disabled={currentPage === totalPages}><Icons.ChevronRight /></button>
                            </div>
                        </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
