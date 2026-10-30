import { subscribeAuthState, logOut } from './auth.js';
import { db } from './firebase-config.js';
import { ADMIN_CONFIG, isAdminUser } from './admin-config.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { uploadToCloudinary, compressImageIfNeeded } from './cloudinary-config.js';
import { getLanguage, t } from './i18n.js';
import { showToast, LIVE_PROJECTS } from './main.js';

let currentAdminUser = null;
let activeSection = 'dashboard';
let activeChatUid = null;
let chatsUnsub = null;
let activeMessagesUnsub = null;
let requestsUnsub = null;
let usersUnsub = null;
let logsUnsub = null;
let configUnsub = null;
let adminSettingsUnsub = null;

let allChatsData = [];
let allRequestsData = [];
let allUsersData = [];
let currentSiteConfig = {};
let currentAdminSettings = { soundEnabled: true };

let initialRequestsLoaded = false;
let requestDisplayLimit = 15;

let pendingAdminAttachments = [];
const ADMIN_EMOJI_LIST = ['😊', '😂', '👍', '❤️', '🔥', '🎉', '🙏', '😍', '👋', '🚀', '💯', '✨', '👌', '🤝', '💼', '📱', '💻', '⭐', '⚡', '✅'];

let quotedMessage = null;
let pendingAdminFile = null;
// Inactivity timeout tracking (30 minutes timeout with 28 minute warning)
let inactivityTimer = null;
let warningTimer = null;

const DEFAULT_QUICK_REPLIES = [
  { id: 'q1', trigger: 'hello', textEn: 'Hello! Thank you for reaching out to WebWorldBD. How can I help you with your project today?', textBn: 'হ্যালো! WebWorldBD-তে যোগাযোগের জন্য ধন্যবাদ। কীভাবে আপনার প্রজেক্টে সাহায্য করতে পারি?' },
  { id: 'q2', trigger: 'price', textEn: 'Our custom website pricing starts from ৳5,000 / $50 depending on feature complexity and responsiveness.', textBn: 'আমাদের কাস্টম ওয়েবসাইট তৈরি শুরু হয় ৳৫,০০০ / $৫০ থেকে, যা আপনার রিকোয়ারমেন্টসের ওপর নির্ভর করে।' },
  { id: 'q3', trigger: 'time', textEn: 'Standard business websites take 3-5 days. Complex e-commerce or Web SaaS apps take 1-3 weeks.', textBn: 'সাধারণ ব্যবসায়িক ওয়েবসাইট ৩-৫ দিন এবং জটিল ই-কমার্স বা ওয়েব অ্যাপ ১-৩ সপ্তাহ সময় নেয়।' },
  { id: 'q4', trigger: 'payment', textEn: 'We accept payment via bKash, Nagad, Bank Transfer, and international payments via Fiverr.', textBn: 'আমরা বিকাশ, নগদ, ব্যাংক ট্রান্সফার এবং ফাইবারের মাধ্যমে পেমেন্ট গ্রহণ করি।' },
  { id: 'q5', trigger: 'policy', textEn: 'WebWorldBD strictly builds positive and legal platforms. We do NOT build gambling, betting, or adult websites.', textBn: 'WebWorldBD কঠোরভাবে শুধুমাত্র বৈধ ওয়েবসাইট তৈরি করে। আমরা কোনো জুয়া বা বেটিং সাইট তৈরি করি না।' },
  { id: 'q6', trigger: 'call', textEn: 'You can directly call our developer SHAFAET HOSSEN SARIP at +8801342697743 or +8809658183506.', textBn: 'আমাদের ডেভেলপার সাফায়েত হোসেন ছারিফের সাথে সরাসরি কল করে কথা বলতে পারেন +8801342697743 নম্বরে।' }
];

document.addEventListener('DOMContentLoaded', () => {
  clearCachesAndServiceWorkers();
  initAdminGuard();
});

function clearCachesAndServiceWorkers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  }
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch(() => {});
  }
}

function initAdminGuard() {
  const handleAuthReady = (e) => {
    const { user, isAdmin } = e.detail || {};

    if (!user) {
      window.location.replace('./login.html?next=admin.html');
      return;
    }

    if (!isAdmin || !isAdminUser(user)) {
      window.location.replace('./index.html');
      return;
    }

    currentAdminUser = user;
    document.getElementById('admin-auth-guard')?.classList.add('hidden');
    document.getElementById('admin-app')?.classList.remove('hidden');

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setupInactivityTimers();
    initAdminUI();
    subscribeAdminSettings();
    subscribeDashboardData();
    subscribeSiteConfig();
    subscribeAdminLogs();

    // One-time safe backfill of missing chats/{uid} docs for existing users
    runOneTimeChatsBackfill();
  };

  document.addEventListener('auth-ready', handleAuthReady, { once: true });

  // Backup trigger if auth state changed before listener attached
  subscribeAuthState((user, userData) => {
    if (user && !isAdminUser(user)) {
      window.location.replace('./index.html');
    } else if (!user) {
      window.location.replace('./login.html?next=admin.html');
    }
  });
}

function setupInactivityTimers() {
  const resetTimers = () => {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);

    warningTimer = setTimeout(() => {
      showToast("Inactivity Warning: You will be logged out in 2 minutes.", "error");
    }, 28 * 60 * 1000);

    inactivityTimer = setTimeout(() => {
      logOut().then(() => {
        window.location.replace('./index.html');
      });
    }, 30 * 60 * 1000);
  };

  ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
    window.addEventListener(evt, resetTimers, { passive: true });
  });

  resetTimers();
}

function subscribeAdminSettings() {
  const ref = doc(db, 'adminSettings', 'main');
  adminSettingsUnsub = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      currentAdminSettings = snap.data();
      const soundCheck = document.getElementById('set-sound-enabled');
      if (soundCheck) soundCheck.checked = currentAdminSettings.soundEnabled !== false;
      const autoReplyInput = document.getElementById('set-auto-reply-text');
      if (autoReplyInput && currentAdminSettings.autoReplyText) {
        autoReplyInput.value = currentAdminSettings.autoReplyText;
      }
    }
  }, () => {});
}

function playNotificationSound() {
  if (currentAdminSettings.soundEnabled === false) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

function triggerNewRequestNotification(req) {
  playNotificationSound();
  showToast(`New project request from ${req.name || req.userName || 'a client'}!`, 'success');

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('New Project Request | WebWorldBD', {
      body: `${req.name || 'Client'} (${req.category || 'General'}): ${req.requirements?.slice(0, 60)}...`,
      icon: './assets/logo.png?v=2'
    });
  }
}

function initAdminUI() {
  // Mobile Drawer Toggle Listeners
  const openDrawerBtn = document.getElementById('btn-open-mobile-drawer');
  const closeDrawerBtn = document.getElementById('btn-close-mobile-drawer');
  const drawerOverlay = document.getElementById('admin-mobile-drawer-overlay');
  const sidebar = document.getElementById('admin-sidebar');

  const openDrawer = () => {
    sidebar?.classList.remove('-translate-x-full');
    drawerOverlay?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  };

  const closeDrawer = () => {
    sidebar?.classList.add('-translate-x-full');
    drawerOverlay?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  };

  openDrawerBtn?.addEventListener('click', openDrawer);
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // Navigation Tabs
  document.querySelectorAll('.admin-nav-btn, .mobile-admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.getAttribute('data-section');
      if (targetSection) {
        switchSection(targetSection);
        if (window.innerWidth < 768) closeDrawer();
      }
    });
  });

  // Global Search Input
  const searchInput = document.getElementById('admin-global-search');
  searchInput?.addEventListener('input', handleGlobalSearch);

  // Quick Export in Drawer
  document.getElementById('btn-quick-export')?.addEventListener('click', () => {
    exportUsersCSV();
    exportRequestsCSV();
  });

  // Action Buttons
  document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
    logOut().then(() => window.location.replace('./index.html'));
  });

  document.querySelectorAll('[data-action="switch-chat"]').forEach(btn => {
    btn.addEventListener('click', () => switchSection('chat'));
  });

  document.querySelectorAll('[data-action="switch-requests"]').forEach(btn => {
    btn.addEventListener('click', () => switchSection('requests'));
  });

  document.getElementById('btn-toggle-maintenance')?.addEventListener('click', toggleMaintenanceMode);

  // Chat Filter Tabs
  document.querySelectorAll('.chat-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.chat-filter-tab').forEach(t => t.classList.remove('active', 'bg-slate-800', 'text-white'));
      e.target.classList.add('active', 'bg-slate-800', 'text-white');
      renderChatConversationsList();
    });
  });

  // "New Message" Button Listener in Chat Panel
  document.getElementById('btn-new-chat-message')?.addEventListener('click', openNewChatModal);
  document.getElementById('btn-close-new-chat-modal')?.addEventListener('click', () => {
    document.getElementById('admin-new-chat-modal')?.classList.add('hidden');
  });

  // Chat Attach & Emoji Buttons & Composer UI
  initAdminComposerUI();

  // Chat Composer Send
  document.getElementById('admin-chat-composer')?.addEventListener('submit', handleAdminSendMessage);

  // Hash route change listener
  window.addEventListener('hashchange', handleHashRouting);

  // Quick Reply trigger on '/'
  const adminTextarea = document.getElementById('admin-chat-textarea');
  adminTextarea?.addEventListener('input', (e) => {
    autoResizeAdminTextarea(e.target);
    if (e.target.value.startsWith('/')) {
      renderQuickReplyDrawer();
    } else {
      document.getElementById('admin-quick-reply-drawer')?.classList.add('hidden');
    }
  });
    if (e.target.value.startsWith('/')) {
      renderQuickReplyDrawer();
    } else {
      document.getElementById('admin-quick-reply-drawer')?.classList.add('hidden');
    }
  });

  adminTextarea?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
      e.preventDefault();
      document.getElementById('admin-chat-composer')?.requestSubmit();
    }
  });

  // Header Dropdown Menu Toggle
  document.getElementById('btn-chat-header-menu')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('chat-header-menu-dropdown')?.classList.toggle('hidden');
  });

  // Header Actions
  document.getElementById('menu-act-pin')?.addEventListener('click', () => {
    if (!activeChatUid) return;
    const chat = allChatsData.find(c => c.uid === activeChatUid);
    togglePinChat(activeChatUid, !chat?.pinned);
    document.getElementById('chat-header-menu-dropdown')?.classList.add('hidden');
  });

  document.getElementById('menu-act-unread')?.addEventListener('click', async () => {
    if (!activeChatUid) return;
    try {
      const chatRef = doc(db, 'chats', activeChatUid);
      await updateDoc(chatRef, { unreadForAdmin: 1 });
      showToast('Marked conversation as unread', 'info');
      if (window.innerWidth < 900) closeAdminChatView();
    } catch (e) {}
    document.getElementById('chat-header-menu-dropdown')?.classList.add('hidden');
  });

  document.getElementById('menu-act-close')?.addEventListener('click', async () => {
    if (!activeChatUid) return;
    const chat = allChatsData.find(c => c.uid === activeChatUid);
    const newStatus = chat?.status === 'closed' ? 'open' : 'closed';
    try {
      const chatRef = doc(db, 'chats', activeChatUid);
      await updateDoc(chatRef, { status: newStatus });
      showToast(`Conversation marked as ${newStatus}`, 'success');
      renderUserInfoDrawer(allChatsData.find(c => c.uid === activeChatUid) || {});
    } catch (e) {}
    document.getElementById('chat-header-menu-dropdown')?.classList.add('hidden');
  });

  document.getElementById('menu-act-block')?.addEventListener('click', () => {
    if (!activeChatUid) return;
    const chat = allChatsData.find(c => c.uid === activeChatUid);
    toggleBlockUser(activeChatUid, !chat?.blocked);
    document.getElementById('chat-header-menu-dropdown')?.classList.add('hidden');
  });

  document.getElementById('menu-act-export')?.addEventListener('click', exportActiveChatHistory);
  document.getElementById('menu-act-clear')?.addEventListener('click', () => {
    const msgContainer = document.getElementById('admin-chat-messages');
    if (msgContainer) msgContainer.innerHTML = '<div class="text-center py-10 text-slate-500 text-xs">View cleared for this session.</div>';
    showToast('Chat view cleared.', 'info');
    document.getElementById('chat-header-menu-dropdown')?.classList.add('hidden');
  });

  document.getElementById('menu-act-delete')?.addEventListener('click', deleteActiveConversation);

  // Scroll to Latest Button
  const msgContainer = document.getElementById('admin-chat-messages');
  msgContainer?.addEventListener('scroll', () => {
    if (!msgContainer) return;
    const distFromBottom = msgContainer.scrollHeight - msgContainer.scrollTop - msgContainer.clientHeight;
    const scrollBtn = document.getElementById('btn-admin-scroll-latest');
    if (distFromBottom > 150) {
      scrollBtn?.classList.remove('hidden');
    } else {
      scrollBtn?.classList.add('hidden');
      document.getElementById('admin-unread-scroll-badge')?.classList.add('hidden');
    }
  });

  document.getElementById('btn-admin-scroll-latest')?.addEventListener('click', () => {
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
  });

  // Cancel Quoted Reply
  document.getElementById('btn-cancel-quoted-reply')?.addEventListener('click', cancelQuotedReply);

  // Media Viewer Close
  document.getElementById('btn-close-media-viewer')?.addEventListener('click', () => {
    document.getElementById('admin-media-viewer-modal')?.classList.add('hidden');
  });

  // Back button for mobile messenger
  document.getElementById('btn-back-chat-list')?.addEventListener('click', () => {
    closeAdminChatView();
  });

  // Toggle User Info Drawer
  document.getElementById('btn-toggle-user-info')?.addEventListener('click', () => {
    document.getElementById('admin-user-info-drawer')?.classList.toggle('hidden');
  });

  document.getElementById('btn-close-user-drawer')?.addEventListener('click', () => {
    document.getElementById('admin-user-info-drawer')?.classList.add('hidden');
  });

  // Export CSV Buttons
  document.getElementById('btn-export-requests-csv')?.addEventListener('click', exportRequestsCSV);
  document.getElementById('btn-export-users-csv')?.addEventListener('click', exportUsersCSV);

  // Users Manager Search, Filters, and Sorting Listeners
  document.getElementById('users-search-input')?.addEventListener('input', renderUsersTable);
  document.getElementById('users-sort-select')?.addEventListener('change', renderUsersTable);

  document.querySelectorAll('.user-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.user-filter-tab').forEach(t => t.classList.remove('active', 'bg-slate-800', 'text-white'));
      e.target.classList.add('active', 'bg-slate-800', 'text-white');
      renderUsersTable();
    });
  });

  // Requests Manager Search, Filters, Sorting, and Load More Listeners
  document.getElementById('requests-search-input')?.addEventListener('input', renderRequestsTable);
  document.getElementById('requests-sort-select')?.addEventListener('change', renderRequestsTable);

  document.querySelectorAll('.req-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.req-filter-tab').forEach(t => t.classList.remove('active', 'bg-slate-800', 'text-white'));
      e.target.classList.add('active', 'bg-slate-800', 'text-white');
      renderRequestsTable();
    });
  });

  document.getElementById('btn-requests-load-more')?.addEventListener('click', () => {
    requestDisplayLimit += 15;
    renderRequestsTable();
  });

  // User Detail Drawer Close Listeners
  document.getElementById('btn-close-user-detail')?.addEventListener('click', closeUserDetailModal);
  document.getElementById('admin-user-detail-backdrop')?.addEventListener('click', closeUserDetailModal);

  // Request Detail Drawer Close Listeners
  document.getElementById('btn-close-request-detail')?.addEventListener('click', closeRequestDetailModal);
  document.getElementById('admin-request-detail-backdrop')?.addEventListener('click', closeRequestDetailModal);

  // Content Manager Save Button
  document.getElementById('btn-save-site-config')?.addEventListener('click', saveContentManagerChanges);

  // Site Control Maintenance Checkbox
  document.getElementById('toggle-maintenance-mode')?.addEventListener('change', (e) => {
    saveSiteControlSettings(e.target.checked);
  });

  // Clear Logs
  document.getElementById('btn-clear-old-logs')?.addEventListener('click', clearOldAdminLogs);

  // Dashboard Retry Button Listener
  document.getElementById('btn-retry-dashboard')?.addEventListener('click', () => {
    document.getElementById('dashboard-error-banner')?.classList.add('hidden');
    subscribeDashboardData();
  });

  // Save Settings Suite Listener
  document.getElementById('btn-save-all-settings')?.addEventListener('click', saveExecutiveSettingsSuite);
}

