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
    const [form, setForm] = useState({ name: '', displayOrder: 0 });
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
        setForm({ name: '', displayOrder: standards.length });
        setShowModal(true);
    };

    const openEdit = (std) => {
        setEditing(std);
        setForm({ name: std.name, displayOrder: std.displayOrder || 0 });
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

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Clipboard /> All Standards</h3>
                    <button id="add-standard-btn" class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Add Standard
                    </button>
                </div>
                {loading ? (
                    <div class="loading-spinner" />
                ) : standards.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Standards /></div>
                        <p>No standards yet. Add your first standard!</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standards.map((std, i) => (
                                <tr key={std._id}>
                                    <td>{i + 1}</td>
                                    <td style="font-weight: 600;">{std.name}</td>
                                    <td>
                                        <span class={`badge ${std.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {std.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => openEdit(std)}>
                                                <Icons.Edit /> Edit
                                            </button>
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(std)}>
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
