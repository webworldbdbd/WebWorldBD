# WebWorldBD - Changes and Fixes Log

## [2026-03-30] Critical Bug Fixes (Profile Loading, Sidebar Navigation & Menu Layout)

### Root Cause Analysis & Fixes Summary

#### FIX 1: Profile Page Stuck on Gray Loading Skeleton (`profile.html`, `js/auth.js`, `firestore.rules`)
- **Root Cause**:
  1. Incorrect ES module import path in `profile.html` and `settings.html`: `./cloudinary-config.js` instead of `./js/cloudinary-config.js`, causing a script loading error before auth initialization could complete.
  2. The skeleton hiding DOM logic was not wrapped in a `finally` block, leaving the gray skeleton box stuck on screen if Firestore reads failed, timed out, or returned permission errors.
- **Fix Applied**:
  1. Fixed module import paths to `./js/cloudinary-config.js`.
  2. Wrapped `onAuthStateChanged` profile document retrieval in `js/auth.js` with an 8-second timeout (`Promise.race`).
  3. Placed skeleton element removal (`profile-skeleton.classList.add('hidden')`) inside a guaranteed `finally` block in `profile.html`.
  4. Implemented fallback rendering using Firebase Auth user data (`displayName`, `email`, `photoURL`, `metadata.creationTime`) if Firestore document retrieval fails or times out, accompanied by a bilingual (EN/BN) friendly warning banner with a "Retry" button.
  5. Verified auto-creation of missing `users/{uid}` documents upon user session restoration.
  6. Updated `firestore.rules` to ensure owner read/write access for `users/{uid}`, public read and owner create/delete for `usernames/{username}`, and public create / admin-only read/write for `projectRequests`.

#### FIX 2: Sidebar User Card Mailto & Navigation Fix (`js/main.js`, all HTML files)
- **Root Cause**: Mobile web browsers and mailto wrapper links automatically treated email text inside the sidebar user card as `mailto:` links, opening default email applications when tapped.
- **Fix Applied**:
  1. Added `<meta name="format-detection" content="email=no, telephone=no, address=no">` across all HTML pages.
  2. Converted email and login text nodes in the sidebar user card to plain HTML `<span>` elements.
  3. Configured the entire user card (`#sidebar-user-card`) as a single interactive element navigating to `profile.html` when logged in or `login.html` when logged out, while closing the sidebar drawer.
  4. Preserved the quick "Edit" pencil button functionality with `event.stopPropagation()` to prevent nested click triggers.

#### FIX 3: Reordered "My Profile" in Main Navigation (`js/main.js`, `css/style.css`, `js/i18n.js`)
- **Fix Applied**:
  1. Moved "My Profile" from OTHERS section to MAIN MENU directly below "Services" in the sidebar drawer (New order: Home, Services, My Profile, Start Project, Live Chat, Connect, Settings, Theme, Language).
  2. Applied an indigo/purple gradient 3D glossy icon tile (`.icon-tile-profile`) and active-state highlight for `profile.html`.
  3. Maintained OTHERS section with: Why Choose Me, Work Process, FAQ, and Privacy Policy (opening `https://webworldbd-privacypolicy.pages.dev/` in a new tab).
  4. Updated menu list ordering in Header dropdown, Footer Quick Links, and i18n translation dictionaries.

---

## [2026-03-29] Premium Professional User Profile System & Cloudinary Integration

### Added Features & Enhancements
1. **Auto Profile Creation & Atomic Username Reservation (`js/auth.js`)**:
   - Inside `onAuthStateChanged` and `fetchOrCreateUserDoc`, user profile documents in `users/{uid}` are created automatically on login/signup (Google & Email/Password).
   - Generated usernames from email prefix with lowercase a-z and 0-9 sanitization, auto-padding, and 3-20 character length limits.
   - Guaranteed unique username reservation using Firestore transactions on `usernames/{username}`.
   - Debounced (500ms) live username availability check against `usernames` collection and blocked reserved words (`admin`, `administrator`, `root`, `support`, `webworldbd`, `official`, `system`, `moderator`, `help`, `api`, `null`, `undefined`).

2. **Cloudinary Unsigned Photo Upload (`js/cloudinary-config.js`)**:
   - Direct browser upload using unsigned upload preset `webworldbd`, cloud name `plpznnxh`, and folder `webworldbd_uploads`.
   - Real-time `XMLHttpRequest` upload progress bar and cancellation.
   - Client-side 512x512 canvas circle/square crop modal with interactive zoom and drag repositioning before upload.
   - Cloudinary image transformation URLs (`/c_fill,g_face,w_256,h_256,f_auto,q_auto/`) for ultra-fast loading.

3. **Premium Profile Page (`profile.html` & `edit-profile.html`)**:
   - 3D glass style matching sidebar, login, and contact pages.
   - Animated cover banner with floating shapes and circular avatar with glowing gradient ring and green online indicator dot.
   - User identity metadata: full name, `@username` with copy button and toast, email, email verification status badge/button, role badge (User / Admin), member since date.
   - Profile completion progress bar with contextual completion hints.
   - Glass cards for About (bio), Contact Information, Account Details, and Quick Actions.
   - Interactive Edit Profile slide-up modal with real-time validation, Bangladesh phone format validation, bio counter, and unsaved changes prompt.

4. **Header & Sidebar Integration (`js/main.js`)**:
   - Added round user avatar dropdown in top header opposite hamburger menu with quick links to Profile, Edit Profile, Settings, and Log Out.
   - Sidebar top user card displays photo/initials with gradient ring, green online dot, full name, `@username`, and direct Edit Profile pencil button.

5. **Security & Settings Enhancement (`settings.html`)**:
   - Change Password card for email/password accounts with current password reauthentication.
   - Email verification resend button.
   - Theme (Light/Dark/System), language (EN/BN), and notification preferences synced to Firestore `users/{uid}.preferences`.
   - Danger Zone account deletion requiring "DELETE" text confirmation and credential reauthentication.

6. **Firestore Security Rules (`firestore.rules`)**:
   - Owner-only write permissions for `users/{uid}` with immutable `role`, `uid`, and `createdAt` protections.
   - Length and character validation for name (2-50), bio (max 160), and username (`^[a-z0-9]{3,20}$`).
   - Transactional read/create/delete permissions for `usernames/{username}`.

### Manual Setup Confirmation Steps Required:
1. **Firestore Rules**: Publish the updated `firestore.rules` file in the Firebase Console under Firestore Database -> Rules.
2. **Cloudinary Console**: Confirm in Cloudinary Console (Settings > Upload) that upload preset `webworldbd` is set to **Unsigned**, allows folder `webworldbd_uploads`, and restricts allowed formats to `jpg`, `png`, and `webp`.
