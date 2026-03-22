import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    razorpayKeyId: '',
    razorpayKeySecret: '',
    currency: 'INR',
    studentPlanPrice: '',
    guestPlanPrice: '',
    trialDays: '',
    taxPercent: '',
    paymentDescription: '',
};

export function PaymentConfig() {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/config/payment')
            .then(res => { if (res) setForm({ ...defaultForm, ...res }); })
            .catch(() => {}) // Silently fail if config not yet saved
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.post('/config/payment', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to save payment configuration');
        } finally {
            setSaving(false);
        }
    };

    const f = (key) => ({
        value: form[key],
        onInput: (e) => setForm({ ...form, [key]: e.target.value })
    });

    if (loading) return <div style="padding:2rem;text-align:center;">Loading configuration...</div>;

    return (
        <div>
            <div class="config-page">
                <div class="config-header">
                    <div class="config-header-icon"><Icons.Gear /></div>
                    <div>
                        <h2 class="config-title">Payment Configuration</h2>
                        <p class="config-subtitle">Manage payment gateway credentials and pricing settings</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div class="config-section">
                        <h3 class="config-section-title">Gateway Credentials</h3>
                        <p class="config-section-desc">Razorpay API keys for processing payments</p>
                        <div class="config-grid">
                            <div class="form-group">
                                <label>Razorpay Key ID</label>
                                <input class="form-control" type="text" placeholder="rzp_live_..." {...f('razorpayKeyId')} />
                            </div>
                            <div class="form-group">
                                <label>Razorpay Key Secret</label>
                                <input class="form-control" type="password" placeholder="••••••••••••" {...f('razorpayKeySecret')} />
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <h3 class="config-section-title">Pricing & Plans</h3>
                        <p class="config-section-desc">Set your subscription and pricing values</p>
                        <div class="config-grid">
                            <div class="form-group">
                                <label>Currency</label>
                                <select class="form-control" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                                    <option value="INR">INR (₹)</option>
                                    <option value="USD">USD ($)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Student Plan Price (₹)</label>
                                <input class="form-control" type="number" placeholder="e.g. 999" {...f('studentPlanPrice')} />
                            </div>
                            <div class="form-group">
                                <label>Guest Plan Price (₹)</label>
                                <input class="form-control" type="number" placeholder="e.g. 499" {...f('guestPlanPrice')} />
                            </div>
                            <div class="form-group">
                                <label>Trial Days</label>
                                <input class="form-control" type="number" placeholder="e.g. 7" {...f('trialDays')} />
                            </div>
                            <div class="form-group">
                                <label>Tax / GST (%)</label>
                                <input class="form-control" type="number" placeholder="e.g. 18" {...f('taxPercent')} />
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <h3 class="config-section-title">Payment Description</h3>
                        <p class="config-section-desc">Text shown to users on the payment screen</p>
                        <div class="form-group">
                            <textarea class="form-control" rows="3" placeholder="e.g. Padhaku Premium — Unlimited access to study materials" {...f('paymentDescription')} />
                        </div>
                    </div>

                    <div class="config-footer">
                        {saved && (
                            <span class="save-success"><Icons.Success /> Saved successfully!</span>
                        )}
                        <button class="btn btn-primary" type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