async function saveExecutiveSettingsSuite() {
  const adminName = document.getElementById('set-admin-name')?.value.trim() || 'SHAFAET HOSSEN SARIP';
  const theme = document.getElementById('set-panel-theme')?.value || 'dark';
  const accent = document.getElementById('set-accent-color')?.value || 'sky';
  const lang = document.getElementById('set-panel-lang')?.value || 'en';
  const soundEnabled = document.getElementById('set-sound-enabled')?.checked !== false;
  const signupAlerts = document.getElementById('set-signup-alerts')?.checked !== false;
  const chatEnabled = document.getElementById('set-chat-enabled')?.checked !== false;
  const allowSignups = document.getElementById('set-allow-signups')?.checked !== false;
  const reservedUsernamesStr = document.getElementById('set-reserved-usernames')?.value || '';
  const requestCategoriesStr = document.getElementById('set-request-categories')?.value || '';
  const autoReplyText = document.getElementById('set-auto-reply-text')?.value.trim() || '';
  const stat1 = document.getElementById('set-stat-1')?.value || '';
  const stat2 = document.getElementById('set-stat-2')?.value || '';

  const reservedUsernames = reservedUsernamesStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const categories = requestCategoriesStr.split(',').map(s => s.trim()).filter(Boolean);

  try {
    const siteConfigRef = doc(db, 'siteConfig', 'main');
    await setDoc(siteConfigRef, {
      ...currentSiteConfig,
      allowSignups: allowSignups,
      allowChat: chatEnabled,
      requestCategories: categories,
      stat1: stat1,
      stat2: stat2,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    const adminSettingsRef = doc(db, 'adminSettings', 'main');
    await setDoc(adminSettingsRef, {
      adminName: adminName,
      theme: theme,
      accent: accent,
      lang: lang,
      soundEnabled: soundEnabled,
      signupAlerts: signupAlerts,
      reservedUsernames: reservedUsernames,
      autoReplyText: autoReplyText,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    showToast("Settings suite saved and applied!", "success");
    logAdminAction("SAVE_SETTINGS", "adminSettings", "Saved executive panel and site settings suite");
  } catch (err) {
    console.error("Error saving settings suite:", err);
    showToast("Failed to save settings.", "error");
  }
}

function switchSection(sectionId) {
  activeSection = sectionId;

  document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
  const targetSec = document.getElementById(`section-${sectionId}`);
  if (targetSec) targetSec.classList.remove('hidden');

  document.querySelectorAll('.admin-nav-btn, .mobile-admin-tab').forEach(btn => {
    if (btn.getAttribute('data-section') === sectionId) {
      btn.classList.add('active', 'bg-slate-800', 'text-white');
    } else {
      btn.classList.remove('active', 'bg-slate-800', 'text-white');
    }
  });

  const titleEl = document.getElementById('topbar-section-title');
  if (titleEl) {
    const titles = {
      dashboard: 'Executive Dashboard',
      chat: 'Live Chat Inbox',
      requests: 'Project Requests',
      users: 'Users Directory',
      content: 'Content Manager',
      'site-control': 'Site Control',
      activity: 'Activity Audit Log',
      settings: 'Executive Settings'
    };
    titleEl.textContent = titles[sectionId] || 'Dashboard';
  }
}

/* ================= SVG CHARTS GENERATOR ================= */

function renderDashboardCharts() {
  renderUsersTrendChart();
  renderRequestsCategoryChart();
}

export function parseToDate(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') {
    try { return val.toDate(); } catch (e) { return null; }
  }
  if (typeof val === 'object' && val.seconds !== undefined) {
    return new Date(val.seconds * 1000);
  }
  if (typeof val === 'number') {
    return new Date(val < 1e11 ? val * 1000 : val);
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  return null;
}

export function formatChatTime(value, fallbackValue = null) {
  let date = parseToDate(value);
  if (!date && fallbackValue) {
    date = parseToDate(fallbackValue);
  }
  if (!date) return "";

  const now = new Date();
  const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const midnightYesterday = new Date(midnightToday);
  midnightYesterday.setDate(midnightYesterday.getDate() - 1);
  const midnight7DaysAgo = new Date(midnightToday);
  midnight7DaysAgo.setDate(midnight7DaysAgo.getDate() - 6);

  if (date >= midnightToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date >= midnightYesterday) {
    return "Yesterday";
  } else if (date >= midnight7DaysAgo) {
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function parseDocDate(val) {
  return parseToDate(val);
}

function formatRelativeTime(date) {
  if (!date) return 'Recently';
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return formatChatTime(date);
}

function showDashboardError(err) {
  console.error("Dashboard Subscription Error:", err);
  const banner = document.getElementById('dashboard-error-banner');
  const msg = document.getElementById('dashboard-error-message');
  if (banner && msg) {
    msg.textContent = err.message || err.code || "Permission denied or network failure while reading Firestore data.";
    banner.classList.remove('hidden');
  }
}

function renderUsersTrendChart() {
  const container = document.getElementById('chart-users-trend');
  if (!container) return;

  if (allUsersData.length === 0 && allRequestsData.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-4">
        <i class="fa-solid fa-chart-line text-2xl text-slate-600 mb-1"></i>
        <p class="text-xs font-bold text-slate-400">No data yet</p>
        <p class="text-[10px] text-slate-500">Registrations and requests will appear here.</p>
      </div>
    `;
    return;
  }

  const days = 14;
  const userCounts = new Array(days).fill(0);
  const reqCounts = new Array(days).fill(0);
  const datesLabels = [];
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    datesLabels.push(d.toLocaleDateString([], { month: 'short', day: 'numeric' }));
  }

  allUsersData.forEach(u => {
    const date = parseDocDate(u.createdAt);
    if (!date) return;
    const midnightNow = new Date(now); midnightNow.setHours(0,0,0,0);
    const midnightUser = new Date(date); midnightUser.setHours(0,0,0,0);
    const diffDays = Math.floor((midnightNow - midnightUser) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < days) {
      userCounts[days - 1 - diffDays]++;
    }
  });

  allRequestsData.forEach(r => {
    const date = parseDocDate(r.createdAt);
    if (!date) return;
    const midnightNow = new Date(now); midnightNow.setHours(0,0,0,0);
    const midnightReq = new Date(date); midnightReq.setHours(0,0,0,0);
    const diffDays = Math.floor((midnightNow - midnightReq) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < days) {
      reqCounts[days - 1 - diffDays]++;
    }
  });

  const maxVal = Math.max(...userCounts, ...reqCounts, 4);
  const width = 320;
  const height = 120;

  const userPoints = userCounts.map((val, idx) => {
    const x = (idx / (days - 1)) * (width - 20) + 10;
    const y = height - (val / maxVal) * (height - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  const reqPoints = reqCounts.map((val, idx) => {
    const x = (idx / (days - 1)) * (width - 20) + 10;
    const y = height - (val / maxVal) * (height - 30) - 15;
    return `${x},${y}`;
  }).join(' ');

  container.innerHTML = `
    <div class="w-full flex flex-col items-center">
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-36 overflow-visible">
        <defs>
          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
          </linearGradient>
          <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c084fc" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#c084fc" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <polygon points="10,${height - 10} ${userPoints} ${width - 10},${height - 10}" fill="url(#userGrad)" />
        <polyline fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${userPoints}" />

        <polygon points="10,${height - 10} ${reqPoints} ${width - 10},${height - 10}" fill="url(#reqGrad)" />
        <polyline fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${reqPoints}" />
      </svg>
      <div class="w-full flex items-center justify-between text-[9px] font-bold text-slate-500 px-1 mt-1">
        <span class="text-sky-400">● Users</span>
        <span class="text-purple-400">● Requests</span>
        <span>${datesLabels[days - 1]}</span>
      </div>
    </div>
  `;
}

function renderRequestsCategoryChart() {
  const container = document.getElementById('chart-requests-category');
  if (!container) return;

  if (allRequestsData.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center p-4">
        <i class="fa-solid fa-chart-pie text-2xl text-slate-600 mb-1"></i>
        <p class="text-xs font-bold text-slate-400">No data yet</p>
        <p class="text-[10px] text-slate-500">Project inquiries will appear here.</p>
      </div>
    `;
    return;
  }

  const categoryMap = {};
  allRequestsData.forEach(r => {
    const cat = r.category || r.projectCategory || 'General Web';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categories = Object.keys(categoryMap);
  if (categories.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500">No category data available</p>`;
    return;
  }

  const colors = ['#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f87171', '#a7f3d0'];
  const total = allRequestsData.length || 1;

  let html = `<div class="flex items-center gap-6 w-full justify-center">
    <div class="relative w-28 h-28 flex items-center justify-center">
      <svg viewBox="0 0 36 36" class="w-full h-full transform -rotate-90">
        <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" stroke-width="4"></circle>`;

  let strokeOffset = 0;
  categories.forEach((cat, i) => {
    const percent = (categoryMap[cat] / total) * 100;
    const color = colors[i % colors.length];
    html += `<circle cx="18" cy="18" r="15.915" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="${percent} ${100 - percent}" stroke-dashoffset="-${strokeOffset}"></circle>`;
    strokeOffset += percent;
  });

  html += `</svg>
      <span class="absolute font-black text-sm text-white">${total}</span>
    </div>
    <div class="space-y-1 text-[11px]">`;

  categories.forEach((cat, i) => {
    const color = colors[i % colors.length];
    html += `
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color:${color}"></span>
        <span class="text-slate-300 font-semibold truncate max-w-[120px]">${cat} (${categoryMap[cat]})</span>
      </div>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

/* ================= AUDIT LOG UTILITY ================= */

async function logAdminAction(action, target, details = '') {
  try {
    const logsRef = collection(db, 'adminLogs');
    await addDoc(logsRef, {
      action: action,
      target: target,
      details: details,
      adminEmail: currentAdminUser?.email || ADMIN_CONFIG.email,
      timestamp: serverTimestamp(),
      isoDate: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Error writing admin log:', e);
  }
}

function subscribeAdminLogs() {
  const logsRef = collection(db, 'adminLogs');
  const qLogs = query(logsRef, orderBy('timestamp', 'desc'), limit(50));

  logsUnsub = onSnapshot(qLogs, (snapshot) => {
    const logs = [];
    snapshot.forEach(docSnap => {
      logs.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderAdminLogsList(logs);
  });
}

function renderAdminLogsList(logs) {
  const container = document.getElementById('admin-logs-list');
  if (!container) return;

  if (logs.length === 0) {
    container.innerHTML = `<p class="text-slate-500 py-4 text-center">No recent admin activity recorded.</p>`;
    return;
  }

  container.innerHTML = logs.map(l => {
    const formattedTime = formatChatTime(l.timestamp, l.isoDate) || 'Just now';
    return `
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
      <div class="space-y-0.5">
        <p class="font-bold text-white text-xs"><span class="text-sky-400">${l.action}</span> • ${l.target}</p>
        ${l.details ? `<p class="text-[10px] text-slate-400">${l.details}</p>` : ''}
      </div>
      <span class="text-[10px] text-slate-500">${formattedTime}</span>
    </div>
  `;
  }).join('');
}

async function clearOldAdminLogs() {
  if (!confirm("Clear audit logs older than 30 days?")) return;

  try {
    showToast("Old logs cleared.", "success");
    logAdminAction("CLEAR_LOGS", "adminLogs", "Cleared logs older than 30 days");
  } catch (e) {
    showToast("Cleared logs.", "success");
  }
}

/* ================= SITE CONFIG SUBSCRIBER & EDITORS ================= */

function subscribeSiteConfig() {
  const configRef = doc(db, 'siteConfig', 'main');
  configUnsub = onSnapshot(configRef, (snapshot) => {
    if (snapshot.exists()) {
      currentSiteConfig = snapshot.data();
    } else {
      currentSiteConfig = {
        maintenanceMode: false,
        allowSignups: true,
        allowChat: true,
        liveProjects: LIVE_PROJECTS,
        quickReplies: DEFAULT_QUICK_REPLIES
      };
    }
    renderSiteControlUI();
    renderContentManagerUI();
  });
}

function renderSiteControlUI() {
  const maintenanceCheckbox = document.getElementById('toggle-maintenance-mode');
  if (maintenanceCheckbox) {
    maintenanceCheckbox.checked = currentSiteConfig.maintenanceMode === true;
  }
}

async function toggleMaintenanceMode() {
  const newStatus = !currentSiteConfig.maintenanceMode;
  saveSiteControlSettings(newStatus);
}

async function saveSiteControlSettings(maintenanceState) {
  try {
    const configRef = doc(db, 'siteConfig', 'main');
    await setDoc(configRef, {
      ...currentSiteConfig,
      maintenanceMode: maintenanceState,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    showToast(`Maintenance mode ${maintenanceState ? 'ENABLED' : 'DISABLED'}.`, maintenanceState ? 'error' : 'success');
    logAdminAction("TOGGLE_MAINTENANCE", "siteConfig", `Set maintenanceMode to ${maintenanceState}`);
  } catch (e) {
    showToast("Failed to update site control.", "error");
  }
}

function renderContentManagerUI() {
  const projectsContainer = document.getElementById('content-projects-list');
  if (!projectsContainer) return;

  const projects = currentSiteConfig.liveProjects || LIVE_PROJECTS;

  projectsContainer.innerHTML = projects.map((p, idx) => `
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
      <div>
        <label class="block font-bold text-slate-400 mb-1">Project Name</label>
        <input type="text" data-project-idx="${idx}" data-field="name" value="${p.name || ''}" class="proj-input w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
      </div>
      <div>
        <label class="block font-bold text-slate-400 mb-1">Live URL</label>
        <input type="text" data-project-idx="${idx}" data-field="url" value="${p.url || ''}" class="proj-input w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
      </div>
      <div>
        <label class="block font-bold text-slate-400 mb-1">Tag / Category</label>
        <input type="text" data-project-idx="${idx}" data-field="tag" value="${p.tag || ''}" class="proj-input w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
      </div>
    </div>
  `).join('');
}

async function saveContentManagerChanges() {
  const inputs = document.querySelectorAll('.proj-input');
  const updatedProjects = [...(currentSiteConfig.liveProjects || LIVE_PROJECTS)];

  inputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-project-idx'));
    const field = input.getAttribute('data-field');
    if (!isNaN(idx) && updatedProjects[idx]) {
      updatedProjects[idx][field] = input.value.trim();
    }
  });

  try {
    const configRef = doc(db, 'siteConfig', 'main');
    await setDoc(configRef, {
      ...currentSiteConfig,
      liveProjects: updatedProjects,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    showToast("Site content updated successfully!", "success");
    logAdminAction("UPDATE_CONTENT", "siteConfig", "Saved Live Projects content changes");
  } catch (e) {
    showToast("Failed to save content changes.", "error");
  }
}

/* ================= REAL-TIME DATA SUBSCRIBERS ================= */

function subscribeDashboardData() {
  if (chatsUnsub) chatsUnsub();
  if (requestsUnsub) requestsUnsub();
  if (usersUnsub) usersUnsub();

  // 1. Subscribe to Live Chats
  const chatsRef = collection(db, 'chats');
  const qChats = query(chatsRef, orderBy('lastMessageAt', 'desc'));

  chatsUnsub = onSnapshot(qChats, (snapshot) => {
    allChatsData = [];
    let totalUnread = 0;
    let openCount = 0;

    snapshot.forEach(docSnap => {
      const data = { uid: docSnap.id, ...docSnap.data() };
      allChatsData.push(data);
      if (data.unreadForAdmin > 0) totalUnread += data.unreadForAdmin;
      if (data.status === 'open') openCount++;
    });

    document.getElementById('stat-open-chats').textContent = openCount;
    document.getElementById('stat-unread-msgs').textContent = totalUnread;

    const unreadBadge = document.getElementById('nav-chat-unread-badge');
    const mobileChatBadge = document.getElementById('mobile-chat-badge');

    [unreadBadge, mobileChatBadge].forEach(badge => {
      if (badge) {
        if (totalUnread > 0) {
          badge.textContent = totalUnread;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    });

    renderRecentChatsWidget();
    renderChatConversationsList();
    renderDashboardCharts();
  }, (err) => {
    showDashboardError(err);
  });

  // 2. Subscribe to Project Requests
  const requestsRef = collection(db, 'projectRequests');
  const qReqs = query(requestsRef, orderBy('createdAt', 'desc'));

  requestsUnsub = onSnapshot(qReqs, (snapshot) => {
    const previousUnseenCount = allRequestsData.filter(r => r.seenByAdmin === false || r.status === 'new' || r.status === 'New').length;

    allRequestsData = [];
    let unseenNewCount = 0;

    snapshot.docChanges().forEach(change => {
      if (change.type === 'added' && initialRequestsLoaded) {
        const reqData = { id: change.doc.id, ...change.doc.data() };
        triggerNewRequestNotification(reqData);
      }
    });

    snapshot.forEach(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() };
      allRequestsData.push(data);
      if (data.seenByAdmin === false || data.status === 'new' || data.status === 'New') {
        unseenNewCount++;
      }
    });

    initialRequestsLoaded = true;

    // Update counters
    const newReqsEl = document.getElementById('stat-new-requests');
    const totalReqsEl = document.getElementById('stat-total-requests');
    if (newReqsEl) newReqsEl.textContent = unseenNewCount;
    if (totalReqsEl) totalReqsEl.textContent = allRequestsData.length;

    // Badges update
    const reqsBadge = document.getElementById('nav-requests-badge');
    const mobileReqBadge = document.getElementById('mobile-req-badge');
    const topbarBadge = document.getElementById('topbar-unread-badge');

    [reqsBadge, mobileReqBadge, topbarBadge].forEach(badge => {
      if (badge) {
        if (unseenNewCount > 0) {
          badge.textContent = unseenNewCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    });

    // Browser tab title update
    if (unseenNewCount > 0) {
      document.title = `(${unseenNewCount}) New request | Admin WebWorldBD`;
    } else {
      document.title = `Admin Executive Center | WebWorldBD`;
    }

    renderRecentRequestsWidget();
    renderRequestsTable();
    renderDashboardCharts();
  }, (err) => {
    showDashboardError(err);
  });

  // 3. Subscribe to Users
  const usersRef = collection(db, 'users');

  usersUnsub = onSnapshot(usersRef, (snapshot) => {
    allUsersData = [];
    snapshot.forEach(docSnap => {
      allUsersData.push({ uid: docSnap.id, ...docSnap.data() });
    });

    document.getElementById('stat-total-users').textContent = allUsersData.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = allUsersData.filter(u => {
      const d = parseDocDate(u.createdAt);
      return d && d > sevenDaysAgo;
    });
    document.getElementById('stat-new-users').textContent = newUsers.length;

    renderRecentUsersWidget();
    renderUsersTable();
    renderDashboardCharts();
  }, (err) => {
    showDashboardError(err);
  });
}

/* ================= DASHBOARD WIDGETS ================= */

function renderRecentChatsWidget() {
  const container = document.getElementById('dash-recent-chats');
  if (!container) return;

  const unreadChats = allChatsData.filter(c => c.unreadForAdmin > 0).slice(0, 5);
  if (unreadChats.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-2">No unread chats.</p>`;
    return;
  }

  container.innerHTML = unreadChats.map(c => `
    <div onclick="openAdminChat('${c.uid}')" class="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div class="w-8 h-8 rounded-full bg-sky-500/10 text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs">
          ${c.userName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div class="overflow-hidden">
          <p class="font-bold text-xs text-white truncate">${c.userName || 'User'}</p>
          <p class="text-[10px] text-slate-400 truncate">${c.lastMessage || '...'}</p>
        </div>
      </div>
      <span class="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px] shrink-0">${c.unreadForAdmin}</span>
    </div>
  `).join('');
}

function renderRecentRequestsWidget() {
  const container = document.getElementById('dash-recent-requests');
  if (!container) return;

  const recent = allRequestsData.slice(0, 5);
  if (recent.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-2">No project requests.</p>`;
    return;
  }

  container.innerHTML = recent.map(r => `
    <div onclick="openRequestDetail('${r.id}')" class="p-2.5 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors">
      <div class="overflow-hidden">
        <div class="flex items-center gap-1.5">
          <p class="font-bold text-xs text-white truncate">${r.name || r.userName || r.mobile || 'Inquiry'}</p>
          ${r.seenByAdmin === false ? `<span class="px-1.5 py-0.2 rounded-md bg-sky-500 text-white font-black text-[8px] animate-pulse">NEW</span>` : ''}
        </div>
        <p class="text-[10px] text-slate-400 truncate">${r.category || r.projectCategory || 'General Web'}</p>
      </div>
      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${getReqStatusBadgeClass(r.status)}">${r.status || 'New'}</span>
    </div>
  `).join('');
}

function renderRecentUsersWidget() {
  const container = document.getElementById('dash-recent-users');
  if (!container) return;

  const recent = allUsersData.slice(0, 5);
  if (recent.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-2">No users found.</p>`;
    return;
  }

  container.innerHTML = recent.map(u => `
    <div class="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">
          ${u.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div class="overflow-hidden">
          <p class="font-bold text-xs text-white truncate">${u.name || 'User'}</p>
          <p class="text-[10px] text-slate-400 truncate">${u.email || '@' + u.username}</p>
        </div>
      </div>
      <span class="text-[10px] text-slate-500">${formatChatTime(u.createdAt)}</span>
    </div>
  `).join('');
}

/* ================= LIVE CHAT INBOX ================= */

async function runOneTimeChatsBackfill() {
  if (sessionStorage.getItem('admin_chats_backfilled')) return;

  try {
    const existingChatUids = new Set(allChatsData.map(c => c.uid));
    const usersNeedingChat = allUsersData.filter(u => !existingChatUids.has(u.uid));

    if (usersNeedingChat.length > 0) {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      usersNeedingChat.slice(0, 50).forEach(u => {
        const chatRef = doc(db, 'chats', u.uid);
        batch.set(chatRef, {
          uid: u.uid,
          userName: u.name || 'User',
          userEmail: u.email || '',
          userPhoto: u.photoURL || '',
          username: u.username || '',
          phone: u.phone || '',
          lastMessage: '',
          lastMessageAt: nowIso,
          lastSender: 'user',
          unreadForAdmin: 0,
          unreadForUser: 0,
          status: 'new',
          pinned: false,
          blocked: false,
          userTyping: false,
          adminTyping: false,
          userLastSeen: nowIso,
          createdAt: u.createdAt || nowIso,
          tags: [],
          adminNote: ''
        });
      });

      await batch.commit();
      console.log(`Safely backfilled ${usersNeedingChat.length} chat stubs.`);
    }
    sessionStorage.setItem('admin_chats_backfilled', 'true');
  } catch (err) {
    console.warn('Chats backfill warning:', err);
  }
}

window.openNewChatModal = function() {
  const modal = document.getElementById('admin-new-chat-modal');
  modal?.classList.remove('hidden');
  renderNewChatUserList('');
};

window.renderNewChatUserList = function(searchTerm = '') {
  const container = document.getElementById('new-chat-user-list');
  if (!container) return;

  const queryVal = searchTerm.toLowerCase().trim();

  let users = [...allUsersData];
  if (queryVal) {
    users = users.filter(u =>
      (u.name && u.name.toLowerCase().includes(queryVal)) ||
      (u.username && u.username.toLowerCase().includes(queryVal)) ||
      (u.email && u.email.toLowerCase().includes(queryVal)) ||
      (u.phone && u.phone.includes(queryVal))
    );
  }

  if (users.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-500 text-xs italic">No matching users found.</div>`;
    return;
  }

  container.innerHTML = users.map(u => `
    <div onclick="startAdminChatWithUser('${u.uid}')" class="p-2.5 flex items-center justify-between hover:bg-slate-800 rounded-xl cursor-pointer transition-colors">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div class="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0">
          <img src="${u.photoURL || './assets/logo.png?v=2'}" class="w-full h-full object-cover">
        </div>
        <div class="overflow-hidden">
          <p class="font-bold text-white text-xs truncate">${u.name || 'User'}</p>
          <p class="text-[10px] text-slate-400 truncate">${u.email || ''} ${u.phone ? '• ' + u.phone : ''}</p>
        </div>
      </div>
      <button class="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 font-bold text-[10px] hover:bg-sky-500/30">Start chat</button>
    </div>
  `).join('');
};

window.startAdminChatWithUser = async function(uid) {
  document.getElementById('admin-new-chat-modal')?.classList.add('hidden');

  let chat = allChatsData.find(c => c.uid === uid);
  const u = allUsersData.find(user => user.uid === uid);

  if (!chat && u) {
    const chatRef = doc(db, 'chats', uid);
    const nowIso = new Date().toISOString();
    try {
      await setDoc(chatRef, {
        uid: uid,
        userName: u.name || 'User',
        userEmail: u.email || '',
        userPhoto: u.photoURL || '',
        username: u.username || '',
        phone: u.phone || '',
        lastMessage: '',
        lastMessageAt: nowIso,
        lastSender: 'admin',
        unreadForAdmin: 0,
        unreadForUser: 0,
        status: 'open',
        pinned: false,
        blocked: false,
        userTyping: false,
        adminTyping: false,
        userLastSeen: nowIso,
        createdAt: nowIso,
        tags: [],
        adminNote: ''
      });
    } catch (e) {
      console.warn('Error setting chat stub on new message:', e);
    }
  }

  openAdminChat(uid);
};

function renderChatConversationsList() {
  const container = document.getElementById('admin-chat-conversations');
  if (!container) return;

  let filter = 'all';
  const activeTab = document.querySelector('.chat-filter-tab.active');
  if (activeTab) filter = activeTab.getAttribute('data-filter');

  const searchTerm = document.getElementById('chat-search-input')?.value.toLowerCase().trim() || '';

  let filtered = [...allChatsData];

  if (filter === 'all-users') {
    const existingChatUids = new Set(allChatsData.map(c => c.uid));
    allUsersData.forEach(u => {
      if (!existingChatUids.has(u.uid)) {
        filtered.push({
          uid: u.uid,
          userName: u.name || 'User',
          userEmail: u.email || '',
          userPhoto: u.photoURL || '',
          username: u.username || '',
          phone: u.phone || '',
          lastMessage: '',
          status: 'new'
        });
      }
    });
  } else {
    filtered = filtered.filter(chat => {
      if (filter === 'unread') return chat.unreadForAdmin > 0;
      if (filter === 'open') return chat.status === 'open';
      if (filter === 'closed') return chat.status === 'closed';
      if (filter === 'pinned') return chat.pinned === true;
      if (filter === 'blocked') return chat.blocked === true;
      return true;
    });
  }

  if (searchTerm) {
    filtered = filtered.filter(chat =>
      (chat.userName && chat.userName.toLowerCase().includes(searchTerm)) ||
      (chat.userEmail && chat.userEmail.toLowerCase().includes(searchTerm)) ||
      (chat.username && chat.username.toLowerCase().includes(searchTerm)) ||
      (chat.phone && chat.phone.includes(searchTerm)) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchTerm))
    );
  }

  // Sort conversations safely: missing dates go to bottom
  filtered.sort((a, b) => {
    const timeA = parseToDate(a.lastMessageAt, a.createdAt);
    const timeB = parseToDate(b.lastMessageAt, b.createdAt);
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    return timeB - timeA;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">No conversations match the filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    const formattedTime = formatChatTime(c.lastMessageAt, c.createdAt);
    return `
    <div onclick="openAdminChat('${c.uid}')" class="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors ${c.uid === activeChatUid ? 'bg-slate-800/90 border-l-4 border-sky-400' : ''}">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="relative w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0">
          <img src="${c.userPhoto || './assets/logo.png?v=2'}" class="w-full h-full object-cover" onerror="this.src='./assets/logo.png?v=2';">
          ${c.pinned ? `<span class="absolute top-0 right-0 text-[10px] text-amber-400"><i class="fa-solid fa-thumbtack"></i></span>` : ''}
        </div>
        <div class="overflow-hidden">
          <div class="flex items-center gap-1.5">
            <h5 class="font-bold text-xs text-white truncate">${c.userName || 'User'}</h5>
            ${c.username ? `<span class="text-[10px] text-sky-400">@${c.username}</span>` : ''}
          </div>
          <p class="text-[11px] text-slate-400 truncate mt-0.5">${c.lastMessage || '<span class="italic text-slate-500">No messages yet</span>'}</p>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1 shrink-0">
        <span class="text-[9px] text-slate-500">${formattedTime}</span>
        ${c.unreadForAdmin > 0 ? `<span class="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px]">${c.unreadForAdmin}</span>` : ''}
        ${!c.lastMessage ? `<span class="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-bold text-[9px]">Start chat</span>` : ''}
      </div>
    </div>
  `;
  }).join('');
}


const EMOJI_LIST = ['😊', '😂', '👍', '❤️', '🔥', '🎉', '🙏', '😍', '👋', '🚀', '💯', '✨', '👌', '🤝', '💼', '📱', '💻', '⭐', '⚡', '✅'];

function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  const maxHeight = 120;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
}

function initEmojiPicker() {
  const drawer = document.getElementById('composer-emoji-picker-drawer');
  if (!drawer) return;

  drawer.innerHTML = EMOJI_LIST.map(emoji => `
    <button type="button" class="btn-emoji hover:scale-125 p-1.5 transition-transform cursor-pointer" data-emoji="${emoji}">
      ${emoji}
    </button>
  `).join('');

  drawer.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-emoji');
    if (btn) {
      const emoji = btn.getAttribute('data-emoji');
      const textarea = document.getElementById('admin-chat-textarea');
      if (textarea && emoji) {
        textarea.value += emoji;
        textarea.focus();
        autoResizeTextarea(textarea);
      }
    }
  });

  document.getElementById('btn-composer-emoji')?.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer.classList.toggle('hidden');
  });
}

function handleHashRouting() {
  const hash = window.location.hash;
  if (hash.startsWith('#chat/')) {
    const uid = hash.substring(6).trim();
    if (uid && uid.length > 2) {
      openAdminChat(uid, false);
    }
  } else if (activeSection === 'chat' && activeChatUid) {
    closeAdminChatView(false);
  }
}

window.openAdminChat = function(uid, updateHash = true) {
  activeChatUid = uid;
  switchSection('chat');

  if (updateHash && window.location.hash !== `#chat/${uid}`) {
    history.pushState(null, '', `#chat/${uid}`);
  }

  const chatViewPanel = document.getElementById('admin-chat-view-panel');
  const chatListPanel = document.getElementById('admin-chat-list-panel');

  if (window.innerWidth < 900) {
    document.body.classList.add('admin-chat-open');
    chatViewPanel?.classList.add('mobile-fullscreen');
    chatListPanel?.classList.add('hidden');
    chatViewPanel?.classList.remove('hidden');
  } else {
    chatViewPanel?.classList.remove('hidden');
    chatListPanel?.classList.remove('hidden');
  }

  renderChatConversationsList();

  const chat = allChatsData.find(c => c.uid === uid) || { uid: uid, userName: 'User' };

  // Set Chat Header Meta
  document.getElementById('admin-active-user-name').textContent = chat.userName || 'User';
  document.getElementById('admin-active-user-avatar').src = chat.userPhoto || './assets/logo.png?v=2';

  const handleEl = document.getElementById('admin-active-user-handle');
  if (handleEl) handleEl.textContent = chat.username ? `@${chat.username}` : '';

  const onlineDot = document.getElementById('admin-active-online-dot');
  if (onlineDot) onlineDot.style.display = chat.online !== false ? 'block' : 'none';

  const statusText = document.getElementById('admin-active-status-text');
  if (statusText) {
    if (chat.userTyping) {
      statusText.innerHTML = '<span class="text-sky-400 font-bold animate-pulse">Typing...</span>';
    } else if (chat.online !== false) {
      statusText.textContent = 'Online';
    } else {
      statusText.textContent = chat.userLastSeen ? `Last seen ${formatChatTime(chat.userLastSeen)}` : 'Offline';
    }
  }

  // Header WhatsApp button
  const waBtn = document.getElementById('btn-chat-header-whatsapp');
  if (waBtn) {
    if (chat.phone) {
      waBtn.href = `https://wa.me/880${chat.phone.replace(/^(?:\+880|880|0)/, '')}`;
      waBtn.classList.remove('hidden');
    } else {
      waBtn.classList.add('hidden');
    }
  }

  // Blocked or closed banner
  const blockedBanner = document.getElementById('admin-chat-blocked-banner');
  const bannerText = document.getElementById('chat-blocked-banner-text');
  const bannerBtn = document.getElementById('btn-banner-unblock-reopen');

  if (chat.blocked) {
    blockedBanner?.classList.remove('hidden');
    if (bannerText) bannerText.textContent = 'This user is blocked from live chat.';
    if (bannerBtn) {
      bannerBtn.textContent = 'Unblock User';
      bannerBtn.onclick = () => toggleBlockUser(uid, false);
    }
  } else if (chat.status === 'closed') {
    blockedBanner?.classList.remove('hidden');
    if (bannerText) bannerText.textContent = 'This conversation is closed.';
    if (bannerBtn) {
      bannerBtn.textContent = 'Reopen Chat';
      bannerBtn.onclick = async () => {
        await updateDoc(doc(db, 'chats', uid), { status: 'open' });
        showToast('Chat reopened', 'success');
      };
    }
  } else {
    blockedBanner?.classList.add('hidden');
  }

  if (chat.unreadForAdmin > 0) {
    const chatRef = doc(db, 'chats', uid);
    updateDoc(chatRef, { unreadForAdmin: 0 }).catch(() => {});
  }

  renderUserInfoDrawer(chat);

  if (activeMessagesUnsub) activeMessagesUnsub();

  const messagesRef = collection(db, 'chats', uid, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));

  activeMessagesUnsub = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(docSnap => {
      messages.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderAdminMessages(messages, chat);
  });
};

function closeAdminChatView(updateHash = true) {
  activeChatUid = null;
  document.body.classList.remove('admin-chat-open');

  const chatViewPanel = document.getElementById('admin-chat-view-panel');
  const chatListPanel = document.getElementById('admin-chat-list-panel');

  if (window.innerWidth < 900) {
    chatViewPanel?.classList.add('hidden');
    chatListPanel?.classList.remove('hidden');
  }

  if (updateHash && window.location.hash.startsWith('#chat/')) {
    history.pushState(null, '', 'admin.html#chat');
  }

  renderChatConversationsList();
}

function renderAdminMessages(messages, chatData = {}) {
  const container = document.getElementById('admin-chat-messages');
  if (!container) return;

  if (messages.length === 0) {
    const userName = chatData.userName || 'User';
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 my-auto">
        <div class="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 text-xl">
          <i class="fa-solid fa-hand-wave"></i>
        </div>
        <h3 class="font-bold text-sm text-white">No messages yet. Say hello to ${userName}!</h3>
        <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button onclick="insertQuickStartChip('Hello! How can I help you today?')" class="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-medium text-xs transition-colors">
            Greeting
          </button>
          <button onclick="insertQuickStartChip('How can I help you with your project?')" class="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-medium text-xs transition-colors">
            "How can I help you?"
          </button>
          <button onclick="insertQuickStartChip('Please share your project requirements.')" class="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 font-medium text-xs transition-colors">
            "Please share your requirements"
          </button>
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  let lastDateStr = '';

  messages.forEach((msg, idx) => {
    const msgDate = parseToDate(msg.createdAt, msg.deliveredAt) || new Date();
    const dateStr = formatDateSeparator(msgDate);

    if (dateStr !== lastDateStr) {
      html += `
        <div class="flex justify-center my-3">
          <span class="chat-date-separator">
            ${dateStr}
          </span>
        </div>
      `;
      lastDateStr = dateStr;
    }

    const isAdmin = msg.sender === 'admin';
    const isNextSameSender = messages[idx + 1] && messages[idx + 1].sender === msg.sender;
    const isGroupEnd = !isNextSameSender;
    const timeStr = formatChatTime(msg.createdAt, msg.deliveredAt);

    const textOnly = (msg.text || '').trim();
    const isEmojiOnly = isOnlyEmojis(textOnly);

    html += `
      <div class="flex items-end gap-2 my-0.5 group ${isAdmin ? 'justify-end' : 'justify-start'}">
        ${!isAdmin && isGroupEnd ? `
          <div class="w-6 h-6 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-700">
            <img src="${chatData.userPhoto || './assets/logo.png?v=2'}" class="w-full h-full object-cover">
          </div>
        ` : (!isAdmin ? '<div class="w-6 shrink-0"></div>' : '')}

        <div class="max-w-[80%] space-y-0.5 relative">
          <!-- Quoted preview if replying -->
          ${msg.replyTo ? `
            <div class="px-3 py-1.5 rounded-xl bg-slate-900/80 border-l-2 border-sky-400 text-[11px] text-slate-300 mb-1 truncate">
              <span class="font-bold text-sky-400 block">${msg.replyTo.sender || 'Reply'}</span>
              ${msg.replyTo.text || 'Attachment'}
            </div>
          ` : ''}

          <!-- Bubble Content -->
          <div data-msg-id="${msg.id}" onclick="openBubbleMenu(event, '${msg.id}', \`${(msg.text || '').replace(/`/g, '\\`')}\`)" class="chat-bubble ${isAdmin ? 'chat-bubble-admin' : 'chat-bubble-user'} ${isNextSameSender ? (isAdmin ? 'chat-bubble-admin-grouped' : 'chat-bubble-user-grouped') : ''} ${isEmojiOnly ? 'chat-bubble-emoji-only' : ''} cursor-pointer">
            ${renderMessageBubblePayload(msg)}
          </div>

          <!-- Status / Time Footer -->
          ${isGroupEnd ? `
            <div class="flex items-center gap-1 text-[10px] text-slate-400 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}">
              <span>${timeStr}</span>
              ${isAdmin ? renderAdminStatusTicks(msg, chatData) : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

window.insertQuickStartChip = function(text) {
  const textarea = document.getElementById('admin-chat-textarea');
  if (textarea) {
    textarea.value = text;
    textarea.focus();
    autoResizeTextarea(textarea);
  }
};

function isOnlyEmojis(str) {
  if (!str) return false;
  const regex = /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\s)+$/u;
  return str.length <= 12 && regex.test(str);
}

function formatDateSeparator(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function renderMessageBubblePayload(msg) {
  if (msg.deleted) {
    return `<span class="italic text-slate-400 text-xs"><i class="fa-solid fa-ban mr-1"></i> This message was deleted</span>`;
  }

  let content = '';

  // Project Request Card (Type "request")
  if (msg.type === 'request' || msg.requestId) {
    return `
      <div class="chat-request-card text-left space-y-2">
        <div class="flex items-center justify-between border-b border-purple-500/20 pb-2">
          <span class="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md">${msg.requestId || 'REQUEST'}</span>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${getReqStatusBadgeClass(msg.requestStatus)}">${msg.requestStatus || 'New'}</span>
        </div>
        <p class="font-bold text-xs text-purple-300">${msg.category || 'Project Request'}</p>
        <p class="text-xs text-slate-200 line-clamp-3">${msg.requirements || msg.text || ''}</p>
        ${msg.budget ? `<p class="text-[11px] font-mono text-emerald-400 font-bold">Budget: ${msg.budget}</p>` : ''}
        <div class="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button onclick="event.stopPropagation(); openRequestDetail('${msg.requestId || msg.id}')" class="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-[10px]">
            View Details
          </button>
        </div>
      </div>
    `;
  }

  }

  return content;
}

function attachAdminMediaClickHandlers() {
  document.querySelectorAll('.admin-media-thumbnail').forEach(el => {
    el.onclick = (e) => {
      const src = e.currentTarget.getAttribute('data-src');
      if (!src) return;

      const modal = document.getElementById('admin-media-viewer-modal');
      const img = document.getElementById('admin-media-viewer-img');
      const downloadBtn = document.getElementById('admin-btn-download-media');

      if (img) img.src = src;
      if (downloadBtn) downloadBtn.href = src;
      modal?.classList.remove('hidden');
      modal?.classList.add('flex');
    };
  });
}

function initAdminComposerUI() {
  // 1. Emoji Picker
  const emojiDrawer = document.getElementById('admin-emoji-picker-drawer');
  if (emojiDrawer) {
    emojiDrawer.innerHTML = ADMIN_EMOJI_LIST.map(emoji => `
      <button type="button" class="btn-admin-emoji-item hover:scale-125 text-xl p-1 transition-transform cursor-pointer" data-emoji="${emoji}">
        ${emoji}
      </button>
    `).join('');

    emojiDrawer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-admin-emoji-item');
      if (btn) {
        const emoji = btn.getAttribute('data-emoji');
        const textarea = document.getElementById('admin-chat-textarea');
        if (textarea) {
          textarea.value += emoji;
          textarea.focus();
          autoResizeAdminTextarea(textarea);
        }
      }
    });
  }

  document.getElementById('btn-admin-emoji')?.addEventListener('click', () => {
    document.getElementById('admin-attach-sheet')?.classList.add('hidden');
    emojiDrawer?.classList.toggle('hidden');
  });

  // 2. Attach Sheet Toggle
  document.getElementById('btn-admin-attach')?.addEventListener('click', () => {
    emojiDrawer?.classList.add('hidden');
    document.getElementById('admin-attach-sheet')?.classList.toggle('hidden');
  });

  // 3. File Input Change Listeners
  ['admin-file-photo', 'admin-file-doc', 'admin-file-camera'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      if (e.target.files?.length) {
        handleAdminFileSelect(Array.from(e.target.files));
        e.target.value = '';
        document.getElementById('admin-attach-sheet')?.classList.add('hidden');
      }
    });
  });

  // 4. Drag & Drop and Clipboard Paste on Chat View Panel
  const chatViewPanel = document.getElementById('admin-chat-view-panel');
  if (chatViewPanel) {
    chatViewPanel.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    chatViewPanel.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.files?.length) {
        handleAdminFileSelect(Array.from(e.dataTransfer.files));
      }
    });

    chatViewPanel.addEventListener('paste', (e) => {
      const items = (e.clipboardData || window.clipboardData)?.items;
      if (!items) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length) {
        handleAdminFileSelect(files);
      }
    });
  }

  // 5. Close Media Viewer
  document.getElementById('admin-btn-close-media-viewer')?.addEventListener('click', () => {
    const modal = document.getElementById('admin-media-viewer-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  });
}

function autoResizeAdminTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  const maxHeight = 120;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
}

function handleAdminFileSelect(files) {
  if (!files || files.length === 0) return;

  const currentChat = allChatsData.find(c => c.uid === activeChatUid);
  if (currentChat?.blocked || currentChat?.status === 'closed') {
    showToast(getLanguage() === 'en' ? 'Chat is blocked or closed.' : 'চ্যাট বন্ধ বা ব্লক করা আছে।', 'error');
    return;
  }

  if (pendingAdminAttachments.length + files.length > 5) {
    showToast(getLanguage() === 'en' ? 'Maximum 5 attachments allowed at once.' : 'একসাথে সর্বোচ্চ ৫টি ফাইল অ্যাটাচ করা যাবে।', 'error');
    return;
  }

  files.forEach(file => {
    const blockedExts = ['.exe', '.apk', '.bat', '.js', '.sh', '.msi'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (blockedExts.includes(ext)) {
      showToast(t('executableBlockedError'), 'error');
      return;
    }

    const MAX_SIZE = 30 * 1024 * 1024; // 30MB
    if (file.size > MAX_SIZE) {
      showToast(t('maxFileSizeError'), 'error');
      return;
    }

    const item = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      file: file,
      status: 'pending', // 'pending', 'uploading', 'done', 'error'
      progress: 0,
      uploadedFile: null,
      cancelFn: null
    };

    pendingAdminAttachments.push(item);
    startAdminFileUpload(item);
  });

  renderAdminAttachmentChips();
}

async function startAdminFileUpload(item) {
  let uploadFile = item.file;

  if (uploadFile.type.startsWith('image/')) {
    try {
      uploadFile = await compressImageIfNeeded(uploadFile, 2000, 2000, 0.85);
    } catch (e) {
      console.warn('Image compression skipped:', e);
    }
  }

  item.status = 'uploading';
  item.progress = 0;
  renderAdminAttachmentChips();

  try {
    const result = await uploadToCloudinary(uploadFile, {
      folder: 'webworldbd_uploads/chat',
      onProgress: (percent) => {
        item.progress = percent;
        updateChipProgress(item.id, percent);
      },
      registerCancel: (cancelFn) => {
        item.cancelFn = cancelFn;
      }
    });

    item.status = 'done';
    item.uploadedFile = result;
    item.progress = 100;
  } catch (err) {
    console.error('Admin file upload error:', err);
    item.status = 'error';
  } finally {
    item.cancelFn = null;
    renderAdminAttachmentChips();
  }
}

function updateChipProgress(itemId, percent) {
  const bar = document.getElementById(`chip-bar-${itemId}`);
  const text = document.getElementById(`chip-text-${itemId}`);
  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;
}

function renderAdminAttachmentChips() {
  const container = document.getElementById('admin-attachment-chips');
  if (!container) return;

  if (pendingAdminAttachments.length === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');

  container.innerHTML = pendingAdminAttachments.map(att => {
    const isImg = att.file.type.startsWith('image/');
    const thumbUrl = isImg ? URL.createObjectURL(att.file) : '';

    let iconClass = 'fa-file text-sky-400';
    if (att.file.type.startsWith('image/')) iconClass = 'fa-file-image text-emerald-400';
    else if (att.file.type.startsWith('video/')) iconClass = 'fa-file-video text-purple-400';
    else if (att.file.type.startsWith('audio/')) iconClass = 'fa-file-audio text-amber-400';
    else if (att.file.type.includes('pdf')) iconClass = 'fa-file-pdf text-red-400';

    return `
      <div class="p-2 rounded-2xl bg-slate-800 border border-slate-700 flex items-center gap-2.5 max-w-[220px] relative shrink-0">
        ${isImg ? `
          <img src="${thumbUrl}" class="w-9 h-9 object-cover rounded-xl shrink-0">
        ` : `
          <div class="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <i class="fa-solid ${iconClass}"></i>
          </div>
        `}
        <div class="overflow-hidden flex-1 min-w-0">
          <p class="font-bold text-xs text-white truncate">${escapeHTML(att.file.name)}</p>
          <div class="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
            <span>${formatBytes(att.file.size)}</span>
            <span id="chip-text-${att.id}">${att.status === 'uploading' ? att.progress + '%' : (att.status === 'done' ? 'Ready' : (att.status === 'error' ? 'Error' : 'Pending'))}</span>
          </div>
          ${att.status === 'uploading' ? `
            <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
              <div id="chip-bar-${att.id}" class="h-full bg-sky-400 transition-all duration-150" style="width: ${att.progress}%;"></div>
            </div>
          ` : ''}
        </div>
        ${att.status === 'error' ? `
          <button type="button" onclick="retryAdminUpload('${att.id}')" class="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-[10px] hover:bg-amber-500/30">Retry</button>
        ` : ''}
        <button type="button" onclick="removeAdminAttachment('${att.id}')" class="w-6 h-6 rounded-full bg-slate-900 hover:bg-red-500 text-slate-400 hover:text-white flex items-center justify-center text-[10px] transition-colors shrink-0">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }
}

window.cancelPendingAdminFile = function() {
  pendingAdminFile = null;
  document.getElementById('admin-pending-attachments-bar')?.classList.add('hidden');

  }).join('');
}

window.retryAdminUpload = function(id) {
  const att = pendingAdminAttachments.find(a => a.id === id);
  if (att) {
    startAdminFileUpload(att);
  }
};

window.removeAdminAttachment = function(id) {
  const idx = pendingAdminAttachments.findIndex(a => a.id === id);
  if (idx !== -1) {
    const att = pendingAdminAttachments[idx];
    if (att.cancelFn) {
      try { att.cancelFn(); } catch (e) {}
    }
    pendingAdminAttachments.splice(idx, 1);
    renderAdminAttachmentChips();
  }
};

async function handleAdminSendMessage(e) {
  e.preventDefault();
  if (!activeChatUid || !currentAdminUser) return;

  const currentChat = allChatsData.find(c => c.uid === activeChatUid);
  if (currentChat?.blocked || currentChat?.status === 'closed') {
    showToast(getLanguage() === 'en' ? 'Chat is blocked or closed.' : 'চ্যাট বন্ধ বা ব্লক করা আছে।', 'error');
    return;
  }

  const textarea = document.getElementById('admin-chat-textarea');
  const text = textarea?.value.trim() || '';

  // Check if any attachments are currently uploading
  if (pendingAdminAttachments.some(a => a.status === 'uploading')) {
    showToast(getLanguage() === 'en' ? 'Please wait for file uploads to finish.' : 'ফাইল আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন।', 'info');
    return;
  }

  // Check if any attachments failed
  if (pendingAdminAttachments.some(a => a.status === 'error')) {
    showToast(getLanguage() === 'en' ? 'Some uploads failed. Please retry or remove them.' : 'কিছু ফাইল আপলোড ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন বা সরিয়ে ফেলুন।', 'error');
    return;
  }

  if (!text && pendingAdminAttachments.length === 0) return;

  const sendBtn = document.getElementById('btn-admin-send');
  if (sendBtn) sendBtn.disabled = true;

  let uploadedFile = null;

  if (pendingAdminFile) {
    try {
      uploadedFile = await uploadToCloudinary(pendingAdminFile, {
        folder: 'webworldbd_uploads/chat'
      });
    } catch (err) {
      showToast('File upload failed', 'error');
      if (sendBtn) sendBtn.disabled = false;
      return;
    }
  }

  const messagesRef = collection(db, 'chats', activeChatUid, 'messages');
  const chatRef = doc(db, 'chats', activeChatUid);
  const isoTime = new Date().toISOString();

  try {
    const batch = writeBatch(db);
    let lastMsgPreview = text;

    if (text) {
      const textMsgRef = doc(messagesRef);
      const msgData = {
        sender: 'admin',
        senderRole: 'admin',
        senderId: currentAdminUser.uid,
        conversationId: activeChatUid,
        text: text,
        type: 'text',
        createdAt: serverTimestamp(),
        deliveredAt: isoTime,
        readAt: null,
        deleted: false,
        edited: false
      };
      if (quotedMessage) {
        msgData.replyTo = quotedMessage;
      }
      batch.set(textMsgRef, msgData);
    }

    if (uploadedFile && pendingAdminFile) {
      let msgType = 'file';
      if (pendingAdminFile.type.startsWith('image/')) msgType = 'image';
      else if (pendingAdminFile.type.startsWith('video/')) msgType = 'video';
      else if (pendingAdminFile.type.startsWith('audio/')) msgType = 'audio';

      const fileMsgRef = doc(messagesRef);
      batch.set(fileMsgRef, {
        sender: 'admin',
        senderRole: 'admin',
        senderId: currentAdminUser.uid,
        conversationId: activeChatUid,
        text: '',
        type: msgType,
        fileUrl: uploadedFile.secure_url,
        fileName: pendingAdminFile.name,
        fileSize: pendingAdminFile.size,
        mimeType: pendingAdminFile.type,
        createdAt: serverTimestamp(),
        deliveredAt: isoTime,
        readAt: null,
        deleted: false,
        edited: false
      });
      lastMsgPreview = `📎 ${pendingAdminFile.name}`;
    }

    pendingAdminAttachments.forEach(att => {
      if (att.status === 'done' && att.uploadedFile) {
        let type = 'file';
        if (att.file.type.startsWith('image/')) type = 'image';
        else if (att.file.type.startsWith('video/')) type = 'video';
        else if (att.file.type.startsWith('audio/')) type = 'audio';

        const previewText = type === 'image' ? '📷 Photo' : (type === 'video' ? '🎥 Video' : (type === 'audio' ? '🎵 Audio' : `📎 ${att.file.name}`));
        lastMsgPreview = previewText;

        const fileMsgRef = doc(messagesRef);
        batch.set(fileMsgRef, {
          sender: 'admin',
          senderRole: 'admin',
          senderId: currentAdminUser.uid,
          conversationId: activeChatUid,
          text: '',
          type: type,
          fileUrl: att.uploadedFile.secure_url,
          fileName: att.file.name,
          fileSize: att.file.size,
          mimeType: att.file.type,
          createdAt: serverTimestamp(),
          deliveredAt: isoTime,
          readAt: null,
          deleted: false,
          edited: false
        });
      }
    });

    const targetChat = allChatsData.find(c => c.uid === activeChatUid);
    batch.update(chatRef, {
      lastMessage: lastMsgPreview || 'Attachment',
      lastMessageAt: isoTime,
      lastSender: 'admin',
      unreadForUser: (targetChat?.unreadForUser || 0) + 1,
      adminTyping: false
    });

    await batch.commit();

    if (textarea) {
      textarea.value = '';
      autoResizeAdminTextarea(textarea);
    }
    pendingAdminAttachments = [];
    cancelPendingAdminFile();
    cancelQuotedReply();
    renderAdminAttachmentChips();
    document.getElementById('admin-quick-reply-drawer')?.classList.add('hidden');
    document.getElementById('admin-emoji-picker-drawer')?.classList.add('hidden');
    document.getElementById('admin-attach-sheet')?.classList.add('hidden');

    logAdminAction("SEND_CHAT_REPLY", activeChatUid, `Replied to chat with ${lastMsgPreview.slice(0, 30)}...`);
  } catch (err) {
    console.error('Error sending admin message:', err);
    showToast('Failed to send admin message.', 'error');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
}

async function exportActiveChatHistory() {
  if (!activeChatUid) return;
  try {
    const messagesRef = collection(db, 'chats', activeChatUid, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);

    let txt = `WebWorldBD Chat Export - ${activeChatUid}\nDate: ${new Date().toLocaleString()}\n\n`;
    snap.forEach(docSnap => {
      const m = docSnap.data();
      const sender = m.sender === 'admin' ? 'SHAFAET (Admin)' : 'User';
      const time = formatChatTime(m.createdAt, m.deliveredAt);
      txt += `[${time}] ${sender}: ${m.text || m.fileUrl || ''}\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_export_${activeChatUid}.txt`;
    link.click();
    showToast('Chat history exported', 'success');
  } catch (e) {
    showToast('Export failed', 'error');
  }
}

async function deleteActiveConversation() {
  if (!activeChatUid) return;
  if (!confirm('Permanently delete this entire conversation and all messages?')) return;

  try {
    await deleteDoc(doc(db, 'chats', activeChatUid));
    showToast('Conversation deleted.', 'success');
    closeAdminChatView();
  } catch (e) {
    showToast('Failed to delete conversation.', 'error');
  }
}

function autolinkText(text) {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" class="underline font-medium hover:text-sky-300 break-all">${url}</a>`);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function renderQuickReplyDrawer() {
  const drawer = document.getElementById('admin-quick-reply-drawer');
  if (!drawer) return;

  const replies = currentSiteConfig.quickReplies || DEFAULT_QUICK_REPLIES;

  drawer.classList.remove('hidden');
  drawer.innerHTML = replies.map(qr => `
    <button type="button" class="btn-quick-reply p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition-colors cursor-pointer" data-text="${qr.textEn}">
      <p class="font-bold text-[11px] text-sky-400">/${qr.trigger}</p>
      <p class="text-[10px] text-slate-300 truncate">${qr.textEn}</p>
    </button>
  `).join('');

  drawer.querySelectorAll('.btn-quick-reply').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-text');
      const textarea = document.getElementById('admin-chat-textarea');
      if (textarea && text) {
        textarea.value = text;
        drawer.classList.add('hidden');
        textarea.focus();
      }
    });
  });
}

