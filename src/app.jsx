import { h, Fragment } from 'preact';
import { Suspense, lazy } from 'preact/compat';
import { useState, useEffect } from 'preact/hooks';
import { Router, route } from 'preact-router';
import { LoginPage } from './pages/LoginPage.jsx';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Standards } from './pages/Standards';
import { Subjects } from './pages/Subjects';
import { Chapters } from './pages/Chapters';
import { Students } from './pages/Students';
import { Admins } from './pages/Admins';
import { Materials } from './pages/Materials';
import { MindMaps } from './pages/MindMaps';
import { Payments } from './pages/Payments';
import { Exams } from './pages/Exams';
import { OnlineExams } from './pages/OnlineExams';
import { FiveMinQuiz } from './pages/FiveMinQuiz';
import { OneLinerExams } from './pages/OneLinerExams';
import { MatchFollowingExams } from './pages/MatchFollowingExams';
import { PaymentConfig } from './pages/PaymentConfig';
import { NotificationConfig } from './pages/NotificationConfig';
import { ScheduledNotifications } from './pages/ScheduledNotifications';
import { AppConfig } from './pages/AppConfig';
import { ReferAndEarnConfig } from './pages/ReferAndEarnConfig';
import { Products } from './pages/Products';
import { ReportsPage } from './pages/ReportsPage';
const MarketingSite = lazy(() => import('./marketing/MarketingSite.jsx').then((m) => ({ default: m.MarketingSite })));
import { ActivityLogs } from './pages/ActivityLogs';
import { SubscriptionPlans } from './pages/SubscriptionPlans';
import { RedeemCodes } from './pages/RedeemCodes';
import { TrueFalseExams } from './pages/TrueFalseExams';
import './pages/LoginPage.css';

export function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Keep top-level path in sync for ALL navigations (marketing <-> admin),
  // including programmatic route() calls made from the marketing site.
  useEffect(() => {
    const sync = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    // preact-router uses history.pushState; patch it to notify us.
    const origPush = window.history.pushState;
    window.history.pushState = function (...args) {
      const ret = origPush.apply(this, args);
      sync();
      return ret;
    };
    return () => {
      window.removeEventListener('popstate', sync);
      window.history.pushState = origPush;
    };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    route('/admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    route('/admin');
  };

  const handleRoute = (e) => {
    setCurrentPath(e.url);
  };

  const isAdminPath = currentPath.startsWith('/admin');

  // Everything that isn't the admin panel is the premium marketing website.
  if (!isAdminPath) {
    return (
      <Suspense fallback={null}>
        <MarketingSite />
      </Suspense>
    );
  }

  if (isAdminPath) {
    if (!user) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <Layout currentPath={currentPath} user={user} onLogout={handleLogout}>
        <Router onChange={handleRoute}>
          {user.role === 'super admin' && <Dashboard path="/admin" />}
          {user.role === 'super admin' && <Dashboard path="/admin/dashboard" />}
          
          {/* Redirect standard admin away from dashboard if they land there */}
          {user.role !== 'super admin' && (
            <Standards path="/admin" />
          )}
          {user.role !== 'super admin' && (
            <Standards path="/admin/dashboard" />
          )}

          <Students path="/admin/students" />
          
          {/* Super Admin Only Paths */}
          {user.role === 'super admin' && <Admins path="/admin/admins" />}
          {user.role === 'super admin' && <ActivityLogs path="/admin/logs" />}
          {user.role === 'super admin' && <Payments path="/admin/payments/:type?" />}
          {user.role === 'super admin' && <PaymentConfig path="/admin/config/payment" />}
          {user.role === 'super admin' && <NotificationConfig path="/admin/config/notification" />}
          {user.role === 'super admin' && <ScheduledNotifications path="/admin/scheduled-notifications" />}
          {user.role === 'super admin' && <AppConfig path="/admin/config/app" />}
          {user.role === 'super admin' && <ReferAndEarnConfig path="/admin/config/referral" />}

          <Standards path="/admin/standards" />
          <SubscriptionPlans path="/admin/subscription-plans" />
          <RedeemCodes path="/admin/redeem-codes" />
          <Subjects path="/admin/subjects" />
          <Chapters path="/admin/chapters" />
          <Products path="/admin/products" />
          <Materials path="/admin/materials/:type?" />
          <MindMaps path="/admin/mindmaps" />
          <Exams path="/admin/exams" />
          <OnlineExams path="/admin/exams/online" />
          <FiveMinQuiz path="/admin/exams/quiz" />
          <OneLinerExams path="/admin/exams/oneliner" />
          <TrueFalseExams path="/admin/exams/true-false" />
          <MatchFollowingExams path="/admin/exams/matchfollowing" />
          <ReportsPage path="/admin/reports/:section/:type?" key={currentPath} />
        </Router>
      </Layout>
    );
  }

  // Fallback (non-admin routes are handled by MarketingSite above).
  return (
    <Suspense fallback={null}>
      <MarketingSite />
    </Suspense>
  );
}
