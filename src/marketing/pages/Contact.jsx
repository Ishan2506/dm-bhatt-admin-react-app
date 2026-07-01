import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Icon } from '../Icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { PageShell } from '../components/PageShell.jsx';
import { StoreButtons, QRTile } from '../components/AppDownload.jsx';
import { PageHero, SectionHead, FAQ } from '../components/Shared.jsx';
import { APP } from '../config.js';

const CONTACT_FAQ = [
  { q: 'How quickly will I hear back?', a: 'We aim to respond to every message within one business day. For urgent matters, call us during business hours.' },
  { q: 'How do I download the app?', a: 'Padhaku is available free on the Apple App Store and Google Play. Tap a store button anywhere on this site, or scan the QR code to get started.' },
  { q: 'I need help with my account. What should I do?', a: 'Send us a message using the form and describe the issue. Our team will help you get back to learning as quickly as possible.' },
];

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = 'Please enter your name';
    if (!form.email.trim()) err.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = 'Please enter a valid email';
    if (!form.message.trim()) err.message = 'Please tell us how we can help';
    return err;
  };

  const submit = (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length === 0) setSent(true);
  };

  return (
    <PageShell
      current="/contact"
      title="Contact — Padhaku"
      description="Get in touch with the Padhaku team. Book a walkthrough, ask about pricing, or get help onboarding your institute."
    >
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your institute"
        subtitle="Whether you want a walkthrough, have a question about pricing, or need onboarding help — we're here."
      />

      {/* ============ FORM + DETAILS ============ */}
      <section class="section-tight">
        <div class="container">
          <div class="split" style={{ alignItems: 'start' }}>
            {/* Form */}
            <Reveal class="form-card">
              {sent ? (
                <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                  <div class="icon-box green" style={{ margin: '0 auto 18px', width: 60, height: 60, borderRadius: 16 }}>
                    <Icon.CheckCircle size={30} />
                  </div>
                  <h3 style={{ fontSize: 22, marginBottom: 8 }}>Thanks — we've got your message</h3>
                  <p style={{ color: 'var(--c-text-2)' }}>Our team will get back to you within one business day.</p>
                  <button class="btn btn-secondary" style={{ marginTop: 22 }}
                    onClick={() => { setSent(false); setForm({ name: '', email: '', org: '', message: '' }); }}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} novalidate>
                  <h3 style={{ fontSize: 22, marginBottom: 6 }}>Send us a message</h3>
                  <p style={{ color: 'var(--c-text-2)', fontSize: 15, marginBottom: 24 }}>
                    Fill in the form and we'll be in touch shortly.
                  </p>
                  <div class="form-row">
                    <div class="field">
                      <label for="c-name">Full name</label>
                      <input id="c-name" type="text" placeholder="Your name" value={form.name} onInput={set('name')} />
                      {errors.name && <span class="err">{errors.name}</span>}
                    </div>
                    <div class="field">
                      <label for="c-email">Email</label>
                      <input id="c-email" type="email" placeholder="you@institute.com" value={form.email} onInput={set('email')} />
                      {errors.email && <span class="err">{errors.email}</span>}
                    </div>
                  </div>
                  <div class="field" style={{ marginTop: 18 }}>
                    <label for="c-org">Institute / Organization</label>
                    <input id="c-org" type="text" placeholder="Name of your institute (optional)" value={form.org} onInput={set('org')} />
                  </div>
                  <div class="field" style={{ marginTop: 18 }}>
                    <label for="c-msg">How can we help?</label>
                    <textarea id="c-msg" placeholder="Tell us a little about your institute and what you're looking for..." value={form.message} onInput={set('message')} />
                    {errors.message && <span class="err">{errors.message}</span>}
                  </div>
                  <button type="submit" class="btn btn-primary btn-block btn-lg" style={{ marginTop: 22 }}>
                    Send message <Icon.ArrowRight size={18} />
                  </button>
                </form>
              )}
            </Reveal>

            {/* Details */}
            <Reveal delay={1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div class="info-card">
                <div class="ii"><Icon.Mail size={22} /></div>
                <div>
                  <h4>Email us</h4>
                  <p>{APP.contactEmail}</p>
                </div>
              </div>
              <div class="info-card">
                <div class="ii"><Icon.Phone size={22} /></div>
                <div>
                  <h4>Call us</h4>
                  <p>{APP.phone}</p>
                </div>
              </div>
              <div class="info-card">
                <div class="ii"><Icon.MapPin size={22} /></div>
                <div>
                  <h4>Visit us</h4>
                  <p>{APP.address}</p>
                </div>
              </div>
              <div class="info-card">
                <div class="ii"><Icon.Clock size={22} /></div>
                <div>
                  <h4>Business hours</h4>
                  <p>{APP.hours}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ MAP PLACEHOLDER ============ */}
      <section class="section-tight">
        <div class="container">
          <Reveal class="map-box" style={{ minHeight: 340 }}>
            <div class="map-inner">
              <div style={{ textAlign: 'center' }}>
                <div class="icon-box" style={{ margin: '0 auto 12px' }}><Icon.MapPin size={22} /></div>
                <p style={{ color: 'var(--c-text-2)', fontWeight: 600 }}>Padhaku HQ</p>
                <p style={{ color: 'var(--c-text-3)', fontSize: 14 }}>Gujarat, India</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ DOWNLOAD ============ */}
      <section class="section-tight">
        <div class="container">
          <Reveal class="card" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
            flexWrap: 'wrap', padding: 'clamp(28px, 4vw, 40px)',
            background: 'linear-gradient(160deg, #F8FAFF, #EFF4FF)', border: '1px solid #DCE7FF',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <QRTile />
              <div>
                <div class="eyebrow" style={{ marginBottom: 8 }}><Icon.Smartphone size={16} /> Get the app</div>
                <h3 style={{ fontSize: 22, marginBottom: 6 }}>Prefer to just start learning?</h3>
                <p style={{ color: 'var(--c-text-2)', fontSize: 15, maxWidth: 340 }}>
                  Scan the code or tap a store button to download Padhaku free.
                </p>
              </div>
            </div>
            <StoreButtons />
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <SectionHead eyebrow="FAQ" title="Before you reach out" />
          <FAQ items={CONTACT_FAQ} />
        </div>
      </section>
    </PageShell>
  );
}

export default Contact;
