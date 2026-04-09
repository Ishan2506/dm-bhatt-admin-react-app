import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    minAndroidVersion: '1',
    minIosVersion: '1',
    playStoreUrl: 'https://play.store.url',
    appStoreUrl: 'https://app.store.url',
    forceUpdateMessage: 'A new version of the app is available. Please update to continue using the app.',
};

export function AppConfig() {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/config/app')
            .then(res => { if (res) setForm({ ...defaultForm, ...res }); })
            .catch(() => {}) // Silently fail if config not yet saved
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.post('/config/app', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to save app configuration');
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
                        <h2 class="config-title">App Version Configuration</h2>
                        <p class="config-subtitle">Manage minimum required app version and store links</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div class="config-section">
                        <h3 class="config-section-title">Force Update Configuration</h3>
                        <p class="config-section-desc">App versions below these minimums will be forced to update.</p>
                        <div class="config-grid">
                            <div class="form-group">
                                <label>Minimum Android Version (Build Number)</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('minAndroidVersion')} />
                            </div>
                            <div class="form-group">
                                <label>Minimum iOS Version (Build Number)</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('minIosVersion')} />
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <h3 class="config-section-title">Store Links</h3>
                        <p class="config-section-desc">URLs where users will be redirected to update their app.</p>
                        <div class="config-grid">
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Play Store URL (Android)</label>
                                <input class="form-control" type="text" placeholder="https://play.google.com/store/apps/details?id=com.example.app" {...f('playStoreUrl')} />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>App Store URL (iOS)</label>
                                <input class="form-control" type="text" placeholder="https://apps.apple.com/us/app/example/id123456789" {...f('appStoreUrl')} />
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <h3 class="config-section-title">Update Message</h3>
                        <p class="config-section-desc">Text shown to users on the force update screen</p>
                        <div class="form-group">
                            <textarea class="form-control" rows="3" placeholder="e.g. A new version of the app is available. Please update to continue using the app." {...f('forceUpdateMessage')} />
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
