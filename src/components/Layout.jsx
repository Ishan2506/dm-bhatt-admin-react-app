import { h } from 'preact';
import { Router, route } from 'preact-router';

const navItems = [

    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/standards', label: 'Standards', icon: '🏫' },
    { path: '/admin/subjects', label: 'Subjects', icon: '📚' },
    { path: '/admin/chapters', label: 'Chapters', icon: '📖' },
    { path: '/admin/materials', label: 'Materials', icon: '📂' },
    { path: '/admin/mindmaps', label: 'Mind Maps', icon: '🧠' },
    { path: '/admin/payments', label: 'Payments', icon: '💳' },
];

export function Layout({ children, currentPath, user, onLogout }) {
    return (
        <div class="layout">
            <aside class="sidebar">
                <div class="sidebar-brand">
                    <h2>Padhaku</h2>
                    <span>Super Admin</span>
                </div>
                <nav class="sidebar-nav">
                    <div class="nav-label">Management</div>
                    {navItems.map(item => (
                        <a
                            key={item.path}
                            href={item.path}
                            class={`nav-item ${currentPath === item.path ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                route(item.path);
                            }}
                        >
                            <span class="nav-icon">{item.icon}</span>
                            {item.label}
                        </a>
                    ))}
                </nav>
            </aside>
            <main class="main-content">
                <header class="topbar">
                    <h1 class="topbar-title">
                        {navItems.find(n => n.path === currentPath || (n.path === '/admin' && currentPath === '/admin/dashboard'))?.label || 'Dashboard'}
                    </h1>
                    <div class="topbar-right">
                        <span style="color: var(--text-secondary); font-size: var(--font-sm); margin-right: 1rem;">👤 {user?.firstName || 'Admin'}</span>
                        <button 
                            class="btn btn-sm btn-outline" 
                            onClick={onLogout}
                            style="padding: var(--space-xs) var(--space-md); font-size: var(--font-xs);"
                        >
                            Logout 🚪
                        </button>
                    </div>
                </header>
                <div class="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
