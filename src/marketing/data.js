import { Icon } from './Icons.jsx';

/**
 * Content sourced ONLY from the existing Padhaku app capabilities
 * (API models & routes: exams, materials, mind maps, games/leaderboards,
 * rewards, redeem codes, subscription plans, events, notifications, support).
 * Written for the app's audience: students & parents. No invented features.
 */

export const CORE_FEATURES = [
  {
    icon: Icon.ClipboardCheck,
    tint: '',
    title: 'Practice tests & exams',
    desc: 'Take full exams, five-minute quizzes, true/false, one-liner and match-the-following tests — with instant scores.',
  },
  {
    icon: Icon.BookOpen,
    tint: 'green',
    title: 'Study materials',
    desc: 'Find notes and materials neatly organized by standard, subject and chapter — so studying is always easy.',
  },
  {
    icon: Icon.Brain,
    tint: 'violet',
    title: 'Mind maps',
    desc: 'Revise faster with visual mind maps that turn tricky topics into something you can actually remember.',
  },
  {
    icon: Icon.Gamepad,
    tint: 'amber',
    title: 'Learning games',
    desc: 'Practice through fun, game-based questions that make studying feel less like work and more like play.',
  },
  {
    icon: Icon.Trophy,
    tint: 'cyan',
    title: 'Leaderboards & ranks',
    desc: 'Climb the leaderboard, become a top ranker, and stay motivated by seeing your progress against friends.',
  },
  {
    icon: Icon.Gift,
    tint: 'rose',
    title: 'Rewards & points',
    desc: 'Earn reward points for your effort and redeem special codes — because your hard work deserves rewards.',
  },
  {
    icon: Icon.BarChart,
    tint: '',
    title: 'Progress tracking',
    desc: 'See your exam results and scores over time, so you always know where you stand and what to improve.',
  },
  {
    icon: Icon.Calendar,
    tint: 'green',
    title: 'Events & updates',
    desc: 'Stay in the loop with important events, and never miss a thing with timely notifications.',
  },
  {
    icon: Icon.Bell,
    tint: 'amber',
    title: 'Smart reminders',
    desc: 'Get helpful reminders and warm birthday wishes that keep you connected and on track.',
  },
];

export const WHY_POINTS = [
  {
    icon: Icon.Smartphone,
    title: 'Study anytime, anywhere',
    desc: 'Everything lives in your pocket. Learn on the bus, at home or before class — your progress follows you.',
  },
  {
    icon: Icon.Sparkles,
    title: 'Learning that feels fun',
    desc: 'Games, points and leaderboards turn everyday practice into something you actually look forward to.',
  },
  {
    icon: Icon.TrendingUp,
    title: 'Improve your marks',
    desc: 'Regular practice, instant feedback and clear progress help you steadily improve where it matters.',
  },
  {
    icon: Icon.ShieldCheck,
    title: 'Safe & trusted',
    desc: 'A secure, distraction-free space built for learning — something parents can feel good about.',
  },
];

export const STATS = [
  { to: 25000, suffix: '+', label: 'Happy students' },
  { to: 4.8, decimals: 1, label: 'Average app rating' },
  { to: 500000, suffix: '+', label: 'Tests attempted' },
  { to: 6, label: 'Ways to practice' },
];

export const HOW_STEPS = [
  [Icon.Download, 'Download the app', 'Get Padhaku free from the App Store or Google Play in seconds.'],
  [Icon.BookOpen, 'Pick your subjects', 'Open your standard and subjects and dive into materials and mind maps.'],
  [Icon.ClipboardCheck, 'Practice & test', 'Take quizzes and exams, play learning games and check instant results.'],
  [Icon.Trophy, 'Earn & improve', 'Collect points, climb the leaderboard and watch your marks grow.'],
];

export const TESTIMONIALS = [
  {
    text: 'The five-minute quizzes are perfect before a test. I practice a little every day and my marks have actually gone up.',
    name: 'Aarav Sharma',
    role: 'Student · Standard 10',
    initials: 'AS',
  },
  {
    text: 'As a parent, I love that my daughter is learning on her phone instead of just scrolling. The progress tracking gives me peace of mind.',
    name: 'Meena Joshi',
    role: 'Parent',
    initials: 'MJ',
  },
  {
    text: 'Mind maps make revision so much easier. I can understand a whole chapter in a few minutes now.',
    name: 'Diya Patel',
    role: 'Student · Standard 9',
    initials: 'DP',
  },
  {
    text: 'The leaderboard makes me want to practice more than my friends. Learning feels like a game now.',
    name: 'Kabir Mehta',
    role: 'Student · Standard 8',
    initials: 'KM',
  },
  {
    text: 'My son actually reminds me to let him study now. The reward points really keep him motivated.',
    name: 'Rajesh Kumar',
    role: 'Parent',
    initials: 'RK',
  },
  {
    text: 'Everything I need is in one app — notes, tests and results. I do not have to search anywhere else.',
    name: 'Priya Nair',
    role: 'Student · Standard 11',
    initials: 'PN',
  },
];

