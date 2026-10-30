import { getLanguage, toggleLanguage, t, applyTranslations } from './i18n.js';
import { subscribeAuthState, logOut, safeRedirect } from './auth.js';
import { ADMIN_CONFIG, isAdminUser } from './admin-config.js';
import { getOptimizedImageUrl } from './cloudinary-config.js';
import { db } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const PRIVACY_POLICY_URL = 'https://webworldbd-privacypolicy.pages.dev/';

export const LIVE_PROJECTS = [
  {
    name: 'Market Koro',
    icon: 'fa-store',
    url: 'https://marketkoro.pages.dev/',
    tag: 'E-commerce Platform',
    desc: 'Full-featured online shopping store with cart & checkout.'
  },
  {
    name: "Student's Tool's & AI",
    icon: 'fa-graduation-cap',
    url: 'https://studentstoolsorai.pages.dev/',
    tag: 'Educational SaaS',
    desc: 'AI-assisted tools for academic productivity and study.'
  },
  {
    name: 'Birthday Website',
    icon: 'fa-cake-candles',
    url: 'https://happybirthday-all.pages.dev/',
    tag: 'Custom Interactive Web',
    desc: 'Personalized animated celebration website with music & effects.'
  },
  {
    name: 'Animated Heart',
    icon: 'fa-heart',
    url: 'https://animatedheart.pages.dev/',
    tag: 'Interactive Canvas UI',
    desc: '3D CSS/JS particle animation platform for creative presentation.'
  },
  {
    name: 'RunZone',
    icon: 'fa-person-running',
    url: 'https://gamezonebd.pages.dev/',
    tag: 'Sports & Fitness App',
    desc: 'Fitness tracking dashboard and activity log web app.'
  }
];

let currentUser = null;
let currentUserData = null;
let userChatUnsub = null;

function checkIsAdminPage() {
  const cleanPath = window.location.pathname.replace(/\/$/, '').toLowerCase();
  const isAdminPath = cleanPath === '/admin' ||
                      cleanPath === '/admin.html' ||
                      cleanPath.endsWith('/admin') ||
                      cleanPath.endsWith('/admin.html');
  const hasDataPageAdmin = document.body && document.body.getAttribute('data-page') === 'admin';
  const hasAdminRoot = !!(document.getElementById('admin-app') || document.getElementById('admin-auth-guard'));
  return isAdminPath || hasDataPageAdmin || hasAdminRoot;
}

