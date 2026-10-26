import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  MessageSquare,
  User,
  Rocket,
  Briefcase,
  ShieldAlert,
  Code2,
  FileCode,
  Terminal,
  Cpu,
  Database,
  Cloud,
  Globe,
  Server,
  Layers,
  Smartphone,
  CreditCard,
  Container,
  Flame,
  Bot,
  GitBranch,
  ExternalLink
} from 'lucide-react';

interface HomeProps {
  onOpenModal: (modalType: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onOpenModal }) => {
  const { t } = useLanguage();

  const scrollToLiveProjects = () => {
    const el = document.getElementById('live-projects');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Tech stack items mapping for the 24 required technologies
  const techStack = [
    { name: 'HTML5', icon: Code2 },
    { name: 'CSS3 / Flex', icon: FileCode },
    { name: 'JavaScript', icon: Terminal },
    { name: 'React.js', icon: Cpu },
    { name: 'Node.js', icon: Server },
    { name: 'Python', icon: Terminal },
    { name: 'C', icon: Code2 },
    { name: 'C++', icon: Code2 },
    { name: 'Firebase', icon: Flame },
    { name: 'AI API Integrations', icon: Bot },
    { name: 'Android App Dev', icon: Smartphone },
    { name: 'Database Design', icon: Database },
    { name: 'MongoDB / MySQL', icon: Database },
    { name: 'Git & Cloudflare', icon: GitBranch },
    { name: 'Domain Management', icon: Globe },
    { name: 'Web Hosting / Deployment', icon: Cloud },
    { name: 'TypeScript', icon: FileCode },
    { name: 'Next.js', icon: Layers },
    { name: 'Tailwind CSS', icon: FileCode },
    { name: 'PHP / Laravel', icon: Server },
    { name: 'Kotlin / Java', icon: Smartphone },
    { name: 'REST API Development', icon: Server },
    { name: 'Docker / Container', icon: Container },
    { name: 'Payment Gateway (bKash, Nagad, SSLCommerz)', icon: CreditCard },
  ];

  const liveProjects = [
    { title: 'Market Koro', category: 'E-commerce Platform', desc: 'Full-featured online shopping store with cart & checkout.' },
    { title: "Student's Tool's & AI", category: 'Educational SaaS', desc: 'AI-assisted tools for academic productivity and study.' },
    { title: 'Birthday Website', category: 'Custom Interactive Web', desc: 'Personalized animated celebration website with music & effects.' },
    { title: 'Animated Heart', category: 'Interactive Canvas UI', desc: '3D CSS/JS particle animation platform for creative presentation.' },
    { title: 'RunZone', category: 'Sports & Fitness App', desc: 'Fitness tracking dashboard and activity log web app.' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 max-w-5xl mx-auto space-y-16">
      {/* ================= HERO SECTION ================= */}
      <section className="text-center pt-6 space-y-8 animate-fade-in-up">
        {/* Profile Photo */}
        <div className="relative inline-block">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl mx-auto ring-4 ring-sky-400/30">
            {/* Young man in black suit outdoors photo placeholder */}
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80"
              alt="SHAFAET HOSSEN SARIP"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="absolute bottom-1 right-2 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" title="Available for work" />
        </div>

        {/* Hero Paragraph */}
        <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
          {t('heroGreeting')}
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={scrollToLiveProjects}
            className="px-6 py-3.5 rounded-full btn-primary-gradient font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <span>{t('viewAllProjects')}</span>
          </button>

          <button
            onClick={() => onOpenModal('liveChat')}
            className="px-6 py-3.5 rounded-full btn-whatsapp-gradient font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>{t('liveChat')}</span>
          </button>
        </div>

        {/* 3 Stat Cards in a row */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 pt-4 max-w-3xl mx-auto">
          <div className="glass-card p-4 rounded-2xl text-center shadow-xs">
            <h3 className="text-2xl md:text-4xl font-extrabold text-sky-500 dark:text-sky-400">
              108+
            </h3>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {t('projectsCompleted')}
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center shadow-xs">
            <h3 className="text-2xl md:text-4xl font-extrabold text-sky-500 dark:text-sky-400">
              86+
            </h3>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {t('satisfiedClients')}
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl text-center shadow-xs">
            <h3 className="text-2xl md:text-4xl font-extrabold text-sky-500 dark:text-sky-400">
              100%
            </h3>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {t('satisfactionRate')}
            </p>
          </div>
        </div>
      </section>

      {/* ================= WHO I AM SECTION ================= */}
      <section id="about-me" className="p-6 md:p-10 rounded-3xl bg-gradient-to-b from-sky-50/80 via-indigo-50/40 to-slate-50/50 dark:from-sky-950/30 dark:via-indigo-950/20 dark:to-slate-900/40 border border-sky-100 dark:border-sky-900/40 space-y-8">
        <div className="text-center space-y-3">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300">
            {t('whoIAmBadge')}
          </span>

          <div className="inline-block">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('authorName')}
            </h2>
            <div className="h-1.5 w-24 mx-auto mt-2 rounded-full bg-gradient-to-r from-sky-400 to-purple-500" />
          </div>

          <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t('authorSubtitle')}
          </p>
        </div>

        {/* 2x2 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: About Me */}
          <div className="glass-card rounded-2xl p-5 border-t-4 border-t-cyan-400 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-300">
                  {t('aboutMePill')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('aboutMeTitle')}
              </h3>

              <p className="text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                I am a <strong className="text-sky-500 dark:text-sky-400 font-bold">Web & App Developer</strong> from Kushtia, Khulna, Bangladesh. I am a student in the <strong className="text-sky-500 dark:text-sky-400 font-bold">Electronics Technology</strong> department at Kushtia Government Polytechnic Institute and have been working with <strong className="text-sky-500 dark:text-sky-400 font-bold">Web Development</strong> for over a year.
              </p>
            </div>
          </div>

          {/* Card 2: My Goal */}
          <div className="glass-card rounded-2xl p-5 border-t-4 border-t-purple-400 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Rocket className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
                  {t('myGoalPill')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('myGoalTitle')}
              </h3>

              <p className="text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                To build fast, reliable, and high-quality digital platforms ranging from small Business Websites to complete <strong className="text-sky-500 dark:text-sky-400 font-bold">E-commerce Platforms</strong>, <strong className="text-sky-500 dark:text-sky-400 font-bold">Web Applications</strong>, and <strong className="text-sky-500 dark:text-sky-400 font-bold">Custom Digital Solutions</strong>.
              </p>
            </div>
          </div>

          {/* Card 3: Skills & Experience */}
          <div className="glass-card rounded-2xl p-5 border-t-4 border-t-blue-500 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                  {t('skillsPill')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('skillsTitle')}
              </h3>

              <p className="text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                I build modern <strong className="text-sky-500 dark:text-sky-400 font-bold">Websites</strong>, <strong className="text-sky-500 dark:text-sky-400 font-bold">Web Applications</strong>, <strong className="text-sky-500 dark:text-sky-400 font-bold">E-commerce Platforms</strong>, Business Websites, Educational Platforms, <strong className="text-sky-500 dark:text-sky-400 font-bold">AI-powered Websites</strong>, and various <strong className="text-sky-500 dark:text-sky-400 font-bold">Custom Digital Solutions</strong> for clients and my own ventures.
              </p>
            </div>
          </div>

          {/* Card 4: Policy */}
          <div className="glass-card rounded-2xl p-5 border-t-4 border-t-gradient-to-r border-t-orange-500 relative flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
                  {t('policyPill')}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('policyTitle')}
              </h3>

              <p className="text-xs md:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                I work on building positive, professional, and business-oriented websites and digital platforms. I do NOT build <strong className="text-red-600 dark:text-red-400 font-black">Gambling or Betting Websites</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TECH STACK SECTION ================= */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300">
            {t('techStackBadge')}
          </span>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('techStackHeading')}
          </h2>
        </div>

        {/* 4-column grid of small white rounded cards with exact 24 technologies */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div
                key={idx}
                className="glass-card p-3.5 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {tech.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= LIVE PROJECTS SECTION ================= */}
      <section id="live-projects" className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-300">
            Live Portfolios
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Featured Live Digital Solutions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {liveProjects.map((proj, idx) => (
            <div key={idx} className="glass-card p-5 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                  {proj.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {proj.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {proj.desc}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Online
                </span>
                <button
                  onClick={() => onOpenModal('liveChat')}
                  className="px-3 py-1.5 rounded-lg bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-300 text-xs font-bold flex items-center gap-1 hover:bg-sky-200 transition-colors cursor-pointer"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
