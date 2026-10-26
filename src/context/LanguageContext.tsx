import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header & Sidebar
    brandName: 'WebWorld',
    brandBD: 'BD',
    mainMenu: 'MAIN MENU',
    home: 'Home',
    services: 'Services',
    startProject: 'Start Project',
    liveChat: 'Live Chat',
    livePreview: 'Live Preview',
    connect: 'Connect',
    settings: 'Settings',
    adminPanel: 'Admin Panel',
    theme: 'Theme',
    language: 'Language',
    others: 'OTHERS',
    myProfile: 'My Profile',
    whyChooseMe: 'Why Choose Me',
    workProcess: 'Work Process',
    faq: 'FAQ',
    privacyPolicy: 'Privacy Policy',
    createAccount: 'CREATE ACCOUNT',
    logOut: 'Log Out',

    // Home Page Hero
    heroGreeting: "Hello! I am SHAFAET HOSSEN SARIP. Our work starts right from your ideas. We transform your preferences, needs, and vision into modern, attractive websites, web apps, and mobile apps. Your ideas, our technology—together we build your desired website & website applications.",
    viewAllProjects: "View All Live Projects",
    projectsCompleted: "Projects Completed",
    satisfiedClients: "Satisfied Clients",
    satisfactionRate: "Satisfaction Rate",

    // Who I Am Section
    whoIAmBadge: "Who I Am",
    authorName: "SHAFAET HOSSEN SARIP",
    authorSubtitle: "Web & App Developer | Digital Solutions Creator",
    aboutMePill: "About Me",
    aboutMeTitle: "About Me",
    aboutMeContent: "I am a Web & App Developer from Kushtia, Khulna, Bangladesh. I am a student in the Electronics Technology department at Kushtia Government Polytechnic Institute and have been working with Web Development for over a year.",
    myGoalPill: "My Goal",
    myGoalTitle: "My Goal",
    myGoalContent: "To build fast, reliable, and high-quality digital platforms ranging from small Business Websites to complete E-commerce Platforms, Web Applications, and Custom Digital Solutions.",
    skillsPill: "Skills & Experience",
    skillsTitle: "Skills & Experience",
    skillsContent: "I build modern Websites, Web Applications, E-commerce Platforms, Business Websites, Educational Platforms, AI-powered Websites, and various Custom Digital Solutions for clients and my own ventures.",
    policyPill: "Policy",
    policyTitle: "Policy",
    policyContent: "I work on building positive, professional, and business-oriented websites and digital platforms. I do NOT build Gambling or Betting Websites.",

    // Tech Stack
    techStackBadge: "Tech Stack",
    techStackHeading: "Technologies & Frameworks I Master",

    // Services Page
    ourServicesBadge: "Our Services",
    servicesHeading: "High-Performance Custom Web Services",
    servicesSubtitle: "Professional web solutions tailored to elevate and scale your business.",
    specializedCapHeading: "Specialized Development Capabilities",
    ethicalPolicyTitle: "Strict Ethical Commitment Policy",
    ethicalPolicyContent: "WebWorldBD strictly builds positive, business-oriented, and legal platforms only. Absolutely NO Gambling, Betting, Adult, or illegal websites are accepted.",
    ctaHeading: "Let's Build Something Great Together!",
    ctaText: "Ready to take your business online or start a new project? Contact me today for a free consultation.",

    // Contact Page
    getInTouchBadge: "Get In Touch",
    contactHeading: "Let's Build Something Great Together!",
    contactText: "Ready to take your business online or start a new project? Contact me today for a free consultation.",
    emailSupport: "EMAIL SUPPORT",
    phoneNumber: "PHONE NUMBER",
    whatsappMessage: "WHATSAPP MESSAGE",
    supportHotline: "SUPPORT HOTLINE",
    telegramSupport: "TELEGRAM SUPPORT",
    linkedinProfile: "LINKEDIN PROFILE",
    fiverrProfile: "FIVERR PROFILE",
    webDevelopment: "WEB DEVELOPMENT",
    androidAppDev: "ANDROID APP DEVELOPMENT",
    socialNetworks: "SOCIAL NETWORKS",

    // Footer
    footerDesc: "SHAFAET HOSSEN SARIP — WebWorldBD. Building powerful digital experiences, high-converting websites, and modern apps with zero compromise on quality and ethics.",
    quickLinks: "Quick Links",
    popularServices: "Popular Services",
    contactInfo: "Contact Info",
    location: "Kushtia, Bangladesh",
    copyright: "© 2026 WebWorldBD. Created with passion by SHAFAET HOSSEN SARIP. All rights reserved.",
  },
  bn: {
    // Header & Sidebar
    brandName: 'ওয়েবওয়ার্ল্ড',
    brandBD: 'বিডি',
    mainMenu: 'মূল মেনু',
    home: 'হোম',
    services: 'সার্ভিসসমূহ',
    startProject: 'প্রজেক্ট শুরু করুন',
    liveChat: 'লাইভ চ্যাট',
    livePreview: 'লাইভ প্রিভিউ',
    connect: 'যোগাযোগ',
    settings: 'সেটিংস',
    adminPanel: 'এডমিন প্যানেল',
    theme: 'থিম',
    language: 'ভাষা',
    others: 'অন্যান্য',
    myProfile: 'আমার প্রোফাইল',
    whyChooseMe: 'কেন আমাকে বেছে নেবেন',
    workProcess: 'কাজ করার পদ্ধতি',
    faq: 'সাধারণ জিজ্ঞাসা (FAQ)',
    privacyPolicy: 'প্রাইভেসি পলিসি',
    createAccount: 'অ্যাকাউন্ট তৈরি করুন',
    logOut: 'লগ আউট',

    // Home Page Hero
    heroGreeting: "হ্যালো! আমি শাফায়েত হোসেন সারিপ। আপনার চিন্তা থেকেই আমাদের কাজ শুরু হয়। আমরা আপনার পছন্দ, চাহিদা এবং দৃষ্টিভঙ্গিকে আধুনিক, আকর্ষণীয় ওয়েবসাইট, ওয়েব অ্যাপ এবং মোবাইল অ্যাপে রূপান্তরিত করি। আপনার আইডিয়া, আমাদের প্রযুক্তি—একত্রে আমরা তৈরি করি আপনার স্বপ্নের ওয়েবসাইট ও অ্যাপ্লিকেশন।",
    viewAllProjects: "সব লাইভ প্রজেক্ট দেখুন",
    projectsCompleted: "সম্পন্ন প্রজেক্ট",
    satisfiedClients: "সন্তুষ্ট ক্লায়েন্ট",
    satisfactionRate: "সন্তুষ্টির হার",

    // Who I Am Section
    whoIAmBadge: "আমার পরিচয়",
    authorName: "শাফায়েত হোসেন সারিপ",
    authorSubtitle: "ওয়েব ও অ্যাপ ডেভেলপার | ডিজিটাল সলিউশন ক্রিয়েটর",
    aboutMePill: "আমার সম্পর্কে",
    aboutMeTitle: "আমার সম্পর্কে",
    aboutMeContent: "আমি কুষ্টিয়া, খুলনা, বাংলাদেশের একজন ওয়েব ও অ্যাপ ডেভেলপার। আমি কুষ্টিয়া সরকারি পলিটেকনিক ইনস্টিটিউটে ইলেকট্রনিক্স টেকনোলজি বিভাগে অধ্যয়নরত এবং গত ১ বছরেরও বেশি সময় ধরে ওয়েব ডেভেলপমেন্ট নিয়ে কাজ করছি।",
    myGoalPill: "আমার লক্ষ্য",
    myGoalTitle: "আমার লক্ষ্য",
    myGoalContent: "ক্ষুদ্র বিজনেস ওয়েবসাইট থেকে শুরু করে সম্পূর্ণ ই-কমার্স প্ল্যাটফর্ম, ওয়েব অ্যাপ্লিকেশন এবং কাস্টম ডিজিটাল সলিউশন দ্রুত, নির্ভরযোগ্য এবং উচ্চমানের সাথে তৈরি করা।",
    skillsPill: "দক্ষতা ও অভিজ্ঞতা",
    skillsTitle: "দক্ষতা ও অভিজ্ঞতা",
    skillsContent: "আমি আধুনিক ওয়েবসাইট, ওয়েব অ্যাপ্লিকেশন, ই-কমার্স প্ল্যাটফর্ম, ব্যবসায়িক ওয়েবসাইট, শিক্ষা বিষয়ক প্ল্যাটফর্ম, এআই-চালিত ওয়েবসাইট এবং বিভিন্ন কাস্টম ডিজিটাল সলিউশন তৈরি করি।",
    policyPill: "নীতিমালা",
    policyTitle: "নীতিমালা",
    policyContent: "আমি ইতিবাচক, পেশাদার এবং ব্যবসায়িক ওয়েবসাইট ও ডিজিটাল প্ল্যাটফর্ম তৈরিতে কাজ করি। আমি কোনো জুয়া বা বেটিং ওয়েবসাইট তৈরি করি না।",

    // Tech Stack
    techStackBadge: "টেক স্ট্যাক",
    techStackHeading: "যেসব প্রযুক্তি ও ফ্রেমওয়ার্কে আমি অভিজ্ঞ",

    // Services Page
    ourServicesBadge: "আমাদের সার্ভিসসমূহ",
    servicesHeading: "হাই-পারফর্ম্যান্স কাস্টম ওয়েব সার্ভিসেস",
    servicesSubtitle: "আপনার ব্যবসাকে এগিয়ে নিতে এবং স্কেল করার জন্য পেশাদার ওয়েব সলিউশন।",
    specializedCapHeading: "বিশেষায়িত ডেভেলপমেন্ট ক্ষমতা",
    ethicalPolicyTitle: "কঠোর নৈতিক অঙ্গীকার নীতি",
    ethicalPolicyContent: "ওয়েবওয়ার্ল্ডবিডি কঠোরভাবে শুধুমাত্র ইতিবাচক, ব্যবসায়িক এবং বৈধ প্ল্যাটফর্ম তৈরি করে। কোনো জুয়া, বেটিং, অ্যাডাল্ট বা অবৈধ ওয়েবসাইট গ্রহণ করা হয় না।",
    ctaHeading: "চলুন একসাথে অসাধারণ কিছু তৈরি করি!",
    ctaText: "আপনার ব্যবসাকে অনলাইনে নিতে বা একটি নতুন প্রজেক্ট শুরু করতে প্রস্তুত? বিনামূল্যে পরামর্শের জন্য আজই যোগাযোগ করুন।",

    // Contact Page
    getInTouchBadge: "যোগাযোগ করুন",
    contactHeading: "চলুন একসাথে অসাধারণ কিছু তৈরি করি!",
    contactText: "আপনার ব্যবসাকে অনলাইনে নিতে বা একটি নতুন প্রজেক্ট শুরু করতে প্রস্তুত? বিনামূল্যে পরামর্শের জন্য আজই যোগাযোগ করুন।",
    emailSupport: "ইমেইল সাপোর্ট",
    phoneNumber: "ফোন নম্বর",
    whatsappMessage: "হোয়াটসঅ্যাপ মেসেজ",
    supportHotline: "সাপোর্ট হটলাইন",
    telegramSupport: "টেলিগ্রাম সাপোর্ট",
    linkedinProfile: "লিঙ্কডইন প্রোফাইল",
    fiverrProfile: "ফাইবার প্রোফাইল",
    webDevelopment: "ওয়েব ডেভেলপমেন্ট",
    androidAppDev: "অ্যান্ড্রয়েড অ্যাপ ডেভেলপমেন্ট",
    socialNetworks: "সোশ্যাল নেটওয়ার্ক",

    // Footer
    footerDesc: "শাফায়েত হোসেন সারিপ — ওয়েবওয়ার্ল্ডবিডি। গুণমান এবং নৈতিকতার সাথে কোনো আপস না করে শক্তিশালী ডিজিটাল অভিজ্ঞতা, হাই-কনভার্টিং ওয়েবসাইট এবং আধুনিক অ্যাপ তৈরি করছি।",
    quickLinks: "দ্রুত লিঙ্ক",
    popularServices: "জনপ্রিয় সার্ভিসসমূহ",
    contactInfo: "যোগাযোগের তথ্য",
    location: "কুষ্টিয়া, বাংলাদেশ",
    copyright: "© ২০২৬ ওয়েবওয়ার্ল্ডবিডি। শাফায়েত হোসেন সারিপ কর্তৃক নিবেদিতভাবে নির্মিত। সর্বস্বত্ব সংরক্ষিত।",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
