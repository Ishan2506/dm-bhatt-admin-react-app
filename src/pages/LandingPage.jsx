import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Link } from 'preact-router/match';
import './LandingPage.css';

const svg = (children) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    {children}
  </svg>
);

const LpIcons = {
  Book: () => svg(<><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6.5 18H20" /></>),
  Check: () => svg(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>),
  Chart: () => svg(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>),
  Phone: () => svg(<><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></>),
  Lock: () => svg(<><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  Bulb: () => svg(<><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></>),
  Pin: () => svg(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>),
};

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="lp-nav">
        <div className="lp-container lp-nav-content">
          <div className="lp-logo">
            <img src="/assets/logo.png" alt="Padhaku Logo" className="lp-logo-img" />
            <span className="lp-logo-text">Padhaku</span>
          </div>
          <div className={`lp-nav-links ${isMenuOpen ? 'lp-nav-open' : ''}`}>
            <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
          </div>
          <button 
            className="lp-menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            <div className={`lp-hamburger ${isMenuOpen ? 'lp-hamburger-active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="lp-hero">
        <div className="lp-container lp-hero-content">
          <div className="lp-hero-text">
            <div className="lp-badge">ENHANCING EDUCATION</div>
            <h1>Empowering Students with <span>Direct Learning</span></h1>
            <p>
              Access high-quality study materials, track your progress, and excel in your exams with Padhaku's comprehensive learning platform.
            </p>
            <div className="lp-hero-btns">
              <button className="lp-btn lp-btn-primary">Get Started Free</button>
              <button className="lp-btn lp-btn-secondary">Watch Demo</button>
            </div>
            <div className="lp-social-proof">
              <div className="lp-avatars">
                <img src="https://i.pravatar.cc/40?img=1" alt="User" />
                <img src="https://i.pravatar.cc/40?img=2" alt="User" />
                <img src="https://i.pravatar.cc/40?img=3" alt="User" />
                <img src="https://i.pravatar.cc/40?img=4" alt="User" />
              </div>
              <span>Trusted by <strong>1,000+</strong> students</span>
            </div>
          </div>
          <div className="lp-hero-image">
            <div className="lp-image-wrapper">
              <img src="/assets/padhaku-mockup.png" alt="App Mockup" />
              <div className="lp-floating-card lp-card-1">
                <div className="lp-card-icon"><LpIcons.Book /></div>
                <div className="lp-card-info">
                  <strong>500+</strong>
                  <span>Chapters</span>
                </div>
              </div>
              <div className="lp-floating-card lp-card-2">
                <div className="lp-card-icon"><LpIcons.Check /></div>
                <div className="lp-card-info">
                  <strong>Real-time</strong>
                  <span>Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Social Proof Section (Repositioned) */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid">
            <div className="lp-stat-item">
              <strong>10k+</strong>
              <span>Active Students</span>
            </div>
            <div className="lp-stat-item">
              <strong>98%</strong>
              <span>Satisfaction Rate</span>
            </div>
            <div className="lp-stat-item">
              <strong>50+</strong>
              <span>Expert Educators</span>
            </div>
            <div className="lp-stat-item">
              <strong>24/7</strong>
              <span>Support Access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid */}
      <section id="features" className="lp-features">
        <div className="lp-container">
          <div className="lp-section-header">
            <h2>Everything you need to <span>succeed</span></h2>
            <p>Our platform is designed with students in mind, providing all the tools necessary for modern learning.</p>
          </div>
          
          <div className="lp-bento-grid">
            <div className="lp-bento-item lp-bento-large">
              <div className="lp-bento-content">
                <div className="lp-bento-icon"><LpIcons.Chart /></div>
                <h3>Detailed Analytics</h3>
                <p>Track your performance across different subjects and see where you need to improve.</p>
              </div>
              <div className="lp-bento-visual">
                <div className="lp-mini-chart">
                  <div className="lp-bar" style={{height: '60%'}}></div>
                  <div className="lp-bar" style={{height: '80%'}}></div>
                  <div className="lp-bar" style={{height: '40%'}}></div>
                  <div className="lp-bar" style={{height: '90%'}}></div>
                  <div className="lp-bar" style={{height: '70%'}}></div>
                </div>
              </div>
            </div>

            <div className="lp-bento-item lp-bento-medium">
              <div className="lp-bento-content">
                <div className="lp-bento-icon"><LpIcons.Phone /></div>
                <h3>Anywhere Access</h3>
                <p>Study on the go with our fully responsive mobile and web applications.</p>
              </div>
            </div>

            <div className="lp-bento-item lp-bento-medium">
              <div className="lp-bento-content">
                <div className="lp-bento-icon"><LpIcons.Lock /></div>
                <h3>Secure Portal</h3>
                <p>Your data and progress are always safe with our enterprise-grade security.</p>
              </div>
            </div>

            <div className="lp-bento-item lp-bento-wide">
              <div className="lp-bento-content">
                <div className="lp-bento-icon"><LpIcons.Bulb /></div>
                <h3>Expert Curated Content</h3>
                <p>All materials are verified and curated by subject matter experts to ensure accuracy and relevance to your curriculum.</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Footer - dailyyou.in style */}
      <footer className="lp-footer">
        {/* Pre-footer with big branding and CTA */}
        <div className="lp-pre-footer">
          <div className="lp-footer-bg-text">PADHAKU.</div>
          <div className="lp-container lp-footer-cta">
            <Link href="/admin" className="lp-journey-btn">
              START YOUR JOURNEY 
              <span className="lp-arrow-circle">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="lp-footer-main">
          <div className="lp-container">
            <div className="lp-footer-grid">
              {/* Brand Column */}
              <div className="lp-footer-brand-col">
                <div className="lp-logo">
                  <img src="/assets/logo.png" alt="Padhaku Logo" className="lp-logo-img" />
                  <span className="lp-logo-text">Padhaku.</span>
                </div>
                <p className="lp-brand-tagline">
                  Centralised platform to track your daily progress. Elevating 
                  education management through digital innovation.
                </p>
                <div className="lp-location-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  AHMEDABAD, IN
                </div>
              </div>

              {/* Platform Links */}
              <div className="lp-footer-col">
                <h4>PLATFORM</h4>
                <div className="lp-footer-links-list">
                  <Link href="/admin/standards">Standards</Link>
                  <Link href="/admin/subjects">Subjects</Link>
                  <Link href="/admin/chapters">Chapters</Link>
                  <Link href="/admin/materials">Materials</Link>
                </div>
              </div>

              {/* Connect Column */}
              <div className="lp-footer-col">
                <h4>CONNECT</h4>
                <div className="lp-connect-item">
                  <div className="lp-connect-icon">
                    <svg viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="lp-connect-info">
                    <span>EMAIL</span>
                    <a href="mailto:info@padhaku.in">info@padhaku.in</a>
                  </div>
                </div>
                <div className="lp-connect-item">
                  <div className="lp-connect-icon">
                    <svg viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="lp-connect-info">
                    <span>MOBILE</span>
                    <a href="tel:+919274043301">+91 92740 43301</a>
                  </div>
                </div>
              </div>

              {/* Crafted By Column */}
              <div className="lp-footer-col">
                <div className="lp-crafted-card">
                  <span className="lp-crafted-label">CRAFTED BY</span>
                  <div className="lp-crafted-name">
                    <span></span> BondByte Technologies
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="lp-footer-bottom">
              <p>&copy; 2026 Padhaku Education. All rights reserved.</p>
              <div className="lp-footer-bottom-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Support</a>
                <div className="lp-footer-socials">
                  <a href="#" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                  <a href="#" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                      <rect x="2" y="9" width="4" height="12"></rect>
                      <circle cx="4" cy="4" r="2"></circle>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
