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
let allChatsData = [];
let allRequestsData = [];
let allUsersData = [];
let currentSiteConfig = {};

// Inactivity timeout tracking (30 minutes timeout with 28 minute warning)
let inactivityTimer = null;
let warningTimer = null;

const DEFAULT_QUICK_REPLIES = [
  { id: 'q1', trigger: 'hello', textEn: 'Hello! Thank you for reaching out to WebWorldBD. How can I help you with your project today?', textBn: 'হ্যালো! ওয়েবওয়ার্ল্ডবিডি-তে যোগাযোগের জন্য ধন্যবাদ। কীভাবে আপনার প্রজেক্টে সাহায্য করতে পারি?' },
  { id: 'q2', trigger: 'price', textEn: 'Our custom website pricing starts from ৳5,000 / $50 depending on feature complexity and responsiveness.', textBn: 'আমাদের কাস্টম ওয়েবসাইট তৈরি শুরু হয় ৳৫,০০০ / $৫০ থেকে, যা আপনার রিকোয়ারমেন্টসের ওপর নির্ভর করে।' },
  { id: 'q3', trigger: 'time', textEn: 'Standard business websites take 3-5 days. Complex e-commerce or Web SaaS apps take 1-3 weeks.', textBn: 'সাধারণ ব্যবসায়িক ওয়েবসাইট ৩-৫ দিন এবং জটিল ই-কমার্স বা ওয়েব অ্যাপ ১-৩ সপ্তাহ সময় নেয়।' },
  { id: 'q4', trigger: 'payment', textEn: 'We accept payment via bKash, Nagad, Bank Transfer, and international payments via Fiverr.', textBn: 'আমরা বিকাশ, নগদ, ব্যাংক ট্রান্সফার এবং ফাইবারের মাধ্যমে পেমেন্ট গ্রহণ করি।' },
  { id: 'q5', trigger: 'policy', textEn: 'WebWorldBD strictly builds positive and legal platforms. We do NOT build gambling, betting, or adult websites.', textBn: 'ওয়েবওয়ার্ল্ডবিডি কঠোরভাবে শুধুমাত্র বৈধ ওয়েবসাইট তৈরি করে। আমরা কোনো জুয়া বা বেটিং সাইট তৈরি করি না।' },
  { id: 'q6', trigger: 'call', textEn: 'You can directly call our developer SHAFAET HOSSEN SARIP at +8801342697743 or +8809658183506.', textBn: 'আমাদের ডেভেলপার শাফায়েত হোসেন সারিপের সাথে সরাসরি কল করে কথা বলতে পারেন +8801342697743 নম্বরে।' }
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

    setupInactivityTimers();
    initAdminUI();
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

  // Chat Composer Send
  document.getElementById('admin-chat-composer')?.addEventListener('submit', handleAdminSendMessage);

  // Quick Reply trigger on '/'
  const adminTextarea = document.getElementById('admin-chat-textarea');
  adminTextarea?.addEventListener('input', (e) => {
    if (e.target.value.startsWith('/')) {
      renderQuickReplyDrawer();
    } else {
      document.getElementById('admin-quick-reply-drawer')?.classList.add('hidden');
    }
  });

  // Back button for mobile messenger
  document.getElementById('btn-back-chat-list')?.addEventListener('click', () => {
    document.getElementById('admin-chat-list-panel')?.classList.remove('hidden');
    document.getElementById('admin-chat-view-panel')?.classList.add('hidden');
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

  // User Detail Drawer Close Listeners
  document.getElementById('btn-close-user-detail')?.addEventListener('click', closeUserDetailModal);
  document.getElementById('admin-user-detail-backdrop')?.addEventListener('click', closeUserDetailModal);

  // Content Manager Save Button
  document.getElementById('btn-save-site-config')?.addEventListener('click', saveContentManagerChanges);

  // Site Control Maintenance Checkbox
  document.getElementById('toggle-maintenance-mode')?.addEventListener('change', (e) => {
    saveSiteControlSettings(e.target.checked);
  });

  // Clear Logs
  document.getElementById('btn-clear-old-logs')?.addEventListener('click', clearOldAdminLogs);

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

function renderUsersTrendChart() {
  const container = document.getElementById('chart-users-trend');
  if (!container) return;

  const days = 14;
  const counts = new Array(days).fill(0);
  const now = new Date();

  allUsersData.forEach(u => {
    if (!u.createdAt) return;
    const date = new Date(u.createdAt);
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < days) {
      counts[days - 1 - diffDays]++;
    }
  });

  const maxVal = Math.max(...counts, 5);
  const width = 300;
  const height = 120;
  const points = counts.map((val, idx) => {
    const x = (idx / (days - 1)) * width;
    const y = height - (val / maxVal) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" class="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <polygon points="0,${height} ${points} ${width},${height}" fill="url(#userGrad)" />
      <polyline fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" points="${points}" />
      ${counts.map((val, idx) => {
        const x = (idx / (days - 1)) * width;
        const y = height - (val / maxVal) * (height - 20) - 10;
        return `<circle cx="${x}" cy="${y}" r="3" fill="#38bdf8" />`;
      }).join('')}
    </svg>
  `;
}

function renderRequestsCategoryChart() {
  const container = document.getElementById('chart-requests-category');
  if (!container) return;

  const categoryMap = {};
  allRequestsData.forEach(r => {
    const cat = r.projectCategory || 'General Web';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  const categories = Object.keys(categoryMap);
  if (categories.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500">No category data available</p>`;
    return;
  }

  const colors = ['#38bdf8', '#c084fc', '#34d399', '#fbbf24', '#f87171'];
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
        <span class="w-2.5 h-2.5 rounded-full" style="background-color:${color}"></span>
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

  container.innerHTML = logs.map(l => `
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
      <div class="space-y-0.5">
        <p class="font-bold text-white text-xs"><span class="text-sky-400">${l.action}</span> • ${l.target}</p>
        ${l.details ? `<p class="text-[10px] text-slate-400">${l.details}</p>` : ''}
      </div>
      <span class="text-[10px] text-slate-500">${l.isoDate ? new Date(l.isoDate).toLocaleString() : 'Just now'}</span>
    </div>
  `).join('');
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
  // 1. Subscribe to Live Chats
  const chatsRef = collection(db, 'chats');
  const qChats = query(chatsRef, orderBy('lastMessageAt', 'desc'), limit(100));

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

    // Update unread badges across header, sidebar, and mobile nav
    const unreadBadge = document.getElementById('nav-chat-unread-badge');
    const topbarBadge = document.getElementById('topbar-unread-badge');
    const mobileChatBadge = document.getElementById('mobile-chat-badge');

    [unreadBadge, topbarBadge, mobileChatBadge].forEach(badge => {
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
  });

  // 2. Subscribe to Project Requests
  const requestsRef = collection(db, 'projectRequests');
  const qReqs = query(requestsRef, orderBy('createdAt', 'desc'), limit(100));

  requestsUnsub = onSnapshot(qReqs, (snapshot) => {
    allRequestsData = [];
    let newCount = 0;

    snapshot.forEach(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() };
      allRequestsData.push(data);
      if (data.status === 'New' || !data.status) newCount++;
    });

    document.getElementById('stat-new-requests').textContent = newCount;
    document.getElementById('stat-total-requests').textContent = allRequestsData.length;

    const reqsBadge = document.getElementById('nav-requests-badge');
    const mobileReqBadge = document.getElementById('mobile-req-badge');

    [reqsBadge, mobileReqBadge].forEach(badge => {
      if (badge) {
        if (newCount > 0) {
          badge.textContent = newCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    });

    renderRecentRequestsWidget();
    renderRequestsTable();
    renderDashboardCharts();
  });

  // 3. Subscribe to Users
  const usersRef = collection(db, 'users');
  const qUsers = query(usersRef, orderBy('createdAt', 'desc'), limit(100));

  usersUnsub = onSnapshot(qUsers, (snapshot) => {
    allUsersData = [];
    snapshot.forEach(docSnap => {
      allUsersData.push({ uid: docSnap.id, ...docSnap.data() });
    });

    document.getElementById('stat-total-users').textContent = allUsersData.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = allUsersData.filter(u => new Date(u.createdAt) > sevenDaysAgo);
    document.getElementById('stat-new-users').textContent = newUsers.length;

    renderRecentUsersWidget();
    renderUsersTable();
    renderDashboardCharts();
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
    <div class="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
      <div class="overflow-hidden">
        <p class="font-bold text-xs text-white truncate">${r.fullName || r.mobileNumber || 'Inquiry'}</p>
        <p class="text-[10px] text-slate-400 truncate">${r.projectCategory || 'General Web'}</p>
      </div>
      <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'New' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300'}">${r.status || 'New'}</span>
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
      <span class="text-[10px] text-slate-500">${new Date(u.createdAt).toLocaleDateString()}</span>
    </div>
  `).join('');
}

/* ================= LIVE CHAT INBOX ================= */

/* ================= SAFE BACKFILL & NEW CHAT MODAL ================= */

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
    // Create new chat stub doc
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
    // Merge all registered users so even users without active messages show in list
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

  if (filtered.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-slate-500 text-xs">No conversations match the filter.</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => `
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
        <span class="text-[9px] text-slate-500">${c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        ${c.unreadForAdmin > 0 ? `<span class="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px]">${c.unreadForAdmin}</span>` : ''}
        ${!c.lastMessage ? `<span class="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-bold text-[9px]">Start chat</span>` : ''}
      </div>
    </div>
  `).join('');
}

window.openAdminChat = function(uid) {
  activeChatUid = uid;
  switchSection('chat');

  if (window.innerWidth < 768) {
    document.getElementById('admin-chat-list-panel')?.classList.add('hidden');
    document.getElementById('admin-chat-view-panel')?.classList.remove('hidden');
  }

  renderChatConversationsList();

  const chat = allChatsData.find(c => c.uid === uid);
  if (!chat) return;

  document.getElementById('admin-active-user-name').textContent = chat.userName || 'User';
  document.getElementById('admin-active-user-email').textContent = chat.userEmail || '@' + chat.username;
  document.getElementById('admin-active-user-avatar').src = chat.userPhoto || './assets/logo.png?v=2';

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
    renderAdminMessages(messages);
  });
};

function renderAdminMessages(messages) {
  const container = document.getElementById('admin-chat-messages');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `<div class="text-center py-10 text-slate-500 text-xs">No messages yet in this conversation.</div>`;
    return;
  }

  container.innerHTML = messages.map(msg => {
    const isAdmin = msg.sender === 'admin';
    const timeStr = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return `
      <div class="flex justify-${isAdmin ? 'end' : 'start'} my-1">
        <div class="max-w-[80%] space-y-1">
          <div class="p-3 rounded-2xl text-xs leading-relaxed ${isAdmin ? 'bg-sky-600 text-white rounded-br-xs' : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'}">
            ${msg.fileUrl ? `<div class="mb-1.5"><a href="${msg.fileUrl}" target="_blank" class="underline font-bold text-sky-200">📎 Attachment File</a></div>` : ''}
            <p class="whitespace-pre-wrap">${msg.text || ''}</p>
          </div>
          <p class="text-[9px] text-slate-500 text-${isAdmin ? 'right' : 'left'} px-1">${timeStr}</p>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

async function handleAdminSendMessage(e) {
  e.preventDefault();
  if (!activeChatUid || !currentAdminUser) return;

  const textarea = document.getElementById('admin-chat-textarea');
  const text = textarea?.value.trim() || '';
  if (!text) return;

  const sendBtn = document.getElementById('btn-admin-send');
  if (sendBtn) sendBtn.disabled = true;

  const messagesRef = collection(db, 'chats', activeChatUid, 'messages');
  const chatRef = doc(db, 'chats', activeChatUid);
  const isoTime = new Date().toISOString();

  try {
    const batch = writeBatch(db);
    const newMsgRef = doc(messagesRef);

    batch.set(newMsgRef, {
      sender: 'admin',
      senderId: currentAdminUser.uid,
      text: text,
      type: 'text',
      createdAt: serverTimestamp(),
      deliveredAt: isoTime,
      readAt: null
    });

    const targetChat = allChatsData.find(c => c.uid === activeChatUid);
    batch.update(chatRef, {
      lastMessage: text,
      lastMessageAt: isoTime,
      lastSender: 'admin',
      unreadForUser: (targetChat?.unreadForUser || 0) + 1,
      adminTyping: false
    });

    await batch.commit();

    if (textarea) textarea.value = '';
    document.getElementById('admin-quick-reply-drawer')?.classList.add('hidden');
    logAdminAction("SEND_CHAT_REPLY", activeChatUid, `Replied: ${text.slice(0, 30)}...`);
  } catch (err) {
    console.error('Error sending admin message:', err);
    showToast('Failed to send admin message.', 'error');
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
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

    <!-- Private Admin Note & Tags Form -->
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

/* ================= PROJECT REQUESTS TABLE ================= */

function renderRequestsTable() {
  const container = document.getElementById('requests-table-body');
  if (!container) return;

  if (allRequestsData.length === 0) {
    container.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-500">No project requests found.</td></tr>`;
    return;
  }

  container.innerHTML = allRequestsData.map(r => `
    <tr class="hover:bg-slate-800/40 transition-colors">
      <td class="p-3.5">
        <p class="font-bold text-white">${r.fullName || 'Anonymous'}</p>
        <p class="text-[10px] text-slate-400">${r.mobileNumber || ''} ${r.email ? '• ' + r.email : ''}</p>
      </td>
      <td class="p-3.5 font-semibold text-sky-400">${r.projectCategory || 'General'}</td>
      <td class="p-3.5">${r.estimatedBudget || 'N/A'}</td>
      <td class="p-3.5 text-slate-400">${new Date(r.createdAt || Date.now()).toLocaleDateString()}</td>
      <td class="p-3.5">
        <select onchange="updateRequestStatus('${r.id}', this.value)" class="py-1 px-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-hidden">
          <option value="New" ${r.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Contacted" ${r.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td class="p-3.5 text-right space-x-2">
        ${r.mobileNumber ? `<a href="https://wa.me/880${r.mobileNumber.replace(/^0/, '')}" target="_blank" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500/20"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
        <button onclick="deleteProjectRequest('${r.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.updateRequestStatus = async function(id, status) {
  try {
    const ref = doc(db, 'projectRequests', id);
    await updateDoc(ref, { status: status });
    showToast(`Request status set to ${status}`, 'success');
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
      <td class="p-3.5 text-slate-400">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
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

  const userReqs = allRequestsData.filter(r => r.email === u.email || r.mobileNumber === u.phone);

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
      ${u.phone ? `<a href="https://wa.me/880${u.phone.replace(/^0/, '')}" target="_blank" class="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 shadow-md"><i class="fa-brands fa-whatsapp text-sm"></i> WhatsApp</a>` : `<button disabled class="py-2 px-3 rounded-xl bg-slate-800 text-slate-500 font-bold flex items-center justify-center gap-2 cursor-not-allowed"><i class="fa-brands fa-whatsapp"></i> No Phone</button>`}
    </div>

    <!-- User Profile Details Card -->
    <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-slate-300">
      <p><strong>Bio:</strong> <span class="italic text-slate-400">${u.bio || 'No bio written.'}</span></p>
      <p><strong>Joined:</strong> ${u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A'}</p>
      <p><strong>Last Login:</strong> ${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Just now'}</p>
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

  let csv = 'ID,Name,Mobile,Email,Category,Budget,Status,Date\n';
  allRequestsData.forEach(r => {
    csv += `"${r.id}","${r.fullName || ''}","${r.mobileNumber || ''}","${r.email || ''}","${r.projectCategory || ''}","${r.estimatedBudget || ''}","${r.status || 'New'}","${r.createdAt || ''}"\n`;
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
    (r.fullName && r.fullName.toLowerCase().includes(queryVal)) ||
    (r.email && r.email.toLowerCase().includes(queryVal)) ||
    (r.mobileNumber && r.mobileNumber.includes(queryVal)) ||
    (r.projectCategory && r.projectCategory.toLowerCase().includes(queryVal))
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
        <div onclick="switchSection('requests'); document.getElementById('admin-search-results-dropdown').classList.add('hidden');" class="p-2.5 hover:bg-slate-800 flex items-center justify-between cursor-pointer">
          <div class="overflow-hidden">
            <p class="font-bold text-white truncate">${r.fullName || 'Inquiry'}</p>
            <p class="text-[10px] text-slate-400 truncate">${r.projectCategory || ''} • ${r.mobileNumber || ''}</p>
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
