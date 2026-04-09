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
        const adminName = JSON.parse(localStorage.getItem('user'))?.firstName || 'Admin';
        try {
            if (editing) {
                await api.put(`/admins/${editing._id}?performedBy=${adminName}`, form);
            } else {
                const res = await api.post(`/admins?performedBy=${adminName}`, form);
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
        const adminName = JSON.parse(localStorage.getItem('user'))?.firstName || 'Admin';
        try {
            await api.del(`/admins/${id}?performedBy=${adminName}`);
            setDeleteConfirm(null);
            load();
        } catch (err) {
            alert(err.message || 'Failed to delete admin');
        }
    };

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Shield /> Admins</h3>
                    <div class="table-filters" style="display: flex; gap: 1rem; align-items: center;">
                        <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">
                            Total: {data.admins.length}
                        </span>
                        <button class="btn btn-primary btn-sm" onClick={openAdd}>
                            <Icons.Plus /> Add Admin
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div style="padding: 2rem; text-align: center;">Loading admins...</div>
                ) : data.admins.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Shield /></div>
                        <p>No admins found.</p>
                    </div>
                ) : (
                    <Fragment>
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                    <th>Joined Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.admins.map((admin) => (
                                    <tr key={admin._id}>
                                        <td style="font-weight: 600;">{admin.firstName || ''}</td>
                                        <td>{admin.email || '-'}</td>
                                        <td>{admin.phoneNum || '-'}</td>
                                        <td>
                                            <span class={`badge ${admin.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                                                {admin.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <div class="td-actions">
                                                <button class="btn btn-outline btn-sm" onClick={() => openEdit(admin)}>
                                                    <Icons.Edit /> Edit
                                                </button>
                                                <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(admin)}>
                                                    <Icons.Trash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Fragment>
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
