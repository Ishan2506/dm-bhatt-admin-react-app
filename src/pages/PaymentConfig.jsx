import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    razorpayKeyId: '',
    razorpayKeySecret: '',
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
                        <p class="config-subtitle">Manage payment gateway credentials</p>
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
