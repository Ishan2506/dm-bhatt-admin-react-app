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
    const [standards, setStandards] = useState([]);
    const [pageSize, setPageSize] = useState(25);
    const [search, setSearch] = useState('');

    // Deterministic avatar color from a name (pure UI helper).
    const avatarColors = ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#dc2626', '#0ea5e9', '#db2777'];
    const avatarColor = (name = '') => {
        let h = 0;
        for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
        return avatarColors[Math.abs(h) % avatarColors.length];
    };
    const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

    const load = (page = 1) => {
        setLoading(true);
        api.get(`/students?page=${page}&limit=${pageSize}`)
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

    useEffect(() => { 
        load(); 
        api.get('/standards').then(setStandards).catch(console.error);
    }, []);

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
                const res = await api.post(`/students`, form);
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

    const visibleStudents = search.trim()
        ? data.students.filter(s => {
            const q = search.trim().toLowerCase();
            return [s.firstName, s.email, s.phoneNum, s.std, s.medium]
                .some(v => (v || '').toString().toLowerCase().includes(q));
        })
        : data.students;

    return (
        <div>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.User /> Users</div>
                    <h1>Students</h1>
                    <p class="page-subtitle">Manage enrolled learners, their standards, and reward points.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{data.total.toLocaleString()}</span>
                            <span class="hm-label">Total Students</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{standards.length}</span>
                            <span class="hm-label">Standards</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-outline" onClick={handleExport} disabled={exporting}>
                        {exporting ? 'Exporting…' : <Fragment><Icons.Download /> Export CSV</Fragment>}
                    </button>
                    <button class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Add Student
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%;">
                        <div class="toolbar-group">
                            <div class="field-search">
                                <Icons.Eye />
                                <input
                                    class="form-control"
                                    placeholder="Search name, email, phone…"
                                    value={search}
                                    onInput={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div class="toolbar-group">
                            <select
                                class="form-control"
                                value={pageSize}
                                onChange={(e) => { setPageSize(parseInt(e.target.value)); load(1); }}
                            >
                                <option value={10}>10 per page</option>
                                <option value={25}>25 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div class="loading-spinner" />
                ) : data.students.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.User /></div>
                        <p>No students found. Add your first student to get started.</p>
                    </div>
                ) : (
                    <Fragment>
                        <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Phone</th>
                                    <th>Standard</th>
                                    <th>Medium</th>
                                    <th>Points</th>
                                    <th>Joined</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleStudents.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <div class="identity">
                                                <div class="avatar" style={{ background: avatarColor(student.firstName || '') }}>
                                                    {initials(student.firstName || '')}
                                                </div>
                                                <div class="identity-body">
                                                    <div class="identity-name">{student.firstName || 'Unnamed'}</div>
                                                    <div class="identity-sub">{student.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{student.phoneNum || '—'}</td>
                                        <td>
                                            <span class="cell-chip">
                                                {student.std || '—'}{student.stream ? ` · ${student.stream}` : ''}
                                            </span>
                                        </td>
                                        <td>{student.medium || '—'}</td>
                                        <td style="font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums;">
                                            {student.totalRewardPoints || 0}
                                        </td>
                                        <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                        <td>
                                            <div class="td-actions" style="justify-content:flex-end;">
                                                <button class="icon-btn primary" title="Edit" onClick={() => openEdit(student)}>
                                                    <Icons.Edit />
                                                </button>
                                                <button class="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(student)}>
                                                    <Icons.Trash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {visibleStudents.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style="text-align:center;color:var(--text-muted);padding:2.5rem;">
                                            No students match “{search}”.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        </div>

                        {data.totalPages > 1 && (
                            <div class="pagination">
                                <span>
                                    Showing {((data.page - 1) * pageSize) + 1}–{Math.min(data.page * pageSize, data.total)} of {data.total.toLocaleString()}
                                </span>
                                <div class="pagination-controls">
                                    <button
                                        onClick={() => load(data.page - 1)}
                                        disabled={data.page === 1}
                                    >
                                        <Icons.ChevronLeft />
                                    </button>
                                    {Array.from({ length: data.totalPages }, (_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === data.totalPages ||
                                            (pageNum >= data.page - 1 && pageNum <= data.page + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    class={pageNum === data.page ? 'active' : ''}
                                                    onClick={() => load(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            (pageNum === 2 && data.page > 3) ||
                                            (pageNum === data.totalPages - 1 && data.page < data.totalPages - 2)
                                        ) {
                                            return <span key={pageNum}>…</span>;
                                        }
                                        return null;
                                    })}
                                    <button
                                        onClick={() => load(data.page + 1)}
                                        disabled={data.page === data.totalPages}
                                    >
                                        <Icons.ChevronRight />
                                    </button>
                                </div>
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
                            <select class="form-control" value={form.std} onChange={(e) => setForm({ ...form, std: e.target.value, stream: '' })}>
                                <option value="">Select Standard</option>
                                {standards.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Medium</label>
                            <select class="form-control" value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}>
                                <option value="">Select Medium</option>
                                <option value="Gujarati">Gujarati</option>
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                            </select>
                        </div>
                        {['11', '12'].some(val => form.std.includes(val)) && (
                            <div class="form-group">
                                <label>Stream</label>
                                <select class="form-control" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                                    <option value="">Select Stream</option>
                                    <option value="Science">Science</option>
                                    <option value="Commerce">Commerce</option>
                                </select>
                            </div>
                        )}
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
