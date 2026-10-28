# WebWorldBD Fixes and Feature Implementations Log

## Version 2.9.0 - Unified Atomic Project Requests & Shared Card Component

### Root Cause Analysis
- Previously, submitting a project request in `start-project.html` did not write to `projectRequests/{id}` and `chats/{uid}/messages` atomically, causing requests not to render as rich cards inside user and admin Live Chat conversations.
- Project requests lacked a single, standardized, responsive card component across the Admin Panel drawer, Live Chat inbox, and user profile views.
- WhatsApp message generation on the form needed bold asterisks, emojis, line breaks, and proper attachment URL fallbacks without writing to Firestore.

### Summary of Changes Implemented
1. **Atomic Batch Submission (`start-project.html`)**:
   - Refactored request submission to run in a single Firestore `writeBatch(db)`.
   - Atomically creates `projectRequests/{requestId}`, creates a `type: "request"` message in `chats/{uid}/messages`, and creates/updates `chats/{uid}` with `lastMessage: "📋 Project Request WW-XXXXXX"`.
   - Updated WhatsApp form button to build formatted text with `*bold*` labels, emojis, line breaks, and attachment URL without saving to Firestore.

2. **Unified Shared Request Card Component (`js/request-card.js`)**:
   - Created `renderRequestCardHtml()` with gradient title, ID badge (copy to clipboard), colored status chip, time ago + exact timestamp, client profile info with registered badge, details grid, quote-style requirements block with autolink and show more/less toggle, attachment preview/download, status dropdown, WhatsApp action, copy as text, print/PDF, and admin note auto-save.

3. **Admin Panel & Alerts (`js/admin.js` & `css/style.css`)**:
   - Updated request detail drawer to render the unified Request Card.
   - Added print stylesheet `@media print` in `css/style.css` so printing or saving to PDF outputs only the request card cleanly.
   - Preserved real-time sound, desktop notifications, toast alerts, unread badges, and glowing "NEW" tags.

4. **Live Chat Inbox Request Cards (`js/chat.js` & `js/admin.js`)**:
   - Render `type: "request"` messages as special wide cards with live status badges on both Admin and User sides in Live Chat conversations.

5. **Firestore Security Rules (`firestore.rules`)**:
   - Configured `chats/{uid}/messages` match rules to allow `type: "request"` for signed-in users with a `getAfter()` check requiring `projectRequests/{requestId}.userId == request.auth.uid`.

## Version 2.8.1 - Bengali Language Copy, Name Spelling, Brand Consistency & Layout Fixes

### Root Cause Analysis
1. **Name Spelling Inconsistency**:
   - The developer's name in Bengali mode was spelled incorrectly in several places as "শাফায়েত হোসেন সারিপ" instead of the exact spelling "সাফায়েত হোসেন ছারিফ".
2. **Brand Name Transliteration**:
   - In Bengali mode, the brand name was transliterated as "ওয়েবওয়ার্ল্ড" / "ওয়েবওয়ার্ল্ডবিডি" across header, sidebar, footer, user cards, copyright, and toasts instead of maintaining the exact English branding "WebWorldBD" ("WebWorld" in dark text + "BD" in sky blue).
3. **Home Page Bengali Copy & Card Highlights**:
   - Home page hero paragraph, action buttons, stats labels, Who I Am section badge/heading/subheading, and the four card contents needed exact wording replacements matching client specifications, with technical terms kept in English letters and highlighted using bold sky-blue styling.
4. **Who I Am Badge Alignment**:
   - In Bengali mode, the "আমার পরিচয়" pill badge sat beside the author heading due to `inline-block` layout on certain screen widths.
5. **Bengali Typography & Mobile Layout Scale**:
   - Bengali conjuncts rendered with standard fallback fonts lacking line-height optimization, and setting document language attribute was missing when toggling languages.
   - Background orb containers or long tab labels caused slight viewport width calculation issues on 360px screens.

### Summary of Changes Implemented
1. **Name Spelling Correction**:
   - Updated all Bengali occurrences of the developer's name across `js/i18n.js`, `js/admin.js`, `js/main.js`, `js/auth.js`, and HTML files to `সাফায়েত হোসেন ছারিফ`.
   - Preserved exact English name `SHAFAET HOSSEN SARIP` in English mode.
