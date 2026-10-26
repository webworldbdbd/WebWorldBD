import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Home as HomeIcon,
  Briefcase,
  Rocket,
  MessageSquare,
  Eye,
  Send,
  Settings as SettingsIcon,
  ShieldCheck,
  ExternalLink,
  User,
  CheckCircle2,
  ListOrdered,
  HelpCircle,
  FileText,
  LogOut,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (modalType: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenModal }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleModalClick = (modalType: string) => {
    onOpenModal(modalType);
    onClose();
  };

  const isHomeActive = location.pathname === '/';
  const isServicesActive = location.pathname === '/services';
  const isContactActive = location.pathname === '/contact';

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Blurred Dark Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-80 max-w-[85vw] bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Top Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-lg shadow-xs">
              W
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              {t('brandName')}<span className="text-sky-400 font-black">{t('brandBD')}</span>
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Navigation"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-6">
          {/* User Card */}
          <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-950/80 border-2 border-sky-400 flex items-center justify-center text-sky-500 font-bold text-lg shrink-0">
              W
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">WebWorldBD</h4>
              <a
                href="mailto:webworldbd.lmt@gmail.com"
                className="text-xs text-sky-500 dark:text-sky-400 hover:underline font-medium block truncate"
              >
                webworldbd.lmt@gmail.com
              </a>
            </div>
          </div>

          {/* MAIN MENU SECTION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
              {t('mainMenu')}
            </h3>
            <div className="space-y-2">
              {/* Home */}
              <button
                onClick={() => handleNavigation('/')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                  isHomeActive
                    ? 'bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-950/50 dark:to-purple-950/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <HomeIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('home')}</span>
                </div>
              </button>

              {/* Services */}
              <button
                onClick={() => handleNavigation('/services')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                  isServicesActive
                    ? 'bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-950/50 dark:to-purple-950/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('services')}</span>
                </div>
              </button>

              {/* Start Project */}
              <button
                onClick={() => handleNavigation('/contact')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('startProject')}</span>
                </div>
              </button>

              {/* Live Chat */}
              <button
                onClick={() => handleModalClick('liveChat')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all relative"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0 relative">
                    <MessageSquare className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                  </div>
                  <span className="text-sm font-semibold">{t('liveChat')}</span>
                </div>
              </button>

              {/* Live Preview */}
              <button
                onClick={() => handleModalClick('livePreview')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('livePreview')}</span>
                </div>
              </button>

              {/* Connect */}
              <button
                onClick={() => handleNavigation('/contact')}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                  isContactActive
                    ? 'bg-gradient-to-r from-sky-50 to-purple-50 dark:from-sky-950/50 dark:to-purple-950/50 border-l-4 border-sky-500 text-sky-700 dark:text-sky-300 font-bold shadow-xs'
                    : 'bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('connect')}</span>
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={() => handleModalClick('settings')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <SettingsIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('settings')}</span>
                </div>
              </button>

              {/* Admin Panel */}
              <button
                onClick={() => handleModalClick('adminPanel')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('adminPanel')}</span>
                </div>
              </button>

              {/* Theme Switcher Card */}
              <div
                onClick={toggleTheme}
                className="w-full p-2.5 rounded-xl flex items-center justify-between bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-sky-400" />}
                  </div>
                  <span className="text-sm font-semibold">{t('theme')}</span>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {theme === 'light' ? 'Light' : 'Dark'}
                </span>
              </div>

              {/* Language Switcher Card */}
              <div
                onClick={toggleLanguage}
                className="w-full p-2.5 rounded-xl flex items-center justify-between bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-500 shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold">{t('language')}</span>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {language === 'en' ? 'EN' : 'BN'}
                </span>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW SECTION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
              LIVE PREVIEW
            </h3>
            <div className="space-y-2">
              {[
                'Market Koro',
                "Student's Tool's & AI",
                'Birthday Website',
                'Animated Heart',
                'RunZone'
              ].map((projectName) => (
                <a
                  key={projectName}
                  href="#live-projects"
                  onClick={() => onClose()}
                  className="w-full p-2.5 rounded-xl flex items-center justify-between bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all text-sm font-semibold"
                >
                  <span>{projectName}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </a>
              ))}
            </div>
          </div>

          {/* OTHERS SECTION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
              {t('others')}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => handleModalClick('profile')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-semibold">{t('myProfile')}</span>
                </div>
              </button>

              <button
                onClick={() => handleModalClick('whyChooseMe')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-semibold">{t('whyChooseMe')}</span>
                </div>
              </button>

              <button
                onClick={() => handleModalClick('workProcess')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ListOrdered className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-semibold">{t('workProcess')}</span>
                </div>
              </button>

              <button
                onClick={() => handleModalClick('faq')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-semibold">{t('faq')}</span>
                </div>
              </button>

              <button
                onClick={() => handleModalClick('privacyPolicy')}
                className="w-full p-2.5 rounded-xl flex items-center justify-between text-left bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-500" />
                  <span className="text-sm font-semibold">{t('privacyPolicy')}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* CREATE ACCOUNT / LOG OUT SECTION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
              {t('createAccount')}
            </h3>
            <button
              onClick={() => handleModalClick('logout')}
              className="w-full p-3 rounded-xl flex items-center justify-between bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-bold">{t('logOut')}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
