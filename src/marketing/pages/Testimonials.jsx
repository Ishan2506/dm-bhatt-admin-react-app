import { h, Fragment } from 'preact';
import { Icon } from '../Icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { PageShell } from '../components/PageShell.jsx';
import { StoreButtons } from '../components/AppDownload.jsx';
import { PageHero, SectionHead, Quote, CtaBanner } from '../components/Shared.jsx';
import { TESTIMONIALS } from '../data.js';

const STUDENTS = TESTIMONIALS.filter((t) => t.role.startsWith('Student'));
const PARENTS = TESTIMONIALS.filter((t) => t.role === 'Parent');

const RATING_BREAKDOWN = [
  [5, 86], [4, 10], [3, 3], [2, 1], [1, 0],
];

const VIDEOS = [
  ['Aarav improved his maths score', 'Student · Standard 10'],
  ['A parent shares her experience', 'Parent review'],
  ['How Diya revises with mind maps', 'Student · Standard 9'],
];

export function Testimonials() {
  return (
    <PageShell
      current="/testimonials"
      title="Testimonials — Padhaku"
      description="Read student success stories and parent reviews for Padhaku. See why learners study more and parents worry less."
    >
      <PageHero
        eyebrow="Testimonials"
        title="Loved by students and parents alike"
        subtitle="Real stories from the learners and families who make Padhaku part of their day."
      />

      {/* ============ RATING SUMMARY ============ */}
      <section class="section-tight">
        <div class="container">
          <Reveal variant="reveal-scale" class="card" style={{ padding: 'clamp(28px, 4vw, 48px)' }}>
            <div class="rating-hero">
              <div style={{ textAlign: 'center' }}>
                <div class="big grad-text">4.8</div>
                <div class="stars" style={{ display: 'flex', justifyContent: 'center', color: 'var(--c-warning)', margin: '10px 0 6px' }}>
                  {[0, 1, 2, 3, 4].map((i) => <Icon.Star key={i} size={20} fill="currentColor" />)}
                </div>
                <div style={{ color: 'var(--c-text-2)', fontSize: 14 }}>12,000+ ratings</div>
              </div>
              <div class="rbars">
                {RATING_BREAKDOWN.map(([star, pct]) => (
                  <div class="rbar" key={star}>
                    <span style={{ width: 34 }}>{star} <Icon.Star size={12} fill="currentColor" style={{ color: 'var(--c-warning)', verticalAlign: '-1px' }} /></span>
                    <span class="track"><i style={{ width: `${pct}%` }} /></span>
                    <span style={{ width: 36, textAlign: 'right' }}>{pct}%</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
                  <span class="badge badge-success"><Icon.Smartphone size={13} /> App Store</span>
                  <span class="badge"><Icon.Smartphone size={13} /> Google Play</span>
                </div>
                <StoreButtons />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ STUDENT STORIES ============ */}
      <section class="section">
        <div class="container">
          <SectionHead eyebrow="Student success stories" title="What students are saying" />
          <div class="grid g-3">
            {STUDENTS.map((t, i) => (
              <Reveal delay={(i % 3) + 1} key={t.name}><Quote {...t} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ VIDEO TESTIMONIALS ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <SectionHead eyebrow="In their own words" title="Hear it from them" subtitle="Short stories from students and parents about learning with Padhaku." />
          <div class="grid g-3">
            {VIDEOS.map(([title, who], i) => (
              <Reveal variant="reveal-scale" delay={(i % 3) + 1} key={title}>
                <div class="video-ph">
                  <div class="play-btn"><Icon.Play size={22} /></div>
                  <div class="v-cap">
                    <div class="vn">{title}</div>
                    <div class="vr">{who}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARENT REVIEWS ============ */}
      <section class="section">
        <div class="container">
          <SectionHead eyebrow="Parent reviews" title="What parents appreciate" />
          <div class="grid g-3">
            {PARENTS.map((t, i) => (
              <Reveal delay={(i % 3) + 1} key={t.name}><Quote {...t} /></Reveal>
            ))}
            {/* Additional parent-style highlight */}
            <Reveal delay={PARENTS.length + 1}>
              <div class="quote" style={{ background: 'linear-gradient(160deg, #F8FAFF, #EFF4FF)', borderColor: '#DCE7FF' }}>
                <div class="stars">{[0, 1, 2, 3, 4].map((i) => <Icon.Star key={i} size={16} fill="currentColor" />)}</div>
                <p>“It's the first app I'm happy to see my child spend time on. The progress reports make it easy to support her.”</p>
                <div class="who">
                  <div class="av">SV</div>
                  <div><div class="n">Sunita Verma</div><div class="r">Parent</div></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <CtaBanner
        title="See what everyone's talking about"
        subtitle="Download Padhaku free and join thousands of students learning smarter every day."
      />
    </PageShell>
  );
}

export default Testimonials;
