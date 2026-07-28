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
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'deleted'
    const [deletedStudents, setDeletedStudents] = useState([]);
    const [loadingDeleted, setLoadingDeleted] = useState(false);
    const [restoring, setRestoring] = useState(null); // id being restored
    const [refundModal, setRefundModal] = useState(null); // { student, payments, upgrades }
    const [deviceModal, setDeviceModal] = useState(null); // { student, sessions, loading }
    const [revoking, setRevoking] = useState(false);
    const [refunding, setRefunding] = useState(false);

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

    const loadDeleted = () => {
        setLoadingDeleted(true);
        api.get('/students/deleted')
            .then(res => setDeletedStudents(Array.isArray(res) ? res : []))
            .catch(err => console.error('Failed to fetch deleted students:', err))
            .finally(() => setLoadingDeleted(false));
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
        // Pre-load deleted count for the badge
        api.get('/students/deleted')
            .then(res => setDeletedStudents(Array.isArray(res) ? res : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (activeTab === 'deleted') loadDeleted();
    }, [activeTab]);

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

    const handleRestore = async (student) => {
        if (!confirm(`Restore account for "${student.firstName}" (${student.phoneNum})?\n\nThey will be able to log in again immediately.`)) return;
        setRestoring(student._id);
        try {
            await api.put(`/students/${student._id}/restore`);
            alert(`✅ Account restored! ${student.firstName} can now log in again.`);
            loadDeleted();
            load(data.page);
        } catch (err) {
            alert('Failed to restore account: ' + (err.message || 'Unknown error'));
        } finally {
            setRestoring(null);
        }
    };

    const openDeviceModal = async (student) => {
        setDeviceModal({ student, sessions: [], loading: true });
        try {
            const data = await api.get(`/students/${student._id}/sessions`);
            setDeviceModal({ student, sessions: data.sessions || [], loading: false });
        } catch (err) {
            setDeviceModal(null);
            alert('Failed to load devices: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRevokeDevices = async (sessionId) => {
        if (!deviceModal) return;
        const msg = sessionId
            ? 'Log this student out of this device?'
            : `Log ${deviceModal.student.firstName} out of ALL devices? They will need to sign in again.`;
        if (!confirm(msg)) return;

        setRevoking(true);
        try {
            const query = sessionId ? `?sessionId=${sessionId}` : '';
            await api.del(`/students/${deviceModal.student._id}/sessions${query}`);
            // Refresh the list so the admin sees the freed-up slots
            const data = await api.get(`/students/${deviceModal.student._id}/sessions`);
            setDeviceModal({ ...deviceModal, sessions: data.sessions || [], loading: false });
        } catch (err) {
            alert('Failed to log out device: ' + (err.message || 'Unknown error'));
        } finally {
            setRevoking(false);
        }
    };

    const openRefundModal = async (student) => {
        try {
            const data = await api.get(`/students/${student._id}/payments`);
            setRefundModal({ student, payments: data.payments || [], upgrades: data.upgrades || [] });
        } catch (err) {
            alert('Failed to load payment details: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRefund = async (paymentId, source) => {
        if (!refundModal) return;
        if (!confirm(`Mark this ₹${source === 'payment'
            ? refundModal.payments.find(p => p._id === paymentId)?.amount
            : refundModal.upgrades.find(u => u._id === paymentId)?.amount} payment as refunded?`)) return;
        setRefunding(true);
        try {
            const result = await api.put(`/students/${refundModal.student._id}/refund`, { paymentId, source });
            alert(`✅ Refund recorded. Student is now ${result.isPaid ? 'still Paid' : 'marked Unpaid'}.`);
            setRefundModal(null);
            load(data.page);
        } catch (err) {
            alert('Refund failed: ' + (err.message || 'Unknown error'));
        } finally {
            setRefunding(false);
        }
    };

    const visibleStudents = search.trim()
        ? data.students.filter(s => {
            const q = search.trim().toLowerCase();
            return [s.firstName, s.email, s.phoneNum, s.std, s.medium]
                .some(v => (v || '').toString().toLowerCase().includes(q));
        })
        : data.students;

    const filteredDeleted = search.trim()
        ? deletedStudents.filter(s => {
            const q = search.trim().toLowerCase();
            return [s.firstName, s.email, s.phoneNum, s.std, s.medium]
                .some(v => (v || '').toString().toLowerCase().includes(q));
        })
        : deletedStudents;

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
                        {deletedStudents.length > 0 && (
                            <div class="header-metric">
                                <span class="hm-value" style={{ color: '#ef4444' }}>{deletedStudents.length}</span>
                                <span class="hm-label">Deleted</span>
                            </div>
                        )}
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

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0' }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        padding: '0.5rem 1.25rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'active' ? '700' : '400',
                        color: activeTab === 'active' ? 'var(--accent)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'active' ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontSize: '0.95rem'
                    }}
                >
                    Active Students
                </button>
                <button
                    onClick={() => setActiveTab('deleted')}
                    style={{
                        padding: '0.5rem 1.25rem',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'deleted' ? '700' : '400',
                        color: activeTab === 'deleted' ? '#ef4444' : 'var(--text-muted)',
                        borderBottom: activeTab === 'deleted' ? '2px solid #ef4444' : '2px solid transparent',
                        marginBottom: '-2px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                    }}
                >
                    🗑 Deleted / Self-Removed
                    {deletedStudents.length > 0 && (
                        <span style={{ background: '#ef4444', color: '#fff', borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.5rem', fontWeight: '700' }}>
                            {deletedStudents.length}
                        </span>
                    )}
                </button>
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
                        {activeTab === 'active' && (
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
                        )}
                    </div>
                </div>

                {/* ── ACTIVE STUDENTS TAB ── */}
                {activeTab === 'active' && (
                    loading ? (
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
                                        <th style="width:170px;max-width:170px;">Student</th>
                                        <th>Phone</th>
                                        <th>Standard</th>
                                        <th>Medium</th>
                                        <th style="width:70px;">Points</th>
                                        <th>Status</th>
                                        <th>Amount</th>
                                        <th>Referral/Redeem</th>
                                        <th>Joined</th>
                                        <th style="text-align:right;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleStudents.map((student) => (
                                        <tr key={student._id}>
                                            <td style="max-width:170px;">
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
                                            <td>
                                                {student.isPaid ? (
                                                    <span class="cell-chip" style={{ backgroundColor: '#def7ec', color: '#03543f', fontWeight: 'bold' }}>Paid</span>
                                                ) : (
                                                    <span class="cell-chip" style={{ backgroundColor: '#fde8e8', color: '#9b1c1c', fontWeight: 'bold' }}>Unpaid</span>
                                                )}
                                            </td>
                                            <td style="font-weight:600;color:var(--text-primary);font-variant-numeric:tabular-nums;">
                                                {student.isPaid ? `₹${student.paidAmount || 0}` : '—'}
                                            </td>
                                            <td>
                                                {(() => {
                                                    if (student.referrerCode) {
                                                        return (
                                                            <div style={{ fontSize: '0.85rem' }}>
                                                                <strong>{student.referrerCode}</strong>
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Referred by {student.referrerName || 'User'}</div>
                                                            </div>
                                                        );
                                                    } else if (student.redeemCode) {
                                                        return (
                                                            <div style={{ fontSize: '0.85rem' }}>
                                                                <strong>{student.redeemCode}</strong>
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Created by {student.redeemCodeCreatedBy || 'Admin'}</div>
                                                            </div>
                                                        );
                                                    }
                                                    return <span style={{ color: '#9ca3af' }}>—</span>;
                                                })()}
                                            </td>
                                            <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                            <td>
                                                <div class="td-actions" style="justify-content:flex-end;">
                                                    {student.isPaid && (
                                                        <button
                                                            class="icon-btn"
                                                            title="Refund Payment"
                                                            style={{ color: '#f59e0b' }}
                                                            onClick={() => openRefundModal(student)}
                                                        >
                                                            ₹
                                                        </button>
                                                    )}
                                                    <button
                                                        class="icon-btn"
                                                        title="Logged-in devices"
                                                        style={{ color: '#0ea5e9' }}
                                                        onClick={() => openDeviceModal(student)}
                                                    >
                                                        <Icons.Shield />
                                                    </button>
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
                                            <td colSpan={10} style="text-align:center;color:var(--text-muted);padding:2.5rem;">
                                                No students match "{search}".
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
                    )
                )}

                {/* ── DELETED STUDENTS TAB ── */}
                {activeTab === 'deleted' && (
                    loadingDeleted ? (
                        <div class="loading-spinner" />
                    ) : filteredDeleted.length === 0 ? (
                        <div class="table-empty">
                            <div class="empty-icon">🗑</div>
                            <p>{search ? `No deleted students match "${search}".` : 'No deleted student accounts found.'}</p>
                        </div>
                    ) : (
                        <div class="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:170px;max-width:170px;">Student</th>
                                        <th>Phone</th>
                                        <th>Standard</th>
                                        <th>Medium</th>
                                        <th>Joined</th>
                                        <th>Deleted On</th>
                                        <th style="text-align:right;">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDeleted.map((student) => (
                                        <tr key={student._id} style={{ opacity: 0.85 }}>
                                            <td style="max-width:170px;">
                                                <div class="identity">
                                                    <div class="avatar" style={{ background: '#9ca3af' }}>
                                                        {initials(student.firstName || '')}
                                                    </div>
                                                    <div class="identity-body">
                                                        <div class="identity-name" style={{ color: 'var(--text-muted)' }}>{student.firstName || 'Unnamed'}</div>
                                                        <div class="identity-sub">{student.email || 'No email'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{student.phoneNum || '—'}</td>
                                            <td>
                                                <span class="cell-chip">{student.std || '—'}{student.stream ? ` · ${student.stream}` : ''}</span>
                                            </td>
                                            <td>{student.medium || '—'}</td>
                                            <td>{student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                            <td>
                                                <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '0.85rem' }}>
                                                    {student.deletedAt ? new Date(student.deletedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div class="td-actions" style="justify-content:flex-end;">
                                                    <button
                                                        class="btn btn-primary"
                                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.9rem' }}
                                                        disabled={restoring === student._id}
                                                        onClick={() => handleRestore(student)}
                                                    >
                                                        {restoring === student._id ? 'Restoring…' : '↩ Restore'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
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

            {deviceModal && (
                <Modal
                    title={`Logged-in Devices — ${deviceModal.student.firstName}`}
                    onClose={() => setDeviceModal(null)}
                    footer={
                        <Fragment>
                            <button class="btn btn-outline" onClick={() => setDeviceModal(null)}>Close</button>
                            {deviceModal.sessions.length > 0 && (
                                <button
                                    class="btn btn-danger"
                                    disabled={revoking}
                                    onClick={() => handleRevokeDevices(null)}
                                >
                                    {revoking ? 'Logging out…' : 'Logout All Devices'}
                                </button>
                            )}
                        </Fragment>
                    }
                >
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Devices this student is currently signed in on. Logging a device out frees up a slot so they can sign in somewhere else.
                    </p>

                    {deviceModal.loading && (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>Loading devices…</p>
                    )}

                    {!deviceModal.loading && deviceModal.sessions.length === 0 && (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>
                            This student is not logged in on any device.
                        </p>
                    )}

                    {deviceModal.sessions.map(s => (
                        <div key={s._id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.75rem 1rem', marginBottom: '0.5rem',
                            borderRadius: '8px', border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                                    {s.deviceName}{s.platform ? ` · ${s.platform}` : ''}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Last active {s.lastActive ? new Date(s.lastActive).toLocaleString('en-GB', {
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    }) : '—'}
                                </div>
                            </div>
                            <button
                                class="btn btn-outline"
                                disabled={revoking}
                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={() => handleRevokeDevices(s._id)}
                            >
                                Logout
                            </button>
                        </div>
                    ))}
                </Modal>
            )}

            {refundModal && (
                <Modal
                    title={`Refund Payment — ${refundModal.student.firstName}`}
                    onClose={() => setRefundModal(null)}
                    footer={
                        <button class="btn btn-outline" onClick={() => setRefundModal(null)}>Close</button>
                    }
                >
                    <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Select the payment you want to mark as <strong>refunded</strong>. This will reduce the displayed amount and, if no payments remain, mark the student as Unpaid.
                    </p>

                    {refundModal.payments.length === 0 && refundModal.upgrades.length === 0 && (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>No payments found for this student.</p>
                    )}

                    {refundModal.payments.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payments</div>
                            {refundModal.payments.map(p => (
                                <div key={p._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', marginBottom: '0.5rem',
                                    borderRadius: '8px', border: '1px solid var(--border-color)',
                                    background: p.status === 'refunded' ? '#fef9f0' : 'var(--bg-secondary)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>₹{p.amount}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            {' · '}{p.razorpayPaymentId}
                                        </div>
                                    </div>
                                    {p.status === 'refunded' ? (
                                        <span class="cell-chip" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Already Refunded</span>
                                    ) : (
                                        <button
                                            class="btn btn-danger"
                                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}
                                            disabled={refunding}
                                            onClick={() => handleRefund(p._id, 'payment')}
                                        >
                                            {refunding ? 'Processing…' : 'Refund ₹' + p.amount}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {refundModal.upgrades.length > 0 && (
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Upgrades</div>
                            {refundModal.upgrades.map(u => (
                                <div key={u._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', marginBottom: '0.5rem',
                                    borderRadius: '8px', border: '1px solid var(--border-color)',
                                    background: u.status === 'refunded' ? '#fef9f0' : 'var(--bg-secondary)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '1rem' }}>₹{u.amount}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            {u.fromStandard && u.toStandard ? ` · Std ${u.fromStandard} → ${u.toStandard}` : ''}
                                        </div>
                                    </div>
                                    {u.status === 'refunded' ? (
                                        <span class="cell-chip" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Already Refunded</span>
                                    ) : (
                                        <button
                                            class="btn btn-danger"
                                            style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}
                                            disabled={refunding}
                                            onClick={() => handleRefund(u._id, 'upgrade')}
                                        >
                                            {refunding ? 'Processing…' : 'Refund ₹' + u.amount}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}
