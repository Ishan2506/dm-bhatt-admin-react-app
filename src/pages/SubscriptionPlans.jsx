import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { Icons } from '../components/Icons';

export function SubscriptionPlans() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ standard: '', amount: 0, description: '', isActive: true });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [error, setError] = useState('');

    const STANDARDS = ['6', '7', '8', '9', '10', '11', '12'];

    const load = () => {
        setLoading(true);
        setError('');
        api.get('/plans')
            .then(data => setPlans(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error(err);
                setError(err.message || 'Failed to load plans');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ standard: '', amount: 0, description: '', isActive: true });
        setShowModal(true);
    };

    const openEdit = (plan) => {
        setEditing(plan);
        setForm({
            standard: plan.standard,
            amount: plan.amount,
            description: plan.description || '',
            isActive: plan.isActive ?? true
        });
        setShowModal(true);
    };

    const isValidApplePrice = (amount) => {
        if (amount === 0) return true;
        
        const P = amount - 1;
        
        // Low Tiers
        if (P === 29 || P === 49) return true;

        // Standard Tiers (₹50 to ₹299): increments of ₹50
        if (P >= 99 && P <= 299) {
            return P % 50 === 49;
        }
        
        // Mid-Range Tiers (₹300 to ₹999): increments of ₹100
        if (P >= 399 && P <= 999) {
            return P % 100 === 99;
        }
        
        // Subscription/High Tiers (₹1000 to ₹24999): increments of ₹500 (with ₹1299 special tier)
        if (P === 1299) return true;
        if (P >= 1499 && P <= 24999) {
            return P % 500 === 499;
        }
        
        // Premium Tiers (₹25000+): increments of ₹5000
        if (P >= 29999) {
            return P % 5000 === 4999;
        }
        
        return false;
    };

    const handleSave = async () => {
        if (!form.standard || form.amount < 0) {
            alert('Please fill in all required fields correctly');
            return;
        }
        if (!isValidApplePrice(form.amount)) {
            alert('Invalid amount! The price does not match standard Apple tier guidelines.\n\nExamples of valid prices:\n- ₹30 (displays as ₹29)\n- ₹50 (displays as ₹49)\n- ₹100 (displays as ₹99)\n- ₹150 (displays as ₹149)\n- ₹300 (displays as ₹299)\n- ₹1500 (displays as ₹1499)\n- ₹4500 (displays as ₹4499)\n- ₹5000 (displays as ₹4999)');
            return;
        }
        setSaving(true);
        try {
            await api.post('/plans', form);
            setShowModal(false);
            load();
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (standard) => {
        if (!confirm(`Are you sure you want to delete plan for Standard ${standard}?`)) return;
        try {
            await api.del(`/plans/${standard}`);
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleInitializeDefaults = async () => {
        if (!confirm('This will initialize all plans with default prices. Continue?')) return;
        setSaving(true);
        try {
            await api.post('/plans/initialize-default', {});
            load();
            alert('Default plans initialized successfully');
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (plan) => {
        try {
            await api.post('/plans', {
                standard: plan.standard,
                amount: plan.amount,
                description: plan.description,
                isActive: !plan.isActive
            });
            load();
        } catch (err) {
            alert(err.message);
        }
    };

    const activeCount = plans.filter(p => p.isActive).length;
    return h('div', null,
        <div class="page-header">
            <div class="page-header-titles">
                <div class="page-header-eyebrow"><Icons.Gear /> Payments</div>
                <h1>Subscription Plans</h1>
                <p class="page-subtitle">Manage subscription pricing for each standard.</p>
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: '600', marginTop: '6px' }}>
                    * Note: The Student App automatically subtracts ₹1 from the set price for psychological charm pricing (e.g. ₹300 here displays as ₹299 to the student, ₹500 displays as ₹499).
                </div>
                <div class="header-metrics">
                    <div class="header-metric">
                        <span class="hm-value">{plans.length}</span>
                        <span class="hm-label">Plans</span>
                    </div>
                    <div class="header-metric">
                        <span class="hm-value">{activeCount}</span>
                        <span class="hm-label">Active</span>
                    </div>
                </div>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-outline" onClick={handleInitializeDefaults} disabled={saving || loading}>
                    <Icons.Refresh /> Initialize Defaults
                </button>
                <button class="btn btn-primary" onClick={openAdd}>
                    <Icons.Plus /> Add Plan
                </button>
            </div>
        </div>,

        error && <div class="error-state" style="margin-bottom:1rem;">{error}</div>,

        <div class="table-container">
            {loading ? (
                <div class="loading-spinner" />
            ) : !plans || plans.length === 0 ? (
                <div class="empty-state">
                    <div class="empty-state-icon"><Icons.Gear /></div>
                    <h3>No plans yet</h3>
                    <p>Add a plan or initialize the defaults to get started.</p>
                </div>
            ) : (
                <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Plan</th>
                                <th>Amount</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan._id}>
                                    <td>
                                        <div class="identity">
                                            <div class="avatar avatar-sm" style={{ background: 'var(--primary)' }}>{plan.standard}</div>
                                            <div class="identity-name">Standard {plan.standard}</div>
                                        </div>
                                    </td>
                                    <td><span class="amount" style="color:var(--text-primary);">₹{plan.amount}</span></td>
                                    <td class="text-muted">{plan.description || '—'}</td>
                                    <td>
                                        <span class={`badge ${plan.isActive ? 'badge-success' : 'badge-danger'}`}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="td-actions" style="justify-content:flex-end;">
                                            <button class="icon-btn" title={plan.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleActive(plan)}>
                                                <Icons.Eye />
                                            </button>
                                            <button class="icon-btn primary" title="Edit" onClick={() => openEdit(plan)}>
                                                <Icons.Edit />
                                            </button>
                                            <button class="icon-btn danger" title="Delete" onClick={() => handleDelete(plan.standard)}>
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
        </div>,

        showModal && h(Modal, {
            title: editing ? `Edit Plan - Standard ${editing.standard}` : 'Add New Plan',
            onClose: () => setShowModal(false),
            footer: h(Fragment, null,
                h('button', {
                    class: 'btn btn-outline',
                    onClick: () => setShowModal(false)
                }, 'Cancel'),
                h('button', {
                    class: 'btn btn-primary',
                    onClick: handleSave,
                    disabled: saving
                }, saving ? 'Saving...' : editing ? 'Update' : 'Create')
            )
        },
            h('div', { class: 'form-group' },
                h('label', null, 'Standard'),
                h('select', {
                    value: form.standard,
                    disabled: !!editing,
                    onChange: (e) => setForm({ ...form, standard: e.target.value }),
                    class: 'form-control'
                },
                    h('option', { value: '' }, 'Select Standard'),
                    ...STANDARDS.map(std =>
                        h('option', { value: std, key: std }, `Standard ${std}`)
                    )
                )
            ),
            h('div', { class: 'form-group' },
                h('label', null, 'Amount (₹)'),
                h('input', {
                    type: 'number',
                    value: form.amount,
                    onChange: (e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 }),
                    class: 'form-control',
                    min: '0',
                    step: '1'
                }),
                h('div', { style: { color: '#dc2626', fontSize: '0.75rem', marginTop: '6px', fontWeight: '600' } },
                    '* Note: Student app automatically subtracts ₹1. Entered amount must match standard Apple pricing tiers (e.g. 30, 50, 100, 150, 300, 1500, 4500, 5000).'
                )
            ),
            h('div', { class: 'form-group' },
                h('label', null, 'Description'),
                h('input', {
                    type: 'text',
                    value: form.description,
                    onChange: (e) => setForm({ ...form, description: e.target.value }),
                    class: 'form-control',
                    placeholder: 'e.g., Standard 10 - Science'
                })
            ),
            h('div', { class: 'form-group' },
                h('label', null,
                    h('input', {
                        type: 'checkbox',
                        checked: form.isActive,
                        onChange: (e) => setForm({ ...form, isActive: e.target.checked })
                    }),
                    ' Active'
                )
            )
        )
    );
}
