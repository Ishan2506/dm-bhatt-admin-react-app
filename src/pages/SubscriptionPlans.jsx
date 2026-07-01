import { h } from 'preact';
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

    const handleSave = async () => {
        if (!form.standard || form.amount < 0) {
            alert('Please fill in all required fields correctly');
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
            await api.delete(`/plans/${standard}`);
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

    return h('div', { class: 'page' },
        h('div', { class: 'page-header' },
            h('div', null,
                h('h1', null, 'Subscription Plans'),
                h('p', null, 'Manage pricing for each standard')
            ),
            h('div', { class: 'button-group' },
                h('button', {
                    class: 'btn btn-secondary',
                    onClick: handleInitializeDefaults,
                    disabled: saving || loading
                }, h(Icons.RotateCcw, null), ' Initialize Defaults'),
                h('button', {
                    class: 'btn btn-primary',
                    onClick: openAdd
                }, h(Icons.Plus, null), ' Add Plan')
            )
        ),

        error && h('div', { class: 'alert alert-danger' }, error),

        loading ? h('div', { class: 'loading' }, 'Loading plans...') :
            h('table', { class: 'data-table' },
                h('thead', null,
                    h('tr', null,
                        h('th', null, 'Standard'),
                        h('th', null, 'Amount (₹)'),
                        h('th', null, 'Description'),
                        h('th', null, 'Status'),
                        h('th', null, 'Actions')
                    )
                ),
                h('tbody', null,
                    plans && plans.length > 0 ? plans.map(plan =>
                        h('tr', { key: plan._id },
                            h('td', null, `Standard ${plan.standard}`),
                            h('td', { style: 'text-align: right' }, `₹${plan.amount}`),
                            h('td', null, plan.description || '-'),
                            h('td', null,
                                h('span', {
                                    class: `badge ${plan.isActive ? 'badge-success' : 'badge-danger'}`
                                }, plan.isActive ? 'Active' : 'Inactive')
                            ),
                            h('td', { class: 'action-buttons' },
                                h('button', {
                                    class: 'btn btn-sm btn-info',
                                    onClick: () => toggleActive(plan),
                                    title: plan.isActive ? 'Deactivate' : 'Activate'
                                }, h(Icons.Eye, null)),
                                h('button', {
                                    class: 'btn btn-sm btn-warning',
                                    onClick: () => openEdit(plan)
                                }, h(Icons.Edit, null)),
                                h('button', {
                                    class: 'btn btn-sm btn-danger',
                                    onClick: () => handleDelete(plan.standard)
                                }, h(Icons.Trash, null))
                            )
                        )
                    ) : h('tr', null, h('td', { colSpan: 5, style: 'text-align: center' }, 'No plans found'))
                )
            ),

        showModal && h(Modal, {
            title: editing ? `Edit Plan - Standard ${editing.standard}` : 'Add New Plan',
            onClose: () => setShowModal(false),
            onSave: handleSave,
            saving
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
                })
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
