import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { AcademicConstants } from '../utils/constants';

const NodeEditor = ({ node, onUpdate, onDelete, isRoot = false }) => {
    const addChild = () => {
        const newNode = { ...node, children: [...node.children, { name: '', children: [] }] };
        onUpdate(newNode);
    };

    const updateChild = (index, updatedChild) => {
        const newChildren = [...node.children];
        newChildren[index] = updatedChild;
        onUpdate({ ...node, children: newChildren });
    };

    const removeChild = (index) => {
        const newChildren = node.children.filter((_, i) => i !== index);
        onUpdate({ ...node, children: newChildren });
    };

    return (
        <div class="node-editor" style={{ marginLeft: isRoot ? '0' : '1.5rem', marginBottom: '0.5rem', borderLeft: isRoot ? 'none' : '2px solid var(--border-color)', paddingLeft: isRoot ? '0' : '1rem' }}>
            <div class="node-input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                    type="text"
                    class="form-control"
                    placeholder={isRoot ? "Main Topic" : "Sub-topic"}
                    value={node.name}
                    onInput={(e) => onUpdate({ ...node, name: e.target.value })}
                />
                <button type="button" class="btn btn-sm btn-outline" onClick={addChild} title="Add Child">➕</button>
                {!isRoot && <button type="button" class="btn btn-sm btn-outline btn-danger" onClick={onDelete} title="Remove Node">✖️</button>}
            </div>
            <div class="node-children" style={{ marginTop: '0.5rem' }}>
                {node.children.map((child, index) => (
                    <NodeEditor
                        key={index}
                        node={child}
                        onUpdate={(updated) => updateChild(index, updated)}
                        onDelete={() => removeChild(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export function MindMaps() {
    const [activeTab, setActiveTab] = useState('Create');
    const [mindMaps, setMindMaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null);
    const [toast, setToast] = useState(null);

    const initialForm = {
        board: 'GSEB',
        standard: '',
        stream: '-',
        subject: '',
        unit: '',
        title: '',
        data: { name: '', children: [] }
    };

    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (activeTab === 'History') {
            loadMindMaps();
        }
    }, [activeTab]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadMindMaps = async () => {
        setLoading(true);
        try {
            const data = await api.get('/mindmap/all', { noPrefix: true });
            setMindMaps(data);
        } catch (err) {
            showToast('Failed to load mind maps', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleTreeUpdate = (newData) => {
        setForm(prev => ({ ...prev, data: newData }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditing(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.standard || !form.subject || !form.unit || !form.title || !form.data.name) {
            showToast('Please fill all required fields and the main topic', 'error');
            return;
        }

        setSaving(true);
        try {
            const endpoint = editing ? `/mindmap/${editing}` : '/mindmap/add';
            const method = editing ? 'put' : 'post';
            
            // Map standard to std for backend compatibility
            const payload = {
                ...form,
                std: form.standard
            };
            delete payload.standard;

            await api[method](endpoint, payload, { noPrefix: true });
            
            showToast(`Mind Map ${editing ? 'updated' : 'created'} successfully!`, 'success');
            resetForm();
            if (activeTab === 'History') loadMindMaps();
            else setActiveTab('History');
        } catch (err) {
            showToast(err.message || 'Failed to save mind map', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (item) => {
        setEditing(item._id);
        setForm({
            board: item.board || 'GSEB',
            standard: item.std || '',
            stream: item.stream || 'None',
            subject: item.subject || '',
            unit: item.unit || '',
            title: item.title || '',
            data: item.data || { name: '', children: [] }
        });
        setActiveTab('Create');
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this mind map?')) return;
        try {
            await api.del(`/mindmap/${id}`, { noPrefix: true });
            showToast('Mind Map deleted successfully!', 'success');
            loadMindMaps();
        } catch (err) {
            showToast('Failed to delete mind map', 'error');
        }
    };

    const availableStandards = AcademicConstants.standards[form.board] || [];
    const subjectKey = `${form.board}-${form.standard}${form.stream !== 'None' ? `-${form.stream}` : ''}`;
    const availableSubjects = AcademicConstants.subjects[subjectKey] || AcademicConstants.subjects[`${form.board}-${form.standard}`] || [];

    return (
        <div class="materials-page">
            {toast && (
                <div class="toast-container">
                    <div class={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                </div>
            )}

            <div class="tabs">
                <button 
                    class={`tab ${activeTab === 'Create' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('Create'); if (editing) resetForm(); }}
                >
                    {editing ? '📝 Edit Mind Map' : '🆕 Create Mind Map'}
                </button>
                <button 
                    class={`tab ${activeTab === 'History' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('History'); if (editing) resetForm(); }}
                >
                    📜 History
                </button>
            </div>

            <div class="tab-content">
                {activeTab === 'Create' ? (
                    <div class="card">
                        <div class="table-header" style="margin-bottom: 1.5rem; padding: 0; border: none;">
                            <h3>{editing ? 'Edit Existing Mind Map' : 'Assign New Mind Map'}</h3>
                            {editing && (
                                <button class="btn btn-outline btn-sm" onClick={resetForm}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                                <div class="form-group">
                                    <label class="form-label">Board</label>
                                    <select 
                                        name="board" 
                                        class="form-control" 
                                        value={form.board} 
                                        onInput={handleInputChange}
                                    >
                                        {AcademicConstants.boards.map(b => <option value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Standard</label>
                                    <select 
                                        name="standard" 
                                        class="form-control" 
                                        value={form.standard} 
                                        onInput={handleInputChange}
                                    >
                                        <option value="">Select Std</option>
                                        {availableStandards.map(s => <option value={s}>{s}</option>)}
                                    </select>
                                </div>
                                {(form.standard === '11' || form.standard === '12') && (
                                    <div class="form-group">
                                        <label class="form-label">Stream</label>
                                        <select 
                                            name="stream" 
                                            class="form-control" 
                                            value={form.stream} 
                                            onInput={handleInputChange}
                                        >
                                            <option value="None">None</option>
                                            <option value="Science">Science</option>
                                            <option value="Commerce">Commerce</option>
                                        </select>
                                    </div>
                                )}
                                <div class="form-group">
                                    <label class="form-label">Subject</label>
                                    <select 
                                        name="subject" 
                                        class="form-control" 
                                        value={form.subject} 
                                        onInput={handleInputChange}
                                    >
                                        <option value="">Select Subject</option>
                                        {availableSubjects.map(s => <option value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Unit / Topic</label>
                                    <input 
                                        type="text" 
                                        name="unit" 
                                        class="form-control" 
                                        placeholder="e.g. Atoms and Molecules" 
                                        value={form.unit} 
                                        onInput={handleInputChange}
                                    />
                                </div>
                                <div class="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label class="form-label">Mind Map Title</label>
                                    <input 
                                        type="text" 
                                        name="title" 
                                        class="form-control" 
                                        placeholder="e.g. Basic Laws of Chemistry" 
                                        value={form.title} 
                                        onInput={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div class="tree-builder-section">
                                <h4 class="form-label" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>🌳 Tree Builder</h4>
                                <NodeEditor 
                                    node={form.data} 
                                    onUpdate={handleTreeUpdate} 
                                    isRoot={true} 
                                />
                            </div>

                            <div class="form-actions" style={{ marginTop: '2rem' }}>
                                <button type="submit" class="btn btn-primary" style="width: 100%;" disabled={saving}>
                                    {saving ? 'Saving...' : (editing ? 'Update Mind Map' : 'Save Mind Map')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div class="table-container">
                        <div class="table-header">
                            <h3>🧠 Mind Map Repository</h3>
                            <button class="btn btn-outline btn-sm" onClick={loadMindMaps} disabled={loading}>
                                {loading ? 'Refresing...' : '🔄 Refresh'}
                            </button>
                        </div>
                    {loading ? (
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Fetching mind maps...</p>
                        </div>
                    ) : mindMaps.length === 0 ? (
                        <div class="empty-state">
                            <div class="empty-icon">🧠</div>
                            <p>No mind maps found. Create your first one!</p>
                        </div>
                    ) : (
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Std</th>
                                        <th>Unit</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mindMaps.map(item => (
                                        <tr key={item._id}>
                                            <td class="font-bold">{item.title}</td>
                                            <td>{item.subject}</td>
                                            <td>{item.std} {item.stream !== 'None' ? `(${item.stream})` : ''}</td>
                                            <td>{item.unit}</td>
                                            <td class="font-mono text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <div class="table-actions">
                                                    <button 
                                                        class="btn btn-icon btn-outline" 
                                                        title="Edit"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        class="btn btn-icon btn-outline btn-danger" 
                                                        title="Delete"
                                                        onClick={() => handleDelete(item._id)}
                                                    >
                                                        🗑️
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
            )}
            </div>
        </div>
    );
}