function initApp() {
  const isAdminPage = checkIsAdminPage();
  if (isAdminPage && document.body) {
    document.body.classList.add('admin-page');
  }

  const isLiveChatPage = window.location.pathname.endsWith('livechat.html') || window.location.pathname.includes('/livechat.html');
  if (isLiveChatPage && document.body) {
    document.body.classList.add('livechat-page');
  }

  initTheme();

  if (!isAdminPage) {
    injectParticlesBg();
    injectHeader();
    injectSidebar();
    injectFooter();
    injectFloatingButtons();
    injectBottomNav();
  }

  injectModals();
  injectToastContainer();
  applyTranslations();
  initCopyCardButtons();
  subscribeSiteConfigPublic();

  // Subscribe to Auth State Changes
  subscribeAuthState((user, userData) => {
    currentUser = user;
    currentUserData = userData;
    updateAuthDependentUI();
    subscribeUserChatUnreadStatus();
    document.dispatchEvent(new CustomEvent('authStateUpdated', { detail: { user, userData } }));
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* ================= PUBLIC SITE CONFIG & MAINTENANCE CHECK ================= */
function subscribeSiteConfigPublic() {
  const configRef = doc(db, 'siteConfig', 'main');
  onSnapshot(configRef, (snap) => {
    if (snap.exists()) {
      const config = snap.data();
      // Maintenance mode check disabled to restore normal website state
    }
  }, () => {});
}

function subscribeUserChatUnreadStatus() {
  if (userChatUnsub) { userChatUnsub(); userChatUnsub = null; }
  if (!currentUser) return;

  const chatRef = doc(db, 'chats', currentUser.uid);
  userChatUnsub = onSnapshot(chatRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const hasUnread = data.unreadForUser > 0;
      document.querySelectorAll('.live-chat-red-dot').forEach(el => {
        if (hasUnread) {
          el.classList.remove('hidden');
          el.style.display = 'block';
        } else {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });
    }
  }, () => {});
}

/* ================= THEME MANAGEMENT ================= */
function initTheme() {
  const savedTheme = localStorage.getItem('webworldbd_theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

export function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('webworldbd_theme', isDark ? 'dark' : 'light');
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.body.classList.contains('dark');
  const sunIcons = document.querySelectorAll('.theme-icon-sun');
  const moonIcons = document.querySelectorAll('.theme-icon-moon');
  const themeLabels = document.querySelectorAll('.theme-label-text');

  sunIcons.forEach(el => el.style.display = isDark ? 'none' : 'inline-block');
  moonIcons.forEach(el => el.style.display = isDark ? 'inline-block' : 'none');
  themeLabels.forEach(el => el.textContent = isDark ? 'Dark' : 'Light');
}

/* ================= PARTICLES BG ================= */
function injectParticlesBg() {
  if (document.querySelector('.particles-bg')) return;
  const bg = document.createElement('div');
  bg.className = 'particles-bg';
  bg.innerHTML = `
    <div class="particle" style="width:12px; height:12px; top:12%; left:10%; animation-delay:0s;"></div>
    <div class="particle" style="width:16px; height:16px; top:25%; left:85%; animation-delay:2s;"></div>
    <div class="particle" style="width:8px; height:8px; top:50%; left:20%; animation-delay:4s;"></div>
    <div class="particle" style="width:20px; height:20px; top:75%; left:70%; animation-delay:1s;"></div>
    <div class="particle" style="width:12px; height:12px; top:90%; left:40%; animation-delay:3s;"></div>
  `;
  document.body.prepend(bg);
}

/* ================= HEADER INJECTION ================= */
function injectHeader() {
  const headerContainer = document.getElementById('header-root');
  if (!headerContainer) return;

  const isDark = document.body.classList.contains('dark');

  headerContainer.innerHTML = `
    <header id="main-header" class="sticky top-0 z-40 w-full header-3d-bar">
      <div class="max-w-6xl mx-auto header-inner flex items-center justify-between">
        <!-- Left Group: Hamburger + Brand Logo -->
        <div class="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="btn-open-sidebar"
            aria-label="Open Navigation Menu"
            class="btn-3d-header btn-3d-header-round"
          >
            <i class="fa-solid fa-bars text-base"></i>
          </button>

          <a href="./index.html" class="flex items-center gap-2 group header-logo-link">
            <div class="logo-img-container">
              <img
                src="./assets/logo.png?v=2"
                alt="WebWorldBD"
                width="36"
                height="36"
                class="header-logo-img"
                onerror="this.style.display='none';"
              />
            </div>
            <span class="header-brand-text">
              <span class="brand-dark" data-i18n="brandName">${t('brandName')}</span><span class="brand-sky" data-i18n="brandBD">${t('brandBD')}</span>
            </span>
          </a>
        </div>

        <!-- Right Group: User Avatar + Theme Toggle + Language Toggle -->
        <div class="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <!-- Header User Avatar Dropdown (Hidden when logged out) -->
          <div id="header-user-wrapper" class="relative hidden">
            <button
              id="btn-header-avatar"
              aria-label="User Menu"
              class="btn-3d-avatar"
            >
              <div class="avatar-ring-outer">
                <div class="avatar-ring-inner">
                  <img id="header-avatar-img" class="w-full h-full object-cover hidden" alt="Profile">
                  <span id="header-avatar-initial" class="text-white font-black text-xs">U</span>
                </div>
              </div>
              <span class="avatar-online-dot"></span>
            </button>

            <!-- Dropdown Menu -->
            <div
              id="header-user-dropdown"
              class="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl py-2 hidden z-50 animate-fade-in-up"
            >
              <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
                <p id="header-dropdown-name" class="font-bold text-xs text-slate-900 dark:text-white truncate">User Name</p>
                <p id="header-dropdown-username" class="text-[10px] text-sky-500 dark:text-sky-400 font-semibold truncate">@username</p>
              </div>

              <!-- Admin Link placeholder container (dynamically populated) -->
              <div id="header-dropdown-admin-container"></div>

              <a href="./profile.html" class="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors">
                <i class="fa-solid fa-user text-sky-500 w-4 text-center"></i>
                <span data-i18n="myProfile">${t('myProfile')}</span>
              </a>

              <a href="./profile.html?edit=true" class="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors">
                <i class="fa-solid fa-pen-to-square text-sky-500 w-4 text-center"></i>
                <span data-i18n="editProfile">${t('editProfile')}</span>
              </a>

              <a href="./settings.html" class="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors">
                <i class="fa-solid fa-gear text-sky-500 w-4 text-center"></i>
                <span data-i18n="settings">${t('settings')}</span>
              </a>

              <div class="border-t border-slate-100 dark:border-slate-800/80 my-1"></div>

              <button
                id="btn-header-logout"
                class="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer text-left"
              >
                <i class="fa-solid fa-right-from-bracket w-4 text-center"></i>
                <span data-i18n="logOut">${t('logOut')}</span>
              </button>
            </div>
          </div>

          <button
            id="btn-toggle-theme"
            aria-label="Toggle Light/Dark Theme"
            class="btn-3d-header btn-3d-header-round btn-theme-toggle"
          >
            <i class="fa-solid fa-sun theme-icon-sun text-amber-500" style="display:${isDark ? 'none' : 'inline-block'};"></i>
            <i class="fa-solid fa-moon theme-icon-moon text-sky-400" style="display:${isDark ? 'inline-block' : 'none'};"></i>
          </button>

          <button
            id="btn-toggle-lang"
            aria-label="Toggle Language"
            class="btn-3d-header btn-3d-header-pill"
          >
            <i class="fa-solid fa-globe text-sky-500"></i>
            <span class="lang-toggle-text">${getLanguage() === 'en' ? 'BN' : 'EN'}</span>
          </button>
        </div>
      </div>
      <div class="header-bottom-glow-line"></div>
    </header>
  `;

  document.getElementById('btn-open-sidebar')?.addEventListener('click', openSidebar);
  document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-toggle-lang')?.addEventListener('click', toggleLanguage);

  // Header Avatar Dropdown Event Listeners
  const avatarBtn = document.getElementById('btn-header-avatar');
  const dropdown = document.getElementById('header-user-dropdown');

  avatarBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!dropdown?.contains(e.target) && !avatarBtn?.contains(e.target)) {
      dropdown?.classList.add('hidden');
    }
  });

  document.getElementById('btn-header-logout')?.addEventListener('click', async () => {
    dropdown?.classList.add('hidden');
    await logOut();
    showToast(getLanguage() === 'en' ? "Signed out successfully." : "সফলভাবে লগ আউট হয়েছে।", "success");
    safeRedirect('./index.html');
  });

  // Scroll height shrink listener
  window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (header) {
      if (window.scrollY > 10) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }
  });
}

