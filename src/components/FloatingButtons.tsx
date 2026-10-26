import React, { useState, useEffect } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';

export const FloatingButtons: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Scroll To Top Button (Left of WhatsApp Button) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer animate-fade-in-up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Green WhatsApp Button */}
      <a
        href="https://wa.me/8801342697743"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer ring-4 ring-emerald-500/20"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
      </a>
    </div>
  );
};
