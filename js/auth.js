import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  sendEmailVerification,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, googleProvider, db } from "./firebase-config.js";

export const ADMIN_EMAIL = "webworldbd.lmt@gmail.com";

/**
 * Checks if the given user object meets admin credentials based on email and emailVerified status.
 * @param {Object} user - Firebase User object
 * @returns {boolean}
 */
export function isAdminUser(user) {
  if (!user) return false;
  const email = (user.email || '').trim().toLowerCase();
  const targetEmail = ADMIN_EMAIL.trim().toLowerCase();
  return email === targetEmail && user.emailVerified === true;
}

export const RESERVED_USERNAMES = [
  "admin", "administrator", "root", "support", "webworldbd",
  "official", "system", "moderator", "help", "api", "null", "undefined"
];

/* ================= USERNAME UTILITIES ================= */

/**
 * Converts input string to valid username format: lowercase a-z and 0-9 only.
 */
export function sanitizeUsernameInput(input) {
  if (!input) return "";
  return input.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
}

/**
 * Checks if a username is in the reserved list.
 */
export function isReservedUsername(username) {
  if (!username) return true;
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}

/**
 * Sanitizes base email prefix or string, ensuring min 3 chars and max 20 chars.
 */
export function generateBaseUsername(emailOrName) {
  let base = "";
  if (emailOrName && emailOrName.includes("@")) {
    base = emailOrName.split("@")[0];
  } else if (emailOrName) {
    base = emailOrName;
  }
  base = sanitizeUsernameInput(base);

  while (base.length < 3) {
    base += Math.floor(Math.random() * 10);
  }
  return base.slice(0, 20);
}

/**
 * Checks availability of username in Firestore "usernames/{username}".
 * Returns { available: boolean, reason?: string }
 */
export async function checkUsernameAvailability(username) {
  const sanitized = sanitizeUsernameInput(username);
  if (sanitized.length < 3) {
    return { available: false, reason: "TOO_SHORT" };
  }
  if (sanitized.length > 20) {
    return { available: false, reason: "TOO_LONG" };
  }
  if (isReservedUsername(sanitized)) {
    return { available: false, reason: "RESERVED" };
  }

  try {
    const userRef = doc(db, "usernames", sanitized);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return { available: false, reason: "TAKEN" };
    }
    return { available: true, username: sanitized };
  } catch (err) {
    console.error("Error checking username availability:", err);
    return { available: false, reason: "ERROR" };
  }
}

/**
 * Auto-generates a unique username and reserves it atomically in "usernames/{username}"
 */
export async function generateAndReserveUniqueUsername(userUid, emailOrName) {
  let candidate = generateBaseUsername(emailOrName);
  let attempts = 0;

  while (attempts < 15) {
    let testUsername = candidate;
    if (attempts > 0 || isReservedUsername(testUsername)) {
      const suffix = Math.floor(100 + Math.random() * 900).toString();
      const allowedBaseLen = 20 - suffix.length;
      testUsername = candidate.slice(0, allowedBaseLen) + suffix;
    }

    if (isReservedUsername(testUsername)) {
      attempts++;
      continue;
    }

    try {
      const reserved = await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, "usernames", testUsername);
        const usernameSnap = await transaction.get(usernameRef);
        if (usernameSnap.exists()) {
          return false;
        }
        transaction.set(usernameRef, {
          uid: userUid,
          createdAt: new Date().toISOString()
        });
        return true;
      });

      if (reserved) {
        return testUsername;
      }
    } catch (err) {
      console.warn("Transaction attempt failed for username:", testUsername, err);
    }
    attempts++;
  }

  // Fallback guaranteed random username
  const fallback = ("user" + Math.floor(100000 + Math.random() * 900000)).slice(0, 20);
  try {
    await setDoc(doc(db, "usernames", fallback), {
      uid: userUid,
      createdAt: new Date().toISOString()
    });
  } catch (e) {
    console.error("Fallback username setDoc error:", e);
  }
  return fallback;
}

/* ================= AUTHENTICATION FUNCTIONS ================= */