/* ================= SIDEBAR INJECTION ================= */
function injectSidebar() {
  if (document.getElementById('sidebar-drawer')) return;

  const drawer = document.createElement('div');
  drawer.id = 'sidebar-drawer';
  drawer.className = 'fixed inset-0 z-50 flex sidebar-drawer-container';
  drawer.innerHTML = `
    <!-- Blurred Dark Backdrop -->
    <div id="sidebar-backdrop" class="fixed inset-0 sidebar-backdrop"></div>

    <!-- Drawer Panel Container -->
    <div class="relative h-full flex flex-col z-10 sidebar-panel-flat">

      <!-- Top Header -->
      <div class="sidebar-header-flat">
        <div class="flex items-center gap-2.5">
          <img
            src="./assets/logo.png?v=2"
            alt="WebWorldBD"
            width="36"
            height="36"
            class="h-9 w-auto object-contain"
            onerror="this.style.display='none';"
          />
          <span class="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            <span data-i18n="brandName">${t('brandName')}</span><span class="text-sky-400 font-black ml-0.5" data-i18n="brandBD">${t('brandBD')}</span>
          </span>
        </div>

        <button
          id="btn-close-sidebar"
          aria-label="Close Navigation"
          class="btn-flat-close cursor-pointer"
        >
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Content Body -->
      <div class="sidebar-content-scroll z-10">
        <!-- User Card -->
        <div id="sidebar-user-card" class="sidebar-user-card-flat cursor-pointer">
          <!-- Dynamically populated -->
        </div>

        <!-- MAIN MENU SECTION -->
        <div class="sidebar-section-block">
          <h3 class="sidebar-section-title" data-i18n="mainMenu">
            ${t('mainMenu')}
          </h3>
          <div class="sidebar-nav-list">
            <!-- Home -->
            <a
              href="./index.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="index.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-house"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="home">${t('home')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- Services -->
            <a
              href="./services.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="services.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-briefcase"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="services">${t('services')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- My Profile -->
            <button
              id="sidebar-my-profile"
              class="sidebar-nav-item sidebar-card-flat cursor-pointer"
              data-path="profile.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-user"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="myProfile">${t('myProfile')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </button>

            <!-- Start Project -->
            <a
              href="./start-project.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="start-project.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-rocket"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="startProject">${t('startProject')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- Live Chat (Opens livechat.html page) -->
            <a
              href="./livechat.html"
              class="sidebar-nav-item sidebar-card-flat relative"
              data-path="livechat.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile relative">
                  <i class="fa-solid fa-comments"></i>
                  <span class="live-chat-red-dot hidden"></span>
                </div>
                <span class="sidebar-item-text" data-i18n="liveChat">${t('liveChat')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- Connect -->
            <a
              href="./contact.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="contact.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-paper-plane"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="connect">${t('connect')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- Settings -->
            <a
              href="./settings.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="settings.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-gear"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="settings">${t('settings')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- Admin Panel (Conditional - rendered ONLY for Executive Admin) -->
            <a
              id="sidebar-admin-link"
              href="./admin.html"
              class="sidebar-nav-item sidebar-card-flat hidden"
              data-path="admin.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="adminPanel">${t('adminPanel')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <!-- Theme Switcher Card -->
            <div
              id="sidebar-toggle-theme"
              class="sidebar-card-flat cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-sun theme-icon-sun"></i>
                  <i class="fa-solid fa-moon theme-icon-moon" style="display:none;"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="theme">${t('theme')}</span>
              </div>
              <span class="sidebar-badge-pill theme-label-text">
                ${document.body.classList.contains('dark') ? 'Dark' : 'Light'}
              </span>
            </div>

            <!-- Language Switcher Card -->
            <div
              id="sidebar-toggle-lang"
              class="sidebar-card-flat cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-globe"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="language">${t('language')}</span>
              </div>
              <span class="sidebar-badge-pill lang-toggle-text">
                ${getLanguage() === 'en' ? 'EN' : 'BN'}
              </span>
            </div>
          </div>
        </div>

        <!-- LIVE PREVIEW SECTION -->
        <div class="sidebar-section-block">
          <h3 class="sidebar-section-title">
            LIVE PREVIEW
          </h3>
          <div class="sidebar-live-list">
            ${LIVE_PROJECTS.map(proj => `
              <a
                href="${proj.url}"
                target="_blank"
                rel="noopener noreferrer"
                class="sidebar-live-link sidebar-card-flat sidebar-card-live"
              >
                <div class="flex items-center gap-2.5">
                  <div class="sidebar-icon-tile">
                    <i class="fa-solid ${proj.icon}"></i>
                  </div>
                  <span class="sidebar-item-text">${proj.name}</span>
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square text-xs text-sky-400"></i>
              </a>
            `).join('')}
          </div>
        </div>

        <!-- OTHERS SECTION -->
        <div class="sidebar-section-block">
          <h3 class="sidebar-section-title" data-i18n="others">
            ${t('others')}
          </h3>
          <div class="sidebar-nav-list">
            <a
              href="./why-choose-me.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="why-choose-me.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-circle-check"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="whyChooseMe">${t('whyChooseMe')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <a
              href="./process.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="process.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-list-check"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="workProcess">${t('workProcess')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <a
              href="./faq.html"
              class="sidebar-nav-item sidebar-card-flat"
              data-path="faq.html"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-circle-question"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="faq">${t('faq')}</span>
              </div>
              <i class="fa-solid fa-chevron-right text-xs text-sky-500 opacity-0 active-chevron transition-opacity"></i>
            </a>

            <a
              href="${PRIVACY_POLICY_URL}"
              target="_blank"
              rel="noopener noreferrer"
              class="sidebar-card-flat cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <div class="sidebar-icon-tile">
                  <i class="fa-solid fa-file-contract"></i>
                </div>
                <span class="sidebar-item-text" data-i18n="privacyPolicy">${t('privacyPolicy')}</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square text-xs text-slate-400"></i>
            </a>
          </div>
        </div>

        <!-- CREATE ACCOUNT / LOG OUT SECTION -->
        <div id="sidebar-auth-section" class="sidebar-section-block">
          <!-- Dynamically updated -->
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(drawer);

  // Attach event handlers
  document.getElementById('btn-close-sidebar')?.addEventListener('click', closeSidebar);
  document.getElementById('sidebar-backdrop')?.addEventListener('click', closeSidebar);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  document.getElementById('sidebar-toggle-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('sidebar-toggle-lang')?.addEventListener('click', toggleLanguage);

  document.querySelectorAll('.sidebar-nav-item').forEach(el => {
    el.addEventListener('click', closeSidebar);
  });

  document.getElementById('sidebar-my-profile')?.addEventListener('click', () => {
    closeSidebar();
    if (!currentUser) {
      safeRedirect('./login.html');
    } else {
      safeRedirect('./profile.html');
    }
  });

  highlightActiveSidebarNav();
}

function highlightActiveSidebarNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav-item').forEach(el => {
    const targetPath = el.getAttribute('data-path');
    if (targetPath === currentPath || (currentPath === '' && targetPath === 'index.html')) {
      el.classList.add('active');
      const chevron = el.querySelector('.active-chevron');
      if (chevron) {
        chevron.classList.remove('opacity-0');
        chevron.classList.add('opacity-100');
      }
    } else {
      el.classList.remove('active');
      const chevron = el.querySelector('.active-chevron');
      if (chevron) {
        chevron.classList.add('opacity-0');
        chevron.classList.remove('opacity-100');
      }
    }
  });
}

export function openSidebar() {
  const drawer = document.getElementById('sidebar-drawer');
  if (drawer) {
    drawer.classList.add('is-open');
    document.body.classList.add('drawer-open');
  }
}

export function closeSidebar() {
  const drawer = document.getElementById('sidebar-drawer');
  if (drawer) {
    drawer.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
  }
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
}

/* ================= UPDATE AUTH DEPENDENT UI ================= */
function updateAuthDependentUI() {
  const userCard = document.getElementById('sidebar-user-card');
  const authSection = document.getElementById('sidebar-auth-section');
  const adminLink = document.getElementById('sidebar-admin-link');

  // Header Avatar UI updates
  const headerUserWrapper = document.getElementById('header-user-wrapper');
  const headerAvatarImg = document.getElementById('header-avatar-img');
  const headerAvatarInitial = document.getElementById('header-avatar-initial');
  const headerDropdownName = document.getElementById('header-dropdown-name');
  const headerDropdownUsername = document.getElementById('header-dropdown-username');

  if (currentUser) {
    const name = currentUserData?.name || currentUser.displayName || 'WebWorldBD User';
    const email = currentUser.email || '';
    const username = currentUserData?.username ? `@${currentUserData.username}` : '';
    const photoURL = currentUserData?.photoURL || currentUser.photoURL;
    const optimizedPhoto = getOptimizedImageUrl(photoURL, 128, 128);

    if (headerUserWrapper) {
      headerUserWrapper.classList.remove('hidden');
      if (headerDropdownName) headerDropdownName.textContent = name;
      if (headerDropdownUsername) headerDropdownUsername.textContent = username || email;

      if (optimizedPhoto) {
        if (headerAvatarImg) {
          headerAvatarImg.src = optimizedPhoto;
          headerAvatarImg.classList.remove('hidden');
          headerAvatarImg.onerror = () => {
            headerAvatarImg.classList.add('hidden');
            if (headerAvatarInitial) {
              headerAvatarInitial.textContent = name.charAt(0).toUpperCase();
              headerAvatarInitial.classList.remove('hidden');
            }
          };
        }
        if (headerAvatarInitial) headerAvatarInitial.classList.add('hidden');
      } else {
        if (headerAvatarImg) headerAvatarImg.classList.add('hidden');
        if (headerAvatarInitial) {
          headerAvatarInitial.textContent = name.charAt(0).toUpperCase();
          headerAvatarInitial.classList.remove('hidden');
        }
      }
    }

    if (userCard) {
      userCard.onclick = () => {
        closeSidebar();
        safeRedirect('./profile.html');
      };

      const avatarMarkup = photoURL
        ? `<img src="${getOptimizedImageUrl(photoURL, 128, 128)}" alt="${name}" width="40" height="40" class="absolute inset-0 w-full h-full object-cover object-top" onerror="this.src='./assets/logo.png?v=2'; this.className='absolute inset-0 w-full h-full object-contain p-1';">`
        : `<div class="w-full h-full bg-sky-500 flex items-center justify-center text-white font-extrabold text-xs">${name.charAt(0).toUpperCase()}</div>`;

      userCard.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          ${avatarMarkup}
          <span class="online-status-dot"></span>
        </div>
        <div class="overflow-hidden flex-1">
          <h4 class="font-bold text-slate-900 dark:text-white text-sm truncate">${name}</h4>
          ${username ? `<span class="text-[11px] text-sky-500 font-semibold block truncate">${username}</span>` : ''}
          <span class="text-[10px] text-slate-500 dark:text-slate-400 block truncate">${email}</span>
        </div>
        <a href="./profile.html?edit=true" onclick="event.stopPropagation();" aria-label="Edit Profile" class="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0">
          <i class="fa-solid fa-pencil text-[10px]"></i>
        </a>
      `;
    }
  } else {
    if (headerUserWrapper) headerUserWrapper.classList.add('hidden');

    if (userCard) {
      userCard.onclick = () => {
        closeSidebar();
        safeRedirect('./login.html');
      };
      userCard.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden relative bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <img src="./assets/logo.png?v=2" alt="Guest" width="40" height="40" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<span class=\'font-black text-xs text-sky-500\'>W</span>';">
          <span class="online-status-dot"></span>
        </div>
        <div class="overflow-hidden flex-1">
          <h4 class="font-bold text-slate-900 dark:text-white text-sm truncate" data-i18n="guest">${t('guest')}</h4>
          <span class="text-xs text-sky-500 dark:text-sky-400 font-medium block truncate" data-i18n="logIn">
            ${t('logIn')}
          </span>
        </div>
      `;
    }
  }

  if (authSection) {
    if (currentUser) {
      authSection.innerHTML = `
        <h3 class="sidebar-section-title" data-i18n="createAccount">
          ACCOUNT
        </h3>
        <button
          id="btn-sidebar-logout"
          class="sidebar-card-flat sidebar-card-logout cursor-pointer"
        >
          <div class="flex items-center gap-3">
            <div class="sidebar-icon-tile sidebar-icon-tile-logout">
              <i class="fa-solid fa-right-from-bracket"></i>
            </div>
            <span class="sidebar-item-text text-red-600 dark:text-red-400 font-bold" data-i18n="logOut">${t('logOut')}</span>
          </div>
        </button>
      `;

      document.getElementById('btn-sidebar-logout')?.addEventListener('click', async () => {
        closeSidebar();
        await logOut();
        showToast(getLanguage() === 'en' ? "Signed out successfully." : "সফলভাবে লগ আউট হয়েছে।", "success");
        safeRedirect('./index.html');
      });
    } else {
      authSection.innerHTML = `
        <h3 class="sidebar-section-title" data-i18n="createAccount">
          ${t('createAccount')}
        </h3>
        <div class="sidebar-auth-grid flex items-center justify-center gap-3 w-full">
          <a
            href="./login.html"
            class="sidebar-btn-login block"
            data-i18n="logIn"
          >
            ${t('logIn')}
          </a>
          <a
            href="./signup.html"
            class="sidebar-btn-signup block"
            data-i18n="signUp"
          >
            ${t('signUp')}
          </a>
        </div>
      `;
    }
  }

  // Render Admin Link ONLY for Executive Admin User
  const headerAdminContainer = document.getElementById('header-dropdown-admin-container');
  const sidebarNavList = document.querySelector('#sidebar-drawer .sidebar-nav-list');
  const existingDynamicSidebarBtn = document.getElementById('dynamic-sidebar-admin-btn');
  const existingDynamicHeaderBtn = document.getElementById('dynamic-header-admin-btn');

  const isAdmin = currentUser && isAdminUser(currentUser);

  if (isAdmin) {
    // 1. One-time Welcome Toast for Admin
    if (!sessionStorage.getItem('admin_welcomed')) {
      sessionStorage.setItem('admin_welcomed', 'true');
      const welcomeMsg = getLanguage() === 'en' ? 'Welcome back, Admin' : 'আবার স্বাগতম, এডমিন';
      showToast(welcomeMsg, 'success');
    }

    // 2. Admin Dashboard Button in Sidebar (Very TOP of MAIN MENU)
    if (sidebarNavList && !existingDynamicSidebarBtn) {
      const adminSidebarBtn = document.createElement('a');
      adminSidebarBtn.id = 'dynamic-sidebar-admin-btn';
      adminSidebarBtn.href = './admin.html';
      adminSidebarBtn.className = 'sidebar-nav-item sidebar-card-flat bg-gradient-to-r from-purple-600/10 via-sky-500/10 to-purple-600/10 border-purple-500/40 font-bold mb-1';
      adminSidebarBtn.setAttribute('data-path', 'admin.html');
      adminSidebarBtn.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="sidebar-icon-tile bg-purple-500/20 text-purple-600 dark:text-purple-400">
            <i class="fa-solid fa-shield-halved"></i>
          </div>
          <span class="sidebar-item-text text-purple-700 dark:text-purple-300 font-extrabold flex items-center gap-2">
            Admin Dashboard
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-purple-600 to-sky-500 text-white shadow-xs">ADMIN</span>
          </span>
        </div>
        <i class="fa-solid fa-chevron-right text-xs text-purple-500 opacity-0 active-chevron transition-opacity"></i>
      `;
      adminSidebarBtn.addEventListener('click', closeSidebar);
      sidebarNavList.insertBefore(adminSidebarBtn, sidebarNavList.firstChild);
    }

    // 3. Admin Dashboard Link as first item in Header Dropdown
    if (headerAdminContainer && !existingDynamicHeaderBtn) {
      headerAdminContainer.innerHTML = `
        <a id="dynamic-header-admin-btn" href="./admin.html" class="flex items-center gap-2.5 px-4 py-2.5 text-xs font-extrabold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors">
          <i class="fa-solid fa-shield-halved w-4 text-center text-purple-500"></i>
          <span class="flex items-center gap-1.5">
            Admin Dashboard
            <span class="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-600 text-white">ADMIN</span>
          </span>
        </a>
      `;
    }

    // 4. Update sidebar card tag for Admin
    if (userCard) {
      const cardTitle = userCard.querySelector('h4');
      if (cardTitle && !userCard.querySelector('.admin-tag')) {
        cardTitle.insertAdjacentHTML('beforeend', ` <span class="admin-tag ml-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">Admin</span>`);
      }
    }
  } else {
    // Non-admin / Logged out: remove dynamically created elements
    if (existingDynamicSidebarBtn) existingDynamicSidebarBtn.remove();
    if (headerAdminContainer) headerAdminContainer.innerHTML = '';
  }

  // Ensure legacy hidden admin links remain hidden
  if (adminLink) adminLink.classList.add('hidden');
}

