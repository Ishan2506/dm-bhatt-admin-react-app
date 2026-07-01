import { h, Fragment } from 'preact';
import { Icon } from '../Icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { Counter } from '../components/Counter.jsx';
import { PageShell } from '../components/PageShell.jsx';
import { StoreButtons, AppPromo } from '../components/AppDownload.jsx';
import { PageHero, SectionHead, CtaBanner } from '../components/Shared.jsx';
import { STATS, VALUES } from '../data.js';

const LOVE = [
  [Icon.Smartphone, 'It fits their life', 'Students can study on their own phone, at their own pace, wherever they are.'],
  [Icon.Sparkles, 'It feels rewarding', 'Points, ranks and games make everyday practice something they enjoy.'],
  [Icon.TrendingUp, 'They see progress', 'Instant results and clear tracking show them they are getting better.'],
  [Icon.ShieldCheck, 'Parents trust it', 'A safe, focused space for learning — not another distraction.'],
];

export function About() {
  return (
    <PageShell
      current="/about"
      title="About — Padhaku"
      description="Padhaku is on a mission to help every student learn smarter and enjoy studying. Discover our story, mission, vision and educational philosophy."
    >
      <PageHero
        eyebrow="Our Story"
        title="Making studying something students love"
        subtitle="We believe learning should feel motivating, not stressful. Padhaku was built to put a joyful, effective study companion in every student's pocket."
      >
        <StoreButtons />
      </PageHero>

      {/* ============ STORY ============ */}
      <section class="section">
        <div class="container">
          <div class="split">
            <Reveal>
              <div class="eyebrow"><Icon.BookOpen size={16} /> Our story</div>
              <h2 class="h-section" style={{ marginTop: 14 }}>Study tools that actually help</h2>
              <p class="lead" style={{ marginTop: 18 }}>
                Too many students find studying boring, scattered and hard to stick with — bouncing between
                books, notes and apps without ever feeling like they're making progress.
              </p>
              <p style={{ color: 'var(--c-text-2)', fontSize: 16, marginTop: 16, lineHeight: 1.7 }}>
                So we built Padhaku: one simple app that brings materials, mind maps, practice tests, games
                and rewards together. Learning becomes clear, motivating and — dare we say it — fun. And
                because everything lives on your phone, you can study anytime, anywhere.
              </p>
            </Reveal>
            <Reveal variant="reveal-scale" delay={1} class="grid g-2" style={{ gap: 16 }}>
              {[
                [Icon.Target, 'Focused', 'Made for learning, free of distractions.'],
                [Icon.Layers, 'All-in-one', 'Notes, tests and rewards in a single app.'],
                [Icon.Heart, 'Motivating', 'Designed to make students want to study.'],
                [Icon.Zap, 'Always ready', 'Learn in a spare five minutes, anywhere.'],
              ].map(([I, t, d]) => (
                <div class="card" key={t}>
                  <div class="icon-box" style={{ margin: '0 0 14px' }}><I size={22} /></div>
                  <h3 style={{ fontSize: 17 }}>{t}</h3>
                  <p style={{ fontSize: 14.5 }}>{d}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ MISSION / VISION ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <div class="grid g-2">
            <Reveal class="card" style={{ padding: 'clamp(28px, 4vw, 44px)' }}>
              <div class="icon-box" style={{ width: 54, height: 54 }}><Icon.Rocket size={26} /></div>
              <h3 style={{ fontSize: 24, margin: '4px 0 12px' }}>Our Mission</h3>
              <p style={{ fontSize: 16.5, color: 'var(--c-text-2)', lineHeight: 1.7 }}>
                To help every student learn smarter and enjoy studying — by putting a simple, motivating
                and effective study companion right in their pocket.
              </p>
            </Reveal>
            <Reveal delay={1} class="card" style={{ padding: 'clamp(28px, 4vw, 44px)' }}>
              <div class="icon-box violet" style={{ width: 54, height: 54 }}><Icon.Eye size={26} /></div>
              <h3 style={{ fontSize: 24, margin: '4px 0 12px' }}>Our Vision</h3>
              <p style={{ fontSize: 16.5, color: 'var(--c-text-2)', lineHeight: 1.7 }}>
                A world where every student has an equal chance to do well — with learning that feels
                engaging, accessible and genuinely rewarding.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ PHILOSOPHY / VALUES ============ */}
      <section class="section">
        <div class="container">
          <SectionHead
            eyebrow="Our philosophy"
            title="What we believe about learning"
            subtitle="A few simple ideas shape everything we build."
          />
          <div class="grid g-4">
            {VALUES.map(([I, t, d], i) => (
              <Reveal class="card card-hover" delay={i + 1} key={t}>
                <div class="icon-box"><I size={22} /></div>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY STUDENTS LOVE IT ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <SectionHead eyebrow="Why students love Padhaku" title="Loved by learners, trusted by parents" />
          <div class="grid g-4">
            {LOVE.map(([I, t, d], i) => (
              <Reveal class="card card-hover" delay={i + 1} key={t}>
                <div class="icon-box"><I size={22} /></div>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ IMPACT / STATS ============ */}
      <section class="section">
        <div class="container">
          <SectionHead eyebrow="Our impact" title="Learning that adds up" />
          <div class="stats">
            {STATS.map((s, i) => (
              <Reveal class="stat" delay={i + 1} key={s.label}>
                <div class="n grad-text"><Counter to={s.to} suffix={s.suffix} decimals={s.decimals || 0} /></div>
                <div class="l">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ APP PROMO ============ */}
      <AppPromo />

      <CtaBanner
        title="Join thousands of students learning with Padhaku"
        subtitle="Download the app free and start studying smarter today."
      />
    </PageShell>
  );
}

export default About;
