import { h, Fragment } from 'preact';
import { Icon, Brand } from '../Icons.jsx';
import { APP } from '../config.js';
import { Reveal } from './Reveal.jsx';

/* ---- Store buttons ---- */
export function StoreButtons({ light = false, size = 'md' }) {
  const cls = light ? 'store-btn light' : 'store-btn';
  return (
    <div class="store-row">
      <a class={cls} href={APP.appStoreUrl} target="_blank" rel="noopener" aria-label="Download on the App Store">
        <span class="glyph"><Brand.Apple size={24} /></span>
        <span class="txt"><span class="sm">Download on the</span><span class="lg">App Store</span></span>
      </a>
      <a class={cls} href={APP.playStoreUrl} target="_blank" rel="noopener" aria-label="Get it on Google Play">
        <span class="glyph"><Brand.GooglePlay size={22} /></span>
        <span class="txt"><span class="sm">Get it on</span><span class="lg">Google Play</span></span>
      </a>
    </div>
  );
}

/* ---- QR tile ---- */
export function QRTile() {
  return (
    <div class="qr-tile">
      {APP.qrImageUrl
        ? <img src={APP.qrImageUrl} alt="Scan to download Padhaku" />
        : <div class="qr-ph"><Icon.QrCode size={30} /></div>}
    </div>
  );
}

/* ---- Rating inline ---- */
export function RatingInline({ value = '4.8', count = '12,000+' }) {
  return (
    <div class="rating-inline">
      <span class="stars">
        {[0, 1, 2, 3, 4].map((i) => <Icon.Star key={i} size={15} fill="currentColor" />)}
      </span>
      <span><strong style={{ color: 'var(--c-text)' }}>{value}</strong> · {count} ratings</span>
    </div>
  );
}

/* ---- Home screen content (default) ---- */
function HomeScreen() {
  const items = [
    [Icon.ClipboardCheck, 'Mathematics Test', 'Chapter 7 · Algebra', 'var(--tint-primary)', 'var(--c-primary)', 72],
    [Icon.BookOpen, 'Science Notes', 'Standard 10 · Physics', 'var(--tint-success)', 'var(--c-success)', 45],
    [Icon.Brain, 'History Mind Map', 'Quick revision', '#F5F3FF', '#7C3AED', 90],
  ];
  return (
    <Fragment>
      <div class="phone-status">
        <span>9:41</span>
        <span class="sig"><Icon.Wifi size={14} /> <span>100%</span></span>
      </div>
      <div class="phone-app">
        <div class="phone-hi">Good morning,</div>
        <div class="phone-name">Aarav</div>
        {items.map(([I, t, s, bg, fg, prog]) => (
          <div class="phone-card" key={t}>
            <div class="pc-top">
              <div class="pc-ic" style={{ background: bg, color: fg }}><I size={20} /></div>
              <div>
                <div class="pc-t">{t}</div>
                <div class="pc-s">{s}</div>
              </div>
            </div>
            <div class="phone-prog"><i style={{ width: `${prog}%` }} /></div>
          </div>
        ))}
      </div>
      <div class="phone-tabs"><span class="on" /><span /><span /><span /></div>
    </Fragment>
  );
}

/* ---- Leaderboard screen (for the back phone) ---- */
function LeaderboardScreen() {
  return (
    <Fragment>
      <div class="phone-status"><span>9:41</span><span class="sig"><Icon.Wifi size={14} /></span></div>
      <div class="phone-app">
        <div class="phone-name" style={{ marginTop: 8 }}>Leaderboard</div>
        {['Aarav S.', 'Diya P.', 'Kabir M.'].map((n, i) => (
          <div class="phone-card" key={n}>
            <div class="pc-top">
              <div class="pc-ic" style={{ background: 'var(--tint-warning)', color: '#B45309' }}><Icon.Trophy size={20} /></div>
              <div><div class="pc-t">{n}</div><div class="pc-s">{1200 - i * 140} points</div></div>
            </div>
          </div>
        ))}
      </div>
      <div class="phone-tabs"><span /><span class="on" /><span /><span /></div>
    </Fragment>
  );
}

/* ---- Phone mockup ---- */
export function PhoneMockup({ screen = 'home' }) {
  return (
    <div class="phone">
      <div class="phone-screen">
        {screen === 'leaderboard' ? <LeaderboardScreen /> : <HomeScreen />}
      </div>
    </div>
  );
}

/* ---- Phones cluster (two phones) ---- */
export function PhonesCluster() {
  return (
    <div class="phones-cluster">
      <div class="phone back">
        <div class="phone-screen"><LeaderboardScreen /></div>
      </div>
      <div class="phone front">
        <div class="phone-screen"><HomeScreen /></div>
      </div>
    </div>
  );
}

/* ---- Full app promo band ---- */
export function AppPromo() {
  return (
    <section class="section">
      <div class="container">
        <Reveal variant="reveal-scale" class="app-band">
          <div class="split">
            <div>
              <div class="badge" style={{ marginBottom: 16 }}><Icon.Smartphone size={14} /> Padhaku Mobile App</div>
              <h2 class="h-section" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.5rem)' }}>Continue learning anywhere</h2>
              <p class="lead" style={{ marginTop: 16 }}>
                Take your lessons, tests and progress with you. Study on the bus, revise before class,
                and never lose your place — Padhaku syncs everything to your phone.
              </p>
              <ul class="check-list">
                {['Study materials & mind maps offline-friendly', 'Attempt quizzes and exams on the go', 'Track results, points and leaderboards live'].map((t) => (
                  <li key={t}><span class="ci"><Icon.Check size={15} /></span> {t}</li>
                ))}
              </ul>
              <div style={{ marginTop: 26 }}><StoreButtons /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 22, flexWrap: 'wrap' }}>
                <QRTile />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Scan to download</div>
                  <p style={{ color: 'var(--c-text-2)', fontSize: 14, maxWidth: 200 }}>Point your camera at the code to get the app instantly.</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
