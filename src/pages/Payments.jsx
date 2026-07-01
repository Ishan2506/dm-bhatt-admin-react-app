import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

export function Payments({ type }) {
    const [activeTab, setActiveTab] = useState('upgrades');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadData = () => {
        setLoading(true);
        let endpoint;
        if (activeTab === 'purchases') endpoint = `/product-purchases?page=${page}&limit=15`;
        else endpoint = `/plan-upgrades?page=${page}&limit=15`;

        api.get(endpoint)
            .then(res => {
                if (activeTab === 'purchases') setData(res.purchases);
                else setData(res.upgrades);
                setTotalPages(res.totalPages || 1);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { setPage(1); }, [activeTab]);
    useEffect(() => { loadData(); }, [activeTab, page]);

    useEffect(() => {
        const typeMap = {
            'purchases': 'purchases',
            'upgrades': 'upgrades'
        };
        setActiveTab(typeMap[type] || 'upgrades');
    }, [type]);

    const formatAmount = (amt) => '₹' + (amt || 0).toLocaleString('en-IN');
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const isPurchases = activeTab === 'purchases';
    return (
        <div>
            <div class="page-header">
                <div class="page-header-titles">
                    <div class="page-header-eyebrow"><Icons.Payments /> Payments</div>
                    <h1>{isPurchases ? 'Product Purchases' : 'Plan Purchases'}</h1>
                    <p class="page-subtitle">
                        {isPurchases
                            ? 'Every product bought by students in the app.'
                            : 'Standard upgrades and plan purchases by students.'}
                    </p>
                </div>
            </div>

            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : data.length === 0 ? (
                    <div class="empty-state">
                        <div class="empty-state-icon"><Icons.Payments /></div>
                        <h3>No transactions yet</h3>
                        <p>No {isPurchases ? 'product' : 'plan'} purchases have been recorded.</p>
                    </div>
                ) : (
                    <>
                        <div class="table-scroll">
                        {isPurchases ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => (
                                        <tr key={item._id}>
                                            <td>
                                                <div class="identity">
                                                    <div class="avatar avatar-sm" style={{ background: avatarColor(item.studentName) }}>
                                                        {(item.studentName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div class="identity-body">
                                                        <div class="identity-name">{item.studentName || '—'}</div>
                                                        <div class="identity-sub">{item.studentPhone || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="font-weight:600;color:var(--text-primary);">{item.productName || '—'}</td>
                                            <td><span class="badge badge-warning">{item.productCategory || '—'}</span></td>
                                            <td><span class="amount text-success">{formatAmount(item.amount)}</span></td>
                                            <td class="text-muted" style="font-size:var(--font-xs);">{formatDate(item.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Upgrade</th>
                                        <th>Medium</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item) => (
                                        <tr key={item._id}>
                                            <td>
                                                <div class="identity">
                                                    <div class="avatar avatar-sm" style={{ background: avatarColor(item.studentName) }}>
                                                        {(item.studentName || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div class="identity-body">
                                                        <div class="identity-name">{item.studentName || '—'}</div>
                                                        <div class="identity-sub">{item.studentPhone || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="display:flex;align-items:center;gap:6px;">
                                                    <span class="cell-chip">{item.oldStandard || '—'}</span>
                                                    <span style="color:var(--text-muted);">→</span>
                                                    <span class="badge badge-success">{item.newStandard || '—'}</span>
                                                </div>
                                            </td>
                                            <td>{item.medium || '—'}</td>
                                            <td><span class="amount text-success">{formatAmount(item.amount)}</span></td>
                                            <td class="text-muted" style="font-size:var(--font-xs);">{formatDate(item.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        </div>

                        {totalPages > 1 && (
                            <div class="pagination">
                                <span>Page {page} of {totalPages}</span>
                                <div class="pagination-controls">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                                        <Icons.ChevronLeft />
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                        <Icons.ChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const _avatarColors = ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#dc2626', '#0ea5e9', '#db2777'];
function avatarColor(name = '') {
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return _avatarColors[Math.abs(h) % _avatarColors.length];
}