export async function signUp(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (name) {
      await updateProfile(user, { displayName: name });
    }

    const userData = await fetchOrCreateUserDoc(user, name);
    return { user, userData };
  } catch (error) {
    throw parseAuthError(error);
  }
}

export async function logIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userData = await fetchOrCreateUserDoc(user);
    return { user, userData };
  } catch (error) {
    throw parseAuthError(error);
  }
}

export async function logInWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const user = userCredential.user;
    const userData = await fetchOrCreateUserDoc(user);
    return { user, userData };
  } catch (error) {
    throw parseAuthError(error);
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    throw parseAuthError(error);
  }
}

export async function logOut() {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    throw parseAuthError(error);
  }
}

/* ================= PROFILE AUTO CREATION & FETCH ================= */

export async function fetchOrCreateUserDoc(user, signupName = "") {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  const nowIso = new Date().toISOString();

  let resultData = null;

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const existingData = docSnap.data();
      const updates = {
        lastLoginAt: nowIso,
        emailVerified: user.emailVerified || false
      };
      await updateDoc(userRef, updates);
      resultData = { ...existingData, ...updates };
    } else {
      // New user auto-creation
      const displayName = signupName || user.displayName || user.email?.split("@")[0] || 'User';
      const provider = user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'password';
      const username = await generateAndReserveUniqueUsername(user.uid, user.email || displayName);

      const newUserData = {
        uid: user.uid,
        name: displayName,
        email: user.email || '',
        photoURL: user.photoURL || '',
        username: username,
        bio: '',
        phone: '',
        createdAt: nowIso,
        lastLoginAt: nowIso,
        role: (user.email && user.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : 'user',
        provider: provider,
        emailVerified: user.emailVerified || false,
        preferences: {
          theme: localStorage.getItem('webworldbd_theme') || 'light',
          language: localStorage.getItem('webworldbd_lang') || 'en',
          notifications: {
            projectUpdates: localStorage.getItem('webworldbd_notif_project') !== 'false',
            promotionalEmails: localStorage.getItem('webworldbd_notif_promo') === 'true'
          }
        }
      };

      await setDoc(userRef, newUserData);
      resultData = newUserData;
    }

    // Auto create or update chats/{uid} conversation stub for every account
    try {
      const chatRef = doc(db, "chats", user.uid);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          uid: user.uid,
          userName: resultData.name || 'User',
          userEmail: resultData.email || '',
          userPhoto: resultData.photoURL || '',
          username: resultData.username || '',
          phone: resultData.phone || '',
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
          createdAt: nowIso,
          tags: [],
          adminNote: ''
        });
      } else {
        await updateDoc(chatRef, {
          userName: resultData.name || 'User',
          userEmail: resultData.email || '',
          userPhoto: resultData.photoURL || '',
          username: resultData.username || '',
          phone: resultData.phone || ''
        });
      }
    } catch (chatErr) {
      console.warn("Auto chat stub sync warning:", chatErr);
    }

    return resultData;
  } catch (err) {
    console.warn("Firestore fetch/create error, using fallback:", err);
    return {
      uid: user.uid,
      name: signupName || user.displayName || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      username: generateBaseUsername(user.email || 'user'),
      bio: '',
      phone: '',
      createdAt: nowIso,
      lastLoginAt: nowIso,
      role: (user.email && user.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : 'user',
      provider: 'password',
      emailVerified: user.emailVerified || false,
      preferences: { theme: 'light', language: 'en' }
    };
  }
}