/* ================= FOOTER INJECTION ================= */
function injectFooter() {
  const footerContainer = document.getElementById('footer-root');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="public-footer w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 pt-12 pb-8 px-4 transition-colors">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <!-- Column 1: Logo & Brief -->
          <div class="col-span-2 md:col-span-1 space-y-4">
            <a href="./index.html" class="flex items-center gap-2">
              <img
                src="./assets/logo.png?v=2"
                alt="WebWorldBD"
                width="36"
                height="36"
                class="h-9 w-auto object-contain filter drop-shadow-xs"
                onerror="this.style.display='none';"
              />
              <span class="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                WebWorld<span class="text-sky-400 font-black">BD</span>
              </span>
            </a>
            <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-normal" data-i18n="footerDesc">
              ${t('footerDesc')}
            </p>

            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-3" data-i18n="popularServices">
                ${t('popularServices')}
              </h4>
              <ul class="space-y-2 text-xs">
                ${['Business Website', 'E-commerce Website', 'Portfolio Website', 'Web App / SaaS', 'AI Website / Tools'].map(s => `
                  <li>
                    <a href="./services.html" class="hover:text-sky-500 transition-colors">${s}</a>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Column 2: Quick Links -->
          <div class="col-span-1 space-y-3">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-3" data-i18n="quickLinks">
              ${t('quickLinks')}
            </h4>
            <ul class="space-y-2.5 text-xs">
              <li><a href="./index.html" class="hover:text-sky-500 transition-colors" data-i18n="home">${t('home')}</a></li>
              <li><a href="./services.html" class="hover:text-sky-500 transition-colors" data-i18n="services">${t('services')}</a></li>
              <li><a href="./profile.html" class="hover:text-sky-500 transition-colors" data-i18n="myProfile">${t('myProfile')}</a></li>
              <li><a href="./start-project.html" class="hover:text-sky-500 transition-colors" data-i18n="startProject">${t('startProject')}</a></li>
              <li><a href="./livechat.html" class="hover:text-sky-500 transition-colors" data-i18n="liveChat">${t('liveChat')}</a></li>
              <li><a href="./contact.html" class="hover:text-sky-500 transition-colors" data-i18n="connect">${t('connect')}</a></li>
              <li><a href="./settings.html" class="hover:text-sky-500 transition-colors" data-i18n="settings">${t('settings')}</a></li>
              <li><a href="./why-choose-me.html" class="hover:text-sky-500 transition-colors" data-i18n="whyChooseMe">${t('whyChooseMe')}</a></li>
              <li><a href="./process.html" class="hover:text-sky-500 transition-colors" data-i18n="workProcess">${t('workProcess')}</a></li>
              <li><a href="./faq.html" class="hover:text-sky-500 transition-colors" data-i18n="faq">${t('faq')}</a></li>
            </ul>
          </div>

          <!-- Column 3 & 4: Contact Info -->
          <div class="col-span-1 md:col-span-2 space-y-3">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white mb-3" data-i18n="contactInfo">
              ${t('contactInfo')}
            </h4>
            <ul class="space-y-3 text-xs">
              <li class="flex items-center gap-2.5">
                <i class="fa-solid fa-location-dot text-sky-500"></i>
                <span data-i18n="location">Kushtia, Bangladesh</span>
              </li>
              <li class="flex items-center gap-2.5">
                <i class="fa-solid fa-envelope text-sky-500"></i>
                <a href="mailto:saripofficialsupport@gmail.com" class="hover:underline hover:text-sky-500 truncate">
                  saripofficialsupport@gmail.com
                </a>
              </li>
              <li class="flex items-center gap-2.5">
                <i class="fa-solid fa-phone text-sky-500"></i>
                <a href="tel:+8801342697743" class="hover:underline hover:text-sky-500">
                  +8801342697743
                </a>
              </li>
              <li class="flex items-center gap-2.5">
                <i class="fa-solid fa-headset text-sky-500"></i>
                <a href="tel:+8809658183506" class="hover:underline hover:text-sky-500">
                  +8809658183506
                </a>
              </li>
              <li class="flex items-center gap-2.5 pt-1">
                <i class="fa-brands fa-linkedin text-sky-500 text-sm"></i>
                <a
                  href="https://www.linkedin.com/in/sh-sarip-4066b2431"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:underline hover:text-sky-500 truncate font-medium text-sky-600 dark:text-sky-400"
                >
                  LinkedIn Profile
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p class="text-xs text-slate-500 dark:text-slate-400" data-i18n="copyright">
            ${t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  `;
}

/* ================= BOTTOM NAVIGATION BAR INJECTION ================= */
function injectBottomNav() {
  if (document.getElementById('bottom-nav-bar')) return;

  const rawPath = window.location.pathname.toLowerCase();
  const currentPath = rawPath.split('/').pop() || 'index.html';

  const isServicesActive = currentPath.includes('services');
  const isStartProjectActive = currentPath.includes('start-project');
  const isLiveChatActive = currentPath.includes('livechat');
  const isConnectActive = currentPath.includes('contact');
  const isHomeActive = !isServicesActive && !isStartProjectActive && !isLiveChatActive && !isConnectActive;

  let activeIndex = 0;
  if (isServicesActive) activeIndex = 1;
  else if (isStartProjectActive) activeIndex = 2;
  else if (isLiveChatActive) activeIndex = 3;
  else if (isConnectActive) activeIndex = 4;

  const nav = document.createElement('nav');
  nav.id = 'bottom-nav-bar';
  nav.className = 'bottom-nav-container public-bottom-nav';
  nav.setAttribute('aria-label', 'Mobile Bottom Navigation');

  nav.innerHTML = `
    <div class="bottom-nav-pill-3d">
      <!-- Animated Active Tab Pill Indicator -->
      <div class="bottom-nav-active-indicator" style="transform: translateX(calc(${activeIndex} * 100%));">
        <div class="bottom-nav-indicator-glow"></div>
      </div>

      <!-- 1. Home -->
      <a
        href="./index.html"
        class="bottom-nav-btn ${isHomeActive ? 'active' : ''}"
      >
        <div class="bottom-nav-icon-wrapper">
          <i class="fa-solid fa-house"></i>
        </div>
        <span class="bottom-nav-label" data-i18n="home">${t('home')}</span>
        <span class="bottom-nav-active-dot"></span>
      </a>

      <!-- 2. Services -->
      <a
        href="./services.html"
        class="bottom-nav-btn ${isServicesActive ? 'active' : ''}"
      >
        <div class="bottom-nav-icon-wrapper">
          <i class="fa-solid fa-layer-group"></i>
        </div>
        <span class="bottom-nav-label" data-i18n="services">${t('services')}</span>
        <span class="bottom-nav-active-dot"></span>
      </a>

      <!-- 3. Start Project (CENTER) -->
      <div class="bottom-nav-btn bottom-nav-center-col ${isStartProjectActive ? 'active' : ''}">
        <a
          href="./start-project.html"
          id="btn-bottom-start-project"
          class="bottom-nav-center-sphere"
          aria-label="Start Project"
        >
          <div class="sphere-glass-shine"></div>
          <i class="fa-solid fa-rocket sphere-rocket-icon"></i>
        </a>
        <span class="bottom-nav-label center-label" data-i18n="startProject">${t('startProject')}</span>
        <span class="bottom-nav-active-dot"></span>
      </div>

      <!-- 4. Live Chat -->
      <a
        href="./livechat.html"
        class="bottom-nav-btn ${isLiveChatActive ? 'active' : ''}"
        aria-label="Live Chat"
      >
        <div class="bottom-nav-icon-wrapper relative">
          <i class="fa-solid fa-comments"></i>
          <span class="live-chat-red-dot hidden"></span>
        </div>
        <span class="bottom-nav-label" data-i18n="liveChat">${t('liveChat')}</span>
        <span class="bottom-nav-active-dot"></span>
      </a>

      <!-- 5. Connect -->
      <a
        href="./contact.html"
        class="bottom-nav-btn ${isConnectActive ? 'active' : ''}"
      >
        <div class="bottom-nav-icon-wrapper">
          <i class="fa-solid fa-link"></i>
        </div>
        <span class="bottom-nav-label" data-i18n="connect">${t('connect')}</span>
        <span class="bottom-nav-active-dot"></span>
      </a>
    </div>
  `;

  document.body.appendChild(nav);

  // Center rocket button launch bounce tap handler
  const rocketBtn = document.getElementById('btn-bottom-start-project');
  rocketBtn?.addEventListener('click', (e) => {
    rocketBtn.classList.add('rocket-launch');
    setTimeout(() => rocketBtn.classList.remove('rocket-launch'), 500);
  });

  // Slide down bottom bar on input focus (virtual keyboard open)
  const inputs = 'input, textarea, select';
  document.addEventListener('focusin', (e) => {
    if (e.target.matches(inputs)) {
      nav.classList.add('is-keyboard-open');
    }
  });
  document.addEventListener('focusout', (e) => {
    if (e.target.matches(inputs)) {
      nav.classList.remove('is-keyboard-open');
    }
  });
}

/* ================= FLOATING BUTTONS INJECTION ================= */
function injectFloatingButtons() {
  if (document.getElementById('floating-buttons-root')) return;

  const floating = document.createElement('div');
  floating.id = 'floating-buttons-root';
  floating.className = 'fixed bottom-6 right-6 z-40 flex items-center gap-3';
  floating.innerHTML = `
    <!-- Scroll To Top Button -->
    <button
      id="btn-scroll-top"
      aria-label="Scroll to top"
      class="scroll-top w-12 h-12 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 items-center justify-center shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer hidden"
    >
      <i class="fa-solid fa-arrow-up text-lg"></i>
    </button>

    <!-- Floating Green WhatsApp Button -->
    <a
      href="https://wa.me/8801342697743"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      class="floating-whatsapp-glass floating-whatsapp cursor-pointer"
    >
      <i class="fa-brands fa-whatsapp text-2xl"></i>
    </a>
  `;

  document.body.appendChild(floating);

  const scrollTopBtn = document.getElementById('btn-scroll-top');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
      scrollTopBtn?.classList.remove('hidden');
      scrollTopBtn?.classList.add('flex');
    } else {
      scrollTopBtn?.classList.add('hidden');
      scrollTopBtn?.classList.remove('flex');
    }
  });

  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ================= MODALS INJECTION ================= */
