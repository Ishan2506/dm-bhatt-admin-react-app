import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
import { getFileUrl } from '../fileUrl';
import { Modal } from '../components/Modal';

export function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        subject: '',
        price: '',
        originalPrice: '',
        discount: 0,
        image: ''
    });

    const [filterCategory, setFilterCategory] = useState('');

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');

    const getImageUrl = getFileUrl;

    const loadProducts = async () => {
        setLoading(true);
        try {
            const query = filterCategory ? `?category=${filterCategory}` : '';
            const data = await api.get(`/products${query}`);
            setProducts(data.products || []);
        } catch (err) {
            console.error('Error loading products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, [filterCategory]);

    const categories = ['Material', 'Diagram', 'Phantom material', 'Books', 'Stationery', 'Notes', 'Question Bank', 'Other'];
    
    const subjects = [
        "Science",
        "Maths",
        "English",
        "Gujarati",
        "Social Science",
        "Sanskrit",
        "Computer",
        "Physics",
        "Chemistry",
        "Biology",
        "Accountancy",
        "BA",
        "Economics",
        "Statistics",
        "Secretarial Practice"
    ];
    
    const isPDF = (product) => {
        const cat = (product.category || '').toLowerCase();
        const name = (product.name || '').toLowerCase();
        return cat.includes('notes') || cat.includes('book') || cat.includes('question') || cat.includes('material') || name.includes('.pdf');
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                category: product.category,
                subject: product.subject || '',
                price: product.price,
                originalPrice: product.originalPrice,
                discount: product.discount || 0,
                image: product.image
            });
            setPreview(getImageUrl(product.image));
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                category: '',
                subject: '',
                price: '',
                originalPrice: '',
                discount: 0,
                image: ''
            });
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
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'image') {
                    data.append(key, formData[key]);
                }
            });
            if (file) {
                data.append('image', file);
            } else if (!editingProduct) {
                alert('Please select an image');
                return;
            }

            if (editingProduct) {
                await api.put(`/products/${editingProduct._id}`, data);
            } else {
                await api.post(`/products`, data);
            }
            setModalOpen(false);
            loadProducts();
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Failed to save product');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.del(`/products/${id}`);
            loadProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('Failed to delete product');
        }
    };

    return (
        <div class="page-container">
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Materials /> Management</div>
                    <h1>Products</h1>
                    <p class="page-subtitle">Manage the digital products available for purchase in the app.</p>
                    <div class="header-metrics">
                        <div class="header-metric">
                            <span class="hm-value">{products.length}</span>
                            <span class="hm-label">Showing</span>
                        </div>
                    </div>
                </div>
                <div class="page-header-actions">
                    <button class="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Icons.Plus /> Add Product
                    </button>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <div class="toolbar" style="width:100%;">
                        <div class="toolbar-group">
                            <select
                                class="form-control"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div class="loading-spinner" />
                ) : products.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Materials /></div>
                        <h3>No products yet</h3>
                        <p>Add your first product to make it available for purchase.</p>
                    </div>
                ) : (
                    <div class="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th style="text-align:right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product._id}>
                                    <td>
                                        <div class="identity">
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden', border: '1px solid var(--border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'var(--bg-subtle)', flexShrink: 0
                                            }}>
                                                {isPDF(product) ? (
                                                    <Icons.FilePdf />
                                                ) : (
                                                    <img src={getImageUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )}
                                            </div>
                                            <div class="identity-body">
                                                <div class="identity-name">{product.name}</div>
                                                <div class="identity-sub">{product.subject || 'General'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="badge badge-info">{product.category}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{product.price}</span>
                                            {product.originalPrice > product.price && (
                                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="td-actions" style="justify-content:flex-end;">
                                            <button class="icon-btn primary" title="Edit" onClick={() => handleOpenModal(product)}>
                                                <Icons.Edit />
                                            </button>
                                            <button class="icon-btn danger" title="Delete" onClick={() => handleDelete(product._id)}>
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
                    title={editingProduct ? 'Edit Product' : 'Add New Product'}
                    onClose={() => setModalOpen(false)}
                    footer={
                        <Fragment>
                            <button type="button" class="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                            <button type="submit" form="productForm" class="btn btn-primary">
                                {editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </Fragment>
                    }
                >
                    <form id="productForm" onSubmit={handleSubmit}>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Product Name</label>
                                <input 
                                    class="form-control"
                                    type="text" required
                                    value={formData.name} 
                                    onInput={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="e.g. Science Full Notes PDF"
                                />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Description</label>
                                <textarea 
                                    class="form-control"
                                    required rows="3"
                                    value={formData.description} 
                                    onInput={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="Detailed product description..."
                                />
                            </div>
                            <div class="form-group">
                                <label>Category</label>
                                <select 
                                    class="form-control"
                                    required
                                    value={formData.category} 
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Subject (Optional)</label>
                                <select 
                                    class="form-control"
                                    value={formData.subject} 
                                    onChange={e => setFormData({...formData, subject: e.target.value})}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Selling Price (₹)</label>
                                <input 
                                    class="form-control"
                                    type="number" required min="0"
                                    value={formData.price} 
                                    onInput={e => setFormData({...formData, price: e.target.value})}
                                />
                            </div>
                            <div class="form-group">
                                <label>Original Price (₹)</label>
                                <input 
                                    class="form-control"
                                    type="number" required min="0"
                                    value={formData.originalPrice} 
                                    onInput={e => setFormData({...formData, originalPrice: e.target.value})}
                                />
                            </div>
                            <div class="form-group">
                                <label>Discount (%)</label>
                                <input 
                                    class="form-control"
                                    type="number" min="0" max="100"
                                    value={formData.discount} 
                                    onInput={e => setFormData({...formData, discount: e.target.value})}
                                />
                            </div>
                            <div class="form-group" style="grid-column: span 2;">
                                <label>Product Image / File</label>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {preview && (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <a 
                                                href={preview} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                title="Click to view/download current file"
                                                style={{ display: 'block', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}
                                            >
                                                {isPDF({ category: formData.category, name: file?.name || formData.name || formData.image }) ? (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', cursor: 'pointer' }}>
                                                        <Icons.FilePdf />
                                                    </div>
                                                ) : (
                                                    <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} />
                                                )}
                                            </a>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {file ? file.name : (formData.image ? formData.image.substring(formData.image.lastIndexOf('/') + 1) : 'current file')}
                                            </span>
                                        </div>
                                    )}
                                    <input 
                                        class="form-control"
                                        type="file" 
                                        accept="image/*,application/pdf"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