2. **Brand Name Consistency ("WebWorldBD")**:
   - Updated dictionary brand keys to `brandName: 'WebWorld'` and `brandBD: 'BD'` in both English and Bengali dictionaries.
   - Replaced all Bengali brand transliterations ("ওয়েবওয়ার্ল্ডবিডি" / "ওয়েবওয়ার্ল্ড") with `WebWorldBD`.
3. **Exact Home Page Bengali Copy & Card Formatting**:
   - Updated hero paragraph, buttons ("সকল লাইভ প্রজেক্ট দেখুন", "লাইভ চ্যাট"), stat labels ("সম্পন্ন প্রজেক্ট", "সন্তুষ্ট ক্লায়েন্ট", "স্যাটিসফ্যাকশন রেট"), and Who I Am card contents word-for-word.
   - Updated `applyTranslations()` in `js/i18n.js` to render inner HTML markup when HTML tags are present, preserving sky-blue/bold highlights on technical terms and red/bold highlights on "Gambling বা Betting Website".
4. **Who I Am Layout Fix**:
   - Restructured the Who I Am header container in `index.html` into a vertical flex stack (`flex flex-col items-center`), ensuring the "আমার পরিচয়" badge sits centered strictly ABOVE the author heading across all screen sizes and languages.
5. **Typography & Layout Bug Fix**:
   - Imported `Hind Siliguri` Google Font in `css/style.css` and added CSS rules for `html[lang="bn"]` with 1.7 line-height and crisp heading weight.
   - Updated `setLanguage(lang)` and `applyTranslations()` to explicitly set `document.documentElement.setAttribute('lang', lang)`.
   - Verified 100% scale without horizontal scroll or overflow across 360px, 390px, and 430px viewports in light and dark mode, confirming bottom navigation bar visibility and smooth language toggled switching without page reload.

## Version 2.8.0 - Real-Time Project Requests & Live Tracking System

### Root Cause Analysis
- Previously, project request submissions on `start-project.html` were saved as basic document entries without authenticated user validation, client-side rate limiting, Cloudinary progress cancellation, or complete schema fields (`requestId`, `seenByAdmin`, `adminNote`, `language`, `source`, structured `attachment` object).
- The admin panel (`admin.html` / `js/admin.js`) lacked real-time notification alerts (sound, desktop notifications, unread badges, glowing "NEW" tags) and complete request detail drawer inspection features.
- Users lacked a dedicated real-time "My Requests" live status tracker on `profile.html`.

### Summary of Changes Implemented
1. **Firestore Security Rules (`firestore.rules`)**:
   - Updated `projectRequests/{requestId}` match rules to require user authentication (`request.auth != null`), schema key validation (`hasOnly`), strict field length limits (`requirements <= 3000`, `name <= 80`, `mobile <= 20`, `email <= 120`, `budget <= 60`, `category <= 80`), non-blocked account status (`users/{uid}.blocked != true`), and read access restricted to owner or admin.

2. **Start Project Form (`start-project.html`)**:
   - Enforced user authentication for submitting requests with login redirection; kept WhatsApp message button accessible to all.
   - Added client-side field validation for mobile number (BD format), category selection, requirements (10–3000 chars), email format, and budget (<60 chars) with translated errors shown under each field.
   - Implemented Cloudinary unsigned upload to `webworldbd_uploads/requests` folder with live progress tracking and cancellation.
   - Saves structured document fields (`requestId`, `name`, `mobile`, `email`, `budget`, `category`, `requirements`, `attachment`, `userId`, `userName`, `username`, `userEmail`, `userPhoto`, `status`, `seenByAdmin`, `adminNote`, `createdAt`, `updatedAt`, `language`, `source`).
   - Ensures `chats/{uid}` stub exists on request creation so admins can immediately initiate live chat.
   - Shows an animated success screen with Request ID, Admin Settings auto-reply text, and quick action links.
   - Enforces rate limiting (1 request per 60s per user) with countdown timer and double-submit block.

