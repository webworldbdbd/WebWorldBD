// WebWorldBD Services Data Dictionary (Bilingual Support EN/BN)

export const servicesData = [
  {
    id: 'business-website',
    icon: 'fa-solid fa-globe',
    badge: { en: 'Popular', bn: 'জনপ্রিয়' },
    title: { en: 'Business Website', bn: 'বিজনেস ওয়েবসাইট' },
    category: { en: 'Corporate & Company', bn: 'কর্পোরেট ও কোম্পানি' },
    shortDescription: {
      en: 'High-converting, responsive, and SEO-optimized custom business websites to build your online presence.',
      bn: 'আপনার ব্যবসার অনলাইন উপস্থিতি গড়ে তুলতে রেসপন্সিভ, হাই-কনভার্টিং এবং এসইও ফ্রেন্ডলি কাস্টম ওয়েবসাইট।'
    },
    detailedDescription: {
      en: 'A professional business website serves as the digital storefront for your brand. We craft tailor-made, high-speed corporate sites designed to convert visitors into loyal clients while projecting maximum credibility.',
      bn: 'একটি পেশাদার বিজনেস ওয়েবসাইট আপনার ব্র্যান্ডের ডিজিটাল পরিচয় বহন করে। আমরা দ্রুতগতিসম্পন্ন, নিরাপদ এবং দৃষ্টিনন্দন কর্পোরেট ওয়েবসাইট তৈরি করি যা ভিজিটরকে ক্লায়েন্টে রূপান্তর করতে সাহায্য করে।'
    },
    features: [
      {
        title: { en: 'Responsive & Modern UI', bn: 'রেসপন্সিভ ও আধুনিক ডিজাইন' },
        desc: { en: 'Flawless layout across Mobile, Tablet, and Desktop screens.', bn: 'মোবাইল, ট্যাবলেট এবং ডেস্কটপে সুন্দর ও নিরবচ্ছিন্ন লেআউট।' }
      },
      {
        title: { en: 'SEO & Speed Optimized', bn: 'এসইও ও আল্ট্রা ফাস্ট স্পিড' },
        desc: { en: 'Lightning-fast load times with built-in search engine optimization.', bn: 'গুগল সার্চ র্যাংকিং উপযোগী দ্রুত লোডিং স্পিড।' }
      },
      {
        title: { en: 'Lead Generation Forms', bn: 'লিড জেনারেশন ও ফর্ম' },
        desc: { en: 'Integrated inquiry forms, WhatsApp chat, and location maps.', bn: 'ইনকয়ারি ফর্ম, হোয়াটসঅ্যাপ চ্যাট এবং গুগল ম্যাপ ইন্টিগ্রেশন।' }
      },
      {
        title: { en: 'Custom Admin Dashboard', bn: 'সহজ কন্টেন্ট ম্যানেজমেন্ট' },
        desc: { en: 'Manage your text, portfolio, services, and blog effortlessly.', bn: 'সহজেই ওয়েবসাইট কন্টেন্ট, পোর্টফোলিও এবং সার্ভিস আপডেট করার সুবিধা।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript (ES6+)', 'Firebase / Node.js'],
    deliveryTime: { en: '3 - 5 Days', bn: '৩ - ৫ দিন' },
    startingPrice: { en: '৳15,000 / $150', bn: '১৫,০০০ টাকা / $১৫০' },
    ctaUrl: './contact.html?service=business-website'
  },
  {
    id: 'ecommerce-website',
    icon: 'fa-solid fa-cart-shopping',
    badge: { en: 'Top Choice', bn: 'সেরা পছন্দ' },
    title: { en: 'E-commerce Website', bn: 'ই-কমার্স ওয়েবসাইট' },
    category: { en: 'Online Store & Retail', bn: 'অনলাইন শপ ও রিটেইল' },
    shortDescription: {
      en: 'Scalable online store with seamless payment gateway integration and inventory management.',
      bn: 'পেমেন্ট গেটওয়ে, শপিং কার্ট এবং ইনভেন্টরি ম্যানেজমেন্ট সহ সম্পূর্ণ ই-কমার্স স্টোর।'
    },
    detailedDescription: {
      en: 'Empower your online store with custom product catalogs, shopping cart, instant checkout, bKash/Nagad/Card payment gateways, customer account portal, and order status tracking.',
      bn: 'আপনার অনলাইন ব্যবসা সম্প্রসারণে প্রোডাক্ট ক্যাটালগ, শপিং কার্ট, বিকাশ/নগদ/কার্ড পেমেন্ট গেটওয়ে, কাস্টমার অ্যাকাউন্ট এবং অর্ডার ট্র্যাকিং সহ ই-কমার্স প্ল্যাটফর্ম।'
    },
    features: [
      {
        title: { en: 'Payment Gateway Integration', bn: 'স্থানীয় ও আন্তর্জাতিক পেমেন্ট' },
        desc: { en: 'Integrated bKash, Nagad, SSLCommerz, Stripe, and COD options.', bn: 'বিকাশ, নগদ, কার্ড এবং ক্যাশ অন ডেলিভারি সিস্টেম ইন্টিগ্রেশন।' }
      },
      {
        title: { en: 'Product & Stock Management', bn: 'প্রোডাক্ট ও স্টক ম্যানেজমেন্ট' },
        desc: { en: 'Categorize products, track stock, and control discount coupons.', bn: 'সহজে প্রোডাক্ট যোগ, স্টক ট্র্যাকিং এবং কুপন ডিসকাউন্ট সুবিধা।' }
      },
      {
        title: { en: 'Order Tracking Dashboard', bn: 'অর্ডার ট্র্যাকিং ড্যাশবোর্ড' },
        desc: { en: 'Real-time notification for new orders and status updates.', bn: 'নতুন অর্ডারের নোটিফিকেশন এবং রিয়েল-টাইম কাস্টমার ট্র্যাকিং।' }
      },
      {
        title: { en: 'Mobile App Compatible', bn: 'মোবাইল অপটিমাইজড' },
        desc: { en: 'Ultra-responsive touch shopping interface for mobile buyers.', bn: 'মোবাইল ক্রেতাদের জন্য মসৃণ ও দ্রুত শপিং অভিজ্ঞতা।' }
      }
    ],
    technologies: ['React / Vanilla JS', 'Tailwind CSS', 'Node.js / Express', 'MongoDB / Firebase'],
    deliveryTime: { en: '7 - 12 Days', bn: '৭ - ১২ দিন' },
    startingPrice: { en: '৳25,000 / $250', bn: '২৫,০০০ টাকা / $২৫০' },
    ctaUrl: './contact.html?service=ecommerce-website'
  },
  {
    id: 'portfolio-website',
    icon: 'fa-solid fa-user',
    badge: { en: 'Creative', bn: 'ক্রিয়েটিভ' },
    title: { en: 'Portfolio Website', bn: 'পোর্টফোলিও ওয়েবসাইট' },
    category: { en: 'Personal Branding', bn: 'পার্সোনাল ব্র্যান্ডিং' },
    shortDescription: {
      en: 'Showcase your work, skills, and resume with a stunning, interactive personal portfolio.',
      bn: 'আপনার কাজ, দক্ষতা ও রেজুমে আকর্ষণীয় ভিজ্যুয়াল স্টাইলে তুলে ধরার ব্যক্তিগত পোর্টফোলিও।'
    },
    detailedDescription: {
      en: 'Stand out from the crowd with a luxury dynamic portfolio website. Perfect for developers, designers, agencies, executives, and freelancers looking to attract premium clients.',
      bn: 'ক্লায়েন্ট ও নিয়োগকারীদের আকৃষ্ট করতে অনন্য ৩ডি গ্লাসমরফিক ভিজ্যুয়াল পোর্টফোলিও, কাজের গ্যালারি এবং লাইভ প্রজেক্ট লিংক সহ ওয়েবসাইট।'
    },
    features: [
      {
        title: { en: 'Interactive Project Gallery', bn: 'ইন্টারেক্টিভ প্রজেক্ট গ্যালারি' },
        desc: { en: 'Filterable projects with live preview links and screenshots.', bn: 'লাইভ প্রিভিউ ও ফিল্টার সুবিধা সহ প্রজেক্ট ক্যাটালগ।' }
      },
      {
        title: { en: 'Downloadable CV & Resume', bn: 'সিভি / রেজুমে ডাউনলোড' },
        desc: { en: 'One-click resume download and skill charts.', bn: 'এক ক্লিকে রেজুমে ডাউনলোড ও স্কিল গ্রাফ।' }
      },
      {
        title: { en: 'Direct Contact Form', bn: 'সরাসরি যোগাযোগের ফর্ম' },
        desc: { en: 'Instant lead alerts sent to your email or WhatsApp.', bn: 'ইমেইল বা সরাসরি হোয়াটসঅ্যাপ ক্লায়েন্ট রিকোয়েস্ট মেসেজিং।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Cloudinary CDN'],
    deliveryTime: { en: '2 - 4 Days', bn: '২ - ৪ দিন' },
    startingPrice: { en: '৳10,000 / $100', bn: '১০,০০০ টাকা / $১০০' },
    ctaUrl: './contact.html?service=portfolio-website'
  },
  {
    id: 'blog-website',
    icon: 'fa-solid fa-book-open',
    badge: { en: 'Content Ready', bn: 'কন্টেন্ট রেডি' },
    title: { en: 'Blog Website', bn: 'ব্লগ ওয়েবসাইট' },
    category: { en: 'Publishing & Media', bn: 'পাবলিশিং ও মিডিয়া' },
    shortDescription: {
      en: 'Fast, readable, and AdSense-ready blogging platform designed for content creators.',
      bn: 'অ্যাডসেন্স উপযুক্ত, দ্রুতগতির ব্লগিং প্ল্যাটফর্ম যা কন্টেন্ট ক্রিয়েটরদের জন্য উপযুক্ত।'
    },
    detailedDescription: {
      en: 'Publish articles, share ideas, and monetize your content with a clean, fast-loading blogging website equipped with rich category tags, dark mode, social sharing, and search support.',
      bn: 'প্রবন্ধ বা ফিচার পোস্ট করা, অ্যাডসেন্স আর্নিং, ডার্ক মোড, সোশ্যাল শেয়ারিং এবং ক্যাটাগরি ফিল্টারিং সহ আধুনিক ব্লগ সাইট।'
    },
    features: [
      {
        title: { en: 'AdSense & Ads Ready', bn: 'অ্যাডসেন্স আর্নিং উপযোগী' },
        desc: { en: 'Optimized ad placement slots for Google AdSense & networks.', bn: 'বিজ্ঞাপন দেখানোর জন্য অপটিমাইজড এড স্লট।' }
      },
      {
        title: { en: 'Rich Text & Media Posts', bn: 'রিচ টেক্সট ও ছবি-ভিডিও' },
        desc: { en: 'Easy formatting with code highlight, images, and video embed.', bn: 'ভিডিও, ছবি ও কোড সহ আর্টিকেল লেখার সহজ এডিটর।' }
      },
      {
        title: { en: 'Social Share & Comments', bn: 'সোশ্যাল শেয়ার ও কমেন্ট' },
        desc: { en: 'Integrated Disqus/custom comment system and social sharing.', bn: 'কমেন্ট অপশন এবং সোশ্যাল মিডিয়াতে শেয়ার সুবিধা।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Firebase Firestore'],
    deliveryTime: { en: '3 - 5 Days', bn: '৩ - ৫ দিন' },
    startingPrice: { en: '৳12,000 / $120', bn: '১২,০০০ টাকা / $১২০' },
    ctaUrl: './contact.html?service=blog-website'
  },
  {
    id: 'news-website',
    icon: 'fa-solid fa-newspaper',
    badge: { en: 'High Traffic', bn: 'হাই ট্রাফিক' },
    title: { en: 'News Portal Website', bn: 'অনলাইন নিউজ পোর্টাল' },
    category: { en: 'Journalism & Media', bn: 'সাংবাদিকতা ও মিডিয়া' },
    shortDescription: {
      en: 'Dynamic online news portal with category management, breaking news ticker, and multi-author access.',
      bn: 'ব্রেকিং নিউজ স্ক্রলার, বিভাগীয় ক্যাটাগরি এবং একাধিক রিপোর্টার এক্সেস সহ অনলাইন নিউজ পোর্টাল।'
    },
    detailedDescription: {
      en: 'Comprehensive news portal built for heavy reader traffic, breaking news alerts, multimedia news galleries, localized language support, and reporter portal.',
      bn: 'বিপুল পাঠকের চাপ সামলাতে সক্ষম দ্রুতগতির নিউজ পোর্টাল, জাতীয়, আন্তর্জাতিক, খেলাধুলো ইত্যাদি বিভাগ ও অনলাইন লাইভ টিভি সংযোজন সুবিধা।'
    },
    features: [
      {
        title: { en: 'Breaking News Ticker', bn: 'ব্রেকিং নিউজ স্ক্রলার' },
        desc: { en: 'Live automated news ticker bar at the header.', bn: 'হেডারে লাইভ ব্রেকিং নিউজ স্ক্রল বার।' }
      },
      {
        title: { en: 'Multi-Author & Admin Roles', bn: 'রিপোর্টার ও এডিটর প্যানেল' },
        desc: { en: 'Assign roles for sub-editors, reporters, and news admins.', bn: 'রিপোর্টার ও সাব-এডিটরদের জন্য পৃথক লগইন।' }
      },
      {
        title: { en: 'Ultra Fast Caching', bn: 'দ্রুত পেজ লোডিং' },
        desc: { en: 'High capacity bandwidth with CDN media optimization.', bn: 'ভিডিও ও ছবি দ্রুত লোড হওয়ার জন্য সিডিএন সিস্টেম।' }
      }
    ],
    technologies: ['Tailwind CSS', 'JavaScript ES6+', 'Firebase / Node.js', 'Cloudinary CDN'],
    deliveryTime: { en: '5 - 8 Days', bn: '৫ - ৮ দিন' },
    startingPrice: { en: '৳20,000 / $200', bn: '২০,০০০ টাকা / $২০০' },
    ctaUrl: './contact.html?service=news-website'
  },
  {
    id: 'educational-website',
    icon: 'fa-solid fa-graduation-cap',
    badge: { en: 'EdTech', bn: 'এডটেক' },
    title: { en: 'Educational / LMS Website', bn: 'এডুকেশনাল / এলএমএস ওয়েবসাইট' },
    category: { en: 'Education & Coaching', bn: 'শিক্ষা ও কোচিং ইনস্টিটিউট' },
    shortDescription: {
      en: 'Complete learning platform with online course enrollment, routine, result, and student portal.',
      bn: 'অনলাইন কোর্স, রুটিন, নোটিশ বোর্ড, রেজাল্ট এবং স্টুডেন্ট পোর্টাল সহ শিক্ষা প্রতিষ্ঠানের সাইট।'
    },
    detailedDescription: {
      en: 'Empower schools, colleges, coaching centers, or EdTech startups with course enrollment, video lectures, exam portals, student dashboards, and downloadable study notes.',
      bn: 'স্কুল, কলেজ, কোচিং কিংবা অনলাইন একাডেমি পরিচালনার জন্য কোর্স এনরোলমেন্ট, ভিডিও ক্লাস, নোটিশ এবং অনলাইন মডেল টেস্ট পোর্টাল।'
    },
    features: [
      {
        title: { en: 'Course & Lecture Modules', bn: 'কোর্স ও ভিডিও মডিউল' },
        desc: { en: 'Organize courses into subjects, topics, and video lessons.', bn: 'বিষয়ভিত্তিক সাজানো লেকচার ও ভিডিও ক্লাস।' }
      },
      {
        title: { en: 'Notice Board & Results', bn: 'নোটিশ বোর্ড ও রেজাল্ট' },
        desc: { en: 'Instant notice publishing and student result checking.', bn: 'সহজেই নোটিশ প্রকাশ ও স্টুডেন্টদের ফলাফল চেক সুবিধা।' }
      },
      {
        title: { en: 'Student Registration & Login', bn: 'ছাত্র-ছাত্রী লগইন প্যানেল' },
        desc: { en: 'Personalized user profiles and enrolled course access.', bn: 'স্টুডেন্টদের নিজস্ব ড্যাশবোর্ড ও প্রোফাইল।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Firebase Auth & Firestore'],
    deliveryTime: { en: '5 - 9 Days', bn: '৫ - ৯ দিন' },
    startingPrice: { en: '৳22,000 / $220', bn: '২২,০০০ টাকা / $২২০' },
    ctaUrl: './contact.html?service=educational-website'
  },
  {
    id: 'social-media-website',
    icon: 'fa-solid fa-share-nodes',
    badge: { en: 'Interactive', bn: 'ইন্টারেক্টিভ' },
    title: { en: 'Social Media / Network Website', bn: 'সোশ্যাল মিডিয়া ওয়েবসাইট' },
    category: { en: 'Community & Connections', bn: 'কম্যুনিটি ও কানেকশন' },
    shortDescription: {
      en: 'Interactive social platform with profile creation, posts feed, likes, comments, and real-time chat.',
      bn: 'ইউজার প্রোফাইল, পোস্ট ফিড, লাইক, কমেন্ট ও রিয়েল-টাইম মেসেজিং সহ সামাজিক প্ল্যাটফর্ম।'
    },
    detailedDescription: {
      en: 'Custom social network built with real-time newsfeed updates, user connections/following, notification bell, media upload, and instant web chat system.',
      bn: 'ব্যবহারকারীদের নিজস্ব প্রোফাইল তৈরি, পোস্ট শেয়ারিং, রিয়েল-টাইম চ্যাটিং এবং নোটিফিকেশন অ্যালার্ট সহ সোশ্যাল প্ল্যাটফর্ম।'
    },
    features: [
      {
        title: { en: 'Real-time Activity Feed', bn: 'রিয়েল-টাইম নিউজফিড' },
        desc: { en: 'Instant post updates with media, likes, and comments.', bn: 'ছবি/ভিডিও সহ পোস্ট ও লাইক-কমেন্ট মিথস্ক্রিয়া।' }
      },
      {
        title: { en: 'Direct Live Messaging', bn: 'ডাইরেক্ট মেসেজিং' },
        desc: { en: 'One-on-one live chat with media attachments.', bn: 'ব্যবহারকারীদের মধ্যে সরাসরি বার্তা ও ফাইল আদান-প্রদান।' }
      },
      {
        title: { en: 'User Profiles & Follow System', bn: 'প্রোফাইল ও ফলো সিস্টেম' },
        desc: { en: 'Custom bio, cover photo, avatar, and follower count.', bn: 'কাস্টম বায়ো, কভার ফটো ও ফলোয়ার লিস্ট।' }
      }
    ],
    technologies: ['React / Vanilla JS', 'Tailwind CSS', 'Firebase Firestore & Realtime DB', 'Cloudinary'],
    deliveryTime: { en: '8 - 14 Days', bn: '৮ - ১৪ দিন' },
    startingPrice: { en: '৳30,000 / $300', bn: '৩০,০০০ টাকা / $৩০০' },
    ctaUrl: './contact.html?service=social-media-website'
  },
  {
    id: 'webapp-saas',
    icon: 'fa-solid fa-layer-group',
    badge: { en: 'Enterprise', bn: 'এন্টারপ্রাইজ' },
    title: { en: 'Web App / SaaS Platform', bn: 'ওয়েব অ্যাপ / SaaS প্ল্যাটফর্ম' },
    category: { en: 'Software as a Service', bn: 'সফটওয়্যার অ্যান এ সার্ভিস' },
    shortDescription: {
      en: 'Custom web software, SaaS applications, automation tools, and dashboard interfaces.',
      bn: 'কাস্টম ওয়েব সফটওয়্যার, SaaS অ্যাপ্লিকেশন, ড্যাশবোর্ড ও বিজনেস অটোমেশন টুলস।'
    },
    detailedDescription: {
      en: 'Transform complex business logic into smooth, secure web applications. Subscription tier billing, role-based controls, data analytics, and cloud API integration.',
      bn: 'জটিল বিজনেস প্রসেসকে ওয়েব সফটওয়্যারে রূপান্তর। রোল-বেসড ইউজার কন্ট্রোল, সাবস্ক্রিপশন সিস্টেম, এনালিটিক্স ও ড্যাশবোর্ড রিপোর্টিং।'
    },
    features: [
      {
        title: { en: 'Subscription & Tiered Billing', bn: 'সাবস্ক্রিপশন বাটন ও বিলিং' },
        desc: { en: 'Freemium, Monthly, or Annual billing system integration.', bn: 'মাসিক বা বাৎসরিক মেম্বারশিপ প্ল্যান ম্যানেজমেন্ট।' }
      },
      {
        title: { en: 'Role-Based Access (RBAC)', bn: 'ভূমিকাভিত্তিক সিকিউরিটি' },
        desc: { en: 'Granular permissions for Super Admin, Manager, and User.', bn: 'অ্যাডমিন, ম্যানেজার ও ইউজার লেভেল আলাদা এক্সেস রোল।' }
      },
      {
        title: { en: 'Analytics & Export Reports', bn: 'এনালিটিক্স ও ডাটা এক্সপোর্ট' },
        desc: { en: 'Interactive graphs, PDF invoice export, and CSV reports.', bn: 'পিডিএফ রিপোর্ট এক্সপোর্ট ও ভিজ্যুয়াল চার্ট ড্যাশবোর্ড।' }
      }
    ],
    technologies: ['React / JS ES6+', 'Tailwind CSS', 'Node.js / Firebase', 'REST / GraphQL APIs'],
    deliveryTime: { en: '10 - 20 Days', bn: '১০ - ২০ দিন' },
    startingPrice: { en: '৳35,000 / $350', bn: '৩৫,০০০ টাকা / $৩৫০' },
    ctaUrl: './contact.html?service=webapp-saas'
  },
  {
    id: 'booking-website',
    icon: 'fa-solid fa-calendar-days',
    badge: { en: 'Automated', bn: 'অটোমেটেড' },
    title: { en: 'Booking / Appointment Website', bn: 'বুকিং ও অ্যাপয়েন্টমেন্ট সাইট' },
    category: { en: 'Services & Healthcare', bn: 'সার্ভিস ও স্বাস্থ্যসেবা' },
    shortDescription: {
      en: 'Automated appointment scheduling for doctors, salons, consultants, and rental services.',
      bn: 'ডাক্তার, সেলুন, কনসালট্যান্ট ও রেন্টাল সেবার জন্য অন-টাইম বুকিং ও শিডিউলিং।'
    },
    detailedDescription: {
      en: 'Streamline client bookings with automated calendar slot availability, deposit payment, automated SMS/email reminders, and reschedule options.',
      bn: 'গ্রাহকদের অনলাইনে বুকিং দেওয়া, খালি স্লট নির্বাচন, অগ্রিম পেমেন্ট এবং কনফার্মেশন নোটিফিকেশন পাঠানোর সম্পূর্ণ অটোমেটেড প্ল্যাটফর্ম।'
    },
    features: [
      {
        title: { en: 'Calendar Time-Slot Selection', bn: 'ক্যালেন্ডার ও টাইম স্লট' },
        desc: { en: 'Clients pick available dates and time slots effortlessly.', bn: 'সহজে বুকিংয়ের তারিখ ও সময় নির্বাচন।' }
      },
      {
        title: { en: 'Advance Payment Option', bn: 'এডভান্স পেমেন্ট গ্রহণ' },
        desc: { en: 'Require partial or full advance fee to confirm booking.', bn: 'বুকিং নিশ্চিত করতে অগ্রিম টাকা সংগ্রহের সুবিধা।' }
      },
      {
        title: { en: 'Automated Reminders', bn: 'অটো রিমাইন্ডার সিস্টেম' },
        desc: { en: 'Email or WhatsApp notifications before appointment time.', bn: 'অ্যাপয়েন্টমেন্টের পূর্বে কাস্টমারকে স্মরণ করিয়ে দেওয়া।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Firebase Realtime DB'],
    deliveryTime: { en: '4 - 7 Days', bn: '৪ - ৭ দিন' },
    startingPrice: { en: '৳18,000 / $180', bn: '১৮,০০০ টাকা / $১৮০' },
    ctaUrl: './contact.html?service=booking-website'
  },
  {
    id: 'marketplace-website',
    icon: 'fa-solid fa-store',
    badge: { en: 'Multi-Vendor', bn: 'মাল্টি-ভেন্ডর' },
    title: { en: 'Marketplace Website', bn: 'মাল্টি-ভেন্ডর মার্কেটপ্লেস' },
    category: { en: 'E-commerce Ecosystem', bn: 'ই-কমার্স ইকোসিস্টেম' },
    shortDescription: {
      en: 'Multi-vendor marketplace platform enabling sellers to list products and earn commission.',
      bn: 'একাধিক বিক্রেতা (Vendor) যুক্ত হয়ে পণ্য বিক্রি এবং কমিশন অর্জনের মার্কেটপ্লেস।'
    },
    detailedDescription: {
      en: 'Build your own multi-seller store like Amazon or Daraz. Sellers get their own shop dashboard to add items, while platform owner collects sales commission.',
      bn: 'দারাজ বা অ্যামাজনের মতো মাল্টি-ভেন্ডর সাইট, যেখানে সেলাররা নিজস্ব দোকান পরিচালনা করতে পারে এবং অ্যাডমিন কমিশন পান।'
    },
    features: [
      {
        title: { en: 'Vendor Dashboard Portal', bn: 'ভেন্ডর বা সেলার প্যানেল' },
        desc: { en: 'Dedicated store control panel for third-party sellers.', bn: 'বিক্রেতাদের নিজস্ব প্রোডাক্ট ও সেলস ট্র্যাকিং প্যানেল।' }
      },
      {
        title: { en: 'Commission Split Engine', bn: 'অটো কমিশন ক্যালকুলেশন' },
        desc: { en: 'Automated commission rate deduction on every payout.', bn: 'প্রতি অর্ডারে প্লাটফর্ম ও সেলারের লাভ ভাগ করার ব্যবস্থা।' }
      },
      {
        title: { en: 'Customer Review & Rating', bn: 'রিভিউ ও রেটিং সিস্টেম' },
        desc: { en: 'Verified buyer reviews and seller rating badges.', bn: 'ক্রেতাদের রেটিং ও মতামত প্রদানের সুযোগ।' }
      }
    ],
    technologies: ['React / JS ES6+', 'Tailwind CSS', 'Node.js / Express', 'MongoDB / Firebase'],
    deliveryTime: { en: '10 - 18 Days', bn: '১০ - ১৮ দিন' },
    startingPrice: { en: '৳35,000 / $350', bn: '৩৫,০০০ টাকা / $৩৫০' },
    ctaUrl: './contact.html?service=marketplace-website'
  },
  {
    id: 'forum-community-website',
    icon: 'fa-solid fa-comments',
    badge: { en: 'Community', bn: 'কম্যুনিটি' },
    title: { en: 'Forum / Community Website', bn: 'ফোরাম ও কম্যুনিটি সাইট' },
    category: { en: 'Discussions & Groups', bn: 'আলোচনা ও গ্রুপ' },
    shortDescription: {
      en: 'Discussion board and question-answer forum with badges, voting, and topic moderation.',
      bn: 'প্রশ্ন-উত্তর, সমস্যা সমাধান, ভোটিং এবং আলোচনা সভার জন্য ডিসকাশন ফোরাম।'
    },
    detailedDescription: {
      en: 'Engage your audience with a feature-packed forum where users ask questions, share answers, upvote helpful responses, earn rank badges, and search topics.',
      bn: 'ব্যবহারকারীদের প্রযুক্তি, শিক্ষা বা নির্দিষ্ট বিষয়ে আলোচনা, আপভোট/ডাউনভোট, ব্যাজ অর্জন ও প্রশ্নোত্তর সাইট।'
    },
    features: [
      {
        title: { en: 'Topic Threads & Categories', bn: 'ক্যাটাগরি ও থ্রেড ভিত্তিক আলোচনা' },
        desc: { en: 'Organize discussions into specific tags and channels.', bn: 'নির্দিষ্ট ক্যাটাগরি ও ট্যাগে বিষয় সাজানো।' }
      },
      {
        title: { en: 'Upvote & Best Answer Selection', bn: 'আপভোট ও সেরা উত্তর নির্বাচন' },
        desc: { en: 'Mark accepted solutions and vote on top responses.', bn: 'সেরা সমাধান নির্বাচন এবং পজিটিভ ভোট প্রদান।' }
      },
      {
        title: { en: 'User Rank Badges', bn: 'ইউজার লেভেল ও ব্যাজ' },
        desc: { en: 'Gamified points system for active community contributors.', bn: 'সক্রিয় মেম্বারদের জন্য পয়েন্ট ও স্পেশাল র‍্যাংক ব্যাজ।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Firebase Firestore'],
    deliveryTime: { en: '5 - 9 Days', bn: '৫ - ৯ দিন' },
    startingPrice: { en: '৳20,000 / $200', bn: '২০,০০০ টাকা / $২০০' },
    ctaUrl: './contact.html?service=forum-community-website'
  },
  {
    id: 'entertainment-website',
    icon: 'fa-solid fa-film',
    badge: { en: 'Media Rich', bn: 'মিডিয়া রিচ' },
    title: { en: 'Entertainment / Media Streaming', bn: 'এন্টারটেইনমেন্ট ও মিডিয়া ওয়েবসাইট' },
    category: { en: 'Streaming & Gallery', bn: 'স্ট্রিম ও গ্যালারি' },
    shortDescription: {
      en: 'Video, audio streaming, or gallery website with fast media playback and dark UI.',
      bn: 'ভিডিও প্রিমিয়ার, অডিও প্লেলিস্ট, গ্যালারি ও সিনেমা রিভিউ এর হাই-স্পিড ওয়েবসাইট।'
    },
    detailedDescription: {
      en: 'Visually rich entertainment website featuring modern dark theme, video playlist embeds, audio players, media categorizations, and bookmarking.',
      bn: 'ভিডিও স্ট্রিমিং ক্যাটালগ, অডিও মিডিয়া প্লেয়ার, ফটো গ্যালারি ও এন্টারটেইনমেন্ট কন্টেন্টের প্রিমিয়াম ওয়েবসাইট।'
    },
    features: [
      {
        title: { en: 'Custom Player Integration', bn: 'কাস্টম ভিডিও/অডিও প্লেয়ার' },
        desc: { en: 'Smooth media player supporting YouTube, Vimeo, MP4, and MP3.', bn: 'দ্রুত বাফারিং ও ফ্লুইড মিডিয়া প্লে ব্যাক।' }
      },
      {
        title: { en: 'Watchlist & Bookmarks', bn: 'ওয়াচলিস্ট ও ফেভারিট' },
        desc: { en: 'Allow users to save items for viewing later.', bn: 'প্রিয় গান/ভিডিও বুকমার্ক করার সুবিধা।' }
      },
      {
        title: { en: 'Dark Luxury Aesthetic', bn: 'লাক্সারি ডার্ক মোড UI' },
        desc: { en: 'Designed for cinema-like experience on dark displays.', bn: 'চোখের স্বাচ্ছন্দ্যে সিনেমাটিক ডার্ক থিম।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Cloudinary / Firebase'],
    deliveryTime: { en: '4 - 8 Days', bn: '৪ - ৮ দিন' },
    startingPrice: { en: '৳18,000 / $180', bn: '১৮,০০০ টাকা / $১৮০' },
    ctaUrl: './contact.html?service=entertainment-website'
  },
  {
    id: 'landing-page',
    icon: 'fa-solid fa-grip',
    badge: { en: 'High Conversion', bn: 'হাই কনভার্সন' },
    title: { en: 'Landing Page', bn: 'ল্যান্ডিং পেজ' },
    category: { en: 'Sales & Marketing', bn: 'সেলস ও মার্কেটিং' },
    shortDescription: {
      en: 'Single-page high-converting product sales page or promotional marketing campaign.',
      bn: 'পণ্য বিক্রি, সার্ভিস অফার বা প্রমোশনাল ক্যাম্পেইনের জন্য সিঙ্গল পেজ ল্যান্ডিং সাইট।'
    },
    detailedDescription: {
      en: 'Designed with a single clear target in mind: MAXIMIZING CONVERSIONS. Perfect for single product sales, app promo downloads, event signups, or ad lead generation.',
      bn: 'ফেসবুক/গুগল এডসের মাধ্যমে পণ্য ও সেবা দ্রুত বিক্রির জন্য আকর্ষণীয় হেডলাইন, অফার টাইমার, প্রোডাক্ট ছবি ও এক-ক্লিকে অর্ডার ফর্ম সহ ল্যান্ডিং পেজ।'
    },
    features: [
      {
        title: { en: 'Countdown Offer Timer', bn: 'অফার কাউন্টডাউন টাইমার' },
        desc: { en: 'Create urgency for flash sales and limited discount offers.', bn: 'জরুরি অফার বোঝাতে লাইভ কাউন্টডাউন টাইমার।' }
      },
      {
        title: { en: 'Instant Order Form', bn: 'এক-ক্লিকে অর্ডার ফর্ম' },
        desc: { en: 'Minimal friction order form directly connected to WhatsApp or DB.', bn: 'কোনো ঝামেলা ছাড়াই সরাসরি অর্ডারের সুযোগ।' }
      },
      {
        title: { en: 'Customer Testimonials', bn: 'কাস্টমার রিভিউ ও প্রমাণ' },
        desc: { en: 'Social proof sections with ratings and screenshot carousel.', bn: 'ক্রেতাদের ভালো রিভিউ ও রেটিং প্রদর্শনের ব্যবস্থা।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Firebase / REST API'],
    deliveryTime: { en: '1 - 3 Days', bn: '১ - ৩ দিন' },
    startingPrice: { en: '৳6,000 / $60', bn: '৬,০০০ টাকা / $৬০' },
    ctaUrl: './contact.html?service=landing-page'
  },
  {
    id: 'government-ngo-website',
    icon: 'fa-solid fa-landmark',
    badge: { en: 'Institutional', bn: 'প্রাতিষ্ঠানিক' },
    title: { en: 'Government / NGO Website', bn: 'সরকারী / এনজিও ওয়েবসাইট' },
    category: { en: 'Public & Social Welfare', bn: 'জনকল্যাণ ও সামাজিক সংস্থা' },
    shortDescription: {
      en: 'Secure, accessible, and compliant official portal for non-profits, foundations, and public orgs.',
      bn: 'এনজিও, ক্লাব, ট্রাস্ট ও সামাজিক সংস্থার প্রাতিষ্ঠানিক তথ্য ও অনুদান প্ল্যাটফর্ম।'
    },
    detailedDescription: {
      en: 'Accessible, clean, and highly secure web portal for non-profit organizations, charities, clubs, and civic institutions with project showcases and online donation options.',
      bn: 'এনজিও, সমাজসেবামূলক প্রতিষ্ঠান বা ক্লাবের কাজ, রিপোর্ট, মেম্বার ডিরেক্টরি এবং অনুদান (Donation) সংগ্রহের জন্য স্বচ্ছ ও নিরাপদ ওয়েবসাইট।'
    },
    features: [
      {
        title: { en: 'Online Donation Integration', bn: 'অনলাইন অনুদান (Donation)' },
        desc: { en: 'Collect transparent charity contributions via local payment methods.', bn: 'অনলাইনে অনুদান বা সাহায্য গ্রহণের সুব্যবস্থা।' }
      },
      {
        title: { en: 'Projects & Impact Gallery', bn: 'কার্যক্রম ও প্রজেক্ট প্রদর্শনী' },
        desc: { en: 'Display active social causes, events, and outcome reports.', bn: 'এনজিওর চলমান প্রকল্প ও সফলতার ছবি।' }
      },
      {
        title: { en: 'PDF Document Library', bn: 'প্রকাশনা ও পিডিএফ লাইব্রেরি' },
        desc: { en: 'Public archive for audit reports, notices, and newsletters.', bn: 'অডিট রিপোর্ট ও বাৎসরিক নোটিশ ডাউনলোডের সুযোগ।' }
      }
    ],
    technologies: ['HTML5 / CSS3', 'Tailwind CSS', 'JavaScript ES6+', 'Firebase / Node.js'],
    deliveryTime: { en: '4 - 7 Days', bn: '৪ - ৭ দিন' },
    startingPrice: { en: '৳18,000 / $180', bn: '১৮,০০০ টাকা / $১৮০' },
    ctaUrl: './contact.html?service=government-ngo-website'
  },
  {
    id: 'ai-website-tools',
    icon: 'fa-solid fa-robot',
    badge: { en: 'Next-Gen', bn: 'নেক্সট-জেন' },
    title: { en: 'AI Website / Smart Tools', bn: 'এআই ওয়েবসাইট ও টুলস' },
    category: { en: 'Artificial Intelligence', bn: 'কৃত্রিম বুদ্ধিমত্তা' },
    shortDescription: {
      en: 'Web platform integrated with OpenAI ChatGPT, Gemini, or custom AI prompt generators.',
      bn: 'ওপেনএআই (ChatGPT), জেমিনি বা কাস্টম এআই প্রম্পট চালিত আধুনিক ওয়েব অ্যাপ্লিকেশন।'
    },
    detailedDescription: {
      en: 'Bring cutting-edge Artificial Intelligence capabilities into your web app. Automated text generation, smart chatbots, AI image tools, and automated content translation.',
      bn: 'আপনার ওয়েবসাইটে স্মার্ট এআই চ্যাটবট, কন্টেন্ট রাইটিং এআই টুল, ছবি তৈরি বা বাংলা-ইংরেজি অটোমেটিক অনুবাদ সলিউশন সংযুক্তকরণ।'
    },
    features: [
      {
        title: { en: 'OpenAI / Gemini API Integration', bn: 'ওপেনএআই ও জেমিনি এপিআই' },
        desc: { en: 'Seamless connection to GPT-4o, Gemini, or Claude models.', bn: 'সর্বাধুনিক এআই মডেলগুলোর সাথে সরাসরি এপিআই কানেকশন।' }
      },
      {
        title: { en: 'Custom Prompt Templates', bn: 'কাস্টম এআই প্রম্পট টেমপ্লেট' },
        desc: { en: 'Pre-designed workflows for copywriting, coding, or academic study.', bn: 'লিখালিখি, কোডিং কিংবা স্টাডির জন্য তৈরি প্রম্পট টেমপ্লেট।' }
      },
      {
        title: { en: 'Token Usage & Credit System', bn: 'টোকেন ও ক্রেডিট লিমিট' },
        desc: { en: 'Control API usage with user credits and subscription plans.', bn: 'ইউজার প্রতি ডেইলি ক্রেডিট বা ব্যবহার নিয়ন্ত্রণ।' }
      }
    ],
    technologies: ['React / JS ES6+', 'Tailwind CSS', 'OpenAI API / Gemini SDK', 'Node.js / Firebase'],
    deliveryTime: { en: '5 - 10 Days', bn: '৫ - ১০ দিন' },
    startingPrice: { en: '৳25,000 / $250', bn: '২৫,০০০ টাকা / $২৫০' },
    ctaUrl: './contact.html?service=ai-website-tools'
  },
  {
    id: 'others-custom-project',
    icon: 'fa-solid fa-circle-question',
    badge: { en: 'Tailored', bn: 'কাস্টম সমাধান' },
    title: { en: 'Others (Custom Project)', bn: 'অন্যান্য (কাস্টম প্রজেক্ট)' },
    category: { en: 'Custom Engineering', bn: 'কাস্টম ইঞ্জিনিয়ারিং' },
    shortDescription: {
      en: 'Bespoke web applications, custom API integrations, or unique digital idea implementation.',
      bn: 'আপনার যেকোনো স্বতন্ত্র আইডিয়া, অনন্য কাস্টম ওয়েব অ্যাপ বা এপিআই তৈরির বিশেষ সেবা।'
    },
    detailedDescription: {
      en: 'Have an innovative startup concept or non-standard requirement? We design and architect custom software built precisely according to your specification.',
      bn: 'আপনার কাছে কোনো আনকমন বা স্পেশাল বিজনেস আইডিয়া আছে? আমরা আপনার নিজস্ব চাহিদানুযায়ী পরিচ্ছন্ন কোড দিয়ে পছন্দসই প্ল্যাটফর্ম তৈরি করে দেব।'
    },
    features: [
      {
        title: { en: '100% Customized Architecture', bn: '১০০% কাস্টম আর্কিটেকচার' },
        desc: { en: 'No strict templates—everything coded for your target workflow.', bn: 'কোনো ধরাবাঁধা নিয়ম নয়—আপনার চাহিদামত অনন্য সিস্টেম।' }
      },
      {
        title: { en: 'Scalable Cloud Setup', bn: 'স্কেলেবল ক্লাউড আর্কিটেকচার' },
        desc: { en: 'Built to accommodate future expansion and massive user base.', bn: 'ভবিষ্যতে ইউজার বাড়লেও গতি বজায় রাখার প্রযুক্তি।' }
      },
      {
        title: { en: 'Free Consultation', bn: 'ফ্রি টেকনিক্যাল পরামর্শ' },
        desc: { en: 'Expert advice on architecture, budget, and deployment strategy.', bn: 'প্রজেক্ট প্ল্যানিং, প্রযুক্তি নির্বাচন ও বাজেটের বিনামূল্যের গাইডলাইন।' }
      }
    ],
    technologies: ['Custom Web Stack', 'Tailwind / Bootstrap', 'JavaScript / Node.js', 'Firebase / SQL'],
    deliveryTime: { en: 'Custom Schedule', bn: 'আলোচনা সাপেক্ষে' },
    startingPrice: { en: 'Negotiable', bn: 'আলোচনা সাপেক্ষে' },
    ctaUrl: './contact.html?service=others-custom-project'
  }
];
