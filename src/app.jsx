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

  useEffect(() => {
    // Disable right click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && e.keyCode === 85) // Ctrl+U
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.onselectstart = () => false;
    document.ondragstart = () => false;

    // Continuous debugger loop to prevent inspection if DevTools is open
    const interval = setInterval(() => {
      (function() {
        try {
          (function b(i) {
            if (("" + i / i).length !== 1 || i % 20 === 0) {
              (function() {}).constructor("debugger")();
            } else {
              debugger;
            }
            b(++i);
          })(0);
        } catch (e) {}
      })();
    }, 1000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.onselectstart = null;
      document.ondragstart = null;
      clearInterval(interval);
    };
  }, []);

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
          {user.role === 'super admin' && <Dashboard path="/admin" />}
          {user.role === 'super admin' && <Dashboard path="/admin/dashboard" />}
          
          {/* Redirect standard admin away from dashboard if they land there */}
          {user.role !== 'super admin' && (
            <Standards path="/admin" />
          )}
          {user.role !== 'super admin' && (
            <Standards path="/admin/dashboard" />
          )}

          <Students path="/admin/students" />
          
          {/* Super Admin Only Paths */}
          {user.role === 'super admin' ? (
            <Fragment>
              <Admins path="/admin/admins" />
              <ActivityLogs path="/admin/logs" />
              <Payments path="/admin/payments/:type?" />
              <PaymentConfig path="/admin/config/payment" />
              <NotificationConfig path="/admin/config/notification" />
              <AppConfig path="/admin/config/app" />
            </Fragment>
          ) : null}

          <Standards path="/admin/standards" />
          <Subjects path="/admin/subjects" />
          <Chapters path="/admin/chapters" />
          <Products path="/admin/products" />
          <Materials path="/admin/materials/:type?" />
          <MindMaps path="/admin/mindmaps" />
          <Exams path="/admin/exams" />
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
