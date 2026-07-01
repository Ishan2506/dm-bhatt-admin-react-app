import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

export function Exams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadExams = () => {
        setLoading(true);
        api.get('/exam/all', { noPrefix: true })
            .then(setExams)
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadExams();
    }, []);

    const handleDelete = async (id) => {
        try {
            await api.del(`/exam/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadExams();
            showToast('Exam deleted successfully!');
        } catch (err) {
            showToast(err.message, 'error');
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

    return (
        <div class="materials-page">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Reports /> Resources</div>
                    <h1>Exam History</h1>
                    <p class="page-subtitle">A complete audit trail of every exam created across the platform.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{exams.length.toLocaleString()}</span>
                            <span class="hm-label">Total Exams</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={loadExams}>
                        <Icons.Refresh /> Refresh
                    </button>
                </div>
            </div>

            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : exams.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Reports /></div>
                        <p>No exams found.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Exam</th>
                                <th>Standard</th>
                                <th>Medium</th>
                                <th>Board</th>
                                <th>Created By</th>
                                <th>Last Updated By</th>
                                <th>Created</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(item => {
                                const editor = item.updatedBy || item.createdBy;
                                return (
                                <tr key={item._id}>
                                    <td>
                                        <div class="identity-body">
                                            <div class="identity-name">{item.title}</div>
                                            <div class="identity-sub">{item.subject}</div>
                                        </div>
                                    </td>
                                    <td><span class="cell-chip">{item.std}</span></td>
                                    <td>{item.medium}</td>
                                    <td><span class="badge badge-info">{item.board}</span></td>
                                    <td>
                                        {item.createdBy ? (
                                            <div class="identity">
                                                <div class="avatar avatar-sm" style={{ background: 'var(--primary)' }}>
                                                    {(item.createdBy.firstName || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div class="identity-body">
                                                    <div class="identity-name">{item.createdBy.firstName}</div>
                                                    {item.createdBy.email && <div class="identity-sub">{item.createdBy.email}</div>}
                                                </div>
                                            </div>
                                        ) : <span class="cell-chip">System</span>}
                                    </td>
                                    <td>
                                        {editor ? (
                                            <div class="identity-body">
                                                <div class="identity-name">{editor.firstName}</div>
                                                {editor.email && <div class="identity-sub">{editor.email}</div>}
                                            </div>
                                        ) : <span class="cell-chip">System</span>}
                                    </td>
                                    <td style="font-size: var(--font-xs);">{formatDateTime(item.createdAt)}</td>
                                    <td>
                                        <div class="td-actions" style="justify-content:flex-end;">
                                            <button class="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(item)}>
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Delete Exam</h3>
                            <button class="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
                            <p style="color: var(--text-danger); font-size: 0.875rem; margin-top: 0.5rem;">This will also delete all associated questions.</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div class="toast-container">
                    <div class={`toast toast-${toast.type || 'success'}`}>
                        {toast.type === 'error' ? <Icons.Error /> : toast.type === 'info' ? <Icons.Info /> : <Icons.Success />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
