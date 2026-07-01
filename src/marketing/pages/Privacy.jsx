import { h, Fragment } from 'preact';
import { PageShell } from '../components/PageShell.jsx';
import { PageHero } from '../components/Shared.jsx';

export function Privacy() {
  return (
    <PageShell
      current="/privacy"
      title="Privacy Policy — Padhaku"
      description="Read the Padhaku Privacy Policy to understand how we collect, use and protect your data."
    >
      <PageHero eyebrow="Legal" title="Privacy Policy" subtitle="Last updated: 2 July 2026" />

      <section class="section-tight">
        <div class="container">
          <div class="legal">
            <p>
              This Privacy Policy explains how Padhaku (“we”, “us”, “our”) collects, uses and safeguards
              information when you use the Padhaku mobile app and website. By using Padhaku, you agree to
              the practices described here.
            </p>

            <h2>1. Information we collect</h2>
            <p>We collect information needed to provide the app, including:</p>
            <ul>
              <li><strong>Account information</strong> — names and contact details used to create and manage your account.</li>
              <li><strong>Learning activity</strong> — study material access, quiz and exam attempts, results, game activity and reward points.</li>
              <li><strong>Usage information</strong> — technical data such as device and log information used to keep the app secure and reliable.</li>
            </ul>

            <h2>2. How we use information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and operate the app’s features, including materials, mind maps, quizzes, exams, games and notifications.</li>
              <li>Generate exam results, leaderboards and rewards.</li>
              <li>Send helpful reminders and birthday messages where enabled.</li>
              <li>Maintain security, prevent misuse and improve the app.</li>
            </ul>

            <h2>3. Sharing of information</h2>
            <p>
              We do not sell your personal information. Information may be shared with service providers who
              help us operate the app under appropriate confidentiality obligations. We may disclose
              information where required by law.
            </p>

            <h2>4. Data security</h2>
            <p>
              We apply reasonable technical and organizational measures to protect your information, including
              access controls. No system can be guaranteed completely secure, but we work continuously to
              safeguard your data.
            </p>

            <h2>5. Data retention</h2>
            <p>
              We retain information for as long as needed to provide the app and to meet applicable legal
              obligations.
            </p>

            <h2>6. Your choices</h2>
            <p>
              Institutes and users may request access to, correction of, or deletion of certain information,
              subject to legal and operational limits. Contact us to make a request.
            </p>

            <h2>7. Children and students</h2>
            <p>
              Padhaku is a learning app used by students. Where a student is a minor, a parent or guardian is
              responsible for providing any necessary consent for the student’s use of the app.
            </p>

            <h2>8. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be reflected by an
              updated “last updated” date above.
            </p>

            <h2>9. Contact us</h2>
            <p>
              If you have questions about this Privacy Policy, please reach out via our{' '}
              <a href="/contact">contact page</a> or email padhaku@gmail.com.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default Privacy;
