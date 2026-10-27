# WebWorldBD - Pure Static Multi-Page Website

WebWorldBD is a pure static website built with HTML5, CSS3, vanilla JavaScript (ES modules), and Firebase Auth / Firestore. It runs directly on GitHub Pages with zero build steps or Node.js dependencies.

## Features & Page Structure
- `/index.html` - Home Page (Hero, Stats, Who I Am, Tech Stack, Live Portfolios)
- `/services.html` - High-Performance Custom Web Services & Ethical Commitment Policy
- `/contact.html` - Support Hotline, Email, WhatsApp, Social Networks & Fiverr Gigs
- `/login.html` - User Authentication Login & Google OAuth
- `/signup.html` - Account Creation & Firestore User Profile Sync
- `/forgot-password.html` - Password Reset Link Request
- `/profile.html` - Premium Glass User Profile System (Auto profile creation, atomic username reservation, photo cropping & Cloudinary unsigned upload)
- `/edit-profile.html` - Edit Profile wrapper redirecting to profile editor
- `/settings.html` - System preferences, theme/lang sync, change password & danger zone account deletion
- `/livechat.html` - Real-time User Live Chat (Messenger UI, 30MB Cloudinary attachments, auto-reconnection & read status)
- `/admin.html` - Protected Executive Management Dashboard (`webworldbd.lmt@gmail.com`)
- `/404.html` - Catch-all redirection for GitHub Pages routing
- `/css/style.css` - Custom 3D glassmorphism, responsive styles, animations & theme CSS
- `/js/admin-config.js` - Executive Admin identity configuration and client authorization guards
- `/js/chat.js` - User-side live chat realtime synchronization, file upload validation, and typing indicators
- `/js/admin.js` - Executive dashboard controller, Messenger split view inbox, requests, users, content manager, site control & audit logging
- `/js/cloudinary-config.js` - Cloudinary unsigned upload configuration and media compression utilities
- `/js/main.js` - Dynamic header/sidebar drawer, header user dropdown, theme/language toggling, floating particles, toast alerts
- `/js/i18n.js` - Complete English and Bengali translation system
- `/js/firebase-config.js` & `/js/auth.js` - Firebase v10 CDN ES modules for Auth & Firestore integration

## Admin Setup & Firestore Composite Indexes
Executive privileges are exclusively granted to:
- **Admin Email:** `webworldbd.lmt@gmail.com`
- **Admin UID:** `dS9uZZToHTUPP1Q3DiWiG25D3Xt2`

### Firestore Required Composite Indexes
If ordering or querying messages by `createdAt` in combination with Firestore queries, create the following index in Firebase Console:

1. **Collection ID:** `messages` (Group / Sub-collection under `chats/{uid}/messages`)
   - Field 1: `createdAt` ASCENDING
   - Direct Firebase Index Link: `https://console.firebase.google.com/v1/r/project/web-worldbd/firestore/indexes?create_composite=Cg9jaGF0cy97dWlkfS9tZXNzYWdlcxACGg0KCWNyZWF0ZWRBdBAB`

2. **Collection ID:** `chats`
   - Field 1: `lastMessageAt` DESCENDING
   - Direct Firebase Index Link: `https://console.firebase.google.com/v1/r/project/web-worldbd/firestore/indexes?create_composite=CghjaGF0cxABGg4KCWxhc3RNZXNzYWdlQXQQARoMCghfbmFtZV9fEAE`

## Deployment
Deployed on GitHub Pages at: [https://webworldbdbd.github.io/WebWorldBD/](https://webworldbdbd.github.io/WebWorldBD/)
