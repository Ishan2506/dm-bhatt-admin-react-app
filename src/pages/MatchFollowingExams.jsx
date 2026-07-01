import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { AcademicConstants } from '../utils/constants';

const INITIAL_FORM_DATA = {
    title: '',
    board: 'GSEB',
    std: '',
    medium: 'English',
    stream: 'None',
    subject: '',
    unit: '',
    overview: ''
};

export function MatchFollowingExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingExam, setEditingExam] = useState(null);

    const [formData, setFormData] = useState(INITIAL_FORM_DATA);
    const [pairs, setPairs] = useState([{ left: '', right: '' }]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setFormData(INITIAL_FORM_DATA);
        setPairs([{ left: '', right: '' }]);
        setEditingExam(null);
    };

    const loadExams = () => {
        setLoading(true);
        api.get('/matchfollowingexam/all', { noPrefix: true })
            .then(response => setExams(response.data || response))
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadExams(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addPair = () => setPairs([...pairs, { left: '', right: '' }]);

    const updatePair = (index, field, value) => {
        const updated = [...pairs];
        updated[index][field] = value;
        setPairs(updated);
    };

    const removePair = (index) => setPairs(pairs.filter((_, i) => i !== index));

    const handleEdit = (exam) => {
        setEditingExam(exam._id);
        setFormData({
            title: exam.title || '',
            board: exam.board || 'GSEB',
            std: exam.std || '',
            medium: exam.medium || 'English',
            stream: exam.stream || 'None',
            subject: exam.subject || '',
            unit: exam.unit || '',
            overview: exam.overview || ''
        });
        setPairs(exam.pairs?.length > 0 ? exam.pairs.map(p => ({ left: p.left, right: p.right })) : [{ left: '', right: '' }]);
        setShowAddModal(true);
    };

    const handleSave = async () => {
        if (!formData.title) return showToast('Exam Title is required.', 'error');
        if (!formData.std) return showToast('Standard is required.', 'error');
        if (!formData.subject) return showToast('Subject is required.', 'error');
        if (!formData.unit) return showToast('Unit is required.', 'error');
        if (!formData.overview) return showToast('Overview is required.', 'error');

        if (pairs.length === 0) {
            return showToast('Please add at least one pair.', 'error');
        }
        for (let i = 0; i < pairs.length; i++) {
            if (!pairs[i].left || !pairs[i].right) {
                return showToast(`Pair ${i + 1} must have both left and right values.`, 'error');
            }
        }

        try {
            const payload = { ...formData, pairs, totalMarks: pairs.length };

            if (editingExam) {
                await api.put(`/matchfollowingexam/update/${editingExam}`, payload, { noPrefix: true });
                showToast('Match The Following exam updated successfully!');
            } else {
                await api.post('/matchfollowingexam/create', payload, { noPrefix: true });
                showToast('Match The Following exam created successfully!');
            }
            setShowAddModal(false);
            resetForm();
            loadExams();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/matchfollowingexam/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadExams();
            showToast('Exam deleted successfully!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div class="materials-page">
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Reports /> Match The Following Exams</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowAddModal(true); }}>
                            <Icons.Plus /> Add New Exam
                        </button>
                        <button class="btn btn-outline btn-sm" onClick={loadExams}>
                            <Icons.Refresh /> Refresh
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style="padding: 2rem; text-align: center;"><div class="loading-spinner" /></div>
                ) : exams.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Reports /></div>
                        <p>No match the following exams found.</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Subject</th>
                                <th>Std</th>
                                <th>Unit</th>
                                <th>Pairs</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map(item => (
                                <tr key={item._id}>
                                    <td style="font-weight: 600;">{item.title}</td>
                                    <td>{item.subject}</td>
                                    <td>{item.std} ({item.board})</td>
                                    <td>{item.unit}</td>
                                    <td>{item.pairs?.length || 0}</td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => handleEdit(item)} title="Edit Exam">
                                                <Icons.Edit />
                                            </button>
                                            <button class="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>
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

            {showAddModal && (
                <div class="modal-overlay">
                    <div class="modal modal-lg">
                        <div class="modal-header">
                            <h3>{editingExam ? 'Edit Match The Following Exam' : 'Add Match The Following Exam'}</h3>
                            <button class="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="exam-form" style="display: flex; flex-direction: column; gap: 2rem;">
                                <div style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                    <h4 style="margin: 0 0 1.5rem 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                        <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                        Exam Details
                                    </h4>
                                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Title *</label>
                                            <input type="text" name="title" value={formData.title} onInput={handleInputChange} placeholder="e.g. Match The Following - Unit 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Board *</label>
                                            <select name="board" value={formData.board} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                {AcademicConstants.boards.map(b => <option value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Standard *</label>
                                            <select name="std" value={formData.std} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                <option value="">Select Standard</option>
                                                {AcademicConstants.standards[formData.board]?.map(s => <option value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Medium *</label>
                                            <select name="medium" value={formData.medium} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                {AcademicConstants.mediums.map(m => <option value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Stream</label>
                                            <select name="stream" value={formData.stream} onChange={handleInputChange} style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;">
                                                {AcademicConstants.streams.map(s => <option value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Subject *</label>
                                            <input type="text" name="subject" value={formData.subject} onInput={handleInputChange} placeholder="e.g. English" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                        </div>
                                        <div class="form-group">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Unit *</label>
                                            <input type="text" name="unit" value={formData.unit} onInput={handleInputChange} placeholder="e.g. Unit 1" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem;" />
                                        </div>
                                        <div class="form-group" style="grid-column: 1 / -1;">
                                            <label style="font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 0.5rem;">Overview *</label>
                                            <textarea name="overview" value={formData.overview} onInput={handleInputChange} placeholder="Short instructions/overview for this exam" style="width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); font-size: 0.95rem; min-height: 70px;" />
                                        </div>
                                    </div>
                                </div>

                                <div class="pairs-section" style="background: var(--bg-secondary); padding: 1.75rem; border-radius: 12px; border: 1px solid var(--border-color);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                        <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                            <span style="width: 4px; height: 24px; background: var(--accent); border-radius: 2px;"></span>
                                            Pairs
                                        </h4>
                                        <button class="btn btn-sm btn-primary" onClick={addPair}><Icons.Plus /> Add Pair</button>
                                    </div>
                                    <div style="max-height: 50vh; overflow-y: auto;">
                                        {pairs.map((p, pIndex) => (
                                            <div key={pIndex} style="display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 1rem; background: var(--bg-primary);">
                                                <strong style="padding-top: 0.75rem; color: var(--primary-color);">{pIndex + 1}.</strong>
                                                <div class="form-group" style="flex: 1;">
                                                    <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.4rem;">Left</label>
                                                    <input type="text" class="form-control" style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);" placeholder="e.g. Capital of France" value={p.left} onInput={(e) => updatePair(pIndex, 'left', e.target.value)} />
                                                </div>
                                                <div class="form-group" style="flex: 1;">
                                                    <label style="font-weight: 600; font-size: 0.85rem; display: block; margin-bottom: 0.4rem;">Right</label>
                                                    <input type="text" class="form-control" style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color);" placeholder="e.g. Paris" value={p.right} onInput={(e) => updatePair(pIndex, 'right', e.target.value)} />
                                                </div>
                                                <button class="btn btn-sm btn-outline-danger" style="margin-top: 1.6rem;" onClick={() => removePair(pIndex)}><Icons.Trash /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave}>{editingExam ? 'Update Exam' : 'Save Exam'}</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div class="modal-overlay">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>Delete Exam</h3>
                            <button class="modal-close" onClick={() => setDeleteConfirm(null)}>&times;</button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div class="toast-container">
                    <div class={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