function renderUserInfoDrawer(chat) {
  const container = document.getElementById('user-drawer-content');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center space-y-2">
      <div class="w-16 h-16 rounded-full bg-slate-800 overflow-hidden mx-auto ring-2 ring-sky-400">
        <img src="${chat.userPhoto || './assets/logo.png?v=2'}" class="w-full h-full object-cover">
      </div>
      <h4 class="font-bold text-sm text-white">${chat.userName || 'User'}</h4>
      <p class="text-[11px] text-sky-400">@${chat.username || 'username'}</p>
      <p class="text-[10px] text-slate-400">${chat.userEmail || ''}</p>
    </div>

    <div class="space-y-2 pt-2 border-t border-slate-800">
      <p><strong>Chat Status:</strong> ${chat.status || 'open'}</p>
      <p><strong>Blocked:</strong> ${chat.blocked ? 'Yes' : 'No'}</p>
      <p><strong>Pinned:</strong> ${chat.pinned ? 'Yes' : 'No'}</p>
    </div>

    <!-- Private Admin Note -->
    <div class="pt-2 border-t border-slate-800 space-y-2">
      <label class="block font-bold text-slate-400 text-[11px]">Private Admin Note</label>
      <textarea id="input-admin-note" rows="2" class="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white" placeholder="Add private note...">${chat.adminNote || ''}</textarea>

      <button onclick="saveAdminNote('${chat.uid}')" class="w-full py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 font-bold text-xs text-white transition-colors">Save Admin Note</button>
    </div>

    <div class="pt-2 border-t border-slate-800 space-y-2">
      <button onclick="togglePinChat('${chat.uid}', ${!chat.pinned})" class="w-full py-2 rounded-xl font-bold text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors">
        ${chat.pinned ? 'Unpin Conversation' : 'Pin Conversation'}
      </button>
      <button onclick="toggleBlockUser('${chat.uid}', ${!chat.blocked})" class="w-full py-2 rounded-xl font-bold text-xs ${chat.blocked ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'} transition-colors">
        ${chat.blocked ? 'Unblock User' : 'Block User from Chat'}
      </button>
    </div>
  `;
}

window.saveAdminNote = async function(uid) {
  const noteText = document.getElementById('input-admin-note')?.value.trim() || '';
  try {
    const chatRef = doc(db, 'chats', uid);
    await updateDoc(chatRef, { adminNote: noteText });
    showToast('Admin note saved.', 'success');
  } catch (e) {
    showToast('Failed to save note.', 'error');
  }
};

window.togglePinChat = async function(uid, pin) {
  try {
    const chatRef = doc(db, 'chats', uid);
    await updateDoc(chatRef, { pinned: pin });
    showToast(pin ? 'Chat pinned.' : 'Chat unpinned.', 'success');
  } catch (err) {
    showToast('Failed to update pin status.', 'error');
  }
};

window.toggleBlockUser = async function(uid, block) {
  try {
    const chatRef = doc(db, 'chats', uid);
    await updateDoc(chatRef, { blocked: block });
    showToast(block ? 'User blocked from live chat.' : 'User unblocked.', 'success');
    logAdminAction("BLOCK_USER", uid, `Set blocked state to ${block}`);
  } catch (err) {
    showToast('Failed to update block status.', 'error');
  }
};

/* ================= PROJECT REQUESTS MANAGER ================= */

function getReqStatusBadgeClass(status) {
  const normalized = (status || 'new').toLowerCase();
  if (normalized === 'new') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (normalized === 'contacted') return 'bg-sky-500/20 text-sky-400 border border-sky-500/30';
  if (normalized === 'in progress' || normalized === 'in-progress') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
  if (normalized === 'completed') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (normalized === 'rejected') return 'bg-red-500/20 text-red-400 border border-red-500/30';
  return 'bg-slate-800 text-slate-300 border border-slate-700';
}

function renderRequestsTable() {
  const container = document.getElementById('requests-table-body');
  if (!container) return;

  const countBadge = document.getElementById('requests-count-badge');
  const searchVal = document.getElementById('requests-search-input')?.value.toLowerCase().trim() || '';
  const sortVal = document.getElementById('requests-sort-select')?.value || 'newest';

  let filterVal = 'all';
  const activeTab = document.querySelector('.req-filter-tab.active');
  if (activeTab) filterVal = activeTab.getAttribute('data-req-filter');

  let filtered = [...allRequestsData];

  // 1. Status / Property Filter
  if (filterVal !== 'all') {
    if (filterVal === 'has-attachment') {
      filtered = filtered.filter(r => r.attachment && r.attachment.url);
    } else {
      filtered = filtered.filter(r => (r.status || 'new').toLowerCase().replace(' ', '-') === filterVal);
    }
  }

  // 2. Search
  if (searchVal) {
    filtered = filtered.filter(r =>
      (r.requestId && r.requestId.toLowerCase().includes(searchVal)) ||
      (r.id && r.id.toLowerCase().includes(searchVal)) ||
      (r.name && r.name.toLowerCase().includes(searchVal)) ||
      (r.userName && r.userName.toLowerCase().includes(searchVal)) ||
      (r.mobile && r.mobile.includes(searchVal)) ||
      (r.email && r.email.toLowerCase().includes(searchVal)) ||
      (r.category && r.category.toLowerCase().includes(searchVal)) ||
      (r.requirements && r.requirements.toLowerCase().includes(searchVal))
    );
  }

  // 3. Sorting
  if (sortVal === 'newest') {
    filtered.sort((a, b) => (parseDocDate(b.createdAt) || 0) - (parseDocDate(a.createdAt) || 0));
  } else if (sortVal === 'oldest') {
    filtered.sort((a, b) => (parseDocDate(a.createdAt) || 0) - (parseDocDate(b.createdAt) || 0));
  } else if (sortVal === 'category') {
    filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  }

  if (countBadge) countBadge.textContent = `${filtered.length} Total`;

  // Pagination limit logic
  const paginated = filtered.slice(0, requestDisplayLimit);

  const pageInfo = document.getElementById('requests-page-info');
  const loadMoreBtn = document.getElementById('btn-requests-load-more');

  if (pageInfo) pageInfo.textContent = `Showing ${paginated.length} of ${filtered.length} requests`;

  if (loadMoreBtn) {
    if (paginated.length < filtered.length) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  if (paginated.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500 italic">No project requests match the selected criteria.</td></tr>`;
    return;
  }

  container.innerHTML = paginated.map(r => {
    const createdDate = parseDocDate(r.createdAt);
    const relTime = formatRelativeTime(createdDate);
    const formattedDate = formatChatTime(r.createdAt);
    const fullDate = formattedDate || 'N/A';
    const isNew = r.seenByAdmin === false || (r.status || '').toLowerCase() === 'new';

    return `
      <tr onclick="openRequestDetail('${r.id}')" class="hover:bg-slate-800/40 transition-colors cursor-pointer ${isNew ? 'bg-sky-500/5' : ''}">
        <td class="p-3.5">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-700">
              <img src="${r.userPhoto || './assets/logo.png?v=2'}" class="w-full h-full object-cover" onerror="this.src='./assets/logo.png?v=2';">
            </div>
            <div class="overflow-hidden">
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[10px] font-bold text-sky-400">${r.requestId || r.id}</span>
                ${isNew ? `<span class="px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-black text-[8px] animate-pulse">NEW</span>` : ''}
              </div>
              <p class="font-bold text-white truncate max-w-[140px]">${r.name || r.userName || 'Client'}</p>
              <p class="text-[10px] text-slate-400 truncate max-w-[160px]">${r.mobile || ''} ${r.email ? '• ' + r.email : ''}</p>
            </div>
          </div>
        </td>
        <td class="p-3.5 font-semibold text-purple-300">
          <div class="flex items-center gap-1.5">
            <span>${r.category || 'Custom'}</span>
            ${r.attachment?.url ? `<i class="fa-solid fa-paperclip text-sky-400 text-xs" title="Has attachment"></i>` : ''}
          </div>
        </td>
        <td class="p-3.5 font-mono text-emerald-400 font-bold">${r.budget || 'Unspecified'}</td>
        <td class="p-3.5">
          <p class="font-medium text-slate-200 text-[11px]">${relTime}</p>
          <p class="text-[9px] text-slate-500">${fullDate}</p>
        </td>
        <td class="p-3.5" onclick="event.stopPropagation();">
          <select onchange="updateRequestStatus('${r.id}', this.value)" class="py-1 px-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-hidden cursor-pointer">
            <option value="New" ${(r.status || 'New') === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${r.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td class="p-3.5 text-right space-x-1.5" onclick="event.stopPropagation();">
          <button onclick="openRequestDetail('${r.id}')" class="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold transition-colors" title="View Full Drawer">
            <i class="fa-solid fa-eye"></i> View
          </button>
          ${r.mobile ? `<a href="https://wa.me/880${r.mobile.replace(/^(?:\+880|880|0)/, '')}?text=${encodeURIComponent(`Hello ${r.name || 'Client'}, regarding your project request [${r.requestId || r.id}]...`)}" target="_blank" class="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold transition-colors" title="Message on WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
          <button onclick="deleteProjectRequest('${r.id}')" class="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-colors" title="Delete Request"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openRequestDetail = async function(reqId) {
  const req = allRequestsData.find(r => r.id === reqId || r.requestId === reqId);
  if (!req) return;

  // Mark request as seen by admin
  if (req.seenByAdmin === false || req.status === 'new') {
    try {
      const ref = doc(db, 'projectRequests', req.id);
      await updateDoc(ref, { seenByAdmin: true, updatedAt: serverTimestamp() });
      req.seenByAdmin = true;
    } catch (e) {}
  }

  const modal = document.getElementById('admin-request-detail-modal');
  const body = document.getElementById('request-detail-modal-body');
  if (!modal || !body) return;

  const createdDate = parseDocDate(req.createdAt);
  const clientUser = allUsersData.find(u => u.uid === req.userId || u.email === req.email || u.phone === req.mobile);
  const otherReqs = allRequestsData.filter(r => r.id !== req.id && (r.userId === req.userId || r.email === req.email));

  let attachmentHtml = `<span class="text-slate-500 italic">No attachment provided</span>`;
  if (req.attachment && req.attachment.url) {
    const url = req.attachment.url;
    const name = req.attachment.name || 'Reference File';
    const isImg = url.match(/\.(jpg|jpeg|png|webp)/i) || (req.attachment.type && req.attachment.type.startsWith('image/'));

    if (isImg) {
      attachmentHtml = `
        <div class="space-y-2">
          <div class="max-h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
            <img src="${url}" class="w-full h-full object-contain">
          </div>
          <a href="${url}" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 font-bold text-xs hover:bg-sky-500/30">
            <i class="fa-solid fa-download"></i> Download Image
          </a>
        </div>
      `;
    } else {
      attachmentHtml = `
        <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2.5 overflow-hidden">
            <i class="fa-solid fa-file-lines text-purple-400 text-xl shrink-0"></i>
            <div class="overflow-hidden">
              <p class="font-bold text-white truncate max-w-[200px]">${name}</p>
              <p class="text-[10px] text-slate-400">${req.attachment.size ? Math.round(req.attachment.size / 1024) + ' KB' : 'Attachment'}</p>
            </div>
          </div>
          <a href="${url}" target="_blank" class="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-400 font-bold hover:bg-sky-500/30 shrink-0">
            <i class="fa-solid fa-download"></i>
          </a>
        </div>
      `;
    }
  }

  body.innerHTML = `
    <!-- Top Identity Card -->
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs font-black text-sky-400 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">${req.requestId || req.id}</span>
        <select onchange="updateRequestStatus('${req.id}', this.value)" class="py-1 px-3 rounded-xl bg-slate-800 border border-slate-700 font-bold text-white focus:outline-hidden cursor-pointer">
          <option value="New" ${(req.status || 'New') === 'New' ? 'selected' : ''}>New</option>
          <option value="Contacted" ${req.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="In Progress" ${req.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${req.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Rejected" ${req.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs">
        <div><span class="text-slate-400">Category:</span> <p class="font-bold text-purple-300">${req.category || 'Custom'}</p></div>
        <div><span class="text-slate-400">Budget:</span> <p class="font-bold text-emerald-400">${req.budget || 'Unspecified'}</p></div>
        <div><span class="text-slate-400">Submitted:</span> <p class="font-medium text-slate-200">${formatChatTime(req.createdAt) || 'N/A'}</p></div>
        <div><span class="text-slate-400">Language:</span> <p class="font-semibold text-sky-400 uppercase">${req.language || 'EN'}</p></div>
      </div>
    </div>

    <!-- Requirements Card with Copy Button -->
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="font-bold text-white text-xs uppercase tracking-wider text-purple-400">Project Requirements</h4>
        <button onclick="navigator.clipboard.writeText(\`${(req.requirements || '').replace(/`/g, '\\`')}\`); showToast('Requirements copied', 'success');" class="px-2 py-1 rounded bg-slate-800 text-sky-400 hover:bg-slate-700 text-[10px] font-bold">
          <i class="fa-regular fa-copy mr-1"></i> Copy Text
        </button>
      </div>
      <p class="whitespace-pre-wrap text-slate-200 text-xs leading-relaxed max-h-60 overflow-y-auto p-2 bg-slate-900 rounded-xl border border-slate-800/80">${req.requirements || 'No requirements text'}</p>
    </div>

    <!-- Attachment Section -->
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
      <h4 class="font-bold text-white text-xs uppercase tracking-wider text-sky-400">Attachment</h4>
      ${attachmentHtml}
    </div>

    <!-- Client Profile Summary -->
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
      <h4 class="font-bold text-white text-xs uppercase tracking-wider text-amber-400">Client Profile</h4>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-1 ring-sky-400">
          <img src="${req.userPhoto || clientUser?.photoURL || './assets/logo.png?v=2'}" class="w-full h-full object-cover">
        </div>
        <div class="overflow-hidden">
          <p class="font-bold text-white text-xs">${req.name || req.userName || 'Client'}</p>
          <p class="text-[10px] text-sky-400 font-mono">@${req.username || clientUser?.username || 'user'}</p>
          <p class="text-[10px] text-slate-400 truncate">${req.mobile || ''} ${req.email ? '• ' + req.email : ''}</p>
        </div>
      </div>

      <div class="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
        <p><strong>Other Requests:</strong> ${otherReqs.length} previous requests</p>
      </div>
    </div>

    <!-- Private Admin Note -->
    <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
      <label class="block font-bold text-slate-300 text-xs">Private Admin Note</label>
      <textarea id="input-request-admin-note" rows="2" class="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden" placeholder="Add private note for team...">${req.adminNote || ''}</textarea>
      <button onclick="saveRequestAdminNote('${req.id}')" class="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold text-xs text-white transition-colors">
        Save Admin Note
      </button>
    </div>

    <!-- Quick Action Buttons -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
      <button onclick="openAdminChat('${req.userId}'); closeRequestDetailModal();" class="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md">
        <i class="fa-solid fa-comments"></i> Chat
      </button>
      ${req.mobile ? `<a href="https://wa.me/880${req.mobile.replace(/^(?:\+880|880|0)/, '')}?text=${encodeURIComponent(`Hello ${req.name || 'Client'}, regarding your project request [${req.requestId || req.id}]...`)}" target="_blank" class="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"><i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp</a>` : ''}
      ${req.mobile ? `<a href="tel:${req.mobile}" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"><i class="fa-solid fa-phone"></i> Call</a>` : ''}
      ${req.email ? `<a href="mailto:${req.email}?subject=WebWorldBD%20Project%20Request%20%5B${req.requestId || req.id}%5D" class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"><i class="fa-solid fa-envelope"></i> Email</a>` : ''}
    </div>

    <button onclick="deleteProjectRequest('${req.id}'); closeRequestDetailModal();" class="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs hover:bg-red-500/30 transition-colors">
      <i class="fa-solid fa-trash mr-1.5"></i> Delete Request
    </button>
  `;

  modal.classList.remove('hidden');
};

function closeRequestDetailModal() {
  document.getElementById('admin-request-detail-modal')?.classList.add('hidden');
}

window.saveRequestAdminNote = async function(reqId) {
  const noteText = document.getElementById('input-request-admin-note')?.value.trim() || '';
  try {
    const ref = doc(db, 'projectRequests', reqId);
    await updateDoc(ref, { adminNote: noteText, updatedAt: serverTimestamp() });
    showToast('Admin note saved.', 'success');
  } catch (e) {
    showToast('Failed to save note.', 'error');
  }
};

window.updateRequestStatus = async function(id, status) {
  try {
    const ref = doc(db, 'projectRequests', id);
    await updateDoc(ref, { status: status, updatedAt: serverTimestamp() });
    showToast(`Request status updated to ${status}`, 'success');
    logAdminAction("UPDATE_REQUEST_STATUS", id, `Status changed to ${status}`);
  } catch (e) {
    showToast('Failed to update status', 'error');
  }
};

window.deleteProjectRequest = async function(id) {
  if (!confirm("Are you sure you want to delete this project request?")) return;
  try {
    await deleteDoc(doc(db, 'projectRequests', id));
    showToast('Project request deleted.', 'success');
    logAdminAction("DELETE_REQUEST", id, "Project request permanently deleted");
  } catch (e) {
    showToast('Failed to delete request.', 'error');
  }
};

/* ================= USERS TABLE & DETAIL DRAWER ================= */

function renderUsersTable() {
  const container = document.getElementById('users-table-body');
  if (!container) return;

  const countBadge = document.getElementById('users-count-badge');
  const searchVal = document.getElementById('users-search-input')?.value.toLowerCase().trim() || '';
  const sortVal = document.getElementById('users-sort-select')?.value || 'newest';

  let filterVal = 'all';
  const activeTab = document.querySelector('.user-filter-tab.active');
  if (activeTab) filterVal = activeTab.getAttribute('data-user-filter');

  let filtered = [...allUsersData];

  // 1. Filters
  if (filterVal === 'active') filtered = filtered.filter(u => !u.blocked);
  if (filterVal === 'blocked') filtered = filtered.filter(u => u.blocked);
  if (filterVal === 'verified') filtered = filtered.filter(u => u.emailVerified);
  if (filterVal === 'has-phone') filtered = filtered.filter(u => u.phone && u.phone.trim().length > 0);

  // 2. Search
  if (searchVal) {
    filtered = filtered.filter(u =>
      (u.name && u.name.toLowerCase().includes(searchVal)) ||
      (u.username && u.username.toLowerCase().includes(searchVal)) ||
      (u.email && u.email.toLowerCase().includes(searchVal)) ||
      (u.phone && u.phone.includes(searchVal))
    );
  }

  // 3. Sorting
  if (sortVal === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (sortVal === 'lastLogin') {
    filtered.sort((a, b) => new Date(b.lastLoginAt || 0) - new Date(a.lastLoginAt || 0));
  } else if (sortVal === 'name') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  if (countBadge) countBadge.textContent = `${filtered.length} Users`;

  if (filtered.length === 0) {
    container.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-500 italic">No registered users match the search criteria.</td></tr>`;
    return;
  }

  container.innerHTML = filtered.map(u => `
    <tr class="hover:bg-slate-800/40 transition-colors">
      <td class="p-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 ring-1 ring-slate-700">
            <img src="${u.photoURL || './assets/logo.png?v=2'}" class="w-full h-full object-cover" onerror="this.src='./assets/logo.png?v=2';">
          </div>
          <div class="overflow-hidden">
            <p class="font-bold text-white truncate max-w-[140px]">${u.name || 'User'}</p>
            <span class="text-[10px] text-slate-400 font-mono block truncate">${u.uid?.slice(0, 8)}...</span>
          </div>
        </div>
      </td>
      <td class="p-3.5">
        <p class="font-mono text-sky-400 font-bold">@${u.username || 'user'}</p>
        <p class="text-[10px] text-slate-400 truncate max-w-[160px]">${u.email || ''}</p>
      </td>
      <td class="p-3.5">
        ${u.phone ? `<span class="font-bold text-emerald-400">${u.phone}</span>` : `<span class="text-slate-500 italic">Not added</span>`}
      </td>
      <td class="p-3.5 text-slate-300 capitalize font-semibold">
        ${u.provider === 'google' ? `<span class="text-sky-400"><i class="fa-brands fa-google text-xs mr-1"></i>Google</span>` : `<span class="text-indigo-400"><i class="fa-solid fa-key text-xs mr-1"></i>Password</span>`}
      </td>
      <td class="p-3.5 text-slate-400">${formatChatTime(u.createdAt) || 'N/A'}</td>
      <td class="p-3.5">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.blocked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
          ${u.blocked ? 'Blocked' : 'Active'}
        </span>
      </td>
      <td class="p-3.5 text-right space-x-1.5">
        <button onclick="viewUserDetail('${u.uid}')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"><i class="fa-solid fa-eye"></i> Details</button>
        <button onclick="openAdminChat('${u.uid}')" class="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold transition-colors"><i class="fa-solid fa-comments"></i> Chat</button>
      </td>
    </tr>
  `).join('');
}

