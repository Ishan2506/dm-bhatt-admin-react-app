import { useState } from 'preact/hooks';
import { LoginPage } from './pages/LoginPage.jsx';
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

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Not logged in → show login page
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Logged in → show dashboard placeholder
  return (
    <div class="dashboard-wrapper">
      <header class="dashboard-header">
        <h2>
          🛡️ <span>DM Bhatt</span> Admin
        </h2>
        <button class="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main class="dashboard-content">
        <div class="dashboard-placeholder">
          <div class="welcome-emoji">👋</div>
          <h1>Welcome, {user.firstName || 'Admin'}!</h1>
          <p>Your admin dashboard is ready to be built.</p>
        </div>
      </main>
    </div>
  );
}
