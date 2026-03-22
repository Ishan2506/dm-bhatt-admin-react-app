import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { api } from '../api';
import { Chart, registerables } from 'chart.js';
import { Icons } from '../components/Icons';

Chart.register(...registerables);

export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const revenueChartRef = useRef(null);
    const studentChartRef = useRef(null);
    const productChartRef = useRef(null);
    
    const chartInstances = useRef({});

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get('/dashboard');
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
                setError('Failed to load dashboard data. Check API connection.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        if (!stats) return;

        const timer = setTimeout(() => {
            try {
                // Destroy existing charts
                Object.values(chartInstances.current).forEach(chart => {
                    if (chart) chart.destroy();
                });

                // 1. Revenue Comparison (Bar Chart)
                if (revenueChartRef.current) {
                    const revData = stats.revenueByMonth || [];
                    chartInstances.current.revenue = new Chart(revenueChartRef.current, {
                        type: 'bar',
                        data: {
                            labels: revData.map(d => {
                                if (!d.month) return '';
                                const parts = d.month.split('-');
                                if (parts.length < 2) return d.month;
                                const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
                                return date.toLocaleString('default', { month: 'short' });
                            }),
                            datasets: [
                                {
                                    label: 'Revenue',
                                    data: revData.map(d => d.amount || 0),
                                    backgroundColor: '#4f46e5',
                                    borderRadius: 6,
                                    barThickness: 12,
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: { 
                                    backgroundColor: '#fff', 
                                    titleColor: '#0f172a', 
                                    bodyColor: '#64748b',
                                    borderColor: '#e2e8f0',
                                    borderWidth: 1,
                                    padding: 12,
                                    boxPadding: 6,
                                    usePointStyle: true
                                }
                            },
                            scales: {
                                y: { 
                                    beginAtZero: true, 
                                    grid: { color: '#f3f4f6' }, 
                                    ticks: { color: '#9ca3af', font: { size: 11 } } 
                                },
                                x: { 
                                    grid: { display: false }, 
                                    ticks: { color: '#9ca3af', font: { size: 11 } } 
                                }
                            }
                        }
                    });
                }

                // 2. Student Distribution
                if (studentChartRef.current && stats.studentsByStd?.length > 0) {
                    chartInstances.current.students = new Chart(studentChartRef.current, {
                        type: 'doughnut',
                        data: {
                            labels: stats.studentsByStd.map(s => `Std ${s.label}`),
                            datasets: [{
                                data: stats.studentsByStd.map(s => s.value),
                                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'],
                                borderWidth: 0,
                                hoverOffset: 12
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { 
                                    position: 'bottom', 
                                    labels: { 
                                        color: '#6b7280', 
                                        padding: 20, 
                                        usePointStyle: true,
                                        font: { size: 11 }
                                    } 
                                }
                            },
                            cutout: '75%'
                        }
                    });
                }

                // 3. Product Distribution
                if (productChartRef.current && stats.productEarningsByProduct?.length > 0) {
                    chartInstances.current.products = new Chart(productChartRef.current, {
                        type: 'doughnut',
                        data: {
                            labels: stats.productEarningsByProduct.map(p => p.label),
                            datasets: [{
                                data: stats.productEarningsByProduct.map(p => p.value),
                                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#4f46e5'],
                                borderWidth: 0,
                                hoverOffset: 12
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { 
                                    position: 'bottom', 
                                    labels: { 
                                        color: '#6b7280', 
                                        padding: 20, 
                                        usePointStyle: true,
                                        font: { size: 11 }
                                    } 
                                }
                            },
                            cutout: '75%'
                        }
                    });
                }
            } catch (err) {
                console.error('Error initializing charts:', err);
            }
        }, 150);

        return () => {
            clearTimeout(timer);
            Object.values(chartInstances.current).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
    }, [stats]);

    if (loading) return <div class="loading-state">Loading dashboard...</div>;
    if (error) return <div class="error-state">{error}</div>;

    const totalRevenue = stats?.totalRevenue || 0;

    const cards = [
        { title: 'Total Students', value: stats?.totalStudents || 0, icon: <Icons.User />, color: '#4f46e5', trend: '12%', up: true },
        { title: 'Total Products', value: stats?.totalProducts || 0, icon: <Icons.Materials />, color: '#10b981', trend: '5%', up: true },
        { title: 'Total Chapters', value: stats?.totalChapters || 0, icon: <Icons.Chapters />, color: '#f59e0b', trend: '2%', up: false },
        { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <Icons.Revenue />, color: '#ef4444', trend: '25%', up: true },
    ];

    return (
        <div class="dashboard-page">
            <div class="stat-grid">
                {cards.map(card => (
                    <div class="stat-card">
                        <div class="stat-icon-wrapper">
                            <span class="stat-icon-main">{card.icon}</span>
                        </div>
                        <div class="stat-info">
                            <h3 class="stat-label">
                                {card.title}
                            </h3>
                            <div class="stat-value-container">
                                <span class="stat-value">{card.value}</span>
                                <span class={`trend-badge ${card.up ? 'trend-up' : 'trend-down'}`}>
                                    {card.up ? <Icons.TrendUp /> : <Icons.TrendDown />} {card.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div class="dashboard-charts">
                <div class="chart-card" style={{ gridColumn: '1 / -1' }}>
                    <div class="chart-header">
                        <h2 class="chart-title">Revenue Overview</h2>
                        <div class="chart-legend">
                             <span class="legend-item"><i style={{ background: '#4f46e5' }}></i> Revenue</span>
                        </div>
                    </div>
                    <div class="chart-container" style={{ height: '400px' }}>
                        <canvas ref={revenueChartRef}></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h2 class="chart-title">Student Distribution</h2>
                    </div>
                    <div class="chart-container" style={{ height: '300px' }}>
                        <canvas ref={studentChartRef}></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h2 class="chart-title">Product Distribution</h2>
                    </div>
                    <div class="chart-container" style={{ height: '300px' }}>
                        <canvas ref={productChartRef}></canvas>
                    </div>
                </div>

            </div>
        </div>
    );
}