3. **Admin Panel (`admin.html` & `js/admin.js`)**:
   - Real-time `onSnapshot` listener on `projectRequests` (newest first, with "Load More" pagination).
   - Real-time alerts: sound alert, in-panel toast, desktop notification, badge counters on sidebar, bottom tab, topbar bell, dashboard "New Requests" counter, and tab title `(N) New request`.
   - Glowing "NEW" chip for unread requests until opened (`seenByAdmin: true`).
   - Request Detail Drawer: full field display, copy buttons, attachment preview/download, user profile summary, private admin note, and actions ("Message user", "WhatsApp", "Call", "Email", "Delete").
   - Filter tabs, search bar, sorting, and CSV export.

4. **User Profile Live Tracking (`profile.html`)**:
   - Added real-time "My Requests" list on `profile.html` displaying Request ID, category, date, attachment link, status chip, and status explanation.
   - Displays live toast notifications whenever the admin changes request status.
   - Friendly empty state with "Start a Project" button.

5. **Internationalization (`js/i18n.js`)**:
   - Added complete English and Bengali translations for Start Project form errors, My Requests status explanations, and admin request drawer elements.

## Version 2.7.0 - Admin Panel Public UI Isolation, Header Search & Dashboard Data Fixes

### Root Cause Analysis
1. **Public Bottom Bar Overlaying Admin Tabs**:
   - `js/main.js` previously executed public site injections (`injectHeader`, `injectSidebar`, `injectFooter`, `injectFloatingButtons`, `injectBottomNav`) unconditionally on every page load, including `admin.html`. This rendered the public floating WhatsApp button, scroll-to-top button, and public bottom navigation bar on top of the admin panel's own bottom tab bar.
2. **Header Search Box Text Truncation**:
   - The global search container on the admin top bar used fixed width utility classes (`w-40 sm:w-64 md:w-80`) with a static long placeholder `"Search users, chats, msgs..."`, causing text overflow and overlap on screen widths under 480px.
3. **Dashboard Counters and Charts Showing 0 / Empty**:
   - `subscribeDashboardData()` queried collections with restrictive limits (`limit(100)`) and did not robustly convert Firestore `Timestamp` objects (`toDate()` or `.seconds`) vs ISO string representations.
   - Snapshot subscription error callbacks were unhandled, silently masking permission or network failures.

### Summary of Changes Implemented
1. **Public UI Isolation on `admin.html` & Dark 3D Admin Tab Bar**:
   - Updated `js/main.js` to detect `admin.html`, add `document.body.classList.add("admin-page")`, and skip injecting public header, sidebar, footer, floating buttons, and public bottom bar.
   - Added safety net CSS rules in `css/style.css` (`body.admin-page .public-bottom-nav, body.admin-page #bottom-nav-bar, ... { display: none !important; }`) and set `padding-bottom: 0 !important;` on `body.admin-page`.
   - Redesigned the admin panel's own bottom tab bar with a dark glass 3D look (`.admin-bottom-tab-bar`), 12px side margins, rounded 26px corners, glowing active tabs, live badges, safe-area insets, and auto-hide behavior when the admin menu drawer or on-screen keyboard is active.
2. **Responsive Header Search Box**:
   - Refactored the search field container to `flex-1 min-width: 0 max-w-xs sm:max-w-sm md:max-w-md`.
   - Added dynamic search placeholder logic shortening to `"Search..."` (English) / `"খুঁজুন..."` (Bengali) on screens below 480px.
3. **Real-time Dashboard Data Subscriptions & Charts**:
   - Removed artificial limit filters on total counts in `js/admin.js` to query complete collections (`users`, `projectRequests`, `chats`).
   - Added `parseDocDate()` helper supporting Firestore `Timestamp.toDate()`, `.seconds`, ISO strings, and Date objects. Users without `createdAt` are still counted toward total users.
   - Added friendly "No data yet" states for empty 14-day trend line and category donut charts.
   - Added snapshot error handling that renders a clear error banner with a "Retry" button upon Firestore read failure.

## Version 2.6.0 - Admin Detection Flow & Header Layout Fixes

### Root Cause Analysis
Previously, client-side admin checks either depended on the Firestore user document `role` field (which stays `"user"` for normal accounts created in Firestore unless manually escalated) or inconsistent logic that failed to verify `emailVerified === true` simultaneously across all pages. As a result, signing in with the admin Gmail (`webworldbd.lmt@gmail.com`) was treated as a standard user, preventing access to admin tools and displaying the `"USER"` role badge.

