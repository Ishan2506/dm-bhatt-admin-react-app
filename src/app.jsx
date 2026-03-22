import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Router, route } from 'preact-router';
import { LoginPage } from './pages/LoginPage.jsx';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Standards } from './pages/Standards';
import { Subjects } from './pages/Subjects';
import { Chapters } from './pages/Chapters';
import { Payments } from './pages/Payments';
import { Materials } from './pages/Materials';
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

  const [currentPath, setCurrentPath] = useState('/');

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    route('/');
  };

  const handleRoute = (e) => {
    setCurrentPath(e.url);
  };

  // Not logged in → show login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in → show full admin dashboard
  return (
    <Layout currentPath={currentPath} user={user} onLogout={handleLogout}>
      <Router onChange={handleRoute}>
        <Dashboard path="/" />
        <Standards path="/standards" />
        <Subjects path="/subjects" />
        <Chapters path="/chapters" />
        <Materials path="/materials" />
        <Payments path="/payments" />
      </Router>
    </Layout>
  );
}
