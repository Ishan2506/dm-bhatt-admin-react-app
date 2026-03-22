import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';

export function Students() {
    const [data, setData] = useState({ students: [], total: 0, page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ firstName: '', email: '', phoneNum: '', std: '', medium: '', stream: '', totalRewardPoints: 0 });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [exporting, setExporting] = useState(false);

    const load = (page = 1) => {
        setLoading(true);
        api.get(`/students?page=${page}&limit=50`)
            .then(res => {
                if (Array.isArray(res)) {
                    setData({ students: res, total: res.length, page: 1, totalPages: 1 });
                } else if (res && res.students) {
                    setData(res);
                } else {
                    setData({ students: [], total: 0, page: 1, totalPages: 1 });
                }
            })
            .catch(err => console.error('Failed to fetch students:', err))
            .finally(() => setLoading(false));
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await api.get('/students/export');
            const blob = new Blob([res.csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Padhaku_Students_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to export data: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => { load(); }, []);

    const emptyForm = { firstName: '', email: '', phoneNum: '', std: '', medium: '', stream: '', totalRewardPoints: 0, password: '' };

    const openAdd = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (student) => {
        setEditing(student);
        setForm({
            firstName: student.firstName || '',
            email: student.email || '',
            phoneNum: student.phoneNum || '',
            std: student.std || '',
            medium: student.medium || '',
            stream: student.stream || '',
            totalRewardPoints: student.totalRewardPoints || 0,
            password: ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.firstName.trim() || !form.phoneNum.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/students/${editing._id}`, form);
            } else {
                const res = await api.post('/students', form);
                if (res.defaultPin) {
                    alert(`Student created! Default login PIN: ${res.defaultPin}`);
                }
            }
            setShowModal(false);
            load(data.page);
        } catch (err) {
            alert(err.message || 'Failed to save student');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/students/${id}`);
            setDeleteConfirm(null);
            load(data.page);
        } catch (err) {
            alert(err.message || 'Failed to delete student');
        }
    };

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.User /> All Students</h3>
                    <div class="table-filters" style="display: flex; gap: 1rem; align-items: center;">
                        <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">
                            Total: {data.total}
                        </span>
                        <button class="btn btn-outline btn-sm" onClick={handleExport} disabled={exporting}>
                            {exporting ? 'Exporting...' : <Fragment><Icons.Download /> Export CSV</Fragment>}
                        </button>
                        <button class="btn btn-primary btn-sm" onClick={openAdd}>
                            <Icons.Plus /> Add Student
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div style="padding: 2rem; text-align: center;">Loading students...</div>
                ) : data.students.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.User /></div>
                        <p>No students found.</p>
                    </div>
                ) : (
                    <Fragment>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Standard</th>
                                    <th>Medium</th>
                                    <th>Points</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.students.map((student) => (
                                    <tr key={student._id}>
                                        <td style="font-weight: 600;">{student.firstName || ''}</td>
                                        <td>{student.email || '-'}</td>
                                        <td>{student.phoneNum || '-'}</td>
                                        <td>{student.std || '-'} {student.stream ? `(${student.stream})` : ''}</td>
                                        <td>{student.medium || '-'}</td>
                                        <td>{student.totalRewardPoints || 0}</td>
                                        <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <div class="td-actions">
                                                <button class="btn btn-outline btn-sm" onClick={() => openEdit(student)}>
                                                    <Icons.Edit /> Edit
                                                </button>
                                                <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(student)}>
                                                    <Icons.Trash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {data.totalPages > 1 && (
                            <div class="pagination" style="padding: 1rem; border-top: 1px solid var(--border); display: flex; justify-content: center; gap: 1rem; align-items: center;">
                                <button 
                                    class="btn btn-outline btn-sm"
                                    disabled={data.page === 1}
                                    onClick={() => load(data.page - 1)}
                                >
                                    Previous
                                </button>
                                <span style="font-size: 0.85rem; color: var(--text-secondary);">
                                    Page {data.page} of {data.totalPages}
                                </span>
                                <button 
                                    class="btn btn-outline btn-sm"
                                    disabled={data.page === data.totalPages}
                                    onClick={() => load(data.page + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </Fragment>
                )}
            </div>

            {showModal && (
                <Modal
                    title={editing ? 'Edit Student' : 'Add Student'}
                    onClose={() => setShowModal(false)}
                    footer={
                        <Fragment>
                            <button class="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : editing ? 'Update' : 'Add Student'}
                            </button>
                        </Fragment>
                    }
                >
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Name</label>
                            <input class="form-control" value={form.firstName} onInput={(e) => setForm({ ...form, firstName: e.target.value })} />
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input class="form-control" type="email" value={form.email} onInput={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div class="form-group">
                            <label>Phone Number</label>
                            <input class="form-control" value={form.phoneNum} onInput={(e) => setForm({ ...form, phoneNum: e.target.value })} />
                        </div>
                        <div class="form-group">
                            <label>Standard</label>
                            <input class="form-control" value={form.std} onInput={(e) => setForm({ ...form, std: e.target.value })} />
                        </div>
                        <div class="form-group">
                            <label>Medium</label>
                            <input class="form-control" value={form.medium} onInput={(e) => setForm({ ...form, medium: e.target.value })} />
                        </div>
                        <div class="form-group">
                            <label>Stream</label>
                            <input class="form-control" value={form.stream} onInput={(e) => setForm({ ...form, stream: e.target.value })} />
                        </div>
                        <div class="form-group">
                            <label>Reward Points</label>
                            <input class="form-control" type="number" value={form.totalRewardPoints} onInput={(e) => setForm({ ...form, totalRewardPoints: parseInt(e.target.value) || 0 })} />
                        </div>
                        {!editing && (
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Password / PIN <span style="font-weight:400;color:var(--text-muted);">(optional — defaults to last 4 digits of phone)</span></label>
                                <input class="form-control" type="text" placeholder="Leave blank for default" value={form.password} onInput={(e) => setForm({ ...form, password: e.target.value })} />
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Student"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <Fragment>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </Fragment>
                    }
                >
                    <p class="confirm-message">
                        Are you sure you want to delete the student <strong>"{deleteConfirm.firstName}"</strong>?<br />
                        This action cannot be undone and will remove their login access.
                    </p>
                </Modal>
            )}
        </div>
    );
}
