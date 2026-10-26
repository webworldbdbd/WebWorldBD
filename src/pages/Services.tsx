import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  Globe,
  ShoppingCart,
  User,
  BookOpen,
  Newspaper,
  GraduationCap,
  Share2,
  Layers,
  Calendar,
  Store,
  MessageCircle,
  Film,
  Layout,
  Landmark,
  Bot,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Rocket
} from 'lucide-react';

interface ServicesProps {
  onOpenModal?: (modalType: string) => void;
}

export const Services: React.FC<ServicesProps> = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Exact 16 custom web services in exact order
  const servicesList = [
    { title: 'Business Website', icon: Globe },
    { title: 'E-commerce Website', icon: ShoppingCart },
    { title: 'Portfolio Website', icon: User },
    { title: 'Blog Website', icon: BookOpen },
    { title: 'News Website', icon: Newspaper },
    { title: 'Educational Website', icon: GraduationCap },
    { title: 'Social Media Website', icon: Share2 },
    { title: 'Web App / SaaS', icon: Layers },
    { title: 'Booking Website', icon: Calendar },
    { title: 'Marketplace Website', icon: Store },
    { title: 'Forum / Community Website', icon: MessageCircle },
    { title: 'Entertainment Website', icon: Film },
    { title: 'Landing Page', icon: Layout },
    { title: 'Government / NGO Website', icon: Landmark },
    { title: 'AI Website / Tools', icon: Bot },
    { title: 'Others (Custom Project)', icon: HelpCircle },
  ];

  // Specialized Capabilities Checklist
  const capabilities = [
    'Android App Development',
    'UI/UX Design',
    'Website Redesign',
    'Bug Fixing & Speed Optimization',
    'Website Maintenance & Security',
    'AI Integration (OpenAI/Gemini)',
    'Custom Web Application',
    'Custom Digital Solutions',
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto space-y-12 animate-fade-in-up">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300">
          {t('ourServicesBadge')}
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('servicesHeading')}
        </h1>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium">
          {t('servicesSubtitle')}
        </p>
      </div>

      {/* Vertical list of 16 full-width white rounded rows */}
      <div className="space-y-3">
        {servicesList.map((service, idx) => {
          const Icon = service.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate('/contact')}
              className="glass-card p-4 rounded-2xl flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer group shadow-xs border border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  {service.title}
                </span>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
      </div>

      {/* Specialized Development Capabilities */}
      <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6 border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white text-center">
          {t('specializedCapHeading')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
              <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {cap}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Strict Ethical Commitment Policy Block */}
      <div className="p-6 rounded-3xl bg-red-50 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-900/80 space-y-2">
        <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
          <ShieldAlert className="w-6 h-6 shrink-0" />
          <h3 className="font-extrabold text-base md:text-lg">
            {t('ethicalPolicyTitle')}
          </h3>
        </div>
        <p className="text-xs md:text-sm text-red-700 dark:text-red-300 font-medium leading-relaxed">
          {t('ethicalPolicyContent')}
        </p>
      </div>

      {/* CTA Card */}
      <div className="glass-card p-8 rounded-3xl text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-md">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
          {t('ctaHeading')}
        </h3>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          {t('ctaText')}
        </p>
        <button
          onClick={() => navigate('/contact')}
          className="px-8 py-3.5 rounded-full btn-primary-gradient font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Rocket className="w-4 h-4" />
          <span>{t('startProject')}</span>
        </button>
      </div>
    </div>
  );
};
