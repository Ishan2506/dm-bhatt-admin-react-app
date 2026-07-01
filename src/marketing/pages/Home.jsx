import { h, Fragment } from 'preact';
import { Icon } from '../Icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { Counter } from '../components/Counter.jsx';
import { PageShell } from '../components/PageShell.jsx';
import { PhoneMockup, PhonesCluster, StoreButtons, RatingInline, AppPromo } from '../components/AppDownload.jsx';
import {
  SectionHead, FAQ, Quote, CtaBanner, LogoStrip, goTo,
} from '../components/Shared.jsx';
import {
  CORE_FEATURES, WHY_POINTS, STATS, TESTIMONIALS, FAQ_HOME, HOW_STEPS,
} from '../data.js';

export function Home() {
  return (
    <PageShell
      current="/"
      title="Padhaku — Learn smarter. Study anytime, anywhere."
      description="Padhaku is the learning app for students. Study materials, mind maps, quizzes, exams, games and rewards — all in your pocket. Download free on iOS and Android."
    >
      {/* ============ HERO ============ */}
      <header class="hero">
        <div class="hero-bg" />
        <div class="hero-grid-bg" />
        <div class="container">
          <div class="split" style={{ alignItems: 'center' }}>
            <div>
              <Reveal class="badge" style={{ marginBottom: 20 }}>
                <Icon.Sparkles size={14} /> Loved by 25,000+ students
              </Reveal>
              <Reveal as="h1" class="display" delay={1} style={{ fontSize: 'clamp(2.4rem, 5.2vw, 4rem)' }}>
                Learn smarter. <span class="grad-text">Study anywhere.</span>
              </Reveal>
              <Reveal class="lead" delay={2} style={{ marginTop: 20, maxWidth: 520 }}>
                Padhaku turns your phone into a personal study companion — with materials, mind maps,
                quizzes, exams and rewards that make learning genuinely fun.
              </Reveal>
              <Reveal delay={3} style={{ marginTop: 30 }}>
                <StoreButtons />
              </Reveal>
              <Reveal delay={4} style={{ marginTop: 20 }}>
                <RatingInline />
              </Reveal>
            </div>

            <Reveal variant="reveal-scale" delay={2} class="hero-visual" style={{ margin: 0, position: 'relative' }}>
              <PhonesCluster />
              <div class="float-card float-a" style={{ left: '-2%', top: '8%' }}>
                <div class="fi" style={{ background: 'var(--tint-success)', color: 'var(--c-success)' }}><Icon.TrendingUp size={18} /></div>
                <div><div class="ft">Your progress</div><div class="fv">+18% this week</div></div>
              </div>
              <div class="float-card float-b" style={{ right: '-2%', bottom: '10%' }}>
                <div class="fi" style={{ background: 'var(--tint-warning)', color: '#B45309' }}><Icon.Trophy size={18} /></div>
                <div><div class="ft">Reward earned</div><div class="fv">+120 points</div></div>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ============ TRUST STRIP ============ */}
      <section class="section-tight bg-subtle">
        <div class="container">
          <Reveal><LogoStrip /></Reveal>
        </div>
      </section>

      {/* ============ WHY CHOOSE PADHAKU ============ */}
      <section class="section">
        <div class="container">
          <SectionHead
            eyebrow="Why Padhaku"
            title="A better way to study every day"
            subtitle="Padhaku is built around one goal — helping you learn more while enjoying it more."
          />
          <div class="grid g-4">
            {WHY_POINTS.map((w, i) => (
              <Reveal class="card card-hover" delay={(i % 4) + 1} key={w.title}>
                <div class="icon-box"><w.icon size={22} /></div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section class="section-tight">
        <div class="container">
          <div class="stats">
            {STATS.map((s, i) => (
              <Reveal class="stat" delay={i + 1} key={s.label}>
                <div class="n grad-text">
                  <Counter to={s.to} suffix={s.suffix} decimals={s.decimals || 0} />
                </div>
                <div class="l">{s.label}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PLATFORM HIGHLIGHT (split) ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <div class="split">
            <Reveal variant="reveal-scale" style={{ display: 'flex', justifyContent: 'center', order: 1 }}>
              <PhoneMockup />
            </Reveal>
            <div style={{ order: 2 }}>
              <Reveal class="eyebrow"><Icon.Smartphone size={16} /> Everything in one app</Reveal>
              <Reveal as="h2" class="h-section" delay={1} style={{ marginTop: 14 }}>
                Your notes, tests and rewards — in one place
              </Reveal>
              <Reveal class="lead" delay={2} style={{ marginTop: 18 }}>
                No more juggling books, apps and notes. Open Padhaku and everything you need to study
                is right there, beautifully organized and ready when you are.
              </Reveal>
              <Reveal delay={3}>
                <ul class="check-list">
                  {[
                    'Materials and mind maps for every chapter',
                    'Six ways to practice, with instant results',
                    'Points, ranks and rewards to keep you going',
                  ].map((t) => (
                    <li key={t}><span class="ci"><Icon.Check size={15} /></span> {t}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={4} style={{ marginTop: 28 }}>
                <a class="btn btn-primary" href="/features" onClick={goTo('/features')}>
                  Explore all features <Icon.ArrowRight size={18} />
                </a>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CORE FEATURES ============ */}
      <section class="section">
        <div class="container">
          <SectionHead
            eyebrow="Features"
            title="Everything you need to do well"
            subtitle="A complete study toolkit designed to make learning simple, fun and effective."
          />
          <div class="grid g-3">
            {CORE_FEATURES.map((f, i) => (
              <Reveal class="card card-hover" delay={(i % 3) + 1} key={f.title}>
                <div class={`icon-box ${f.tint}`}><f.icon size={22} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <SectionHead eyebrow="Getting started" title="Start learning in four simple steps" />
          <div class="grid g-4">
            {HOW_STEPS.map(([I, t, d], i) => (
              <Reveal class="card" delay={i + 1} key={t}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div class="icon-box" style={{ margin: 0 }}><I size={22} /></div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--c-border-strong)' }}>0{i + 1}</span>
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ APP PROMO ============ */}
      <AppPromo />

      {/* ============ TESTIMONIALS ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <SectionHead
            eyebrow="Loved by students & parents"
            title="Real stories from real learners"
            subtitle="See why students study more and parents worry less with Padhaku."
          />
          <div class="grid g-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal delay={(i % 3) + 1} key={t.name}><Quote {...t} /></Reveal>
            ))}
          </div>
          <Reveal class="center" delay={2} style={{ marginTop: 40 }}>
            <a class="btn btn-secondary" href="/testimonials" onClick={goTo('/testimonials')}>
              Read more stories <Icon.ArrowRight size={18} />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section class="section">
        <div class="container">
          <SectionHead eyebrow="FAQ" title="Questions, answered" />
          <FAQ items={FAQ_HOME} />
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <CtaBanner />
    </PageShell>
  );
}

export default Home;
