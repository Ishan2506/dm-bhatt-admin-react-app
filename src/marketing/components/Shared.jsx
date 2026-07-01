import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { route } from 'preact-router';
import { Icon } from '../Icons.jsx';
import { Reveal } from './Reveal.jsx';
import { StoreButtons } from './AppDownload.jsx';

/* ---- Navigation helper ---- */
export const goTo = (href) => (e) => {
  if (e) e.preventDefault();
  route(href);
  window.scrollTo({ top: 0 });
};

/* ---- CTA link button ---- */
export function CTA({ href, children, variant = 'primary', size = '', icon = true, onClick }) {
  return (
    <a
      class={`btn btn-${variant} ${size ? `btn-${size}` : ''}`}
      href={href}
      onClick={onClick || goTo(href)}
    >
      {children}
      {icon && variant === 'primary' && <Icon.ArrowRight size={18} />}
    </a>
  );
}

/* ---- Section heading ---- */
export function SectionHead({ eyebrow, title, subtitle, align = 'center' }) {
  return (
    <Reveal class={`section-head ${align === 'left' ? '' : 'center'}`} style={align === 'left' ? { textAlign: 'left', margin: '0 0 48px' } : {}}>
      {eyebrow && <div class="eyebrow"><Icon.Sparkles size={16} /> {eyebrow}</div>}
      <h2 class="h-section" style={{ marginTop: eyebrow ? 14 : 0 }}>{title}</h2>
      {subtitle && <p class="lead">{subtitle}</p>}
    </Reveal>
  );
}

/* ---- FAQ accordion ---- */
export function FAQ({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div class="faq">
      {items.map((it, i) => (
        <div key={i} class={`faq-item ${open === i ? 'open' : ''}`}>
          <button class="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
            {it.q}
            <Icon.Plus size={20} />
          </button>
          <div class="faq-a" style={{ maxHeight: open === i ? '320px' : '0' }}>
            <div class="faq-a-inner">{it.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Testimonial card ---- */
export function Quote({ text, name, role, initials }) {
  return (
    <div class="quote">
      <div class="stars">
        {[0, 1, 2, 3, 4].map((i) => <Icon.Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p>“{text}”</p>
      <div class="who">
        <div class="av">{initials}</div>
        <div>
          <div class="n">{name}</div>
          <div class="r">{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ---- CTA banner (download-focused) ---- */
export function CtaBanner({
  title = 'Start learning with Padhaku today',
  subtitle = 'Download the app and get instant access to lessons, quizzes, mind maps and rewards. Learning has never felt this good.',
  stores = true,
  secondary = null,
}) {
  return (
    <section class="section">
      <div class="container">
        <Reveal variant="reveal-scale" class="cta-banner">
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <div class="cta-actions" style={{ flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            {stores && <StoreButtons light />}
            {secondary && (
              <a class="btn btn-ghost btn-lg" href={secondary[1]} onClick={goTo(secondary[1])}>
                {secondary[0]}
              </a>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---- Inner page hero ---- */
export function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <header class="page-hero">
      <div class="hero-bg" />
      <div class="container page-hero-inner">
        {eyebrow && <Reveal class="badge" style={{ marginBottom: 18 }}><Icon.Sparkles size={14} /> {eyebrow}</Reveal>}
        <Reveal as="h1" class="display" delay={1} style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>{title}</Reveal>
        {subtitle && <Reveal class="lead" delay={2}>{subtitle}</Reveal>}
        {children && <Reveal delay={3} style={{ marginTop: 28 }}>{children}</Reveal>}
      </div>
    </header>
  );
}

/* ---- Trust strip (student/parent proof points) ---- */
export function LogoStrip() {
  const items = [
    [Icon.Users, '25,000+ students'],
    [Icon.Star, '4.8 app rating'],
    [Icon.ClipboardCheck, '500K+ tests taken'],
    [Icon.ShieldCheck, 'Safe & trusted'],
    [Icon.Smartphone, 'iOS & Android'],
  ];
  return (
    <div class="logos">
      {items.map(([I, label]) => (
        <div class="logo-item" key={label}><I size={22} /> {label}</div>
      ))}
    </div>
  );
}
