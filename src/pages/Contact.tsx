import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Mail, Phone, Headset, Send, ExternalLink } from 'lucide-react';

export const Contact: React.FC = () => {
  const { t } = useLanguage();

  const contactList = [
    {
      label: t('emailSupport'),
      value: 'saripofficialsupport@gmail.com',
      link: 'mailto:saripofficialsupport@gmail.com',
      bgColor: 'bg-red-500',
      iconType: 'gmail'
    },
    {
      label: t('phoneNumber'),
      value: '+8801342697743',
      link: 'tel:+8801342697743',
      bgColor: 'bg-emerald-500',
      iconType: 'phone'
    },
    {
      label: t('whatsappMessage'),
      value: '+8801342697743',
      link: 'https://wa.me/8801342697743',
      bgColor: 'bg-green-600',
      iconType: 'whatsapp'
    },
    {
      label: t('supportHotline'),
      value: '+8809658183506',
      link: 'tel:+8809658183506',
      bgColor: 'bg-blue-600',
      iconType: 'headset'
    },
    {
      label: t('telegramSupport'),
      value: '@saripsupportBD',
      link: 'https://t.me/saripsupportBD',
      bgColor: 'bg-sky-500',
      iconType: 'telegram'
    },
    {
      label: t('linkedinProfile'),
      value: 'https://www.linkedin.com/in/sh-sarip-4066b2431',
      link: 'https://www.linkedin.com/in/sh-sarip-4066b2431',
      bgColor: 'bg-blue-700',
      iconType: 'linkedin'
    },
    {
      label: t('fiverrProfile'),
      value: 'https://www.fiverr.com/s/0DbA3ok',
      link: 'https://www.fiverr.com/s/0DbA3ok',
      bgColor: 'bg-emerald-600',
      iconType: 'fiverr'
    },
    {
      label: t('webDevelopment'),
      value: 'https://www.fiverr.com/s/8xzaXEp',
      link: 'https://www.fiverr.com/s/8xzaXEp',
      bgColor: 'bg-emerald-600',
      iconType: 'fiverr'
    },
    {
      label: t('androidAppDev'),
      value: 'https://www.fiverr.com/s/vbvDpkL',
      link: 'https://www.fiverr.com/s/vbvDpkL',
      bgColor: 'bg-emerald-600',
      iconType: 'fiverr'
    },
  ];

  const socialIcons = [
    { name: 'Facebook', link: 'https://facebook.com', bg: 'bg-blue-600', icon: 'facebook' },
    { name: 'TikTok', link: 'https://tiktok.com', bg: 'bg-slate-900', icon: 'tiktok' },
    { name: 'Telegram', link: 'https://t.me/saripsupportBD', bg: 'bg-sky-500', icon: 'telegram' },
    { name: 'LinkedIn', link: 'https://www.linkedin.com/in/sh-sarip-4066b2431', bg: 'bg-blue-700', icon: 'linkedin' },
    { name: 'Gmail', link: 'mailto:saripofficialsupport@gmail.com', bg: 'bg-red-500', icon: 'gmail' },
    { name: 'WhatsApp', link: 'https://wa.me/8801342697743', bg: 'bg-emerald-500', icon: 'whatsapp' },
    { name: 'Fiverr', link: 'https://www.fiverr.com/s/0DbA3ok', bg: 'bg-emerald-600', icon: 'fiverr' },
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case 'gmail':
        return (
          <Mail className="w-5 h-5 text-white" />
        );
      case 'phone':
        return (
          <Phone className="w-5 h-5 text-white" />
        );
      case 'whatsapp':
        return (
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 16.5c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.182 8.182 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.24-8.22 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.79.97-.15.17-.3.19-.55.07-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1.01 2.55.12.17 1.73 2.64 4.19 3.7.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.3z"/>
          </svg>
        );
      case 'headset':
        return (
          <Headset className="w-5 h-5 text-white" />
        );
      case 'telegram':
        return (
          <Send className="w-5 h-5 text-white" />
        );
      case 'linkedin':
        return (
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        );
      case 'fiverr':
        return (
          <span className="font-extrabold text-white text-xs tracking-tighter">fi</span>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.99 3.66 9.12 8.44 9.88v-6.99H7.9v-2.89h2.54V9.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.89h-2.33v6.99C18.34 21.12 22 16.99 22 12z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.32 6.32 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.05a8.3 8.3 0 0 0 5.17 1.83V7.43a4.85 4.85 0 0 1-1.39-.74z"/>
          </svg>
        );
      default:
        return <ExternalLink className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 max-w-3xl mx-auto space-y-10 animate-fade-in-up">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300">
          {t('getInTouchBadge')}
        </span>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('contactHeading')}
        </h1>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium">
          {t('contactText')}
        </p>
      </div>

      {/* Vertical list of contact cards */}
      <div className="space-y-3.5">
        {contactList.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target={item.link.startsWith('http') ? '_blank' : '_self'}
            rel={item.link.startsWith('http') ? 'noopener noreferrer' : ''}
            className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 transition-all flex items-center justify-between group shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className={`w-11 h-11 rounded-full ${item.bgColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                {renderIcon(item.iconType)}
              </div>

              <div className="overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {item.value}
                </p>
              </div>
            </div>

            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors shrink-0 ml-2" />
          </a>
        ))}
      </div>

      {/* SOCIAL NETWORKS Section */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {t('socialNetworks')}
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {socialIcons.map((soc, idx) => (
            <a
              key={idx}
              href={soc.link}
              target={soc.link.startsWith('http') ? '_blank' : '_self'}
              rel={soc.link.startsWith('http') ? 'noopener noreferrer' : ''}
              title={soc.name}
              className={`w-11 h-11 rounded-full ${soc.bg} hover:opacity-90 flex items-center justify-center shadow-md hover:scale-110 transition-all cursor-pointer`}
            >
              {renderIcon(soc.icon)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