function injectModals() {
  if (document.getElementById('modal-dialog-root')) return;

  const modalContainer = document.createElement('div');
  modalContainer.id = 'modal-dialog-root';
  modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 hidden';
  modalContainer.innerHTML = `
    <!-- Dark overlay backdrop -->
    <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"></div>

    <!-- Modal Dialog Card -->
    <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Modal Header -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
        <div class="flex items-center gap-2">
          <i id="modal-header-icon" class="fa-solid fa-info-circle text-sky-500 text-lg"></i>
          <h3 id="modal-header-title" class="font-bold text-base text-slate-900 dark:text-white capitalize"></h3>
        </div>

        <button
          id="btn-close-modal"
          aria-label="Close modal"
          class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div id="modal-body-content" class="p-5 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-sm">
      </div>
    </div>
  `;

  document.body.appendChild(modalContainer);

  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);
}

/* ================= LIVE CHAT WIDGET / NAVIGATION FUNCTION ================= */
export function openLiveChat() {
  const chatWidget = document.getElementById('chat-widget') ||
                     document.querySelector('.chat-widget') ||
                     document.getElementById('live-chat-container') ||
                     document.querySelector('.live-chat-container');

  if (chatWidget) {
    chatWidget.classList.remove('hidden');
    chatWidget.style.display = 'block';
    chatWidget.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    window.location.href = './livechat.html';
  }
}