export function subscribeAuthState(callback) {
  if (window.__TEST_MODE__ && window.__TEST_USER__) {
    setTimeout(() => callback(window.__TEST_USER__, window.__TEST_USER_DATA__), 50);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      let userData = null;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("FIRESTORE_TIMEOUT")), 8000);
        });
        userData = await Promise.race([
          fetchOrCreateUserDoc(user),
          timeoutPromise
        ]);
      } catch (err) {
        console.warn("subscribeAuthState Firestore fetch error, using fallback userData:", err);
        const displayName = user.displayName || user.email?.split("@")[0] || 'User';
        const nowIso = new Date().toISOString();
        userData = {
          uid: user.uid,
          name: displayName,
          email: user.email || '',
          photoURL: user.photoURL || '',
          username: generateBaseUsername(user.email || displayName),
          bio: '',
          phone: '',
          createdAt: user.metadata?.creationTime ? new Date(user.metadata.creationTime).toISOString() : nowIso,
          lastLoginAt: nowIso,
          role: (user.email && user.email.toLowerCase() === ADMIN_EMAIL) ? 'admin' : 'user',
          provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'password',
          emailVerified: user.emailVerified || false,
          preferences: { theme: 'light', language: 'en' },
          firestoreError: err
        };
      }

      const isAdmin = isAdminUser(user);
      document.body.dataset.role = isAdmin ? "admin" : "user";

      callback(user, userData);

      document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user, userData, isAdmin }
      }));
    } else {
      document.body.dataset.role = "guest";
      callback(null, null);

      document.dispatchEvent(new CustomEvent('auth-ready', {
        detail: { user: null, userData: null, isAdmin: false }
      }));
    }
  });
}

/* ================= USER PROFILE UPDATE OPERATIONS ================= */

/**
 * Updates full user profile (name, bio, phone, photoURL, and optional username change)
 */
export async function updateUserProfileData(user, { name, username, bio, phone, photoURL }) {
  if (!user) throw new Error("NO_USER");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("USER_NOT_FOUND");

  const currentData = userSnap.data();
  const oldUsername = currentData.username;
  const newUsername = sanitizeUsernameInput(username);

  let updatedUsername = oldUsername;

  // 1. If username is changing, execute transaction
  if (newUsername && newUsername !== oldUsername) {
    const check = await checkUsernameAvailability(newUsername);
    if (!check.available) {
      throw new Error(`USERNAME_${check.reason}`);
    }

    await runTransaction(db, async (transaction) => {
      const newUsernameRef = doc(db, "usernames", newUsername);
      const newSnap = await transaction.get(newUsernameRef);
      if (newSnap.exists()) {
        throw new Error("USERNAME_TAKEN");
      }

      // Create new username doc
      transaction.set(newUsernameRef, {
        uid: user.uid,
        createdAt: new Date().toISOString()
      });

      // Delete old username doc if it existed
      if (oldUsername) {
        const oldUsernameRef = doc(db, "usernames", oldUsername);
        transaction.delete(oldUsernameRef);
      }

      // Update user doc with new username
      transaction.update(userRef, {
        username: newUsername,
        name: name,
        bio: bio || '',
        phone: phone || '',
        photoURL: photoURL !== undefined ? photoURL : currentData.photoURL
      });
    });

    updatedUsername = newUsername;
  } else {
    // Standard update
    const fieldsToUpdate = {
      name: name,
      bio: bio || '',
      phone: phone || ''
    };
    if (photoURL !== undefined) {
      fieldsToUpdate.photoURL = photoURL;
    }
    await updateDoc(userRef, fieldsToUpdate);
  }

  // 2. Update Firebase Auth Profile
  try {
    const authProfileUpdates = {};
    if (name) authProfileUpdates.displayName = name;
    if (photoURL !== undefined) authProfileUpdates.photoURL = photoURL;
    await updateProfile(user, authProfileUpdates);
  } catch (err) {
    console.warn("Firebase Auth updateProfile warning:", err);
  }

  // Return full updated profile
  const finalSnap = await getDoc(userRef);
  return finalSnap.data();
}

/**
 * Reauthenticates user and changes account password
 */
export async function changeUserPassword(user, currentPassword, newPassword) {
  if (!user || !user.email) throw new Error("NO_USER");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);

  try {
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    throw parseAuthError(error);
  }
}

/**
 * Sends verification email to current user
 */
export async function sendEmailVerificationToUser(user) {
  if (!user) throw new Error("NO_USER");
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error) {
    throw parseAuthError(error);
  }
}

/**
 * Deletes user account from Firestore (users & usernames) and Firebase Auth
 */
