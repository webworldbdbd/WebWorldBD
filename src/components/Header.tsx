import React from 'react';
import { Menu, Sun, Moon, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-4 py-3 transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left Section: Hamburger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            aria-label="Open Navigation Menu"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 group">
            {/* Stylized blue "W" icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
              W
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              {t('brandName')}
              <span className="text-sky-400 font-black ml-0.5">{t('brandBD')}</span>
            </span>
          </Link>
        </div>

        {/* Right Section: Theme Toggle + Language Toggle Pill */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Light/Dark Theme"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-sky-400" />
            )}
          </button>

          <button
            onClick={toggleLanguage}
            aria-label="Toggle Language"
            className="px-3.5 py-2 rounded-full flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-colors shadow-xs cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-4 h-4 text-sky-500" />
            <span>{language === 'en' ? 'BN' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
