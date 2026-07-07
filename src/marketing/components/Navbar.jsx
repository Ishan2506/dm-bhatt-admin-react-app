import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Icon } from '../Icons.jsx';
import { APP } from '../config.js';

const NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Courses', href: '/courses' },
  { label: 'About', href: '/about' },
  { label: 'Testimonials', href: '/testimonials' },
  { label: 'Contact', href: '/contact' },
];

function Brand() {
  return (
    <a class="brand" href="/" onClick={(e) => { e.preventDefault(); route('/'); }}>
      <span class="mark">P</span>
      <span>Padhaku</span>
    </a>
  );
}

export function Navbar({ current = '/' }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const go = (href) => (e) => {
    e.preventDefault();
    setOpen(false);
    route(href);
    window.scrollTo({ top: 0 });
  };

  const isActive = (href) => current === href;

  return (
    <>
      <nav class={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div class="nav-inner">
          <Brand />
          <div class="nav-links">
            {NAV.map((n) => (
              <a
                key={n.href}
                class={`nav-link ${isActive(n.href) ? 'active' : ''}`}
                href={n.href}
                onClick={go(n.href)}
              >
                {n.label}
              </a>
            ))}
          </div>
          <div class="nav-cta">
            <a class="btn btn-primary btn-sm" href={APP.playStoreUrl} target="_blank" rel="noopener">
              <Icon.Download size={16} /> Download App
            </a>
            <button class="nav-toggle" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Icon.Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-out */}
      <div class={`mnav-scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside class={`mnav ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div class="mnav-head">
          <Brand />
          <button class="icon-btn" aria-label="Close menu" onClick={() => setOpen(false)}>
            <Icon.X size={22} />
          </button>
        </div>
        <div class="mnav-links">
          {NAV.map((n) => (
            <a
              key={n.href}
              class={isActive(n.href) ? 'active' : ''}
              href={n.href}
              onClick={go(n.href)}
            >
              {n.label} <Icon.ChevronRight size={18} />
            </a>
          ))}
        </div>
        <div class="mnav-foot">
          <a class="btn btn-primary btn-block" href={APP.playStoreUrl} target="_blank" rel="noopener">
            <Icon.Download size={18} /> Download App
          </a>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