export const FAQ_HOME = [
  {
    q: 'Is Padhaku free to download?',
    a: 'Yes. You can download Padhaku for free from the App Store and Google Play and start exploring study materials and practice right away.',
  },
  {
    q: 'What can I do in the app?',
    a: 'You can study materials by standard, subject and chapter, explore mind maps, take quizzes and exams, play learning games, climb leaderboards and earn reward points.',
  },
  {
    q: 'What types of tests can I take?',
    a: 'Padhaku offers full exams, five-minute quizzes, true/false tests, one-liner tests and match-the-following exams — each with instant results.',
  },
  {
    q: 'Does it work on both iPhone and Android?',
    a: 'Yes. Padhaku is available on both the Apple App Store and Google Play, so you can learn on any phone.',
  },
  {
    q: 'Is it safe for students?',
    a: 'Padhaku is a focused, distraction-free learning space. It is designed to keep students engaged with their studies in a safe environment.',
  },
  {
    q: 'How does Padhaku help improve marks?',
    a: 'Regular practice with instant feedback, visual mind maps for revision, and progress tracking help students learn consistently and improve steadily.',
  },
];

/* ---- Courses (generic school subjects by standard) ---- */
export const COURSE_CATEGORIES = ['All', 'Mathematics', 'Science', 'Languages', 'Social Studies', 'Computers'];

export const COURSES = [
  { cat: 'Mathematics', icon: Icon.BarChart, color: 'linear-gradient(135deg,#2563EB,#4F46E5)', title: 'Mathematics', desc: 'Algebra, geometry, arithmetic and more with step-by-step practice.', lessons: '40+ chapters', level: 'Std 6–12' },
  { cat: 'Science', icon: Icon.Zap, color: 'linear-gradient(135deg,#16A34A,#059669)', title: 'Science', desc: 'Physics, chemistry and biology explained simply with mind maps.', lessons: '36+ chapters', level: 'Std 6–12' },
  { cat: 'Languages', icon: Icon.BookOpen, color: 'linear-gradient(135deg,#F59E0B,#D97706)', title: 'English', desc: 'Grammar, comprehension and writing skills through daily practice.', lessons: '28+ chapters', level: 'Std 5–12' },
  { cat: 'Languages', icon: Icon.MessageCircle, color: 'linear-gradient(135deg,#0891B2,#0E7490)', title: 'Hindi', desc: 'Reading, grammar and literature made easy and engaging.', lessons: '24+ chapters', level: 'Std 5–12' },
  { cat: 'Social Studies', icon: Icon.Globe, color: 'linear-gradient(135deg,#7C3AED,#6D28D9)', title: 'Social Studies', desc: 'History, geography and civics with visual, memorable revision.', lessons: '30+ chapters', level: 'Std 6–10' },
  { cat: 'Computers', icon: Icon.Cpu, color: 'linear-gradient(135deg,#DC2626,#B91C1C)', title: 'Computers', desc: 'Foundations of computing and basic coding for young learners.', lessons: '18+ chapters', level: 'Std 6–10' },
  { cat: 'Mathematics', icon: Icon.Target, color: 'linear-gradient(135deg,#2563EB,#1D4ED8)', title: 'Mental Maths', desc: 'Sharpen speed and accuracy with quick game-based drills.', lessons: 'Daily practice', level: 'All levels' },
  { cat: 'Science', icon: Icon.Brain, color: 'linear-gradient(135deg,#059669,#047857)', title: 'GK & Reasoning', desc: 'General knowledge and logical reasoning through fun quizzes.', lessons: 'Weekly sets', level: 'All levels' },
];

export const VALUES = [
  [Icon.Target, 'Student-first', 'Every feature is built to help students actually learn better.'],
  [Icon.Sparkles, 'Joyful learning', 'We make studying feel motivating, not stressful.'],
  [Icon.ShieldCheck, 'Trust & safety', 'A secure, focused space that parents can rely on.'],
  [Icon.Rocket, 'Always improving', 'We keep making the app better, lesson after lesson.'],
];
