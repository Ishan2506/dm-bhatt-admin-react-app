import { h, Fragment } from 'preact';
import { Icon } from '../Icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { PageShell } from '../components/PageShell.jsx';
import { PhoneMockup, StoreButtons, AppPromo } from '../components/AppDownload.jsx';
import { PageHero, SectionHead, CtaBanner, goTo } from '../components/Shared.jsx';
import { CORE_FEATURES } from '../data.js';

const EXAM_TYPES = [
  ['Full Exams', 'Complete, timed tests with automatic scoring.'],
  ['Five-Minute Quizzes', 'Quick daily practice to build consistency.'],
  ['True / False', 'Fast comprehension checks for any topic.'],
  ['One-Liner Tests', 'Short-answer drills that sharpen recall.'],
  ['Match-the-Following', 'Interactive matching with instant results.'],
];

export function Features() {
  return (
    <PageShell
      current="/features"
      title="Features — Padhaku"
      description="Explore everything the Padhaku app offers: study materials, mind maps, practice tests, learning games, leaderboards, rewards and progress tracking."
    >
      <PageHero
        eyebrow="App Features"
        title="Everything you need to study, in one app"
        subtitle="Materials, mind maps, practice tests, games and rewards — thoughtfully designed to help you learn better every day."
      >
        <StoreButtons />
      </PageHero>

      {/* ============ BENTO ============ */}
      <section class="section">
        <div class="container">
          <SectionHead
            eyebrow="At a glance"
            title="Built around how you actually learn"
            subtitle="Every feature solves a real study problem — nothing bloated, nothing missing."
          />
          <div class="bento">
            <Reveal variant="reveal-scale" class="b feat span-4">
              <div class="icon-box"><Icon.ClipboardCheck size={22} /></div>
              <h3>Six ways to practice</h3>
              <p style={{ maxWidth: 460 }}>
                Take full exams, five-minute quizzes, true/false, one-liner and match-the-following tests,
                plus fun learning games — each with instant results so you know exactly where you stand.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                {['Exams', 'Quizzes', 'True/False', 'One-Liner', 'Match', 'Games'].map((t) => (
                  <span class="pill" key={t}><span class="dot" /> {t}</span>
                ))}
              </div>
            </Reveal>
            <Reveal variant="reveal-scale" delay={1} class="b span-2">
              <div class="icon-box green"><Icon.BookOpen size={22} /></div>
              <h3>Study materials</h3>
              <p>Notes organized by standard, subject and chapter.</p>
            </Reveal>
            <Reveal variant="reveal-scale" delay={1} class="b span-2">
              <div class="icon-box violet"><Icon.Brain size={22} /></div>
              <h3>Mind maps</h3>
              <p>Visual maps that make revision quick and clear.</p>
            </Reveal>
            <Reveal variant="reveal-scale" delay={2} class="b span-2">
              <div class="icon-box amber"><Icon.Gamepad size={22} /></div>
              <h3>Learning games</h3>
              <p>Practice that feels like play, not homework.</p>
            </Reveal>
            <Reveal variant="reveal-scale" delay={2} class="b span-2">
              <div class="icon-box cyan"><Icon.Trophy size={22} /></div>
              <h3>Leaderboards</h3>
              <p>Climb the ranks and stay motivated with friends.</p>
            </Reveal>
            <Reveal variant="reveal-scale" class="b feat span-3">
              <div class="icon-box rose"><Icon.Gift size={22} /></div>
              <h3>Rewards & points</h3>
              <p>Earn points for your effort and redeem special codes — because consistent studying deserves to be rewarded.</p>
            </Reveal>
            <Reveal variant="reveal-scale" delay={1} class="b span-3">
              <div class="icon-box"><Icon.BarChart size={22} /></div>
              <h3>Progress tracking</h3>
              <p>See your scores and results over time so you always know what to work on next.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ EXAM DEEP DIVE ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <div class="split">
            <Reveal>
              <div class="eyebrow"><Icon.ClipboardCheck size={16} /> Practice engine</div>
              <h2 class="h-section" style={{ marginTop: 14 }}>Six ways to practice, one smooth flow</h2>
              <p class="lead" style={{ marginTop: 18 }}>
                From full exams to quick daily quizzes, Padhaku gives you the right way to practice for
                every moment — with instant results that show your progress.
              </p>
              <ul class="check-list">
                {EXAM_TYPES.map(([t, d]) => (
                  <li key={t}>
                    <span class="ci"><Icon.Check size={15} /></span>
                    <span><strong>{t}</strong> — <span style={{ color: 'var(--c-text-2)' }}>{d}</span></span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal variant="reveal-scale" delay={1} style={{ display: 'flex', justifyContent: 'center' }}>
              <PhoneMockup />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ FULL FEATURE GRID ============ */}
      <section class="section">
        <div class="container">
          <SectionHead eyebrow="All capabilities" title="The complete feature set" />
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

      {/* ============ APP PROMO ============ */}
      <AppPromo />

      <CtaBanner
        title="Ready to study smarter?"
        subtitle="Download Padhaku free and start learning with materials, quizzes, games and rewards today."
      />
    </PageShell>
  );
}

export default Features;
