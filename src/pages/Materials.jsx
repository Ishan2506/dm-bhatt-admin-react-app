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
    const [filterSubjects, setFilterSubjects] = useState([]);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterStandard, setFilterStandard] = useState('');
    const [filterStream, setFilterStream] = useState('');
    const [filterMedium, setFilterMedium] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [totalCount, setTotalCount] = useState(0);

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

    const loadMaterials = (page = 1, size = pageSize, filters = {}) => {
        const {
            subject = filterSubject,
            standard = filterStandard,
            stream = filterStream,
            medium = filterMedium,
        } = filters;
        setLoading(true);
        const skip = (page - 1) * size;
        let url = `/material/all?skip=${skip}&limit=${size}`;
        if (subject) url += `&subject=${encodeURIComponent(subject)}`;
        if (standard) url += `&standard=${encodeURIComponent(standard)}`;
        if (stream) url += `&stream=${encodeURIComponent(stream)}`;
        if (medium) url += `&medium=${encodeURIComponent(medium)}`;
        api.get(url, { noPrefix: true })
            .then(response => {
                setMaterials(response.data || response);
                setTotalCount(response.total || response.length);
                setCurrentPage(page);
            })
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
        api.get('/subjects').then(list => {
            const names = [...new Set((list || []).map(s => s.name))].sort();
            setFilterSubjects(names);
        }).catch(console.error);
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
            setCurrentPage(1);
            loadMaterials(1);
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
            loadMaterials(currentPage);
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
                                    Current: <span style="color: var(--accent); font-weight: 600;">{getFileName(editing.file)}</span>
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

    const totalPages = Math.ceil(totalCount / pageSize);

    const renderHistory = () => (
        <div class="table-container">
            <div class="table-header">
                <h3><Icons.History /> Material Upload History</h3>
                <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <select
                        value={filterStandard}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterStandard(val);
                            loadMaterials(1, pageSize, { standard: val });
                        }}
                        style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                    >
                        <option value="">All Standards</option>
                        {standards.map(s => <option value={s.name}>{s.name}</option>)}
                    </select>
                    <select
                        value={filterStream}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterStream(val);
                            loadMaterials(1, pageSize, { stream: val });
                        }}
                        style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                    >
                        <option value="">All Streams</option>
                        {AcademicConstants.streams.filter(s => s !== 'None').map(s => <option value={s}>{s}</option>)}
                    </select>
                    <select
                        value={filterMedium}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterMedium(val);
                            loadMaterials(1, pageSize, { medium: val });
                        }}
                        style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                    >
                        <option value="">All Mediums</option>
                        {AcademicConstants.mediums.map(m => <option value={m}>{m}</option>)}
                    </select>
                    <select
                        value={filterSubject}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFilterSubject(val);
                            loadMaterials(1, pageSize, { subject: val });
                        }}
                        style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                    >
                        <option value="">All Subjects</option>
                        {filterSubjects.map(s => <option value={s}>{s}</option>)}
                    </select>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            const newPageSize = parseInt(e.target.value);
                            setPageSize(newPageSize);
                            loadMaterials(1, newPageSize);
                        }}
                        style="padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); font-size: var(--font-sm); cursor: pointer;"
                    >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </select>
                    <button class="btn btn-outline btn-sm" onClick={() => loadMaterials(currentPage)}>
                        <Icons.Refresh /> Refresh
                    </button>
                </div>
            </div>
            {loading ? (
                <div style="padding: 2rem; text-align: center;"><div class="loading-spinner" /></div>
            ) : materials.length === 0 ? (
                <div class="table-empty">
                    <div class="empty-icon"><Icons.Paper /></div>
                    <p>No materials found.</p>
                </div>
            ) : (
                <>
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
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: '1rem'; border-top: 1px solid var(--border); margin-top: 1.5rem; gap: 1rem;">
                        <span style="font-size: var(--font-sm); color: var(--text-secondary);">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} materials
                        </span>
                        <div style="display: flex; gap: 0.5rem;">
                            <button
                                class="btn btn-outline btn-sm"
                                onClick={() => loadMaterials(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ← Previous
                            </button>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                {Array.from({ length: totalPages }, (_, i) => {
                                    const pageNum = i + 1;
                                    if (
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => loadMaterials(pageNum)}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: pageNum === currentPage ? 'none' : '1px solid var(--border)',
                                                    background: pageNum === currentPage ? 'var(--accent)' : 'transparent',
                                                    color: pageNum === currentPage ? 'white' : 'var(--text-primary)',
                                                    cursor: 'pointer',
                                                    fontSize: 'var(--font-sm)',
                                                    fontWeight: pageNum === currentPage ? '600' : 'normal'
                                                }}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    } else if (
                                        (pageNum === 2 && currentPage > 3) ||
                                        (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                                    ) {
                                        return <span key={pageNum}>...</span>;
                                    }
                                    return null;
                                })}
                            </div>
                            <button
                                class="btn btn-outline btn-sm"
                                onClick={() => loadMaterials(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </>
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
                                    class="btn btn-outline btn-sm btn-icon"
                                    onClick={() => setPreviewItem(null)}
                                    aria-label="Close preview"
                                >
                                    <Icons.X />
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
