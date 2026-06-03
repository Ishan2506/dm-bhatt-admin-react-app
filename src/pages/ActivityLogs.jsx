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

    const getActionColor = (action) => {
        switch (action) {
            case 'Added': return '#22c55e'; // Green
            case 'Updated': return '#3b82f6'; // Blue
            case 'Deleted': return '#ef4444'; // Red
            default: return 'var(--text-secondary)';
        }
    };

    const getActionBg = (action) => {
        switch (action) {
            case 'Added': return '#dcfce7'; 
            case 'Updated': return '#dbeafe'; 
            case 'Deleted': return '#fee2e2'; 
            default: return 'var(--bg-secondary)';
        }
    };

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Activity /> Activity Logs</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                const newPageSize = parseInt(e.target.value);
                                setPageSize(newPageSize);
                                setCurrentPage(1);
                                const skip = 0;
                                api.get(`/logs?skip=${skip}&limit=${newPageSize}`)
                                    .then(res => {
                                        setLogs(res.data || res);
                                        setTotalCount(res.total || res.length);
                                    })
                                    .catch(err => console.error('Failed to fetch logs:', err));
                            }}
                            style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                        >
                            <option value={10}>10 per page</option>
                            <option value={25} selected>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                        </select>
                        <button class="btn btn-outline btn-sm" onClick={() => load(currentPage)}>
                            Refresh Logs
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading activity logs...</div>
                ) : logs.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Activity /></div>
                        <p>No activity logs found.</p>
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Performed By</th>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th>Target Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => {
                                    const getAvatarUrl = (path) => {
                                        if (!path) return null;
                                        if (path.startsWith('http')) return path;
                                        const serverBase = 'http://103.212.121.139:5000';
                                        return `${serverBase}/${path}`;
                                    };

                                    return (
                                        <tr key={log._id}>
                                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {log.performedByImg ? (
                                                        <img
                                                            src={getAvatarUrl(log.performedByImg)}
                                                            alt={log.performedBy}
                                                            style={{
                                                                width: '28px',
                                                                height: '28px',
                                                                borderRadius: '50%',
                                                                objectFit: 'cover',
                                                                border: '1px solid var(--border-color)',
                                                                backgroundColor: 'var(--bg-secondary)'
                                                            }}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    {!log.performedByImg || (log.performedByImg && <div style={{
                                                        display: 'none',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--bg-secondary)',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        color: 'var(--text-secondary)',
                                                        border: '1px solid var(--border-color)',
                                                        flexShrink: 0
                                                    }}>
                                                        {log.performedBy === 'Admin App' ? <Icons.Activity size={14} /> : log.performedBy.charAt(0)}
                                                    </div>)}
                                                    {(!log.performedByImg) && (
                                                        <div style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)',
                                                            border: '1px solid var(--border-color)',
                                                            flexShrink: 0
                                                        }}>
                                                            {log.performedBy === 'Admin App' ? <Icons.Activity size={14} /> : log.performedBy.charAt(0)}
                                                        </div>
                                                    )}
                                                    <span>{log.performedBy}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    backgroundColor: getActionBg(log.action),
                                                    color: getActionColor(log.action)
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{log.entityType}</td>
                                            <td style={{ fontWeight: 600 }}>{log.targetName}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div style="display: flex; align-items: center; justify-content: space-between; padding: '1rem'; border-top: 1px solid var(--border); margin-top: 1.5rem; gap: 1rem;">
                            <span style="font-size: var(--font-sm); color: var(--text-secondary);">
                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} logs
                            </span>
                            <div style="display: flex; gap: 0.5rem;">
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => load(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    ← Previous
                                </button>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => load(pageNum)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: pageNum === currentPage ? 'none' : '1px solid var(--border)',
                                                        background: pageNum === currentPage ? 'var(--accent)' : 'transparent',
                                                        color: pageNum === currentPage ? 'white' : 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        fontSize: 'var(--font-sm)',
                                                        fontWeight: pageNum === currentPage ? '600' : 'normal'
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            (pageNum === 2 && currentPage > 3) ||
                                            (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                        ) {
                                            return <span key={pageNum}>...</span>;
                                        }
                                        return null;
                                    })}
                                </div>
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => load(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
