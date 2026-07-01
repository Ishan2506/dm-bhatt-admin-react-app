import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

export function Standards() {
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', displayOrder: 0, isActive: true });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/standards')
            .then(data => setStandards(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', displayOrder: standards.length, isActive: true });
        setShowModal(true);
    };

    const openEdit = (std) => {
        setEditing(std);
        setForm({ name: std.name, displayOrder: std.displayOrder || 0, isActive: std.isActive ?? true });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/standards/${editing._id}`, form);
            } else {
                await api.post(`/standards`, form);
            }
            setShowModal(false);
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/standards/${id}`);
            setDeleteConfirm(null);
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const activeCount = standards.filter(s => s.isActive).length;
    return (
        <div>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Standards /> Management</div>
                    <h1>Standards</h1>
                    <p class="page-subtitle">Define the academic standards students can be enrolled into.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{standards.length}</span>
                            <span class="hm-label">Total</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{activeCount}</span>
                            <span class="hm-label">Active</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button id="add-standard-btn" class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Add Standard
                    </button>
                </div>
            </div>

            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : standards.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Standards /></div>
                        <h3>No standards yet</h3>
                        <p>Add your first standard to start building the curriculum.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:56px;">#</th>
                                <th>Standard</th>
                                <th>Status</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standards.map((std, i) => (
                                <tr key={std._id}>
                                    <td style="color:var(--text-muted);font-variant-numeric:tabular-nums;">{i + 1}</td>
                                    <td>
                                        <div class="identity">
                                            <div class="avatar avatar-sm" style={{ background: 'var(--primary)' }}>{std.name?.toString().slice(0, 2)}</div>
                                            <div class="identity-name">{std.name}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span class={`badge ${std.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {std.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions" style="justify-content:flex-end;">
                                            <button class="icon-btn primary" title="Edit" onClick={() => openEdit(std)}>
                                                <Icons.Edit />
                                            </button>
                                            <button class="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(std)}>
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
                    title={editing ? 'Edit Standard' : 'Add Standard'}
                    onClose={() => setShowModal(false)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                            </button>
                        </>
                    }
                >
                    <div class="form-group">
                        <label>Standard Name</label>
                        <input
                            id="standard-name-input"
                            class="form-control"
                            placeholder="e.g. 10, 11 Science, 12 Commerce"
                            value={form.name}
                            onInput={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                    {editing && (
                        <div class="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                />
                                {' '}Active
                            </label>
                        </div>
                    )}
                </Modal>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Standard"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </>
                    }
                >
                    <p class="confirm-message">
                        Are you sure you want to delete standard <strong>"{deleteConfirm.name}"</strong>?<br />
                        This will also delete all related subjects and chapters.
                    </p>
                </Modal>
            )}
        </div>
    );
}
