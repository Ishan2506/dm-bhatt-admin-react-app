import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

export function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await api.get('/logs');
            setLogs(data || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

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
                        <button class="btn btn-outline btn-sm" onClick={load}>
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
                )}
            </div>
        </div>
    );
}
