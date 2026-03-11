import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';

export function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStd, setFilterStd] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', standardId: '' });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadStandards = () => api.get('/standards').then(setStandards).catch(console.error);

    const loadSubjects = () => {
        setLoading(true);
        const query = filterStd ? `?standardId=${filterStd}` : '';
        api.get(`/subjects${query}`)
            .then(setSubjects)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadStandards(); }, []);
    useEffect(() => { loadSubjects(); }, [filterStd]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', standardId: filterStd || (standards[0]?._id || '') });
        setShowModal(true);
    };

    const openEdit = (subj) => {
        setEditing(subj);
        setForm({
            name: subj.name,
            standardId: subj.standardId?._id || subj.standardId || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.standardId) return;
        setSaving(true);
        try {
            if (editing) {
                await api.put(`/subjects/${editing._id}`, form);
            } else {
                await api.post('/subjects', form);
            }
            setShowModal(false);
            loadSubjects();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/subjects/${id}`);
            setDeleteConfirm(null);
            loadSubjects();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3>📋 All Subjects</h3>
                    <div class="table-filters">
                        <select
                            id="subject-filter-standard"
                            class="form-control"
                            value={filterStd}
                            onChange={(e) => setFilterStd(e.target.value)}
                        >
                            <option value="">All Standards</option>
                            {standards.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                        <button id="add-subject-btn" class="btn btn-primary" onClick={openAdd}>+ Add Subject</button>
                    </div>
                </div>
                {loading ? (
                    <div class="loading-spinner" />
                ) : subjects.length === 0 ? (
                    <div class="table-empty">
                        <p>📚</p>
                        <p>No subjects found. Add your first subject!</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Subject Name</th>
                                <th>Standard</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subj, i) => (
                                <tr key={subj._id}>
                                    <td>{i + 1}</td>
                                    <td style="font-weight: 600;">{subj.name}</td>
                                    <td>
                                        <span class="badge badge-info">
                                            {subj.standardId?.name || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class={`badge ${subj.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {subj.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => openEdit(subj)}>✏️ Edit</button>
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(subj)}>🗑️</button>
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
                    title={editing ? 'Edit Subject' : 'Add Subject'}
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
                        <label>Standard</label>
                        <select
                            id="subject-standard-select"
                            class="form-control"
                            value={form.standardId}
                            onChange={(e) => setForm({ ...form, standardId: e.target.value })}
                        >
                            <option value="">Select Standard</option>
                            {standards.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Subject Name</label>
                        <input
                            id="subject-name-input"
                            class="form-control"
                            placeholder="e.g. Mathematics, Science, English"
                            value={form.name}
                            onInput={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                </Modal>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Subject"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </>
                    }
                >
                    <p class="confirm-message">
                        Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>?<br />
                        All chapters under this subject will also be deleted.
                    </p>
                </Modal>
            )}
        </div>
    );
}
