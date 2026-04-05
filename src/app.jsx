import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Router, route } from 'preact-router';
import { LoginPage } from './pages/LoginPage.jsx';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Standards } from './pages/Standards';
import { Subjects } from './pages/Subjects';
import { Chapters } from './pages/Chapters';
import { Students } from './pages/Students';
import { Admins } from './pages/Admins';
import { Materials } from './pages/Materials';
import { MindMaps } from './pages/MindMaps';
import { Payments } from './pages/Payments';
import { PaymentConfig } from './pages/PaymentConfig';
import { NotificationConfig } from './pages/NotificationConfig';
import { Products } from './pages/Products';
import { ReportsPage } from './pages/ReportsPage';
import { LandingPage } from './pages/LandingPage';
import './pages/LoginPage.css';

export function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    route('/admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    route('/admin');
  };

  const handleRoute = (e) => {
    setCurrentPath(e.url);
  };

  const isAdminPath = currentPath.startsWith('/admin');

  if (currentPath === '/') {
    return <LandingPage />;
  }

  if (isAdminPath) {
    if (!user) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <Layout currentPath={currentPath} user={user} onLogout={handleLogout}>
        <Router onChange={handleRoute}>
          <Dashboard path="/admin" />
          <Dashboard path="/admin/dashboard" />
          <Students path="/admin/students" />
          <Admins path="/admin/admins" />
          <Standards path="/admin/standards" />
          <Subjects path="/admin/subjects" />
          <Chapters path="/admin/chapters" />
          <Products path="/admin/products" />
          <Materials path="/admin/materials/:type?" />
          <MindMaps path="/admin/mindmaps" />
          <Payments path="/admin/payments/:type?" />
          <PaymentConfig path="/admin/config/payment" />
          <NotificationConfig path="/admin/config/notification" />
          <ReportsPage path="/admin/reports/students" type="students" />
          <ReportsPage path="/admin/reports/exams/:type?" />
        </Router>
      </Layout>
    );
  }

  return (
    <Router onChange={handleRoute}>
      <LandingPage path="/" />
      <LoginPage default onLoginSuccess={handleLoginSuccess} />
    </Router>
  );
}
