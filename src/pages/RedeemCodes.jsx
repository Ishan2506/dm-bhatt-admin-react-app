import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

const STANDARDS = ['6', '7', '8', '9', '10', '11', '12'];
const MEDIUMS = ['English', 'Gujarati'];
const STREAMS = ['Science', 'Commerce'];

const emptyForm = { discount: 10, board: '', std: '', medium: '', stream: '' };

export function RedeemCodes() {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        setError('');
        api.get('/admin/redeem-codes', { noPrefix: true })
            .then(data => setCodes(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error(err);
                setError(err.message || 'Failed to load redeem codes');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const getCreatorName = () => {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            return userData.firstName || userData.name || userData.phoneNum || 'Admin';
        } catch {
            return 'Admin';
        }
    };

    const openAdd = () => {
        setForm(emptyForm);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.discount || form.discount < 1 || form.discount > 70) {
            alert('Discount must be between 1 and 70');
            return;
        }
        setSaving(true);
        try {
            await api.post('/admin/generate-redeem-code', {
                discount: form.discount,
                board: form.board || undefined,
                std: form.std || undefined,
                medium: form.medium || undefined,
                stream: form.stream || undefined,
                createdBy: getCreatorName()
            }, { noPrefix: true });
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
            await api.del(`/admin/delete-redeem-code/${id}`, { noPrefix: true });
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
                    <h3><Icons.Sparkles /> Redeem Codes</h3>
                    <button class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Generate Code
                    </button>
                </div>

                {error && <div class="alert alert-danger">{error}</div>}

                {loading ? (
                    <div class="loading-spinner" />
                ) : codes.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Sparkles /></div>
                        <p>No redeem codes yet. Generate your first code!</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Standard</th>
                                <th>Medium</th>
                                <th>Stream</th>
                                <th>Created By</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map((c) => (
                                <tr key={c._id}>
                                    <td style="font-weight: 600; letter-spacing: 1px;">{c.code}</td>
                                    <td>{c.discount}%</td>
                                    <td>{c.std || 'Any'}</td>
                                    <td>{c.medium || 'Any'}</td>
                                    <td>{c.stream || 'Any'}</td>
                                    <td>{c.createdBy}</td>
                                    <td>
                                        <span class={`badge ${c.used ? 'badge-danger' : 'badge-success'}`}>
                                            {c.used ? 'Used' : 'Available'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            <button
                                                class="btn btn-danger btn-sm"
                                                disabled={c.used}
                                                title={c.used ? 'Cannot delete a used code' : 'Delete'}
                                                onClick={() => setDeleteConfirm(c)}
                                            >
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
                    title="Generate Redeem Code"
                    onClose={() => setShowModal(false)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                            <button class="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Generating...' : 'Generate'}
                            </button>
                        </>
                    }
                >
                    <div class="form-group">
                        <label>Discount (%)</label>
                        <input
                            type="number"
                            class="form-control"
                            min="1"
                            max="70"
                            value={form.discount}
                            onInput={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div class="form-group">
                        <label>Standard (optional - restricts code to this standard)</label>
                        <select
                            class="form-control"
                            value={form.std}
                            onChange={(e) => setForm({ ...form, std: e.target.value })}
                        >
                            <option value="">Any Standard</option>
                            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Medium (optional)</label>
                        <select
                            class="form-control"
                            value={form.medium}
                            onChange={(e) => setForm({ ...form, medium: e.target.value })}
                        >
                            <option value="">Any Medium</option>
                            {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Stream (optional)</label>
                        <select
                            class="form-control"
                            value={form.stream}
                            onChange={(e) => setForm({ ...form, stream: e.target.value })}
                        >
                            <option value="">Any Stream</option>
                            {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </Modal>
            )}

            {deleteConfirm && (
                <Modal
                    title="Delete Redeem Code"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
                        </>
                    }
                >
                    <p class="confirm-message">
                        Are you sure you want to delete redeem code <strong>"{deleteConfirm.code}"</strong>?
                    </p>
                </Modal>
            )}
        </div>
    );
}
