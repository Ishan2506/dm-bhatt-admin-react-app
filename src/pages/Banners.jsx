import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { getFileUrl } from '../fileUrl';
import { Modal } from '../components/Modal';

const emptyForm = { title: '', link: '', isActive: true };

export function Banners() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');

    const loadBanners = async () => {
        setLoading(true);
        try {
            const data = await api.get('/banner/all', { noPrefix: true });
            setBanners(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading banners:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadBanners(); }, []);

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({ title: banner.title || '', link: banner.link || '', isActive: banner.isActive });
            setPreview(getFileUrl(banner.image));
        } else {
            setEditingBanner(null);
            setFormData(emptyForm);
            setPreview('');
        }
        setFile(null);
        setModalOpen(true);
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file && !editingBanner) {
            alert('Please select a banner image');
            return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('link', formData.link);
        data.append('isActive', String(formData.isActive));
        if (file) data.append('image', file);

        setSaving(true);
        try {
            if (editingBanner) {
                await api.put(`/banner/update/${editingBanner._id}`, data, { noPrefix: true });
            } else {
                await api.post('/banner/create', data, { noPrefix: true });
            }
            setModalOpen(false);
            loadBanners();
        } catch (err) {
            console.error('Error saving banner:', err);
            alert(err.message || 'Failed to save banner');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (banner) => {
        const data = new FormData();
        data.append('isActive', String(!banner.isActive));
        try {
            await api.put(`/banner/update/${banner._id}`, data, { noPrefix: true });
            loadBanners();
        } catch (err) {
            console.error('Error updating banner:', err);
            alert('Failed to update banner');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;
        try {
            await api.del(`/banner/delete/${id}`, { noPrefix: true });
            loadBanners();
        } catch (err) {
            console.error('Error deleting banner:', err);
            alert('Failed to delete banner');
        }
    };

    const activeCount = banners.filter(b => b.isActive).length;

    return (
        <div class="page-container">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Image /> Management</div>
                    <h1>App Banners</h1>
                    <p class="page-subtitle">Banners shown as a popup when students log in or open the app. All active banners are shown, newest first.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{banners.length}</span>
                            <span class="hm-label">Total</span>
                        </div>
                        <div class="header-metric">
                            <span class="hm-value">{activeCount}</span>
                            <span class="hm-label">Active</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Icons.Plus /> Add Banner
                    </button>
                </div>
            </div>

            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : banners.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Image /></div>
                        <h3>No banners yet</h3>
                        <p>Upload a banner to show it to students when they open the app.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Banner</th>
                                <th>Link</th>
                                <th>Status</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map((banner) => (
                                <tr key={banner._id}>
                                    <td>
                                        <div class="identity">
                                            <a href={getFileUrl(banner.image)} target="_blank" rel="noopener noreferrer" style={{
                                                width: '96px', height: '54px', borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden', border: '1px solid var(--border)',
                                                background: 'var(--bg-subtle)', flexShrink: 0, display: 'block'
                                            }}>
                                                <img src={getFileUrl(banner.image)} alt={banner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </a>
                                            <div class="identity-body">
                                                <div class="identity-name">{banner.title || 'Untitled banner'}</div>
                                                <div class="identity-sub">{new Date(banner.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {banner.link ? (
                                            <a href={banner.link} target="_blank" rel="noopener noreferrer">{banner.link}</a>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label class="toggle-switch" title={banner.isActive ? 'Deactivate' : 'Activate'}>
                                                <input type="checkbox" checked={banner.isActive} onChange={() => handleToggleActive(banner)} />
                                                <span class="toggle-slider"></span>
                                            </label>
                                            <span class={`badge ${banner.isActive ? 'badge-success' : 'badge-warning'}`}>
                                                {banner.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="td-actions" style="justify-content:flex-end;">
                                            <button class="icon-btn primary" title="Edit" onClick={() => handleOpenModal(banner)}>
                                                <Icons.Edit />
                                            </button>
                                            <button class="icon-btn danger" title="Delete" onClick={() => handleDelete(banner._id)}>
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
            </div>

            {modalOpen && (
                <Modal
                    title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
                    onClose={() => setModalOpen(false)}
                    footer={
                        <Fragment>
                            <button type="button" class="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button type="submit" form="bannerForm" class="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                            </button>
                        </Fragment>
                    }
                >
                    <form id="bannerForm" onSubmit={handleSubmit}>
                        <div class="form-group">
                            <label>Banner Image</label>
                            {preview && (
                                <img src={preview} alt="Banner preview" style={{
                                    width: '100%', maxHeight: '240px', objectFit: 'contain',
                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                    background: 'var(--bg-subtle)', marginBottom: '8px'
                                }} />
                            )}
                            <input
                                class="form-control"
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={handleFileChange}
                            />
                            <small style={{ color: 'var(--text-muted)' }}>JPG, PNG, WEBP or GIF, up to 5MB. A portrait or square image works best on phones.</small>
                        </div>
                        <div class="form-group">
                            <label>Title (Optional)</label>
                            <input
                                class="form-control"
                                type="text"
                                value={formData.title}
                                onInput={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Diwali Offer"
                            />
                        </div>
                        <div class="form-group">
                            <label>Link (Optional)</label>
                            <input
                                class="form-control"
                                type="url"
                                value={formData.link}
                                onInput={e => setFormData({ ...formData, link: e.target.value })}
                                placeholder="https://... (opens when a student taps the banner)"
                            />
                        </div>
                        <div class="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <label class="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                />
                                <span class="toggle-slider"></span>
                            </label>
                            <span>Show this banner in the app</span>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
