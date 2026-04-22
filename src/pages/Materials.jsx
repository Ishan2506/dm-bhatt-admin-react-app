import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { api } from '../api';
import { AcademicConstants } from '../utils/constants';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

export function Materials({ type }) {
    const [activeTab, setActiveTab] = useState('BoardPaper');
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [standards, setStandards] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getFileName = (path) => {
        if (!path) return '';
        return path.split('/').pop();
    };

    const SERVER_ROOT = (import.meta.env?.API_BASE || '').replace('/api', '');

    const getFileUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        if (path.startsWith('uploads/')) return `${SERVER_ROOT}/${path}`;
        return path;
    };

    const isImage = (path) => {
        if (!path) return false;
        return /\.(png|jpe?g|gif|webp|svg)$/i.test(path);
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Form states
    const [form, setForm] = useState({
        title: '',
        board: 'GSEB',
        standard: '',
        medium: 'English',
        stream: 'None',
        year: new Date().getFullYear().toString(),
        subject: '',
        schoolName: '',
        unit: '',
        file: null
    });

    const fileInputRef = useRef(null);

    const tabs = [
        { id: 'BoardPaper', label: 'Board Paper', icon: <Icons.Paper /> },
        { id: 'SchoolPaper', label: 'School Paper', icon: <Icons.Standards /> },
        { id: 'Notes', label: 'Notes', icon: <Icons.Subjects /> },
        { id: 'ImageMaterial', label: 'Images', icon: <Icons.Image /> },
        { id: 'History', label: 'History', icon: <Icons.History /> }
    ];

    const loadMaterials = () => {
        setLoading(true);
        api.get('/material/all', { noPrefix: true })
            .then(setMaterials)
            .catch(err => showToast(err.message, 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const typeMap = {
            'board-paper': 'BoardPaper',
            'school-paper': 'SchoolPaper',
            'notes': 'Notes',
            'images': 'ImageMaterial',
            'history': 'History'
        };
        const newTab = typeMap[type] || 'BoardPaper';
        setActiveTab(newTab);
        if (editing) resetForm();
    }, [type]);

    useEffect(() => {
        api.get('/standards').then(setStandards).catch(console.error);
    }, []);

    useEffect(() => {
        if (!form.standard) {
            setSubjects([]);
            return;
        }
        const std = standards.find(s => s.name === form.standard);
        if (std) {
            let query = `?standardId=${std._id}`;
            if (form.stream && form.stream !== 'None') {
                query += `&stream=${form.stream}`;
            }
            api.get(`/subjects${query}`).then(setSubjects).catch(console.error);
        }
    }, [form.standard, form.stream, standards]);

    useEffect(() => {
        if (activeTab === 'History') {
            loadMaterials();
        }
        
        if (activeTab === 'BoardPaper' && !['10', '12'].includes(form.standard)) {
            setForm(prev => ({ ...prev, standard: '' }));
        }
    }, [activeTab]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setForm(prev => ({ ...prev, file: e.target.files[0] }));
    };

    const resetForm = () => {
        setForm({
            title: '',
            board: 'GSEB',
            standard: '',
            medium: 'English',
            stream: 'None',
            year: new Date().getFullYear().toString(),
            subject: '',
            schoolName: '',
            unit: '',
            file: null
        });
        setEditing(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.standard || !form.subject || (!form.file && !editing)) {
            showToast('Please fill all required fields and select a file.', 'error');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        Object.keys(form).forEach(key => {
            if (form[key] !== null && form[key] !== undefined) {
                formData.append(key, form[key]);
            }
        });

        try {
            let endpoint = '';
            if (editing) {
                await api.put(`/material/update/${editing._id}`, formData, { noPrefix: true });
                showToast('Material updated successfully!');
                setActiveTab('History');
            } else {
                if (activeTab === 'BoardPaper') endpoint = `/material/upload-board-paper`;
                else if (activeTab === 'SchoolPaper') endpoint = `/material/upload-school-paper`;
                else if (activeTab === 'Notes') endpoint = `/material/upload-notes`;
                else if (activeTab === 'ImageMaterial') endpoint = `/material/upload-image-material`;
                
                await api.post(endpoint, formData, { noPrefix: true });
                showToast('Uploaded successfully!');
                resetForm();
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.del(`/material/delete/${id}`, { noPrefix: true });
            setDeleteConfirm(null);
            loadMaterials();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleEdit = (item) => {
        setEditing(item);
        setForm({
            title: item.title,
            board: item.board,
            standard: item.standard,
            medium: item.medium,
            stream: item.stream || 'None',
            year: item.year,
            subject: item.subject,
            schoolName: item.schoolName || '',
            unit: item.unit || '',
            file: null
        });
        setActiveTab(item.type);
    };

    const renderForm = () => {
        const currentBoard = form.board;
        let availableStandards = standards.map(s => s.name);
        
        // Filter for BoardPaper
        if (activeTab === 'BoardPaper') {
            availableStandards = availableStandards.filter(s => s === '10' || s === '12');
        }
        const availableSubjects = subjects.map(s => s.name);

        return (
            <div class="card">
                <form onSubmit={handleSubmit}>
                    <div class="table-header" style="margin-bottom: 1.5rem; padding: 0; border: none;">
                        <h3>{editing ? `Edit ${activeTab}` : `Upload ${activeTab}`}</h3>
                        {editing && (
                            <button type="button" class="btn btn-outline btn-sm" onClick={resetForm}>Cancel Edit</button>
                        )}
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div class="form-group">
                            <label>Title</label>
                            <input name="title" class="form-control" value={form.title} onInput={handleInputChange} required />
                        </div>
                        <div class="form-group">
                            <label>Board</label>
                            <select name="board" class="form-control" value={form.board} onChange={handleInputChange}>
                                {AcademicConstants.boards.map(b => <option value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Standard</label>
                            <select name="standard" class="form-control" value={form.standard} onChange={handleInputChange} required>
                                <option value="">Select Standard</option>
                                {availableStandards.map(s => <option value={s}>{s}</option>)}
                            </select>
                        </div>
                        {(form.standard === '11' || form.standard === '12') && (
                            <div class="form-group">
                                <label>Stream</label>
                                <select name="stream" class="form-control" value={form.stream} onChange={handleInputChange}>
                                    {AcademicConstants.streams.map(s => <option value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                        <div class="form-group">
                            <label>Medium</label>
                            <select name="medium" class="form-control" value={form.medium} onChange={handleInputChange}>
                                {AcademicConstants.mediums.map(m => <option value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Subject</label>
                            <select name="subject" class="form-control" value={form.subject} onChange={handleInputChange} required>
                                <option value="">Select Subject</option>
                                {availableSubjects.map(s => <option value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Year</label>
                            <input name="year" class="form-control" type="number" value={form.year} onInput={handleInputChange} />
                        </div>
                        {activeTab === 'SchoolPaper' && (
                            <div class="form-group">
                                <label>School Name</label>
                                <input name="schoolName" class="form-control" value={form.schoolName} onInput={handleInputChange} />
                            </div>
                        )}
                        {activeTab === 'ImageMaterial' && (
                            <div class="form-group">
                                <label>Unit</label>
                                <input name="unit" class="form-control" value={form.unit} onInput={handleInputChange} />
                            </div>
                        )}
                    </div>

                    <div class="form-group" style="margin-top: 1rem;">
                        <label>{activeTab === 'ImageMaterial' ? 'Image File' : 'PDF File'}</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={activeTab === 'ImageMaterial' ? "image/*" : "application/pdf"} class="form-control" />
                        {editing && !form.file && (
                            <div style="margin-top: 8px; padding: 10px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border);">
                                <p style="font-size: var(--font-xs); color: var(--text-primary); margin-bottom: 4px;">
                                    📄 Current: <span style="color: var(--accent); font-weight: 600;">{getFileName(editing.file)}</span>
                                </p>
                                <p style="font-size: var(--font-xs); color: var(--text-secondary);">Leave empty to keep existing file</p>
                            </div>
                        )}
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 1rem;" disabled={uploading}>
                        {uploading ? 'Processing...' : editing ? 'Update Material' : 'Upload Material'}
                    </button>
                </form>
            </div>
        );
    };

    const renderHistory = () => (
        <div class="table-container">
            <div class="table-header">
                <h3><Icons.History /> Material Upload History</h3>
                <button class="btn btn-outline btn-sm" onClick={loadMaterials}>
                    <Icons.Refresh /> Refresh
                </button>
            </div>
            {loading ? (
                <div style="padding: 2rem; text-align: center;"><div class="loading-spinner" /></div>
            ) : materials.length === 0 ? (
                <div class="table-empty">
                    <div class="empty-icon"><Icons.Paper /></div>
                    <p>No materials found.</p>
                </div>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Subject</th>
                            <th>Std</th>
                            <th>Year</th>
                            <th>Created By</th>
                            <th>Updated By</th>
                            <th>Created Time</th>
                            <th>Updated Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map(item => (
                            <tr key={item._id}>
                                <td style="font-weight: 600;">{item.title}</td>
                                <td><span class="badge badge-info">{item.type}</span></td>
                                <td>{item.subject}</td>
                                <td>{item.standard}</td>
                                <td>{item.year}</td>
                                <td>
                                    {item.createdBy ? (
                                        <div style={{ lineHeight: '1.2' }}>
                                            {item.createdBy.firstName}<br />
                                            {item.createdBy.email && <small style={{ color: 'var(--text-secondary)' }}>{item.createdBy.email}</small>}
                                        </div>
                                    ) : 'System'}
                                </td>
                                <td>
                                    {item.updatedBy ? (
                                        <div style={{ lineHeight: '1.2' }}>
                                            {item.updatedBy.firstName}<br />
                                            {item.updatedBy.email && <small style={{ color: 'var(--text-secondary)' }}>{item.updatedBy.email}</small>}
                                        </div>
                                    ) : (item.createdBy ? (
                                        <div style={{ lineHeight: '1.2' }}>
                                            {item.createdBy.firstName}<br />
                                            {item.createdBy.email && <small style={{ color: 'var(--text-secondary)' }}>{item.createdBy.email}</small>}
                                        </div>
                                    ) : 'System')}
                                </td>
                                <td style="font-size: var(--font-xs); color: var(--text-secondary);">{formatDateTime(item.createdAt)}</td>
                                <td style="font-size: var(--font-xs); color: var(--text-secondary);">{formatDateTime(item.updatedAt || item.createdAt)}</td>
                                <td>
                                    <div class="td-actions">
                                        {item.file && (
                                            <button class="btn btn-outline btn-sm" title="Preview" onClick={() => setPreviewItem(item)} style="color: var(--accent);">
                                                <Icons.Eye />
                                            </button>
                                        )}
                                        <button class="btn btn-outline btn-sm" onClick={() => handleEdit(item)}>
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
    );

    return (
        <div class="materials-page">
            <div class="tab-content" style="margin-top: 0;">
                {activeTab === 'History' ? renderHistory() : renderForm()}
            </div>

            {previewItem && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.75)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) setPreviewItem(null); }}
                >
                    <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)',
                        width: '90vw', maxWidth: '960px', height: '85vh',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                    }}>
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--bg-secondary)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Icons.Eye />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                                        {previewItem.title}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                                        {getFileName(previewItem.file)}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <a
                                    href={getFileUrl(previewItem.file)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="btn btn-outline btn-sm"
                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <Icons.ExternalLink /> Open in tab
                                </a>
                                <button
                                    class="btn btn-outline btn-sm"
                                    onClick={() => setPreviewItem(null)}
                                    style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflow: 'hidden', background: '#1a1a2e' }}>
                            {isImage(previewItem.file) ? (
                                <div style={{
                                    height: '100%', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    padding: '1.5rem'
                                }}>
                                    <img
                                        src={getFileUrl(previewItem.file)}
                                        alt={previewItem.title}
                                        style={{
                                            maxWidth: '100%', maxHeight: '100%',
                                            objectFit: 'contain',
                                            borderRadius: 'var(--radius-md)',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                                        }}
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={getFileUrl(previewItem.file)}
                                    title={previewItem.title}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Material"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </>
                    }
                >
                    <p>Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?</p>
                </Modal>
            )}

            {toast && (
                <div class="toast-container">
                    <div class={`toast toast-${toast.type || 'success'}`}>
                        {toast.type === 'error' ? <Icons.Error /> : toast.type === 'info' ? <Icons.Info /> : <Icons.Success />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