export async function deleteUserAccount(user, currentPassword) {
  if (!user) throw new Error("NO_USER");

  // If email/password provider, reauthenticate first
  const isGoogle = user.providerData?.[0]?.providerId === 'google.com';
  if (!isGoogle && currentPassword) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }

  const userUid = user.uid;
  const userRef = doc(db, "users", userUid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    if (data.username) {
      try {
        await deleteDoc(doc(db, "usernames", data.username));
      } catch (e) {
        console.warn("Username cleanup warning:", e);
      }
    }
    try {
      await deleteDoc(userRef);
    } catch (e) {
      console.warn("User doc cleanup warning:", e);
    }
  }

  // Finally delete from Auth
  await deleteUser(user);
  return true;
}

function parseAuthError(error) {
  const code = error.code || error.message || '';
  let msgEn = error.message;
  let msgBn = error.message;

  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    msgEn = "Incorrect current password.";
    msgBn = "ভুল পাসওয়ার্ড দেওয়া হয়েছে।";
  } else if (code.includes('user-not-found')) {
    msgEn = "No account found with this email.";
    msgBn = "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।";
  } else if (code.includes('email-already-in-use')) {
    msgEn = "An account with this email already exists.";
    msgBn = "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।";
  } else if (code.includes('weak-password')) {
    msgEn = "Password should be at least 6 characters.";
    msgBn = "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
  } else if (code.includes('invalid-email')) {
    msgEn = "Invalid email address format.";
    msgBn = "ইমেইল অ্যাড্রেসের ফরম্যাট সঠিক নয়।";
  } else if (code.includes('network-request-failed')) {
    msgEn = "Network error. Please check your internet connection.";
    msgBn = "নেটওয়ার্ক সমস্যা। দয়া করে ইন্টারনেট সংযোগ পরীক্ষা করুন।";
  } else if (code.includes('popup-closed-by-user')) {
    msgEn = "Sign-in popup was closed before completion.";
    msgBn = "সাইন-ইন পপআপ সম্পন্ন করার আগেই বন্ধ করা হয়েছে।";
  } else if (code.includes('requires-recent-login')) {
    msgEn = "Please log in again to complete this sensitive action.";
    msgBn = "এই কাজটি সম্পন্ন করার জন্য অনুগ্রহ করে পুনরায় লগ ইন করুন।";
  }

  return { code, messageEn: msgEn, messageBn: msgBn, originalError: error };
}

/* ================= REDIRECT LOOP GUARD & NAVIGATION UTILITIES ================= */

export function cleanPageName(urlStr) {
  if (!urlStr) return '';
  try {
    let path = urlStr.split('?')[0].split('#')[0];
    if (path.includes('://')) {
      path = new URL(path).pathname;
    }
    path = path.replace(/\/+$/, '');
    let segment = path.split('/').pop() || 'index';
    if (segment.endsWith('.html')) {
      segment = segment.slice(0, -5);
    }
    return segment.toLowerCase();
  } catch (e) {
    return '';
  }
}