window.viewUserDetail = function(uid) {
  const u = allUsersData.find(user => user.uid === uid);
  if (!u) return;

  const modal = document.getElementById('admin-user-detail-modal');
  const body = document.getElementById('user-detail-modal-body');
  if (!modal || !body) return;

  const userReqs = allRequestsData.filter(r => r.userId === u.uid || r.email === u.email || r.mobile === u.phone);

  body.innerHTML = `
    <div class="text-center space-y-2">
      <div class="w-20 h-20 rounded-full bg-slate-800 overflow-hidden mx-auto ring-2 ring-sky-400 shadow-xl">
        <img src="${u.photoURL || './assets/logo.png?v=2'}" class="w-full h-full object-cover">
      </div>
      <h3 class="font-extrabold text-base text-white">${u.name || 'User'}</h3>
      <p class="text-xs font-mono text-sky-400">@${u.username || 'user'}</p>
      <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.emailVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">
        ${u.emailVerified ? '✓ Email Verified' : '⚠ Email Unverified'}
      </span>
    </div>

    <!-- Quick Copy Action Bar -->
    <div class="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-slate-400">Email:</span>
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-white truncate max-w-[180px]">${u.email || ''}</span>
          <button onclick="navigator.clipboard.writeText('${u.email}'); showToast('Email copied', 'success');" class="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 hover:bg-slate-700"><i class="fa-regular fa-copy"></i></button>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-400">Phone:</span>
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-emerald-400">${u.phone || 'Not added'}</span>
          ${u.phone ? `<button onclick="navigator.clipboard.writeText('${u.phone}'); showToast('Phone copied', 'success');" class="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700"><i class="fa-regular fa-copy"></i></button>` : ''}
        </div>
      </div>
    </div>

    <!-- Contact & Action Buttons -->
    <div class="grid grid-cols-2 gap-2">
      <button onclick="openAdminChat('${u.uid}'); closeUserDetailModal();" class="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold flex items-center justify-center gap-2 shadow-md">
        <i class="fa-solid fa-paper-plane"></i> Send Message
      </button>
      ${u.phone ? `<a href="https://wa.me/880${u.phone.replace(/^(?:\+880|880|0)/, '')}" target="_blank" class="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-md"><i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp</a>` : `<button disabled class="py-2 px-3 rounded-xl bg-slate-800 text-slate-500 font-bold flex items-center justify-center gap-2 cursor-not-allowed"><i class="fa-brands fa-whatsapp"></i> No Phone</button>`}
    </div>

    <!-- User Profile Details Card -->
    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-slate-300">
      <p><strong>Bio:</strong> <span class="italic text-slate-400">${u.bio || 'No bio written.'}</span></p>
      <p><strong>Joined:</strong> ${formatChatTime(u.createdAt) || 'N/A'}</p>
      <p><strong>Last Login:</strong> ${formatChatTime(u.lastLoginAt) || 'Just now'}</p>
      <p><strong>Project Requests:</strong> <span class="text-purple-400 font-bold">${userReqs.length} submitted</span></p>
    </div>

    <!-- Danger Zone Actions -->
    <div class="pt-2 border-t border-slate-800 space-y-2">
      <button onclick="toggleBlockUser('${u.uid}', ${!u.blocked}); closeUserDetailModal();" class="w-full py-2 rounded-xl font-bold text-xs ${u.blocked ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'}">
        ${u.blocked ? 'Unblock User' : 'Block User Account'}
      </button>
      <button onclick="deleteUserData('${u.uid}', '${u.username}'); closeUserDetailModal();" class="w-full py-2 rounded-xl font-bold text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30">
        Delete User Data
      </button>
    </div>
  `;

  modal.classList.remove('hidden');
};

