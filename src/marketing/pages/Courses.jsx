import { h, Fragment } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import { Icon } from '../Icons.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { PageShell } from '../components/PageShell.jsx';
import { StoreButtons, AppPromo } from '../components/AppDownload.jsx';
import { PageHero, SectionHead, CtaBanner } from '../components/Shared.jsx';
import { COURSES, COURSE_CATEGORIES } from '../data.js';

export function Courses() {
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return COURSES.filter((c) => {
      const matchCat = cat === 'All' || c.cat === cat;
      const q = query.trim().toLowerCase();
      const matchQ = !q || c.title.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [cat, query]);

  return (
    <PageShell
      current="/courses"
      title="Courses — Padhaku"
      description="Explore subjects on Padhaku — Mathematics, Science, Languages, Social Studies and more. Continue learning any subject in the mobile app."
    >
      <PageHero
        eyebrow="Courses & Subjects"
        title="Every subject, ready to study"
        subtitle="Browse the subjects covered in Padhaku. Pick one to see what's inside — then continue learning in the app."
      />

      {/* ============ SEARCH + CHIPS ============ */}
      <section class="section-tight">
        <div class="container">
          <Reveal class="searchbar">
            <Icon.Search />
            <input
              type="text"
              placeholder="Search subjects, e.g. Mathematics, Science..."
              value={query}
              onInput={(e) => setQuery(e.target.value)}
              aria-label="Search courses"
            />
          </Reveal>
          <Reveal delay={1} class="chips" style={{ marginTop: 22 }}>
            {COURSE_CATEGORIES.map((c) => (
              <button
                key={c}
                class={`chip ${cat === c ? 'on' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============ COURSE GRID ============ */}
      <section class="section-tight">
        <div class="container">
          {filtered.length === 0 ? (
            <Reveal class="center" style={{ padding: '40px 0' }}>
              <div class="icon-box" style={{ margin: '0 auto 14px' }}><Icon.Search size={22} /></div>
              <h3 style={{ fontSize: 18 }}>No subjects found</h3>
              <p style={{ color: 'var(--c-text-2)', marginTop: 6 }}>Try a different search or category.</p>
            </Reveal>
          ) : (
            <div class="grid g-3">
              {filtered.map((c, i) => (
                <Reveal variant="reveal-scale" class="course" delay={(i % 3) + 1} key={c.title}>
                  <div class="c-top" style={{ background: c.color }}>
                    <c.icon />
                  </div>
                  <div class="c-body">
                    <span class="badge badge-neutral" style={{ alignSelf: 'flex-start', marginBottom: 10 }}>{c.cat}</span>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                    <div class="c-meta">
                      <span><Icon.BookOpen size={15} /> {c.lessons}</span>
                      <span><Icon.GraduationCap size={15} /> {c.level}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ OVERVIEW ============ */}
      <section class="section bg-subtle">
        <div class="container">
          <SectionHead
            eyebrow="How courses work"
            title="Learn each subject, your way"
            subtitle="Every subject combines materials, mind maps and practice so you can learn, revise and test yourself in one flow."
          />
          <div class="grid g-3">
            {[
              [Icon.BookOpen, 'Read & understand', 'Start with clear study materials organized chapter by chapter.'],
              [Icon.Brain, 'Revise with mind maps', 'Lock it in with visual mind maps built for quick revision.'],
              [Icon.ClipboardCheck, 'Test yourself', 'Check your understanding with quizzes and exams that score instantly.'],
            ].map(([I, t, d], i) => (
              <Reveal class="card card-hover" delay={i + 1} key={t}>
                <div class="icon-box"><I size={22} /></div>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal class="center" delay={2} style={{ marginTop: 40 }}>
            <p style={{ color: 'var(--c-text-2)', marginBottom: 18 }}>Continue learning any subject in the app</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}><StoreButtons /></div>
          </Reveal>
        </div>
      </section>

      {/* ============ APP PROMO ============ */}
      <AppPromo />

      <CtaBanner
        title="Pick a subject and start learning"
        subtitle="Download Padhaku free and dive into any subject with materials, mind maps and practice tests."
      />
    </PageShell>
  );
}

export default Courses;
