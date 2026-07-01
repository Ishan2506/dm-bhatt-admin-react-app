import { h } from 'preact';
import { Suspense, lazy } from 'preact/compat';
import { Router } from 'preact-router';
import './marketing.css';
import { Home } from './pages/Home.jsx';

/**
 * Premium multi-page marketing website for Padhaku.
 * Mounted for all non-/admin routes. The admin panel remains at /admin.
 *
 * The Home page is bundled eagerly (first paint); every other page is
 * lazy-loaded on navigation for a fast initial load.
 */
const Features = lazy(() => import('./pages/Features.jsx').then((m) => ({ default: m.Features })));
const Courses = lazy(() => import('./pages/Courses.jsx').then((m) => ({ default: m.Courses })));
const About = lazy(() => import('./pages/About.jsx').then((m) => ({ default: m.About })));
const Testimonials = lazy(() => import('./pages/Testimonials.jsx').then((m) => ({ default: m.Testimonials })));
const Contact = lazy(() => import('./pages/Contact.jsx').then((m) => ({ default: m.Contact })));
const Privacy = lazy(() => import('./pages/Privacy.jsx').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms.jsx').then((m) => ({ default: m.Terms })));

function PageFallback() {
  return (
    <div class="mkt" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: 34, height: 34, border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'mkt-spin .8s linear infinite' }} />
      <style>{`@keyframes mkt-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function MarketingSite() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Router>
        <Home path="/" />
        <Features path="/features" />
        <Courses path="/courses" />
        <About path="/about" />
        <Testimonials path="/testimonials" />
        <Contact path="/contact" />
        <Privacy path="/privacy" />
        <Terms path="/terms" />
        <Home default />
      </Router>
    </Suspense>
  );
}

export default MarketingSite;
