import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Router, route } from 'preact-router';
import { LoginPage } from './pages/LoginPage.jsx';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Standards } from './pages/Standards';
import { Subjects } from './pages/Subjects';
import { Chapters } from './pages/Chapters';
import { Materials } from './pages/Materials';
import { MindMaps } from './pages/MindMaps';
import { Payments } from './pages/Payments';
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
      {/* Landing Page at / */}
      <LandingPage path="/" />

      {/* Admin Routes */}
      <AdminContainer path="/admin/:id*" user={user} currentPath={currentPath} handleLoginSuccess={handleLoginSuccess} handleLogout={handleLogout} />
    </Router>
  );
}

function AdminContainer({ user, currentPath, handleLoginSuccess, handleLogout }) {
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Ensure path is correctly handled for sub-routes
  return (
    <Layout currentPath={currentPath} user={user} onLogout={handleLogout}>
      <Router>
        <Dashboard path="/admin" />
        <Dashboard path="/admin/dashboard" />
        <Standards path="/admin/standards" />
        <Subjects path="/admin/subjects" />
        <Chapters path="/admin/chapters" />
        <Materials path="/admin/materials/:type?" />
        <MindMaps path="/admin/mindmaps" />
        <Payments path="/admin/payments/:type?" />
      </Router>
    </Layout>
  );
}
