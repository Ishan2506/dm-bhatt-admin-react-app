import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

const defaultForm = {
    whatsappEnabled: false,
    whatsappApiKey: '',
    whatsappSenderId: '',
    whatsappTemplate: '',
    smsEnabled: false,
    smsApiKey: '',
    smsSenderId: '',
    smsTemplate: '',
    emailEnabled: false,
    emailHost: '',
    emailPort: '',
    emailUser: '',
    emailPassword: '',
    emailFromName: '',
    notifyOnNewStudent: true,
    notifyOnPayment: true,
    notifyOnPlanUpgrade: true,
};

export function NotificationConfig() {
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pushForm, setPushForm] = useState({ title: '', body: '' });
    const [sendingPush, setSendingPush] = useState(false);
    const [pushSent, setPushSent] = useState(false);

    useEffect(() => {
        api.get('/config/notification')
            .then(res => { if (res) setForm({ ...defaultForm, ...res }); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaved(false);
        try {
            await api.post('/config/notification', form);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to save notification configuration');
        } finally {
            setSaving(false);
        }
    };

    const f = (key) => ({
        value: form[key],
        onInput: (e) => setForm({ ...form, [key]: e.target.value })
    });

    const toggle = (key) => setForm(prev => ({ ...prev, [key]: !prev[key] }));

    const handleSendPush = async (e) => {
        e.preventDefault();
        if (!pushForm.title || !pushForm.body) return alert('Please enter both title and message');
        setSendingPush(true);
        try {
            await api.post('/push-notifications', pushForm);
            setPushSent(true);
            setPushForm({ title: '', body: '' });
            setTimeout(() => setPushSent(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to send notification');
        } finally {
            setSendingPush(false);
        }
    };

    if (loading) return <div style="padding:2rem;text-align:center;">Loading configuration...</div>;

    return (
        <div>
            <div class="config-page">
                <div class="config-header">
                    <div class="config-header-icon"><Icons.Notification /></div>
                    <div>
                        <h2 class="config-title">Notification Configuration</h2>
                        <p class="config-subtitle">Configure WhatsApp, SMS, and Email notification channels</p>
                    </div>
                </div>

                <form onSubmit={handleSave}>

                    {/* --- WhatsApp --- */}
                    <div class="config-section">
                        <div class="config-section-header">
                            <div>
                                <h3 class="config-section-title">WhatsApp Notifications</h3>
                                <p class="config-section-desc">Send automated WhatsApp messages via your API provider</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked={form.whatsappEnabled} onChange={() => toggle('whatsappEnabled')} />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        {form.whatsappEnabled && (
                            <div class="config-grid">
                                <div class="form-group">
                                    <label>API Key</label>
                                    <input class="form-control" type="password" placeholder="••••••••••" {...f('whatsappApiKey')} />
                                </div>
                                <div class="form-group">
                                    <label>Sender ID</label>
                                    <input class="form-control" type="text" placeholder="e.g. +91xxxxxxxxxx" {...f('whatsappSenderId')} />
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label>Message Template</label>
                                    <textarea class="form-control" rows="3" placeholder="e.g. Hello {{name}}, your payment of ₹{{amount}} is confirmed." {...f('whatsappTemplate')} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- SMS --- */}
                    <div class="config-section">
                        <div class="config-section-header">
                            <div>
                                <h3 class="config-section-title">SMS Notifications</h3>
                                <p class="config-section-desc">Send SMS alerts via your SMS gateway provider</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked={form.smsEnabled} onChange={() => toggle('smsEnabled')} />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        {form.smsEnabled && (
                            <div class="config-grid">
                                <div class="form-group">
                                    <label>API Key</label>
                                    <input class="form-control" type="password" placeholder="••••••••••" {...f('smsApiKey')} />
                                </div>
                                <div class="form-group">
                                    <label>Sender ID</label>
                                    <input class="form-control" type="text" placeholder="e.g. PADHAK" {...f('smsSenderId')} />
                                </div>
                                <div class="form-group" style="grid-column: span 2;">
                                    <label>Message Template</label>
                                    <textarea class="form-control" rows="3" placeholder="e.g. Dear {{name}}, your account is active. Padhaku" {...f('smsTemplate')} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Email --- */}
                    <div class="config-section">
                        <div class="config-section-header">
                            <div>
                                <h3 class="config-section-title">Email Notifications</h3>
                                <p class="config-section-desc">Configure SMTP server for email delivery</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" checked={form.emailEnabled} onChange={() => toggle('emailEnabled')} />
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        {form.emailEnabled && (
                            <div class="config-grid">
                                <div class="form-group">
                                    <label>SMTP Host</label>
                                    <input class="form-control" type="text" placeholder="e.g. smtp.gmail.com" {...f('emailHost')} />
                                </div>
                                <div class="form-group">
                                    <label>SMTP Port</label>
                                    <input class="form-control" type="number" placeholder="e.g. 587" {...f('emailPort')} />
                                </div>
                                <div class="form-group">
                                    <label>Email Username</label>
                                    <input class="form-control" type="email" placeholder="yourname@gmail.com" {...f('emailUser')} />
                                </div>
                                <div class="form-group">
                                    <label>Email Password</label>
                                    <input class="form-control" type="password" placeholder="••••••••" {...f('emailPassword')} />
                                </div>
                                <div class="form-group">
                                    <label>From Name</label>
                                    <input class="form-control" type="text" placeholder="e.g. Padhaku Team" {...f('emailFromName')} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- Send Push Notification --- */}
                    <div class="config-section">
                        <h3 class="config-section-title">Send Push Notification</h3>
                        <p class="config-section-desc">Write a message to send a push notification to all student apps</p>
                        
                        <div class="config-grid" style="margin-top: 1.5rem;">
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Notification Title</label>
                                <input 
                                    class="form-control" 
                                    type="text" 
                                    placeholder="Enter title..." 
                                    value={pushForm.title}
                                    onInput={(e) => setPushForm({ ...pushForm, title: e.target.value })}
                                />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Notification Subtitle / Message</label>
                                <textarea 
                                    class="form-control" 
                                    rows="3" 
                                    placeholder="Enter message body..." 
                                    value={pushForm.body}
                                    onInput={(e) => setPushForm({ ...pushForm, body: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                            <button 
                                type="button" 
                                class="btn btn-primary" 
                                onClick={handleSendPush}
                                disabled={sendingPush}
                            >
                                {sendingPush ? 'Sending...' : 'Send to All Students'}
                            </button>
                            {pushSent && (
                                <span class="save-success" style="margin:0;"><Icons.Success /> Notification sent!</span>
                            )}
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
