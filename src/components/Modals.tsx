import React, { useState } from 'react';
import {
  X,
  Send,
  User,
  CheckCircle2,
  ListOrdered,
  HelpCircle,
  FileText,
  ShieldCheck,
  Settings as SettingsIcon,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface ModalsProps {
  activeModal: string | null;
  onClose: () => void;
}

export const Modals: React.FC<ModalsProps> = ({ activeModal, onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  // Live chat state
  const [chatMessages, setChatMessages] = useState([
    { sender: 'sarip', text: 'Hello! I am SHAFAET HOSSEN SARIP. How can WebWorldBD assist you today with your web or mobile project?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  if (!activeModal) return null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'sarip',
          text: `Thank you for your message! You can also contact me directly via WhatsApp at +8801342697743 or email saripofficialsupport@gmail.com for instant response.`
        }
      ]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            {activeModal === 'liveChat' && <MessageSquare className="w-5 h-5 text-sky-500" />}
            {activeModal === 'adminPanel' && <ShieldCheck className="w-5 h-5 text-sky-500" />}
            {activeModal === 'settings' && <SettingsIcon className="w-5 h-5 text-sky-500" />}
            {activeModal === 'profile' && <User className="w-5 h-5 text-sky-500" />}
            {activeModal === 'whyChooseMe' && <CheckCircle2 className="w-5 h-5 text-sky-500" />}
            {activeModal === 'workProcess' && <ListOrdered className="w-5 h-5 text-sky-500" />}
            {activeModal === 'faq' && <HelpCircle className="w-5 h-5 text-sky-500" />}
            {activeModal === 'privacyPolicy' && <FileText className="w-5 h-5 text-sky-500" />}
            {activeModal === 'logout' && <LogOut className="w-5 h-5 text-red-500" />}

            <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
              {activeModal === 'liveChat' && t('liveChat')}
              {activeModal === 'adminPanel' && t('adminPanel')}
              {activeModal === 'settings' && t('settings')}
              {activeModal === 'profile' && t('myProfile')}
              {activeModal === 'whyChooseMe' && t('whyChooseMe')}
              {activeModal === 'workProcess' && t('workProcess')}
              {activeModal === 'faq' && t('faq')}
              {activeModal === 'privacyPolicy' && t('privacyPolicy')}
              {activeModal === 'logout' && t('logOut')}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-sm">
          {/* LIVE CHAT MODAL */}
          {activeModal === 'liveChat' && (
            <div className="space-y-4">
              <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-sky-500 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* ADMIN PANEL MODAL */}
          {activeModal === 'adminPanel' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white p-4 rounded-2xl shadow-md">
                <p className="text-xs opacity-90">WebWorldBD Executive Control</p>
                <h4 className="text-xl font-black">Admin Management Dashboard</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active Projects</p>
                  <p className="text-lg font-bold text-sky-500">12 Ongoing</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Completed</p>
                  <p className="text-lg font-bold text-emerald-500">108+ Done</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">System Status</p>
                  <p className="text-lg font-bold text-purple-500">100% Online</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Client Inquiries</p>
                  <p className="text-lg font-bold text-amber-500">5 New</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                🔒 Admin Panel is restricted to authorized WebWorldBD developers only.
              </div>
            </div>
          )}

          {/* SETTINGS MODAL */}
          {activeModal === 'settings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-sky-400" />}
                  <span className="font-semibold">{t('theme')} Mode</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-medium text-xs cursor-pointer"
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-sky-500" />
                  <span className="font-semibold">{t('language')}</span>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-medium text-xs cursor-pointer"
                >
                  {language === 'en' ? 'বাংলা রূপান্তর' : 'Switch to English'}
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">System Preferences</p>
                <div className="flex items-center justify-between text-xs">
                  <span>Sound Effects</span>
                  <input type="checkbox" defaultChecked className="accent-sky-500" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Push Notifications</span>
                  <input type="checkbox" defaultChecked className="accent-sky-500" />
                </div>
              </div>
            </div>
          )}

          {/* MY PROFILE MODAL */}
          {activeModal === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-extrabold text-2xl ring-4 ring-sky-200 dark:ring-sky-900">
                  W
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    SHAFAET HOSSEN SARIP
                  </h4>
                  <p className="text-xs text-sky-500 font-semibold">Web & App Developer</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kushtia, Khulna, Bangladesh</p>
                </div>
              </div>

              <div className="space-y-2 text-xs leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p>
                  🎓 <strong>Education:</strong> Electronics Technology, Kushtia Government Polytechnic Institute.
                </p>
                <p>
                  💼 <strong>Brand:</strong> Founder & Lead Developer at WebWorldBD.
                </p>
                <p>
                  ⚡ <strong>Specialization:</strong> Full-stack web application development, Android app dev, e-commerce, and digital platform engineering.
                </p>
              </div>
            </div>
          )}

          {/* WHY CHOOSE ME MODAL */}
          {activeModal === 'whyChooseMe' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-900">
                <h5 className="font-bold text-sky-700 dark:text-sky-300 text-sm mb-1">1. High-Performance Engineering</h5>
                <p>Fast loading speed, mobile-responsive layout, and modern tech stack (React, Tailwind, Node.js, Next.js).</p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <h5 className="font-bold text-emerald-700 dark:text-emerald-300 text-sm mb-1">2. 100% Ethical Commitment</h5>
                <p>Strict refusal of gambling, betting, adult, or illegal platforms. Positive & professional digital solutions only.</p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900">
                <h5 className="font-bold text-purple-700 dark:text-purple-300 text-sm mb-1">3. Direct Developer Support</h5>
                <p>24/7 direct communication, bug-free warranty, and ongoing maintenance.</p>
              </div>
            </div>
          )}

          {/* WORK PROCESS MODAL */}
          {activeModal === 'workProcess' && (
            <div className="space-y-3 text-xs">
              <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Requirement Gathering</h5>
                  <p className="text-slate-600 dark:text-slate-400">Discussion of client preferences, target audience, and feature roadmap.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">UI Design & Architecture</h5>
                  <p className="text-slate-600 dark:text-slate-400">Designing modern, clean glassmorphism layouts and structural database schemas.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Coding & API Integration</h5>
                  <p className="text-slate-600 dark:text-slate-400">Full-stack development, mobile responsiveness, and payment gateway integration.</p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-6 h-6 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center shrink-0">4</div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-sm">Testing, Deployment & Handover</h5>
                  <p className="text-slate-600 dark:text-slate-400">Final security checks, domain setup, hosting deployment, and client handover.</p>
                </div>
              </div>
            </div>
          )}

          {/* FAQ MODAL */}
          {activeModal === 'faq' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white mb-1">Q: How long does a web project take?</h5>
                <p className="text-slate-600 dark:text-slate-400">Standard business sites take 3-5 days. Complex e-commerce or SaaS apps take 1-3 weeks.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white mb-1">Q: Do you accept payment via bKash / Nagad / SSLCommerz?</h5>
                <p className="text-slate-600 dark:text-slate-400">Yes! Local Bangladeshi payment gateways as well as Fiverr / international payments are accepted.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-slate-900 dark:text-white mb-1">Q: Do you build gambling or betting sites?</h5>
                <p className="text-slate-600 dark:text-slate-400 text-red-500 font-medium">No. WebWorldBD strictly refuses all Gambling, Betting, Adult, or illegal projects.</p>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY MODAL */}
          {activeModal === 'privacyPolicy' && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <p>
                WebWorldBD respects your privacy. All project information, source code, and credentials shared with SHAFAET HOSSEN SARIP remain 100% confidential.
              </p>
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-medium">
                WebWorldBD strictly builds positive, business-oriented, and legal platforms only. Absolutely NO Gambling, Betting, Adult, or illegal websites are accepted.
              </div>
            </div>
          )}

          {/* LOGOUT MODAL */}
          {activeModal === 'logout' && (
            <div className="space-y-4 text-center">
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                You are currently logged into WebWorldBD. Would you like to sign out?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
