import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    pointsPerReferral: 50,
    maxReferralsAllowed: 10,
};

export function ReferAndEarnConfig() {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/config/referral')
            .then(res => { if (res) setForm({ ...defaultForm, ...res }); })
            .catch(() => {}) // Silently fail if config not yet saved
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.post('/config/referral', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to save referral configuration');
        } finally {
            setSaving(false);
        }
    };

    const f = (key) => ({
        value: form[key],
        onInput: (e) => setForm({ ...form, [key]: Number(e.target.value) })
    });

    if (loading) return <div style="padding:2rem;text-align:center;">Loading configuration...</div>;

    return (
        <div>
            <div class="config-page">
                <div class="page-header">
                    <div class="page-header-titles">
                        <div class="page-header-eyebrow"><Icons.User /> Configuration</div>
                        <h1>Refer & Earn</h1>
                        <p class="page-subtitle">Manage dynamic limits and rewards for the referral program.</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.Sparkles /></div>
                            <div>
                                <h3 class="config-section-title">Referral Program Rules</h3>
                                <p class="config-section-desc">Set limits on how many people a user can refer and how many points they get.</p>
                            </div>
                        </div>
                        <div class="config-grid">
                            <div class="form-group">
                                <label>Points Per Referral</label>
                                <input class="form-control" type="number" placeholder="e.g. 50" {...f('pointsPerReferral')} />
                            </div>
                            <div class="form-group">
                                <label>Max Referrals Allowed per User</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('maxReferralsAllowed')} />
                            </div>
                        </div>
                    </div>

                    <div class="sticky-actions">
                        {saved && (
                            <span class="save-success"><Icons.Success /> Saved successfully</span>
                        )}
                        <button class="btn btn-primary btn-lg" type="submit" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
