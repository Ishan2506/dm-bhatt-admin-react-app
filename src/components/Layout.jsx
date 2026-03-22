import { useState, useEffect } from 'preact/hooks';
import { Router, route } from 'preact-router';
import { Icons } from './Icons';

const navigation = [
    {
        title: 'MANAGEMENT',
        items: [
            { path: '/admin', label: 'Dashboard', icon: <Icons.Dashboard /> },
            { path: '/admin/standards', label: 'Standards', icon: <Icons.Standards /> },
            { path: '/admin/subjects', label: 'Subjects', icon: <Icons.Subjects /> },
            { path: '/admin/chapters', label: 'Chapters', icon: <Icons.Chapters /> },
        ]
    },
    {
        title: 'RESOURCES',
        items: [
            { 
                label: 'Materials', 
                icon: <Icons.Materials />,
                path: '/admin/materials',
                children: [
                    { path: '/admin/materials/board-paper', label: 'Board Paper' },
                    { path: '/admin/materials/school-paper', label: 'School Paper' },
                    { path: '/admin/materials/notes', label: 'Notes' },
                    { path: '/admin/materials/images', label: 'Images' },
                    { path: '/admin/materials/history', label: 'History' },
                ]
            },
            { path: '/admin/mindmaps', label: 'Mind Maps', icon: <Icons.MindMaps /> },
        ]
    },
    {
        title: 'PAYMENTS',
        items: [
            { 
                label: 'Payments', 
                icon: <Icons.Payments />,
                path: '/admin/payments',
                children: [
                    { path: '/admin/payments/all', label: 'All Payments' },
                    { path: '/admin/payments/purchases', label: 'Product Purchases' },
                    { path: '/admin/payments/upgrades', label: 'Plan Upgrades' },
                ]
            },
        ]
    }
];

export function Layout({ children, currentPath, user, onLogout }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [currentPath]);

    return (
        <div class="layout">
            {isSidebarOpen && (
                <div class="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}
            <aside class={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div class="sidebar-brand">
                    <img src="/assets/logo.png" alt="Padhaku Logo" class="sidebar-logo" />
                    <div class="brand-details">
                        <h2>Padhaku</h2>
                        <span>Super Admin</span>
                    </div>
                </div>
                <nav class="sidebar-nav">
                    {navigation.map(section => (
                        <div key={section.title} class="nav-section">
                            <div class="nav-label">{section.title}</div>
                            {section.items.map(item => {
                                const hasChildren = item.children && item.children.length > 0;
                                const isOpen = currentPath.startsWith(item.path);
                                const isActive = currentPath === item.path || (hasChildren && currentPath.startsWith(item.path));

                                return (
                                    <div key={item.label}>
                                        <a
                                            href={hasChildren ? item.children[0].path : item.path}
                                            class={`nav-item ${isActive ? 'active' : ''} ${hasChildren && isOpen ? 'submenu-open' : ''}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const targetPath = hasChildren ? item.children[0].path : item.path;
                                                route(targetPath);
                                            }}
                                        >
                                            <span class="nav-icon">{item.icon}</span>
                                            {item.label}
                                            {hasChildren && <span class="nav-chevron"><Icons.ChevronRight /></span>}
                                        </a>
                                        {hasChildren && isOpen && (
                                            <div class="nav-submenu">
                                                {item.children.map(child => (
                                                    <a
                                                        key={child.path}
                                                        href={child.path}
                                                        class={`nav-subitem ${currentPath === child.path ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            route(child.path);
                                                        }}
                                                    >
                                                        {child.label}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div class="sidebar-footer">
                    <div class="profile-card">
                        <div class="profile-avatar">
                            <Icons.User />
                        </div>
                        <div class="profile-info">
                            <span class="profile-name">{user?.firstName || 'Admin'}</span>
                            <span class="profile-role">Super Admin</span>
                        </div>
                    </div>
                    <a href="#" class="logout-link" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                        <span class="logout-icon"><Icons.Logout /></span>
                        Logout
                    </a>
                </div>
            </aside>
            <main class="main-content">
                <header class="topbar">
                    <div class="topbar-left">
                        <button class="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}>
                            <Icons.Menu />
                        </button>
                        <h1 class="topbar-title">
                            {currentPath.split('/').pop().charAt(0).toUpperCase() + currentPath.split('/').pop().slice(1) || 'Dashboard'}
                        </h1>
                    </div>
                    <div class="topbar-right">
                        <div class="topbar-actions">
                             <button class="topbar-btn">
                                <Icons.Bell />
                             </button>
                        </div>
                    </div>
                </header>
                <div class="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
