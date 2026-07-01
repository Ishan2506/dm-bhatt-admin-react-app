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
    const [form, setForm] = useState({ unitNo: '', name: '', subjectId: '', isActive: true });
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
        setForm({ unitNo: '', name: '', subjectId: filterSubj || '', isActive: true });
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
            subjectId: ch.subjectId?._id || ch.subjectId || '',
            isActive: ch.isActive ?? true
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
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Chapters /> Management</div>
                    <h1>Chapters</h1>
                    <p class="page-subtitle">Break subjects down into units and chapters.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{chapters.length}</span>
                            <span class="hm-label">Showing</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button id="add-chapter-btn" class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Add Chapter
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%;">
                        <div class="toolbar-group">
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
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div class="loading-spinner" />
                ) : chapters.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Chapters /></div>
                        <h3>No chapters found</h3>
                        <p>Add your first chapter, or adjust the filters above.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th style="width:80px;">Unit</th>
                                <th>Chapter</th>
                                <th>Subject</th>
                                <th>Standard</th>
                                <th>Status</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chapters.map(ch => (
                                <tr key={ch._id}>
                                    <td>
                                        <span class="cell-chip" style="font-variant-numeric:tabular-nums;">Unit {ch.unitNo}</span>
                                    </td>
                                    <td>
                                        <div class="identity">
                                            <div class="avatar avatar-sm" style={{ background: 'var(--chart-amber)' }}><Icons.Chapters /></div>
                                            <div class="identity-name">{ch.name}</div>
                                        </div>
                                    </td>
                                    <td>{ch.subjectId?.name ? `${ch.subjectId.name}${ch.subjectId.stream && ch.subjectId.stream !== 'None' ? ` (${ch.subjectId.stream})` : ''}` : '—'}</td>
                                    <td><span class="cell-chip">{ch.subjectId?.standardId?.name || '—'}</span></td>
                                    <td>
                                        <span class={`badge ${ch.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {ch.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions" style="justify-content:flex-end;">
                                            <button class="icon-btn primary" title="Edit" onClick={() => openEdit(ch)}>
                                                <Icons.Edit />
                                            </button>
                                            <button class="icon-btn danger" title="Delete" onClick={() => setDeleteConfirm(ch)}>
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