if (typeof window !== 'undefined') {
  window.openLiveChat = openLiveChat;
}

export function openModal(modalType) {
  const modalContainer = document.getElementById('modal-dialog-root');
  const modalIcon = document.getElementById('modal-header-icon');
  const modalTitle = document.getElementById('modal-header-title');
  const modalBody = document.getElementById('modal-body-content');

  if (!modalContainer || !modalBody) return;

  modalContainer.classList.remove('hidden');

  let iconClass = 'fa-solid fa-info-circle text-sky-500';
  let titleText = t(modalType) || modalType;
  let bodyHTML = '';

  switch (modalType) {
    case 'settings':
      iconClass = 'fa-solid fa-gear text-sky-500';
      titleText = t('settings');
      bodyHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <i class="fa-solid fa-circle-half-stroke text-amber-500"></i>
              <span class="font-semibold">${t('theme')} Mode</span>
            </div>
            <button
              id="modal-toggle-theme"
              class="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-medium text-xs cursor-pointer"
            >
              Toggle Light/Dark
            </button>
          </div>

          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2.5">
              <i class="fa-solid fa-globe text-sky-500"></i>
              <span class="font-semibold">${t('language')}</span>
            </div>
            <button
              id="modal-toggle-lang"
              class="px-3 py-1.5 rounded-lg bg-sky-500 text-white font-medium text-xs cursor-pointer"
            >
              ${getLanguage() === 'en' ? 'বাংলা রূপান্তর' : 'Switch to English'}
            </button>
          </div>
        </div>
      `;
      break;

    default:
      titleText = t(modalType) || modalType;
      bodyHTML = `<p class="text-sm">${t(modalType) || 'Information'}</p>`;
  }

  modalIcon.className = iconClass;
  modalTitle.textContent = titleText;
  modalBody.innerHTML = bodyHTML;

  document.getElementById('modal-toggle-theme')?.addEventListener('click', () => {
    toggleTheme();
  });
  document.getElementById('modal-toggle-lang')?.addEventListener('click', () => {
    toggleLanguage();
    closeModal();
  });
}

export function closeModal() {
  const modalContainer = document.getElementById('modal-dialog-root');
  if (modalContainer) {
    modalContainer.classList.add('hidden');
  }
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
}

/* ================= TOAST NOTIFICATION SYSTEM ================= */
function injectToastContainer() {
  if (document.getElementById('toast-container')) return;
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
}

export function showToast(message, type = 'info') {
  injectToastContainer();
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconHTML = '<i class="fa-solid fa-circle-info"></i>';
  if (type === 'success') iconHTML = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') iconHTML = '<i class="fa-solid fa-circle-exclamation"></i>';

  toast.innerHTML = `
    ${iconHTML}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ================= COPY BUTTONS HANDLER FOR CONTACT CARDS ================= */
function initCopyCardButtons() {
  document.querySelectorAll('.btn-copy-card').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const msg = getLanguage() === 'en' ? 'Copied!' : 'অনুলিপি করা হয়েছে!';
        showToast(msg, 'success');
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          const msg = getLanguage() === 'en' ? 'Copied!' : 'অনুলিপি করা হয়েছে!';
          showToast(msg, 'success');
        } catch (err) {
          showToast('Failed to copy', 'error');
        }
        document.body.removeChild(textarea);
      });
    });
  });
}
