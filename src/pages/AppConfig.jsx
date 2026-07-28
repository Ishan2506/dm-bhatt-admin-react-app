import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    studentMinAndroidVersion: '1',
    studentMinIosVersion: '1',
    studentPlayStoreUrl: 'https://play.store.url',
    studentAppStoreUrl: 'https://app.store.url',
    adminMinAndroidVersion: '1',
    adminMinIosVersion: '1',
    adminPlayStoreUrl: 'https://play.store.url',
    adminAppStoreUrl: 'https://app.store.url',
    forceUpdateMessage: 'A new version of the app is available. Please update to continue using the app.',
    maxDevices: '1',
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
            // Guard the device limit: an empty or zero value would otherwise be
            // written to config and read by the API as "not configured".
            const maxDevices = parseInt(form.maxDevices, 10);
            if (!Number.isFinite(maxDevices) || maxDevices < 1) {
                alert('Maximum devices per student must be at least 1.');
                setSaving(false);
                return;
            }

            await api.post('/config/app', { ...form, maxDevices });
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
                <div class="page-header">
                    <div class="page-header-titles">
                        <div class="page-header-eyebrow"><Icons.Gear /> Configuration</div>
                        <h1>App Settings</h1>
                        <p class="page-subtitle">Manage device login limits, minimum required app versions, and store links for the Student and Admin applications.</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>
                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.Shield /></div>
                            <div>
                                <h3 class="config-section-title">Device Login Limit</h3>
                                <p class="config-section-desc">How many devices a student can stay logged in on at the same time. When the limit is reached, logging in on a new device is blocked until they log out elsewhere.</p>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom:0;max-width:320px;">
                            <label>Maximum Devices Per Student</label>
                            <input
                                class="form-control"
                                type="number"
                                min="1"
                                max="10"
                                placeholder="e.g. 2"
                                {...f('maxDevices')}
                            />
                            <small style="display:block;margin-top:0.5rem;color:#6b7280;">
                                Set to 1 to allow only one device at a time. Existing logins are not affected until those students log out or their session expires. Admins are never limited.
                            </small>
                        </div>
                    </div>

                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.User /></div>
                            <div>
                                <h3 class="config-section-title">Student App</h3>
                                <p class="config-section-desc">Version requirements and store links for the main Student Application.</p>
                            </div>
                        </div>
                        <div class="config-grid">
                            <div class="form-group">
                                <label>Minimum Android Version (Build Number)</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('studentMinAndroidVersion')} />
                            </div>
                            <div class="form-group">
                                <label>Minimum iOS Version (Build Number)</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('studentMinIosVersion')} />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Play Store URL (Android)</label>
                                <input class="form-control" type="text" placeholder="https://play.google.com/store/apps/details?id=com.example.app" {...f('studentPlayStoreUrl')} />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>App Store URL (iOS)</label>
                                <input class="form-control" type="text" placeholder="https://apps.apple.com/us/app/example/id123456789" {...f('studentAppStoreUrl')} />
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.Shield /></div>
                            <div>
                                <h3 class="config-section-title">Assistant / Admin App</h3>
                                <p class="config-section-desc">Version requirements and store links for the Admin Application.</p>
                            </div>
                        </div>
                        <div class="config-grid">
                            <div class="form-group">
                                <label>Minimum Android Version (Build Number)</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('adminMinAndroidVersion')} />
                            </div>
                            <div class="form-group">
                                <label>Minimum iOS Version (Build Number)</label>
                                <input class="form-control" type="number" placeholder="e.g. 10" {...f('adminMinIosVersion')} />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Play Store URL (Android)</label>
                                <input class="form-control" type="text" placeholder="https://play.google.com/store/apps/details?id=com.example.admin" {...f('adminPlayStoreUrl')} />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>App Store URL (iOS)</label>
                                <input class="form-control" type="text" placeholder="https://apps.apple.com/us/app/example/id123456789" {...f('adminAppStoreUrl')} />
                            </div>
                        </div>
                    </div>

                    <div class="config-section">
                        <div class="config-section-head">
                            <div class="config-section-badge"><Icons.Notification /></div>
                            <div>
                                <h3 class="config-section-title">Force Update Message</h3>
                                <p class="config-section-desc">Text shown to users on the force update screen for both apps.</p>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <textarea class="form-control" rows="3" placeholder="e.g. A new version of the app is available. Please update to continue using the app." {...f('forceUpdateMessage')} />
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
