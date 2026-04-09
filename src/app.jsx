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
import { Exams } from './pages/Exams';
import { PaymentConfig } from './pages/PaymentConfig';
import { NotificationConfig } from './pages/NotificationConfig';
import { AppConfig } from './pages/AppConfig';
import { Products } from './pages/Products';
import { ReportsPage } from './pages/ReportsPage';
import { LandingPage } from './pages/LandingPage';
import { ActivityLogs } from './pages/ActivityLogs';
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
          <Exams path="/admin/exams" />
          <Payments path="/admin/payments/:type?" />
          <PaymentConfig path="/admin/config/payment" />
          <NotificationConfig path="/admin/config/notification" />
          <AppConfig path="/admin/config/app" />
          <ActivityLogs path="/admin/logs" />
          <ReportsPage path="/admin/reports/:section/:type?" key={currentPath} />
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
