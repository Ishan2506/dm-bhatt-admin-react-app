import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

export function Chapters() {
    const [chapters, setChapters] = useState([]);
    const [standards, setStandards] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStd, setFilterStd] = useState('');
    const [filterSubj, setFilterSubj] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ unitNo: '', name: '', subjectId: '' });
    const [formStdId, setFormStdId] = useState('');
    const [formSubjects, setFormSubjects] = useState([]);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const loadStandards = () => api.get('/standards').then(setStandards).catch(console.error);

    const loadFilteredSubjects = (stdId) => {
        if (!stdId) { setSubjects([]); return; }
        api.get(`/subjects?standardId=${stdId}`).then(setSubjects).catch(console.error);
    };

    const loadChapters = () => {
        setLoading(true);
        const query = filterSubj ? `?subjectId=${filterSubj}` : '';
        api.get(`/chapters${query}`)
            .then(setChapters)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadStandards(); }, []);
    useEffect(() => { loadFilteredSubjects(filterStd); setFilterSubj(''); }, [filterStd]);
    useEffect(() => { loadChapters(); }, [filterSubj]);

    // Load subjects for the form modal
    const loadFormSubjects = (stdId) => {
        if (!stdId) { setFormSubjects([]); return; }
        api.get(`/subjects?standardId=${stdId}`).then(setFormSubjects).catch(console.error);
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ unitNo: '', name: '', subjectId: filterSubj || '' });
        const stdId = filterStd || (standards[0]?._id || '');
        setFormStdId(stdId);
        if (stdId) loadFormSubjects(stdId);
        setShowModal(true);
    };

    const openEdit = (ch) => {
        setEditing(ch);
        const stdId = ch.subjectId?.standardId?._id || '';
        setFormStdId(stdId);
        setForm({
            unitNo: ch.unitNo,
            name: ch.name,
            subjectId: ch.subjectId?._id || ch.subjectId || ''
        });
        if (stdId) loadFormSubjects(stdId);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.unitNo || !form.name.trim() || !form.subjectId) return;
        setSaving(true);
        try {
            const payload = { ...form, unitNo: parseInt(form.unitNo) };
            if (editing) {
                await api.put(`/chapters/${editing._id}`, payload);
            } else {
                await api.post(`/chapters`, payload);
            }
            setShowModal(false);
            loadChapters();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/chapters/${id}`);
            setDeleteConfirm(null);
            loadChapters();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div>
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Clipboard /> All Chapters / Units</h3>
                    <div class="table-filters">
                        <select
                            id="chapter-filter-standard"
                            class="form-control"
                            value={filterStd}
                            onChange={(e) => setFilterStd(e.target.value)}
                        >
                            <option value="">All Standards</option>
                            {standards.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                        <select
                            id="chapter-filter-subject"
                            class="form-control"
                            value={filterSubj}
                            onChange={(e) => setFilterSubj(e.target.value)}
                            disabled={!filterStd}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name} {s.stream && s.stream !== 'None' ? `(${s.stream})` : ''}</option>
                            ))}
                        </select>
                        <button id="add-chapter-btn" class="btn btn-primary" onClick={openAdd}>
                            <Icons.Plus /> Add Chapter
                        </button>
                    </div>
                </div>
                {loading ? (
                    <div class="loading-spinner" />
                ) : chapters.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Chapters /></div>
                        <p>No chapters found. Add your first chapter!</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Unit No</th>
                                <th>Chapter Name</th>
                                <th>Subject</th>
                                <th>Standard</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chapters.map(ch => (
                                <tr key={ch._id}>
                                    <td>
                                        <span class="badge badge-info">{ch.unitNo}</span>
                                    </td>
                                    <td style="font-weight: 600;">{ch.name}</td>
                                    <td>{ch.subjectId?.name ? `${ch.subjectId.name} ${ch.subjectId.stream && ch.subjectId.stream !== 'None' ? `(${ch.subjectId.stream})` : ''}` : '—'}</td>
                                    <td>
                                        <span class="badge badge-warning">
                                            {ch.subjectId?.standardId?.name || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span class={`badge ${ch.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {ch.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => openEdit(ch)}>
                                                <Icons.Edit /> Edit
                                            </button>
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(ch)}>
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
                    title={editing ? 'Edit Chapter' : 'Add Chapter'}
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
                            id="chapter-modal-standard"
                            class="form-control"
                            value={formStdId}
                            onChange={(e) => {
                                setFormStdId(e.target.value);
                                setForm({ ...form, subjectId: '' });
                                loadFormSubjects(e.target.value);
                            }}
                        >
                            <option value="">Select Standard</option>
                            {standards.map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <select
                            id="chapter-modal-subject"
                            class="form-control"
                            value={form.subjectId}
                            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                            disabled={!formStdId}
                        >
                            <option value="">Select Subject</option>
                            {formSubjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name} {s.stream && s.stream !== 'None' ? `(${s.stream})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Unit No</label>
                        <input
                            id="chapter-unitno-input"
                            class="form-control"
                            type="number"
                            placeholder="e.g. 1, 2, 3"
                            value={form.unitNo}
                            onInput={(e) => setForm({ ...form, unitNo: e.target.value })}
                        />
                    </div>
                    <div class="form-group">
                        <label>Chapter / Unit Name</label>
                        <input
                            id="chapter-name-input"
                            class="form-control"
                            placeholder="e.g. Real Numbers, Chemical Reactions"
                            value={form.name}
                            onInput={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>
                </Modal>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Chapter"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </>
                    }
                >
                    <p class="confirm-message">
                        Are you sure you want to delete <strong>Unit {deleteConfirm.unitNo} — "{deleteConfirm.name}"</strong>?
                    </p>
                </Modal>
            )}
        </div>
    );
}
