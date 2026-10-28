# WebWorldBD Fixes and Feature Implementations Log

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
