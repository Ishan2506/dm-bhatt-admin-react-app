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
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Reports /> Exam Management History</h3>
                    <button class="btn btn-outline btn-sm" onClick={loadExams}>
                        <Icons.Refresh /> Refresh
                    </button>
                </div>
                {loading ? (
                    <div style="padding: 2rem; text-align: center;"><div class="loading-spinner" /></div>
                ) : exams.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Reports /></div>
                        <p>No exams found.</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Std</th>
                                <th>Medium</th>
                                <th>Board</th>
                                <th>Created By</th>
                                <th>Updated By</th>
                                <th>Created Time</th>
                                <th>Updated Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(item => (
                                <tr key={item._id}>
                                    <td style="font-weight: 600;">{item.title}</td>
                                    <td>{item.subject}</td>
                                    <td>{item.std}</td>
                                    <td>{item.medium}</td>
                                    <td><span class="badge badge-info">{item.board}</span></td>
                                    <td>
                                        {item.createdBy ? (
                                            <div style={{ lineHeight: '1.2' }}>
                                                {item.createdBy.firstName}<br />
                                                {item.createdBy.email && <small style={{ color: 'var(--text-secondary)' }}>{item.createdBy.email}<br /></small>}
                                                {item.createdBy.phoneNum && <small style={{ color: 'var(--text-secondary)' }}>{item.createdBy.phoneNum}</small>}
                                            </div>
                                        ) : 'System'}
                                    </td>
                                    <td>
                                        {item.updatedBy ? (
                                            <div style={{ lineHeight: '1.2' }}>
                                                {item.updatedBy.firstName}<br />
                                                {item.updatedBy.email && <small style={{ color: 'var(--text-secondary)' }}>{item.updatedBy.email}<br /></small>}
                                                {item.updatedBy.phoneNum && <small style={{ color: 'var(--text-secondary)' }}>{item.updatedBy.phoneNum}</small>}
                                            </div>
                                        ) : (item.createdBy ? (
                                            <div style={{ lineHeight: '1.2' }}>
                                                {item.createdBy.firstName}<br />
                                                {item.createdBy.email && <small style={{ color: 'var(--text-secondary)' }}>{item.createdBy.email}<br /></small>}
                                                {item.createdBy.phoneNum && <small style={{ color: 'var(--text-secondary)' }}>{item.createdBy.phoneNum}</small>}
                                            </div>
                                        ) : 'System')}
                                    </td>
                                    <td style="font-size: var(--font-xs); color: var(--text-secondary);">{formatDateTime(item.createdAt)}</td>
                                    <td style="font-size: var(--font-xs); color: var(--text-secondary);">{formatDateTime(item.updatedAt || item.createdAt)}</td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
