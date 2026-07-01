import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';

export function Admins() {
    const [data, setData] = useState({ admins: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ firstName: '', email: '', phoneNum: '', isActive: true, password: '' });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const load = () => {
        setLoading(true);
        api.get(`/admins`)
            .then(res => {
                if (res && res.admins) {
                    setData(res);
                } else if (Array.isArray(res)) {
                    setData({ admins: res });
                } else {
                    setData({ admins: [] });
                }
            })
            .catch(err => console.error('Failed to fetch admins:', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ firstName: '', email: '', phoneNum: '', isActive: true, password: '' });
        setShowModal(true);
    };

    const openEdit = (admin) => {
        setEditing(admin);
        setForm({
            firstName: admin.firstName || '',
            email: admin.email || '',
            phoneNum: admin.phoneNum || '',
            isActive: admin.isActive !== false,
            password: ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.firstName.trim() || !form.phoneNum.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/admins/${editing._id}`, form);
            } else {
                const res = await api.post(`/admins`, form);
                if (res.defaultPin) {
                    alert(`Admin created! Default login PIN: ${res.defaultPin}`);
                }
            }
            setShowModal(false);
            load();
        } catch (err) {
            alert(err.message || 'Failed to save admin');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/admins/${id}`);
            setDeleteConfirm(null);
            load();
        } catch (err) {
            alert(err.message || 'Failed to delete admin');
        }
    };

    const activeCount = data.admins.filter(a => a.isActive !== false).length;
    return (
        <div>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Shield /> Users</div>
                    <h1>Administrators</h1>
                    <p class="page-subtitle">Manage staff accounts and their access to the admin panel.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{data.admins.length}</span>
                            <span class="hm-label">Total</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{activeCount}</span>
                            <span class="hm-label">Active</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Add Admin
                    </button>
                </div>
            </div>

            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : data.admins.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Shield /></div>
                        <h3>No administrators yet</h3>
                        <p>Add your first admin to grant panel access.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Administrator</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.admins.map((admin) => (
                                    <tr key={admin._id}>
                                        <td>
                                            <div class="identity">
                                                <div class="avatar" style={{ background: 'var(--primary)' }}>
                                                    {(admin.firstName || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div class="identity-body">
                                                    <div class="identity-name">{admin.firstName || 'Unnamed'}</div>
                                                    <div class="identity-sub">{admin.email || 'No email'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{admin.phoneNum || '—'}</td>
                                        <td>
                                            <span class={`badge ${admin.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                                                {admin.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style="font-size:var(--font-xs);">{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                        <td>
                                            <div class="td-actions" style="justify-content:flex-end;">
                                                <button class="icon-btn primary" title="Edit" onClick={() => openEdit(admin)}>
                                                    <Icons.Edit />
                                                </button>
                                                <button class="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(admin)}>
                                                    <Icons.Trash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <Modal
                    title={editing ? 'Edit Admin' : 'Add Admin'}
                    onClose={() => setShowModal(false)}
                    footer={
                        <Fragment>
                            <button class="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : editing ? 'Update' : 'Add Admin'}
                            </button>
                        </Fragment>
                    }
                >
                    <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                        <div class="form-group">
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
                        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style="width: auto; margin: 0;" />
                            <label for="isActive" style="margin: 0; cursor: pointer;">Active Account</label>
                        </div>
                        <div class="form-group">
                            <label>Password / PIN <span style="font-weight:400;color:var(--text-muted);">(optional)</span></label>
                            <input class="form-control" type="text" placeholder={editing ? "Leave blank to keep current password" : "Defaults to last 4 digits of phone"} value={form.password} onInput={(e) => setForm({ ...form, password: e.target.value })} />
                        </div>
                    </div>
                </Modal>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Admin"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <Fragment>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </Fragment>
                    }
                >
                    <p class="confirm-message">
                        Are you sure you want to delete the admin <strong>"{deleteConfirm.firstName}"</strong>?<br />
                        This action cannot be undone and will permanently remove their access.
                    </p>
                </Modal>
            )}
        </div>
    );
}
