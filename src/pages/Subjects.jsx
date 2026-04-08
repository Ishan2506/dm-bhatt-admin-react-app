import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

export function Subjects() {
    const [subjects, setSubjects] = useState([]);
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStd, setFilterStd] = useState('');
    const [filterStream, setFilterStream] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', standardId: '', stream: '' });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadStandards = () => api.get('/standards').then(setStandards).catch(console.error);

    const loadSubjects = () => {
        setLoading(true);
        const queryParams = new URLSearchParams();
        if (filterStd) queryParams.append('standardId', filterStd);
        
        const selectedFilterStandard = standards.find(s => s._id === filterStd);
        const isFilterHigherSecondary = selectedFilterStandard && (selectedFilterStandard.name.includes('11') || selectedFilterStandard.name.includes('12'));
        
        if (isFilterHigherSecondary && filterStream) {
            queryParams.append('stream', filterStream);
        }

        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        api.get(`/subjects${query}`)
            .then(setSubjects)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadStandards(); }, []);
    useEffect(() => { loadSubjects(); }, [filterStd, filterStream]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: '', standardId: filterStd || (standards[0]?._id || ''), stream: '' });
        setShowModal(true);
    };

    const openEdit = (subj) => {
        setEditing(subj);
        setForm({
            name: subj.name,
            standardId: subj.standardId?._id || subj.standardId || '',
            stream: subj.stream || ''
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

    const selectedStandard = standards.find(s => s._id === form.standardId);
    const isHigherSecondary = selectedStandard && (selectedStandard.name.includes('11') || selectedStandard.name.includes('12'));

    const selectedFilterStandard = standards.find(s => s._id === filterStd);
    const isFilterHigherSecondary = selectedFilterStandard && (selectedFilterStandard.name.includes('11') || selectedFilterStandard.name.includes('12'));

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Clipboard /> All Subjects</h3>
                    <div class="table-filters">
                        <select
                            id="subject-filter-standard"
                            class="form-control"
                            value={filterStd}
                            onChange={(e) => {
                                setFilterStd(e.target.value);
                                setFilterStream('');
                            }}
                        >
                            <option value="">All Standards</option>
                            {standards.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                        <select
                            id="subject-filter-stream"
                            class="form-control"
                            value={filterStream}
                            onChange={(e) => setFilterStream(e.target.value)}
                            disabled={!isFilterHigherSecondary}
                        >
                            <option value="">All Streams</option>
                            <option value="Science">Science</option>
                            <option value="General">General</option>
                        </select>
                        <button id="add-subject-btn" class="btn btn-primary" onClick={openAdd}>
                            <Icons.Plus /> Add Subject
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div class="loading-spinner" />
                ) : subjects.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Subjects /></div>
                        <p>No subjects found. Add your first subject!</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Subject Name</th>
                                <th>Standard</th>
                                <th>Stream</th>
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
                                        {subj.stream ? <span class="badge badge-secondary">{subj.stream}</span> : '—'}
                                    </td>
                                    <td>
                                        <span class={`badge ${subj.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {subj.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => openEdit(subj)}>
                                                <Icons.Edit /> Edit
                                            </button>
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(subj)}>
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
                    {isHigherSecondary && (
                        <div class="form-group">
                            <label>Stream</label>
                            <select
                                class="form-control"
                                value={form.stream}
                                onChange={(e) => setForm({ ...form, stream: e.target.value })}
                            >
                                <option value="">Select Stream</option>
                                <option value="Science">Science</option>
                                <option value="General">General</option>
                            </select>
                        </div>
                    )}
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