### Summary of Changes Implemented
1. **Unified `isAdminUser(user)` Helper**:
   - Created `isAdminUser(user)` in `js/auth.js` (re-exported in `js/admin-config.js`) that returns `true` ONLY when `user.email.trim().toLowerCase() === "webworldbd.lmt@gmail.com"` and `user.emailVerified === true`.
   - Updated `subscribeAuthState` in `js/auth.js` to set `document.body.dataset.role = isAdmin ? "admin" : "user"` and fire a custom `'auth-ready'` event containing `{ user, userData, isAdmin }`.

2. **Admin Dashboard Dynamic Injection & UI Updates**:
   - For the admin user, dynamically creates and inserts "Admin Dashboard" at the very top of the left sidebar main menu (above Home) with gradient highlight, shield icon, and "ADMIN" badge.
   - Dynamically injects "Admin Dashboard" as the first item in the header user avatar dropdown menu.
   - Adds a small "Admin" tag next to the user's name in the sidebar card and shows a one-time welcome toast ("Welcome back, Admin" / "আবার স্বাগতম, এডমিন").
   - Updates `profile.html` so the profile badge shows gold/purple gradient `"ADMIN"` with a crown icon and displays the `"Open Admin Dashboard"` button.

3. **Strict Non-Admin Guard & Redirection**:
   - Ensures admin DOM buttons/links are completely omitted from the HTML/DOM for regular users and logged-out visitors.
   - Updated `admin.html` and `js/admin.js` to wait for `'auth-ready'` with a full-screen "Checking access..." loader. Unauthenticated visitors are sent to `login.html?next=admin.html`, while non-admin accounts are silently redirected to `index.html`.
   - Updated `login.html` and `signup.html` post-auth redirect logic to validate same-site relative `next` parameters.

4. **Mobile Header Overlap Fix**:
   - Added CSS rule `@media (max-width: 419px)` to hide `.header-brand-text` below 420px viewport width while keeping logo icon, 36px avatar, hamburger, theme, and language buttons with equal spacing on 360px, 390px, and 430px screens.

## Version 2.5.0 - Live Chat & Executive Admin Control System

### Part A: User Live Chat System (`livechat.html` & `js/chat.js`)
- Added real-time user live chat with 3D glass Messenger-style UI.
- Implemented media attachments up to 30MB (JPG, PNG, WEBP, GIF, PDF, DOC/DOCX, XLS/XLSX, TXT, ZIP, MP4, MP3).
- Added client-side executable blocker preventing `.exe`, `.apk`, `.bat`, `.js`, `.sh` uploads.
- Integrated Cloudinary unsigned auto upload to `webworldbd_uploads/chat` folder with upload progress tracking and cancellation.
- Implemented client-side image compression for files over 2000px width/height.
- Added message status indicators (sent, delivered, read), typing indicator, date separators, rate limiting (1 msg/sec, 2000 chars limit), and sound/tab title notifications.

### Part B: Premium Admin Panel (`admin.html` & `js/admin.js`)
- Created executive admin panel exclusively accessible by `webworldbd.lmt@gmail.com` (UID: `dS9uZZToHTUPP1Q3DiWiG25D3Xt2`).
- Implemented complete security rules in `firestore.rules` verifying email, UID, and `email_verified`.
- Added client guard that keeps `admin.html` completely blank until auth resolves and silently redirects unauthorized users.
- Built 8 complete admin sections:
  1. **Dashboard:** Real-time user/request/chat counters, recent activity streams, and quick action buttons.
  2. **Live Chat Inbox:** Messenger split view with search, filter tabs (All, Unread, Open, Closed, Pinned, Blocked), quick replies drawer (`/` trigger), and batch update sending.
  3. **Project Requests:** Real-time table with status updates (New, Contacted, In Progress, Completed, Rejected), WhatsApp direct links, and CSV export.
  4. **Users Directory:** Full user list with provider, join date, user profile deletion, and CSV export.
  5. **Content Manager:** Live Projects editor saving to `siteConfig/main`.
  6. **Site Control:** Maintenance mode toggle and global feature flags.
  7. **Activity Log:** Audit trail logging admin actions to `adminLogs` with log purge.
  8. **Settings:** Executive identity and system controls.
