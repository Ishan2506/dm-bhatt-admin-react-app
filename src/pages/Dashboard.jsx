import { h, Fragment } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { api } from '../api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const revenueChartRef = useRef(null);
    const studentChartRef = useRef(null);
    const contentChartRef = useRef(null);
    
    const chartInstances = useRef({});

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.get('/dashboard');
                console.log('Dashboard Data:', data);
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

                // 1. Revenue Chart
                if (revenueChartRef.current) {
                    const revData = stats.revenueByMonth || [];
                    chartInstances.current.revenue = new Chart(revenueChartRef.current, {
                        type: 'line',
                        data: {
                            labels: revData.map(d => {
                                if (!d.month) return '';
                                const parts = d.month.split('-');
                                if (parts.length < 2) return d.month;
                                const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);
                                return date.toLocaleString('default', { month: 'short' });
                            }),
                            datasets: [{
                                label: 'Revenue (₹)',
                                data: revData.map(d => d.amount || 0),
                                borderColor: '#6c63ff',
                                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: '#6c63ff',
                                pointBorderColor: '#fff',
                                pointHoverRadius: 6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: { 
                                    backgroundColor: '#16213e', 
                                    titleColor: '#fff', 
                                    bodyColor: '#e4e4f0',
                                    callbacks: {
                                        label: (ctx) => `Revenue: ₹${ctx.raw.toLocaleString()}`
                                    }
                                }
                            },
                            scales: {
                                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8888a8' } },
                                x: { grid: { display: false }, ticks: { color: '#8888a8' } }
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
                                backgroundColor: ['#6c63ff', '#00c896', '#ffb547', '#ff4d6a', '#38bdf8', '#8b5cf6'],
                                borderWidth: 0,
                                hoverOffset: 10
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'bottom', labels: { color: '#8888a8', padding: 20, usePointStyle: true } }
                            },
                            cutout: '70%'
                        }
                    });
                }

                // 3. Content Distribution
                if (contentChartRef.current && stats.chaptersBySubj?.length > 0) {
                    chartInstances.current.content = new Chart(contentChartRef.current, {
                        type: 'bar',
                        data: {
                            labels: stats.chaptersBySubj.map(c => c.label),
                            datasets: [{
                                label: 'Chapters',
                                data: stats.chaptersBySubj.map(c => c.value),
                                backgroundColor: 'rgba(0, 200, 150, 0.6)',
                                borderRadius: 6,
                                hoverBackgroundColor: '#00c896'
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8888a8' } },
                                y: { grid: { display: false }, ticks: { color: '#8888a8' } }
                            }
                        }
                    });
                }
            } catch (err) {
                console.error('Error initializing charts:', err);
            }
        }, 150); // Increased delay slightly

        return () => {
            clearTimeout(timer);
            Object.values(chartInstances.current).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
    }, [stats]);

    if (loading) return <div class="loading-state">Loading dashboard...</div>;
    if (error) return <div class="error-state">{error}</div>;

    const totalRevenue = stats?.totalRevenue ?? (stats?.totalPaymentAmount || 0);

    const cards = [
        { title: 'Total Standards', value: stats?.totalStandards || 0, icon: '🏫', color: '#6c63ff' },
        { title: 'Total Subjects', value: stats?.totalSubjects || 0, icon: '📚', color: '#00c896' },
        { title: 'Total Chapters', value: stats?.totalChapters || 0, icon: '📖', color: '#ffb547' },
        { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: '💰', color: '#38bdf8' },
    ];

    // Check if there is ANY revenue data in the monthly chart
    const hasMonthlyRevenue = stats.revenueByMonth?.some(d => d.amount > 0);

    return (
        <div class="dashboard-page">
            <header class="page-header">
                <div>
                    <h1 class="page-title">Super Admin Dashboard</h1>
                    <p class="page-subtitle">Platform overview and real-time statistics</p>
                </div>
            </header>

            <div class="stat-grid">
                {cards.map(card => (
                    <div class="stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
                        <div class="stat-icon" style={{ background: `${card.color}15`, color: card.color }}>{card.icon}</div>
                        <div class="stat-info">
                            <h3 class="stat-label">{card.title}</h3>
                            <p class="stat-value">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div class="dashboard-charts">
                <div class="chart-card">
                    <div class="chart-header">
                        <h2 class="chart-title">Revenue Overview (Last 6 Months)</h2>
                    </div>
                    <div class="chart-container">
                        <canvas ref={revenueChartRef}></canvas>
                        {!hasMonthlyRevenue && stats.revenueByMonth?.length > 0 && (
                            <div class="chart-overlay-msg">Note: All recent months have ₹0 revenue</div>
                        )}
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h2 class="chart-title">Student Distribution</h2>
                    </div>
                    <div class="chart-container">
                        {stats.studentsByStd?.length > 0 ? (
                            <canvas ref={studentChartRef}></canvas>
                        ) : (
                            <div class="no-data">No student data available</div>
                        )}
                    </div>
                </div>

                <div class="chart-card" style={{ gridColumn: '1 / -1' }}>
                    <div class="chart-header">
                        <h2 class="chart-title">Subject Content (Chapters per Subject)</h2>
                    </div>
                    <div class="chart-container">
                        {stats.chaptersBySubj?.length > 0 ? (
                            <canvas ref={contentChartRef}></canvas>
                        ) : (
                            <div class="no-data">No content data available</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
