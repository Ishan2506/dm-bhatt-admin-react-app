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
    <div className="login-split-container">
      {/* Left Panel: Branding & Visuals */}
      <div className="login-left">
        <div className="login-left-overlay"></div>
        <div className="login-left-content">
          {/* Logo */}
          <div className="login-logo-top">
            <div className="login-logo-icon">
              <img src="/assets/logo.png" alt="Padhaku Logo" />
            </div>
            <span className="login-logo-text">Padhaku.</span>
          </div>

          {/* Testimonial Card */}
          <div className="login-testimonial-card">
            <div className="trust-badge">
              <span className="dot"></span> Trusted by 1,000+ Students
            </div>
            <p className="testimonial-text">
              "Padhaku has transformed our learning ecosystem. The mind maps 
              and AI assistant are a total game-changer for student engagement."
            </p>
            <div className="built-by-card">
              <div className="built-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </div>
              <div className="built-info">
                <span>BUILT BY</span>
                <strong>BondByte</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <header className="login-header">
            <h1>Welcome back!</h1>
            <p>Please enter your details to access your account.</p>
          </header>

          {/* Error */}
          {error && <div className="login-error-toast">{error}</div>}

          <form className="login-form-modern" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="phoneNum">Phone Number</label>
              <div className="input-group">
                <span className="field-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                <input
                  id="phoneNum"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNum}
                  onInput={(e) => setPhoneNum(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="loginCode">Password</label>
              <div className="input-group">
                <span className="field-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="loginCode"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginCode}
                  onInput={(e) => setLoginCode(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>

            <div className="form-extra">
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? <span className="loader-dots">Loading...</span> : 'Sign in'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
