import { h } from 'preact';
import { route } from 'preact-router';
import { Icon } from '../Icons.jsx';
import { APP } from '../config.js';
import { StoreButtons } from './AppDownload.jsx';

const COLS = [
  {
    h: 'Product',
    links: [
      ['Features', '/features'],
      ['Courses', '/courses'],
      ['Testimonials', '/testimonials'],
    ],
  },
  {
    h: 'Company',
    links: [
      ['About', '/about'],
      ['Contact', '/contact'],
    ],
  },
  {
    h: 'Get the app',
    links: [
      ['Download for iOS', APP.appStoreUrl],
      ['Download for Android', APP.playStoreUrl],
    ],
  },
  {
    h: 'Legal',
    links: [
      ['Privacy Policy', '/privacy'],
      ['Terms & Conditions', '/terms'],
    ],
  },
];

export function Footer() {
  const go = (href) => (e) => {
    if (href.startsWith('/') && !href.startsWith('/admin')) {
      e.preventDefault();
      route(href.split('#')[0]);
      window.scrollTo({ top: 0 });
    }
  };

  return (
    <footer class="footer">
      <div class="container">
        <div class="foot-grid">
          <div class="foot-about">
            <a class="brand" href="/" onClick={go('/')}>
              <span class="mark">P</span>
              <span>Padhaku</span>
            </a>
            <p>
              The learning app that helps students study smarter — materials, mind maps,
              quizzes, exams and rewards, all in one place. Learn anytime, anywhere.
            </p>
            <div style={{ marginTop: 20 }}><StoreButtons /></div>
            <div class="foot-social" style={{ marginTop: 20 }}>
              <a href="#" aria-label="Twitter"><Icon.Twitter size={18} /></a>
              <a href="#" aria-label="LinkedIn"><Icon.Linkedin size={18} /></a>
              <a href="#" aria-label="Instagram"><Icon.Instagram size={18} /></a>
              <a href="#" aria-label="YouTube"><Icon.Youtube size={18} /></a>
            </div>
          </div>
          {COLS.map((col) => (
            <div class="foot-col" key={col.h}>
              <h5>{col.h}</h5>
              {col.links.map(([label, href]) => (
                <a key={label} href={href} onClick={go(href)}>{label}</a>
              ))}
            </div>
          ))}
        </div>
        <div class="foot-bottom">
          <p>© {new Date().getFullYear()} Padhaku. All rights reserved.</p>
          <div class="links">
            <a href="/privacy" onClick={go('/privacy')}>Privacy</a>
            <a href="/terms" onClick={go('/terms')}>Terms</a>
            <a href="/contact" onClick={go('/contact')}>Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
