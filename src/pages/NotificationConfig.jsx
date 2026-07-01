import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { AdvancedDateTimePicker } from '../components/AdvancedDateTimePicker';

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
    const [pushForm, setPushForm] = useState({ title: '', body: '', std: 'all' });
    const [sendingPush, setSendingPush] = useState(false);
    const [pushSent, setPushSent] = useState(false);
    const [standards, setStandards] = useState([]);
    const [activeTab, setActiveTab] = useState('immediate');
    const [scheduledForm, setScheduledForm] = useState({ title: '', body: '', std: 'all', scheduledTime: '' });
    const [schedulingPush, setSchedulingPush] = useState(false);
    const [scheduledPushSent, setScheduledPushSent] = useState(false);
    const [birthdayConfig, setBirthdayConfig] = useState({ enableBirthdayNotification: false, birthdayNotificationTitle: '', birthdayNotificationBody: '', enableBirthdayEmail: false, birthdayEmailSubject: '', birthdayEmailTemplate: '' });
    const [savingBirthday, setSavingBirthday] = useState(false);
    const [birthdaySaved, setBirthdaySaved] = useState(false);

    useEffect(() => {
        api.get('/config/notification')
            .then(res => { if (res) setForm({ ...defaultForm, ...res }); })
            .catch(() => {})
            .finally(() => setLoading(false));

        api.get('/standards')
            .then(res => {
                if (res && Array.isArray(res)) {
                    const stdNames = res.map(s => s.name || s).sort((a, b) => {
                        const aNum = parseInt(a);
                        const bNum = parseInt(b);
                        return aNum - bNum;
                    });
                    setStandards(stdNames);
                }
            })
            .catch(err => console.error('Failed to load standards:', err));

        api.get('/config/birthday-notification')
            .then(res => { if (res) setBirthdayConfig(res); })
            .catch(() => {});
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
            setPushForm({ title: '', body: '', std: 'all' });
            setTimeout(() => setPushSent(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to send notification');
        } finally {
            setSendingPush(false);
        }
    };

    const handleSchedulePush = async (e) => {
        e.preventDefault();
        if (!scheduledForm.title || !scheduledForm.body || !scheduledForm.scheduledTime) {
            return alert('Please enter title, message, and scheduled time');
        }
        setSchedulingPush(true);
        try {
            await api.post('/push-notifications/schedule', scheduledForm);
            setScheduledPushSent(true);
            setScheduledForm({ title: '', body: '', std: 'all', scheduledTime: '' });
            setTimeout(() => setScheduledPushSent(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to schedule notification');
        } finally {
            setSchedulingPush(false);
        }
    };

    const handleSaveBirthdayConfig = async (e) => {
        e.preventDefault();
        setSavingBirthday(true);
        try {
            await api.post('/config/birthday-notification', birthdayConfig);
            setBirthdaySaved(true);
            setTimeout(() => setBirthdaySaved(false), 3000);
        } catch (err) {
            alert(err.message || 'Failed to save birthday configuration');
        } finally {
            setSavingBirthday(false);
        }
    };

    if (loading) return <div style="padding:2rem;text-align:center;">Loading configuration...</div>;

    return (
        <div>
            <div class="config-page">
                <div class="page-header">
                    <div class="page-header-titles">
                        <div class="page-header-eyebrow"><Icons.Notification /> Notifications</div>
                        <h1>Notification Settings</h1>
                        <p class="page-subtitle">Configure WhatsApp, SMS, Email, and push notification channels.</p>
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

                    {/* --- Push Notifications --- */}
                    <div class="config-section">
                        <h3 class="config-section-title">Push Notifications</h3>
                        <p class="config-section-desc">Send push notifications to student apps</p>

                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                            <button
                                type="button"
                                class={`btn btn-sm ${activeTab === 'immediate' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveTab('immediate')}
                            >
                                Send Now
                            </button>
                            <button
                                type="button"
                                class={`btn btn-sm ${activeTab === 'scheduled' ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveTab('scheduled')}
                            >
                                Schedule
                            </button>
                        </div>

                        {activeTab === 'immediate' && (
                            <div class="config-grid" style="margin-top: 1.5rem;">
                                <div class="form-group">
                                    <label>Send To</label>
                                    <select
                                        class="form-control"
                                        value={pushForm.std}
                                        onChange={(e) => setPushForm({ ...pushForm, std: e.target.value })}
                                    >
                                        <option value="all">All Students</option>
                                        {standards.map(std => (
                                            <option key={std} value={std}>
                                                Standard {std}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                                    <label>Notification Message</label>
                                    <textarea
                                        class="form-control"
                                        rows="3"
                                        placeholder="Enter message body..."
                                        value={pushForm.body}
                                        onInput={(e) => setPushForm({ ...pushForm, body: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'scheduled' && (
                            <div style="margin-top: 1.5rem;">
                                <div class="config-grid">
                                    <div class="form-group">
                                        <label>Send To</label>
                                        <select
                                            class="form-control"
                                            value={scheduledForm.std}
                                            onChange={(e) => setScheduledForm({ ...scheduledForm, std: e.target.value })}
                                        >
                                            <option value="all">All Students</option>
                                            {standards.map(std => (
                                                <option key={std} value={std}>
                                                    Standard {std}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style="margin-top: 1.5rem;">
                                    <AdvancedDateTimePicker
                                        value={scheduledForm.scheduledTime}
                                        onChange={(value) => setScheduledForm({ ...scheduledForm, scheduledTime: value })}
                                        label="Scheduled Date & Time"
                                    />
                                </div>

                                <div class="config-grid" style="margin-top: 1.5rem;">
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Notification Title</label>
                                        <input
                                            class="form-control"
                                            type="text"
                                            placeholder="Enter title..."
                                            value={scheduledForm.title}
                                            onInput={(e) => setScheduledForm({ ...scheduledForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Notification Message</label>
                                        <textarea
                                            class="form-control"
                                            rows="3"
                                            placeholder="Enter message body..."
                                            value={scheduledForm.body}
                                            onInput={(e) => setScheduledForm({ ...scheduledForm, body: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                            {activeTab === 'immediate' ? (
                                <>
                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        onClick={handleSendPush}
                                        disabled={sendingPush}
                                    >
                                        {sendingPush ? 'Sending...' : pushForm.std === 'all' ? 'Send to All Students' : `Send to Std ${pushForm.std}`}
                                    </button>
                                    {pushSent && (
                                        <span class="save-success" style="margin:0;"><Icons.Success /> Notification sent!</span>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        class="btn btn-primary"
                                        onClick={handleSchedulePush}
                                        disabled={schedulingPush}
                                    >
                                        {schedulingPush ? 'Scheduling...' : 'Schedule Notification'}
                                    </button>
                                    {scheduledPushSent && (
                                        <span class="save-success" style="margin:0;"><Icons.Success /> Notification scheduled!</span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* --- Birthday Notifications --- */}
                    <div class="config-section">
                        <div class="config-section-header">
                            <div>
                                <h3 class="config-section-title">Birthday Notifications & Emails</h3>
                                <p class="config-section-desc">Configure automatic notifications and emails on student birthdays</p>
                            </div>
                        </div>

                        <div class="config-grid" style="margin-top: 1.5rem;">
                            <div class="form-group" style="grid-column: span 2;">
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input
                                        type="checkbox"
                                        checked={birthdayConfig.enableBirthdayNotification}
                                        onChange={(e) => setBirthdayConfig({ ...birthdayConfig, enableBirthdayNotification: e.target.checked })}
                                    />
                                    Enable Birthday Push Notifications
                                </label>
                            </div>
                            {birthdayConfig.enableBirthdayNotification && (
                                <>
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Birthday Notification Title</label>
                                        <input
                                            class="form-control"
                                            type="text"
                                            placeholder="e.g. Happy Birthday!"
                                            value={birthdayConfig.birthdayNotificationTitle}
                                            onChange={(e) => setBirthdayConfig({ ...birthdayConfig, birthdayNotificationTitle: e.target.value })}
                                        />
                                    </div>
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Birthday Notification Message</label>
                                        <textarea
                                            class="form-control"
                                            rows="3"
                                            placeholder="e.g. Wishing {{studentName}} a wonderful birthday!"
                                            value={birthdayConfig.birthdayNotificationBody}
                                            onChange={(e) => setBirthdayConfig({ ...birthdayConfig, birthdayNotificationBody: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div class="form-group" style="grid-column: span 2; margin-top: 1rem;">
                                <label style="display: flex; align-items: center; gap: 0.5rem;">
                                    <input
                                        type="checkbox"
                                        checked={birthdayConfig.enableBirthdayEmail}
                                        onChange={(e) => setBirthdayConfig({ ...birthdayConfig, enableBirthdayEmail: e.target.checked })}
                                    />
                                    Enable Birthday Emails
                                </label>
                            </div>
                            {birthdayConfig.enableBirthdayEmail && (
                                <>
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Birthday Email Subject</label>
                                        <input
                                            class="form-control"
                                            type="text"
                                            placeholder="e.g. Happy Birthday, {{studentName}}!"
                                            value={birthdayConfig.birthdayEmailSubject}
                                            onChange={(e) => setBirthdayConfig({ ...birthdayConfig, birthdayEmailSubject: e.target.value })}
                                        />
                                    </div>
                                    <div class="form-group" style="grid-column: span 2;">
                                        <label>Birthday Email Template (HTML)</label>
                                        <textarea
                                            class="form-control"
                                            rows="4"
                                            placeholder="e.g. <h1>Happy Birthday {{studentName}}!</h1><p>Wishing you a wonderful day...</p>"
                                            value={birthdayConfig.birthdayEmailTemplate}
                                            onChange={(e) => setBirthdayConfig({ ...birthdayConfig, birthdayEmailTemplate: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div style="margin-top: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                            <button
                                type="button"
                                class="btn btn-primary"
                                onClick={handleSaveBirthdayConfig}
                                disabled={savingBirthday}
                            >
                                {savingBirthday ? 'Saving...' : 'Save Birthday Configuration'}
                            </button>
                            {birthdaySaved && (
                                <span class="save-success" style="margin:0;"><Icons.Success /> Birthday config saved!</span>
                            )}
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
