import { h, Fragment } from 'preact';
import { PageShell } from '../components/PageShell.jsx';
import { PageHero } from '../components/Shared.jsx';

export function Terms() {
  return (
    <PageShell
      current="/terms"
      title="Terms & Conditions — Padhaku"
      description="Read the Terms & Conditions governing the use of the Padhaku learning platform."
    >
      <PageHero eyebrow="Legal" title="Terms & Conditions" subtitle="Last updated: 2 July 2026" />

      <section class="section-tight">
        <div class="container">
          <div class="legal">
            <p>
              These Terms &amp; Conditions (“Terms”) govern your access to and use of the Padhaku mobile app
              and website. By using Padhaku, you agree to these Terms. If you are a minor, you should use
              Padhaku with the involvement of a parent or guardian.
            </p>

            <h2>1. Use of the app</h2>
            <p>
              You may use Padhaku only for lawful educational purposes and in accordance with these Terms.
              You are responsible for maintaining the confidentiality of your account credentials and for all
              activity that occurs under your account.
            </p>

            <h2>2. Your account</h2>
            <p>
              You agree to provide accurate information when creating an account and to keep it up to date.
              You are responsible for the security of your login details.
            </p>

            <h2>3. Access to features</h2>
            <p>
              Padhaku provides study materials, mind maps, quizzes, exams, games, leaderboards and rewards.
              The features available to you may depend on your account and the content made available in the app.
            </p>

            <h2>4. Exams and academic integrity</h2>
            <p>
              The app provides tests and exams with automatic results. Students are expected to use these
              features honestly. Attempts to cheat or circumvent integrity controls may result in restriction
              of access.
            </p>

            <h2>5. Content</h2>
            <p>
              Study materials, questions and other content in the app are provided for your personal
              educational use. You may not copy, redistribute or misuse this content.
            </p>

            <h2>6. Rewards and redeem codes</h2>
            <p>
              Reward points and redeem codes are engagement features of the app. They hold no monetary value
              outside the app and may be subject to rules set within the app.
            </p>

            <h2>7. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Interfere with or disrupt the app’s security or availability.</li>
              <li>Attempt to gain unauthorized access to accounts or data.</li>
              <li>Use the app to distribute unlawful, harmful or infringing content.</li>
            </ul>

            <h2>8. Availability and changes</h2>
            <p>
              We work to keep the app reliable but do not guarantee uninterrupted availability. We may
              update, add or remove features to improve the app over time.
            </p>

            <h2>9. Limitation of liability</h2>
            <p>
              To the extent permitted by law, Padhaku is provided “as is” and we are not liable for indirect or
              consequential losses arising from use of the app.
            </p>

            <h2>10. Termination</h2>
            <p>
              We may suspend or terminate access where these Terms are breached. You may stop using the app at
              any time.
            </p>

            <h2>11. Contact</h2>
            <p>
              For questions about these Terms, please reach out via our <a href="/contact">contact page</a> or
              email padhaku@gmail.com.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default Terms;
