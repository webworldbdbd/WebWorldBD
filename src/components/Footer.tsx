import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { MapPin, Mail, Phone, Headset } from 'lucide-react';

interface FooterProps {
  onOpenModal?: (modalType: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 pt-12 pb-8 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">
        {/* Mobile 2-column layout (and 4-column on desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Column 1 Top: Logo & Brief */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-xl shadow-xs">
                W
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                WebWorld<span className="text-sky-400 font-black">BD</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-normal">
              {t('footerDesc')}
            </p>

            {/* Popular Services Section under Col 1 */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
                {t('popularServices')}
              </h4>
              <ul className="space-y-2 text-xs">
                {['Business Website', 'E-commerce Website', 'Portfolio Website', 'Web App / SaaS', 'AI Website / Tools'].map((service) => (
                  <li key={service}>
                    <Link to="/services" className="hover:text-sky-500 transition-colors">
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="col-span-1 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              {t('quickLinks')}
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-sky-500 transition-colors">{t('home')}</Link>
              </li>
              <li>
                <a href="#about-me" className="hover:text-sky-500 transition-colors">{t('aboutMeTitle')}</a>
              </li>
              <li>
                <Link to="/services" className="hover:text-sky-500 transition-colors">{t('services')}</Link>
              </li>
              <li>
                <a href="#live-projects" className="hover:text-sky-500 transition-colors">Projects</a>
              </li>
              <li>
                <button onClick={() => onOpenModal?.('whyChooseMe')} className="hover:text-sky-500 transition-colors text-left cursor-pointer">
                  {t('whyChooseMe')}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenModal?.('workProcess')} className="hover:text-sky-500 transition-colors text-left cursor-pointer">
                  {t('workProcess')}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenModal?.('faq')} className="hover:text-sky-500 transition-colors text-left cursor-pointer">
                  {t('faq')}
                </button>
              </li>
              <li>
                <button onClick={() => onOpenModal?.('profile')} className="hover:text-sky-500 transition-colors text-left cursor-pointer">
                  Account
                </button>
              </li>
              <li>
                <Link to="/contact" className="hover:text-sky-500 transition-colors">{t('connect')}</Link>
              </li>
            </ul>
          </div>

          {/* Column 2 (below) / Column 3 & 4 on desktop: Contact Info */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
              {t('contactInfo')}
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Kushtia, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                <a href="mailto:saripofficialsupport@gmail.com" className="hover:underline hover:text-sky-500 truncate">
                  saripofficialsupport@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-sky-500 shrink-0" />
                <a href="tel:+8801342697743" className="hover:underline hover:text-sky-500">
                  +8801342697743
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Headset className="w-4 h-4 text-sky-500 shrink-0" />
                <a href="tel:+8809658183506" className="hover:underline hover:text-sky-500">
                  +8809658183506
                </a>
              </li>
              <li className="flex items-center gap-2.5 pt-1">
                <svg className="w-4 h-4 fill-sky-500 shrink-0" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <a
                  href="https://www.linkedin.com/in/sh-sarip-4066b2431"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-sky-500 truncate font-medium text-sky-600 dark:text-sky-400"
                >
                  LinkedIn Profile
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line Copyright Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};
