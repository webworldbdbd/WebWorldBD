# WebWorldBD - Changes and Fixes Log

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
