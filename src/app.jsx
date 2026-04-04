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

  return (
    <Router onChange={handleRoute}>
      <LandingPage path="/" />
      
      <AdminRoute path="/admin" component={Dashboard} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/dashboard" component={Dashboard} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/students" component={Students} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/admins" component={Admins} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/standards" component={Standards} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/subjects" component={Subjects} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/chapters" component={Chapters} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/products" component={Products} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/materials/:type?" component={Materials} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/mindmaps" component={MindMaps} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/payments/:type?" component={Payments} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/config/payment" component={PaymentConfig} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/config/notification" component={NotificationConfig} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/reports/students" component={ReportsPage} type="students" user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
      <AdminRoute path="/admin/reports/exams/:type?" component={ReportsPage} user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
    </Router>
  );
}

function AdminRoute({ component: Component, user, currentPath, handleLoginSuccess, handleLogout, ...routeProps }) {
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout currentPath={currentPath} user={user} onLogout={handleLogout}>
      <Component {...routeProps} />
    </Layout>
  );
}