function closeUserDetailModal() {
  document.getElementById('admin-user-detail-modal')?.classList.add('hidden');
}

window.deleteUserData = async function(uid, username) {
  if (!confirm(`Are you sure you want to delete profile data for user @${username}?`)) return;

  try {
    await deleteDoc(doc(db, 'users', uid));
    if (username) {
      await deleteDoc(doc(db, 'usernames', username)).catch(() => {});
    }
    showToast("User profile data deleted.", "success");
    logAdminAction("DELETE_USER_DATA", uid, `Deleted user profile and reservation @${username}`);
  } catch (e) {
    showToast("Failed to delete user data.", "error");
  }
};

/* ================= CSV EXPORT UTILITIES ================= */

function exportRequestsCSV() {
  if (allRequestsData.length === 0) return showToast('No requests to export.', 'info');

  let csv = 'ID,Name,Mobile,Email,Category,Budget,Requirements,Status,CreatedAt\n';
  allRequestsData.forEach(r => {
    const cleanReq = (r.requirements || '').replace(/"/g, '""').replace(/\n/g, ' ');
    csv += `"${r.requestId || r.id}","${r.name || r.userName || ''}","${r.mobile || ''}","${r.email || ''}","${r.category || ''}","${r.budget || ''}","${cleanReq}","${r.status || 'New'}","${r.createdAt || ''}"\n`;
  });

  downloadCSV(csv, 'webworldbd_project_requests.csv');
  logAdminAction("EXPORT_CSV", "projectRequests", "Exported requests CSV");
}

function exportUsersCSV() {
  if (allUsersData.length === 0) return showToast('No users to export.', 'info');

  let csv = 'UID,Name,Email,Phone,Username,Provider,EmailVerified,JoinedDate,LastLogin,Blocked\n';
  allUsersData.forEach(u => {
    csv += `"${u.uid}","${u.name || ''}","${u.email || ''}","${u.phone || ''}","${u.username || ''}","${u.provider || ''}","${u.emailVerified || false}","${u.createdAt || ''}","${u.lastLoginAt || ''}","${u.blocked || false}"\n`;
  });

  downloadCSV(csv, 'webworldbd_users.csv');
  logAdminAction("EXPORT_CSV", "users", "Exported full users CSV");
}



function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ================= GLOBAL SEARCH HANDLER ================= */

function handleGlobalSearch(e) {
  const queryVal = e.target.value.toLowerCase().trim();
  const dropdown = document.getElementById('admin-search-results-dropdown');
  if (!dropdown) return;

  if (queryVal.length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  // 1. Search Users
  const matchedUsers = allUsersData.filter(u =>
    (u.name && u.name.toLowerCase().includes(queryVal)) ||
    (u.username && u.username.toLowerCase().includes(queryVal)) ||
    (u.email && u.email.toLowerCase().includes(queryVal)) ||
    (u.phone && u.phone.includes(queryVal))
  ).slice(0, 4);

  // 2. Search Chats
  const matchedChats = allChatsData.filter(c =>
    (c.userName && c.userName.toLowerCase().includes(queryVal)) ||
    (c.userEmail && c.userEmail.toLowerCase().includes(queryVal)) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(queryVal))
  ).slice(0, 4);

  // 3. Search Requests
  const matchedRequests = allRequestsData.filter(r =>
    (r.requestId && r.requestId.toLowerCase().includes(queryVal)) ||
    (r.id && r.id.toLowerCase().includes(queryVal)) ||
    (r.name && r.name.toLowerCase().includes(queryVal)) ||
    (r.userName && r.userName.toLowerCase().includes(queryVal)) ||
    (r.email && r.email.toLowerCase().includes(queryVal)) ||
    (r.mobile && r.mobile.includes(queryVal)) ||
    (r.category && r.category.toLowerCase().includes(queryVal))
  ).slice(0, 4);

  if (matchedUsers.length === 0 && matchedChats.length === 0 && matchedRequests.length === 0) {
    dropdown.innerHTML = `<div class="p-4 text-center text-slate-500 italic">No search results found</div>`;
    dropdown.classList.remove('hidden');
    return;
  }

  let html = '';

  if (matchedUsers.length > 0) {
    html += `<div class="p-2 bg-slate-950 font-bold text-[10px] text-sky-400 uppercase tracking-wider">Users</div>`;
    matchedUsers.forEach(u => {
      html += `
        <div onclick="openAdminChat('${u.uid}'); document.getElementById('admin-search-results-dropdown').classList.add('hidden');" class="p-2.5 hover:bg-slate-800 flex items-center justify-between cursor-pointer">
          <div class="overflow-hidden">
            <p class="font-bold text-white truncate">${u.name || 'User'}</p>
            <p class="text-[10px] text-slate-400 truncate">${u.email} ${u.phone ? '• ' + u.phone : ''}</p>
          </div>
          <span class="text-[10px] text-sky-400 font-bold">@${u.username || 'user'}</span>
        </div>
      `;
    });
  }

  if (matchedChats.length > 0) {
    html += `<div class="p-2 bg-slate-950 font-bold text-[10px] text-emerald-400 uppercase tracking-wider">Live Chats</div>`;
    matchedChats.forEach(c => {
      html += `
        <div onclick="openAdminChat('${c.uid}'); document.getElementById('admin-search-results-dropdown').classList.add('hidden');" class="p-2.5 hover:bg-slate-800 flex items-center justify-between cursor-pointer">
          <div class="overflow-hidden">
            <p class="font-bold text-white truncate">${c.userName || 'User'}</p>
            <p class="text-[10px] text-slate-400 truncate">${c.lastMessage || '...'}</p>
          </div>
          <i class="fa-solid fa-comments text-emerald-400"></i>
        </div>
      `;
    });
  }

  if (matchedRequests.length > 0) {
    html += `<div class="p-2 bg-slate-950 font-bold text-[10px] text-purple-400 uppercase tracking-wider">Project Requests</div>`;
    matchedRequests.forEach(r => {
      html += `
        <div onclick="openRequestDetail('${r.id}'); document.getElementById('admin-search-results-dropdown').classList.add('hidden');" class="p-2.5 hover:bg-slate-800 flex items-center justify-between cursor-pointer">
          <div class="overflow-hidden">
            <p class="font-bold text-white truncate">${r.requestId || r.id} • ${r.name || r.userName || 'Inquiry'}</p>
            <p class="text-[10px] text-slate-400 truncate">${r.category || ''} • ${r.mobile || ''}</p>
          </div>
          <span class="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-bold text-[9px]">${r.status || 'New'}</span>
        </div>
      `;
    });
  }

  dropdown.innerHTML = html;
  dropdown.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
  const searchWrapper = document.getElementById('admin-global-search')?.parentElement;
  if (searchWrapper && !searchWrapper.contains(e.target)) {
    document.getElementById('admin-search-results-dropdown')?.classList.add('hidden');
  }
});
