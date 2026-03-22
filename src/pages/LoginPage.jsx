import { useState } from 'preact/hooks';
import './LoginPage.css';

const API_BASE = import.meta.env.API_BASE;

export function LoginPage({ onLoginSuccess }) {
  const [phoneNum, setPhoneNum] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNum.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!loginCode.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        role: 'admin',
        phoneNum: phoneNum.trim(),
        loginCode: loginCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Verify the user is an admin
      if (data.user?.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.');
      }

      // Store auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="login-wrapper">
      <div class="login-card">
        {/* Branding */}
        <div class="login-brand">
          <div class="login-brand-icon">🛡️</div>
          <h1>DM Bhatt Admin</h1>
          <p>Sign in to manage your dashboard</p>
        </div>

        {/* Error */}
        {error && <div class="login-error">{error}</div>}

        {/* Form */}
        <form class="login-form" onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="phoneNum">Phone Number</label>
            <div class="input-wrapper">
              <span class="input-icon">📱</span>
              <input
                id="phoneNum"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNum}
                onInput={(e) => setPhoneNum(e.target.value)}
                autocomplete="tel"
                disabled={loading}
              />
            </div>
          </div>

          <div class="form-group">
            <label for="loginCode">Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                id="loginCode"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={loginCode}
                onInput={(e) => setLoginCode(e.target.value)}
                autocomplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                class="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" class="login-btn" disabled={loading}>
            <span>
              {loading && <span class="btn-spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
