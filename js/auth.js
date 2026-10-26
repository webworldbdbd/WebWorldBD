import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, googleProvider, db } from "./firebase-config.js";

export const ADMIN_EMAIL = "webworldbd.lmt@gmail.com";

export async function signUp(email, password, name) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (name) {
      await updateProfile(user, { displayName: name });
    }

    const userData = {
      uid: user.uid,
      name: name || user.displayName || 'User',
      email: user.email,
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      role: user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
    };

    try {
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    } catch (err) {
      console.warn("Firestore user creation warning:", err);
    }

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

export async function fetchOrCreateUserDoc(user) {
  if (!user) return null;
  const userRef = doc(db, "users", user.uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      const userData = {
        uid: user.uid,
        name: user.displayName || 'User',
        email: user.email,
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        role: user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
      };
      await setDoc(userRef, userData, { merge: true });
      return userData;
    }
  } catch (err) {
    console.warn("Firestore fetch error, fallback to Auth user details:", err);
    return {
      uid: user.uid,
      name: user.displayName || 'User',
      email: user.email,
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString(),
      role: user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'
    };
  }
}

export function subscribeAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await fetchOrCreateUserDoc(user);
      callback(user, userData);
    } else {
      callback(null, null);
    }
  });
}

function parseAuthError(error) {
  const code = error.code || '';
  let msgEn = error.message;
  let msgBn = error.message;

  if (code.includes('invalid-credential') || code.includes('wrong-password')) {
    msgEn = "Incorrect email or password.";
    msgBn = "ভুল ইমেইল অথবা পাসওয়ার্ড।";
  } else if (code.includes('user-not-found')) {
    msgEn = "No account found with this email.";
    msgBn = "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি।";
  } else if (code.includes('email-already-in-use')) {
    msgEn = "An account with this email already exists.";
    msgBn = "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে।";
  } else if (code.includes('weak-password')) {
    msgEn = "Password should be at least 6 characters.";
    msgBn = "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
  } else if (code.includes('invalid-email')) {
    msgEn = "Invalid email address format.";
    msgBn = "ইমেইল অ্যাড্রেসের ফরম্যাট সঠিক নয়।";
  } else if (code.includes('network-request-failed')) {
    msgEn = "Network error. Please check your internet connection.";
    msgBn = "নেটওয়ার্ক সমস্যা। দয়া করে ইন্টারনেট সংযোগ পরীক্ষা করুন।";
  } else if (code.includes('popup-closed-by-user')) {
    msgEn = "Sign-in popup was closed before completion.";
    msgBn = "সাইন-ইন পপআপ সম্পন্ন করার আগেই বন্ধ করা হয়েছে।";
  }

  return { code, messageEn: msgEn, messageBn: msgBn, originalError: error };
}
