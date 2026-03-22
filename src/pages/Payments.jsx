import { useState, useEffect } from 'preact/hooks';
import { api } from '../api';
import { Icons } from '../components/Icons';

export function Payments({ type }) {
    const [activeTab, setActiveTab] = useState('payments');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadData = () => {
        setLoading(true);
        let endpoint;
        if (activeTab === 'payments') endpoint = `/payments?page=${page}&limit=15`;
        else if (activeTab === 'purchases') endpoint = `/product-purchases?page=${page}&limit=15`;
        else endpoint = `/plan-upgrades?page=${page}&limit=15`;

        api.get(endpoint)
            .then(res => {
                if (activeTab === 'payments') setData(res.payments);
                else if (activeTab === 'purchases') setData(res.purchases);
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
            'all': 'payments',
            'purchases': 'purchases',
            'upgrades': 'upgrades'
        };
        setActiveTab(typeMap[type] || 'payments');
    }, [type]);

    const formatAmount = (amt) => '₹' + (amt || 0).toLocaleString('en-IN');
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div>
            <div class="table-container">
                {loading ? (
                    <div class="loading-spinner" />
                ) : data.length === 0 ? (
                    <div class="table-empty">
                        <div class="empty-icon"><Icons.Payments /></div>
                        <p>No {activeTab} data found</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'payments' && (
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Phone</th>
                                        <th>Standard</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, i) => (
                                        <tr key={item._id}>
                                            <td>{(page - 1) * 15 + i + 1}</td>
                                            <td style="font-weight: 600;">{item.studentName || '—'}</td>
                                            <td class="text-muted">{item.studentPhone || '—'}</td>
                                            <td><span class="badge badge-info">{item.standard || '—'}</span></td>
                                            <td><span class="amount text-success">{formatAmount(item.amount)}</span></td>
                                            <td>
                                                <span class={`badge ${item.status === 'captured' ? 'badge-success' : item.status === 'refunded' ? 'badge-warning' : 'badge-danger'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td class="text-muted">{formatDate(item.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'purchases' && (
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Phone</th>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, i) => (
                                        <tr key={item._id}>
                                            <td>{(page - 1) * 15 + i + 1}</td>
                                            <td style="font-weight: 600;">{item.studentName || '—'}</td>
                                            <td class="text-muted">{item.studentPhone || '—'}</td>
                                            <td style="font-weight: 600;">{item.productName || '—'}</td>
                                            <td><span class="badge badge-warning">{item.productCategory || '—'}</span></td>
                                            <td><span class="amount text-success">{formatAmount(item.amount)}</span></td>
                                            <td class="text-muted">{formatDate(item.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'upgrades' && (
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student</th>
                                        <th>Phone</th>
                                        <th>Old Std</th>
                                        <th>New Std</th>
                                        <th>Medium</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, i) => (
                                        <tr key={item._id}>
                                            <td>{(page - 1) * 15 + i + 1}</td>
                                            <td style="font-weight: 600;">{item.studentName || '—'}</td>
                                            <td class="text-muted">{item.studentPhone || '—'}</td>
                                            <td><span class="badge badge-danger">{item.oldStandard || '—'}</span></td>
                                            <td><span class="badge badge-success">{item.newStandard || '—'}</span></td>
                                            <td>{item.medium || '—'}</td>
                                            <td><span class="amount text-success">{formatAmount(item.amount)}</span></td>
                                            <td class="text-muted">{formatDate(item.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {totalPages > 1 && (
                            <div class="pagination">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                                    ← Prev
                                </button>
                                <span>Page {page} of {totalPages}</span>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
