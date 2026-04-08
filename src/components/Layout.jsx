import { useState, useEffect } from 'preact/hooks';
import { Router, route } from 'preact-router';
import { Icons } from './Icons';

const navigation = [
    {
        title: 'MANAGEMENT',
        items: [
            { path: '/admin', label: 'Dashboard', icon: <Icons.Dashboard /> },
            { path: '/admin/boards', label: 'Boards', icon: <Icons.Clipboard /> },
            { path: '/admin/mediums', label: 'Mediums', icon: <Icons.Paper /> },
            { path: '/admin/standards', label: 'Standards', icon: <Icons.Standards /> },
            { path: '/admin/products', label: 'Products', icon: <Icons.Materials /> },
            { path: '/admin/subjects', label: 'Subjects', icon: <Icons.Subjects /> },
            { path: '/admin/chapters', label: 'Chapters', icon: <Icons.Chapters /> },
        ]
    },
    {
        title: 'REPORTS',
        items: [
            { 
                label: 'Exam Reports', 
                icon: <Icons.Reports />,
                path: '/admin/reports/exams',
                children: [
                    { path: '/admin/reports/exams/regular', label: 'Regular Exams' },
                    { path: '/admin/reports/exams/quiz', label: 'Quiz' },
                    { path: '/admin/reports/exams/oneliner', label: 'One Liner' },
                    { path: '/admin/reports/exams/combined', label: 'Combined' },
                ]
            },
            { path: '/admin/reports/students', label: 'Student Reports', icon: <Icons.User /> },
        ]
    },
    {
        title: 'USERS',
        items: [
            { path: '/admin/students', label: 'Students', icon: <Icons.User /> },
            { path: '/admin/admins', label: 'Admin', icon: <Icons.Shield /> },
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
            { path: '/admin/exams', label: 'Exams', icon: <Icons.Reports /> },
        ]
    },
    {
        title: 'PAYMENTS',
        items: [
            { path: '/admin/payments/upgrades', label: 'Plan Purchases', icon: <Icons.Payments /> },
            { path: '/admin/payments/purchases', label: 'Product Purchases', icon: <Icons.Payments /> },
        ]
    },
    {
        title: 'CONFIGURATION',
        items: [
            { path: '/admin/config/payment', label: 'Payment', icon: <Icons.Gear /> },
            { path: '/admin/config/notification', label: 'Notification', icon: <Icons.Notification /> },
        ]
    }
];

export function Layout({ children, currentPath, user, onLogout }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [currentPath]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            setIsDarkMode(true);
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            setIsDarkMode(false);
            document.documentElement.removeAttribute('data-theme');
        }
    }, []);

    const toggleTheme = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

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
                             <button class="topbar-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle Dark Mode">
                                {isDarkMode ? <Icons.Sun /> : <Icons.Moon />}
                             </button>
                             <div class="topbar-profile">
                                 <button class="profile-toggle-btn">
                                     <div class="profile-avatar-small"><Icons.User /></div>
                                     <div class="profile-info-small">
                                         <span class="profile-name">{user?.firstName || 'Admin'}</span>
                                         <span class="profile-role">Super Admin</span>
                                     </div>
                                 </button>
                                 <div class="profile-dropdown">
                                     <div class="profile-dropdown-inner">
                                         <a href="#" class="dropdown-item" onClick={(e) => { e.preventDefault(); onLogout(); }}>
                                             <Icons.Logout /> Logout
                                         </a>
                                     </div>
                                 </div>
                             </div>
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
