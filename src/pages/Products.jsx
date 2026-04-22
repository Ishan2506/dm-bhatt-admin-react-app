import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';
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

    // Construct image URL from path
    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const apiBase = (import.meta.env.API_BASE || 'http://localhost:5000/api').trim();
        const serverBase = (apiBase || '').replace('/api', '');
        return `${serverBase}/${path}`;
    };

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

    const categories = ['Notes', 'Books', 'Question Bank', 'Diagrams', 'Material', 'Other'];
    
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
            <div class="table-container">
                <div class="table-header">
                    <h3><Icons.Materials /> All Products</h3>
                    <div class="table-filters" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
                        <button class="btn btn-primary" onClick={() => handleOpenModal()}>
                            <Icons.Plus /> Add Product
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div class="loading-spinner" />
                ) : products.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Subjects /></div>
                        <p>No products found. Add your first product!</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Image</th>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Pricing</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, i) => (
                                <tr key={product._id}>
                                    <td>{i + 1}</td>
                                    <td>
                                        <div class="product-img-preview" style={{ 
                                            width: '50px', 
                                            height: '50px', 
                                            borderRadius: '8px', 
                                            overflow: 'hidden', 
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'var(--bg-primary)',
                                            position: 'relative'
                                        }}>
                                            {isPDF(product) ? (
                                                <Icons.FilePdf />
                                            ) : (
                                                <img src={getImageUrl(product.image)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>{product.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.subject || 'General'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="badge badge-info">{product.category}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600 }}>₹{product.price}</span>
                                            {product.originalPrice > product.price && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div class="td-actions">
                                            <button class="btn btn-outline btn-sm" onClick={() => handleOpenModal(product)}>
                                                <Icons.Edit /> Edit
                                            </button>
                                            <button class="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                    <option value="Notes">Notes</option>
                                    <option value="Books">Books</option>
                                    <option value="Question Bank">Question Bank</option>
                                    <option value="Diagrams">Diagrams</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Subject (Optional)</label>
                                <input 
                                    class="form-control"
                                    type="text"
                                    value={formData.subject} 
                                    onInput={e => setFormData({...formData, subject: e.target.value})}
                                    placeholder="e.g. Science"
                                />
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
                                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                            {isPDF({ category: formData.category, name: file?.name || formData.name }) ? (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                                                    <Icons.FilePdf />
                                                </div>
                                            ) : (
                                                <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
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
