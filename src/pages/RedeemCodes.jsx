import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

const STANDARDS = ['6', '7', '8', '9', '10', '11', '12'];
const MEDIUMS = ['English', 'Gujarati'];
const STREAMS = ['Science', 'Commerce'];

const emptyForm = {
    code: '', // optional custom code name; blank = auto-generated
    discount: 10,
    discountType: 'percentage',
    board: '',
    std: '',
    medium: '',
    stream: '',
    usageType: 'single', // 'single' | 'multiple'
    maxUses: '', // blank = unlimited when usageType is 'multiple'
    expiresAt: '' // blank = never expires
};

export function RedeemCodes() {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [revokeConfirm, setRevokeConfirm] = useState(null);
    const [revoking, setRevoking] = useState(false);
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
        if (!form.discount || form.discount < 1) {
            alert('Discount must be at least 1');
            return;
        }
        if (form.discountType === 'percentage' && form.discount > 70) {
            alert('Percentage discount cannot exceed 70%');
            return;
        }
        const customCode = form.code.trim().toUpperCase();
        if (customCode && !/^[A-Z0-9]{3,20}$/.test(customCode)) {
            alert('Custom code must be 3-20 letters/numbers only');
            return;
        }
        if (form.expiresAt && new Date(form.expiresAt) <= new Date()) {
            alert('Expiry date must be in the future');
            return;
        }

        // maxUses: single-use -> 1, multiple with blank field -> unlimited (0), multiple with a value -> that cap
        let maxUses = 1;
        if (form.usageType === 'multiple') {
            maxUses = form.maxUses === '' ? 0 : parseInt(form.maxUses, 10) || 0;
        }

        setSaving(true);
        try {
            await api.post('/admin/generate-redeem-code', {
                code: customCode || undefined,
                discount: form.discount,
                discountType: form.discountType,
                board: form.board || undefined,
                std: form.std || undefined,
                medium: form.medium || undefined,
                stream: form.stream || undefined,
                createdBy: getCreatorName(),
                maxUses,
                expiresAt: form.expiresAt || undefined
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

    const handleRevoke = async (id) => {
        setRevoking(true);
        try {
            await api.put(`/admin/revoke-redeem-code/${id}`, {}, { noPrefix: true });
            setRevokeConfirm(null);
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setRevoking(false);
        }
    };

    const activeCodes = codes.filter(c => {
        const isUnlimited = !c.maxUses || c.maxUses <= 0;
        const exhausted = !isUnlimited && (c.usedCount || 0) >= c.maxUses;
        const expired = !!c.expiresAt && new Date(c.expiresAt) <= new Date();
        return !c.revoked && !expired && !exhausted;
    }).length;

    return (
        <div>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Sparkles /> Payments</div>
                    <h1>Redeem Codes</h1>
                    <p class="page-subtitle">Create and track promotional discount codes for students.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{codes.length}</span>
                            <span class="hm-label">Total</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{activeCodes}</span>
                            <span class="hm-label">Available</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onClick={openAdd}>
                        <Icons.Plus /> Generate Code
                    </button>
                </div>
            </div>

            <div class="table-container">
                {error && <div class="error-state" style="margin:1rem;">{error}</div>}

                {loading ? (
                    <div class="loading-spinner" />
                ) : codes.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Sparkles /></div>
                        <h3>No redeem codes yet</h3>
                        <p>Generate your first promotional code to offer discounts.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Scope</th>
                                <th>Usage</th>
                                <th>Expires</th>
                                <th>Created By</th>
                                <th>Status</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map((c) => {
                                const isUnlimited = !c.maxUses || c.maxUses <= 0;
                                const usedCount = c.usedCount || 0;
                                const exhausted = !isUnlimited && usedCount >= c.maxUses;
                                const expired = !!c.expiresAt && new Date(c.expiresAt) <= new Date();
                                const usageLabel = c.maxUses === 1
                                    ? 'Single-use'
                                    : isUnlimited
                                        ? `${usedCount} used · unlimited`
                                        : `${usedCount} / ${c.maxUses} used`;
                                const revoked = !!c.revoked;
                                const statusLabel = revoked ? 'Revoked' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Available';
                                const inactive = revoked || expired || exhausted;
                                const scope = [c.std, c.medium, c.stream].filter(Boolean).join(' · ') || 'Any';
                                return (
                                    <tr key={c._id}>
                                        <td>
                                            <span class="font-mono" style="font-weight:700;letter-spacing:1px;color:var(--text-primary);background:var(--bg-subtle-2);padding:3px 8px;border-radius:var(--radius-sm);">{c.code}</span>
                                        </td>
                                        <td style="font-weight:600;color:var(--text-primary);">{c.discountType === 'flat' ? `₹${c.discount}` : `${c.discount}%`}</td>
                                        <td><span class="cell-chip">{scope}</span></td>
                                        <td class="text-muted">{usageLabel}</td>
                                        <td class="text-muted" style="font-size:var(--font-xs);">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}</td>
                                        <td class="text-muted">{c.createdBy}</td>
                                        <td>
                                            <span class={`badge ${inactive ? 'badge-danger' : 'badge-success'}`}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td>
                                            <div class="td-actions" style="justify-content:flex-end;">
                                                {!revoked && (
                                                    <button
                                                        class="btn btn-outline btn-sm"
                                                        title="Revoke this code so it can no longer be redeemed"
                                                        onClick={() => setRevokeConfirm(c)}
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                                <button
                                                    class="icon-btn danger"
                                                    title={usedCount > 0 ? 'Cannot delete a code that has been used' : 'Delete'}
                                                    onClick={() => setDeleteConfirm(c)}
                                                >
                                                    <Icons.Trash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
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
                        <label>Code Name (optional - leave blank to auto-generate)</label>
                        <input
                            type="text"
                            class="form-control"
                            placeholder="e.g. DIWALI50"
                            maxLength={20}
                            value={form.code}
                            onInput={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                        />
                    </div>
                    <div class="form-group">
                        <label>Discount Type</label>
                        <select
                            class="form-control"
                            value={form.discountType}
                            onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat Amount (₹)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>{form.discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount (%)'}</label>
                        <input
                            type="number"
                            class="form-control"
                            min="1"
                            max={form.discountType === 'percentage' ? '70' : undefined}
                            value={form.discount}
                            onInput={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div class="form-group">
                        <label>Usage Type</label>
                        <select
                            class="form-control"
                            value={form.usageType}
                            onChange={(e) => setForm({ ...form, usageType: e.target.value })}
                        >
                            <option value="single">Single-use (one redemption total)</option>
                            <option value="multiple">Multiple-use</option>
                        </select>
                    </div>
                    {form.usageType === 'multiple' && (
                        <div class="form-group">
                            <label>Max Uses (leave blank for unlimited)</label>
                            <input
                                type="number"
                                class="form-control"
                                min="1"
                                placeholder="Unlimited"
                                value={form.maxUses}
                                onInput={(e) => setForm({ ...form, maxUses: e.target.value })}
                            />
                        </div>
                    )}
                    <div class="form-group">
                        <label>Expiry Date (optional - leave blank to never expire)</label>
                        <input
                            type="date"
                            class="form-control"
                            min={new Date().toISOString().split('T')[0]}
                            value={form.expiresAt}
                            onInput={(e) => setForm({ ...form, expiresAt: e.target.value })}
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

            {revokeConfirm && (
                <Modal
                    title="Revoke Redeem Code"
                    onClose={() => setRevokeConfirm(null)}
                    footer={
                        <>
                            <button class="btn btn-outline" onClick={() => setRevokeConfirm(null)}>Cancel</button>
                            <button class="btn btn-danger" onClick={() => handleRevoke(revokeConfirm._id)} disabled={revoking}>
                                {revoking ? 'Revoking...' : 'Revoke'}
                            </button>
                        </>
                    }
                >
                    <p class="confirm-message">
                        Revoke redeem code <strong>"{revokeConfirm.code}"</strong>? Nobody will be able to redeem it
                        again. The code and its usage history stay on record, and students who already used it keep
                        their discount. This cannot be undone.
                    </p>
                </Modal>
            )}

            {deleteConfirm && (deleteConfirm.usedCount || 0) > 0 ? (
                <Modal
                    title="Cannot Delete Redeem Code"
                    onClose={() => setDeleteConfirm(null)}
                    footer={
                        <button class="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Close</button>
                    }
                >
                    <p class="confirm-message">
                        Redeem code <strong>"{deleteConfirm.code}"</strong> has already been redeemed{' '}
                        {deleteConfirm.usedCount === 1 ? 'once' : `${deleteConfirm.usedCount} times`}, so it cannot be
                        deleted. Deleting it would break the discount records of the students who used it.
                    </p>
                </Modal>
            ) : deleteConfirm && (
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