function showRedirectLoopFallbackUI() {
  if (document.getElementById('redirect-loop-guard-ui')) return;
  const overlay = document.createElement('div');
  overlay.id = 'redirect-loop-guard-ui';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background-color:#0f172a;color:#ffffff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;text-align:center;font-family:sans-serif;';
  overlay.innerHTML = `
    <div style="max-width:400px;background:#1e293b;padding:2rem;border-radius:1rem;border:1px solid #334155;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
      <div style="width:3rem;height:3rem;border-radius:50%;background:rgba(239,68,68,0.2);color:#f87171;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 1rem auto;">⚠️</div>
      <h2 style="font-size:1.25rem;font-weight:800;margin-bottom:0.5rem;color:#ffffff;">Too Many Redirects Detected</h2>
      <p style="font-size:0.875rem;color:#94a3b8;margin-bottom:1.5rem;line-height:1.5;">We stopped an automatic redirect loop to protect your session. Please return to the main site.</p>
      <button id="btn-loop-guard-home" style="width:100%;padding:0.75rem 1rem;border-radius:0.75rem;background:#38bdf8;color:#0f172a;font-weight:700;font-size:0.875rem;border:none;cursor:pointer;transition:all 0.2s;">
        Back to Main Site
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('btn-loop-guard-home')?.addEventListener('click', () => {
    sessionStorage.removeItem('wwbd_redirect_count');
    sessionStorage.removeItem('wwbd_redirect_time');
    window.location.replace('./index.html');
  });
}

export function checkRedirectLoopGuard() {
  try {
    const countStr = sessionStorage.getItem('wwbd_redirect_count');
    const timeStr = sessionStorage.getItem('wwbd_redirect_time');
    const now = Date.now();

    if (countStr && timeStr) {
      const count = parseInt(countStr, 10);
      const time = parseInt(timeStr, 10);

      if (now - time < 10000 && count >= 2) {
        console.warn("Redirect loop guard triggered. Stopping automatic redirect.");
        showRedirectLoopFallbackUI();
        return true;
      } else if (now - time >= 10000) {
        sessionStorage.removeItem('wwbd_redirect_count');
        sessionStorage.removeItem('wwbd_redirect_time');
      }
    }

    setTimeout(() => {
      sessionStorage.removeItem('wwbd_redirect_count');
      sessionStorage.removeItem('wwbd_redirect_time');
    }, 3000);
  } catch (e) {
    console.warn("SessionStorage redirect guard error:", e);
  }
  return false;
}

export function safeRedirect(targetUrl) {
  if (!targetUrl) return false;

  const currentKey = cleanPageName(window.location.pathname);
  const targetKey = cleanPageName(targetUrl);

  if (currentKey && targetKey && currentKey === targetKey) {
    console.log(`Already on page '${currentKey}'. Skipping self-redirect to '${targetUrl}'.`);
    return false;
  }

  if (window.__hasRedirected) {
    console.warn("Redirect already executed for this page load. Skipping duplicate redirect to:", targetUrl);
    return false;
  }

  let count = 0;
  try {
    const countStr = sessionStorage.getItem('wwbd_redirect_count');
    const timeStr = sessionStorage.getItem('wwbd_redirect_time');
    const now = Date.now();
    if (countStr && timeStr && (now - parseInt(timeStr, 10)) < 10000) {
      count = parseInt(countStr, 10);
    }
  } catch (e) {}

  if (count >= 2) {
    console.warn("Redirect limit reached (2 redirects in a row). Stopping loop.");
    showRedirectLoopFallbackUI();
    return false;
  }

  window.__hasRedirected = true;

  try {
    sessionStorage.setItem('wwbd_redirect_count', (count + 1).toString());
    sessionStorage.setItem('wwbd_redirect_time', Date.now().toString());
  } catch (e) {}

  window.location.replace(targetUrl);
  return true;
}

export function normalizeNextParam(nextStr) {
  if (!nextStr) return '';
  let cleaned = nextStr.trim();
  cleaned = cleaned.replace(/^[\.\/]+/, '');
  cleaned = cleaned.split('?')[0].split('#')[0];
  return cleaned;
}

export function getPostAuthRedirectTarget(user) {
  const urlParams = new URLSearchParams(window.location.search);
  let rawNext = urlParams.get('next');

  if (rawNext) {
    const normalized = normalizeNextParam(rawNext);
    const pageKey = cleanPageName(normalized);

    const isSameSiteRelative = !rawNext.includes('://') && !rawNext.startsWith('//');

    if (isSameSiteRelative && pageKey) {
      if (pageKey === 'admin') {
        if (isAdminUser(user)) {
          return './admin.html';
        } else {
          return './index.html';
        }
      }
      return normalized.endsWith('.html') ? `./${normalized}` : `./${normalized}.html`;
    }
  }

  if (isAdminUser(user) && window.location.search.includes('next=')) {
    return './admin.html';
  }

  if (isAdminUser(user)) {
    return './admin.html';
  }

  return './profile.html';
}

if (typeof window !== 'undefined') {
  window.cleanPageName = cleanPageName;
  window.checkRedirectLoopGuard = checkRedirectLoopGuard;
  window.safeRedirect = safeRedirect;
  window.normalizeNextParam = normalizeNextParam;
  window.getPostAuthRedirectTarget = getPostAuthRedirectTarget;
  checkRedirectLoopGuard();
}
