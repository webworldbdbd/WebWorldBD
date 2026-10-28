// Centralized Admin Configuration

export const ADMIN_CONFIG = {
  email: "webworldbd.lmt@gmail.com",
  uid: "dS9uZZToHTUPP1Q3DiWiG25D3Xt2"
};

/**
 * Checks if the given user object meets admin credentials based on email and emailVerified status.
 * @param {Object} user - Firebase User or User Data object
 * @returns {boolean}
 */
export function isAdminUser(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const targetEmail = ADMIN_CONFIG.email.toLowerCase().trim();
  const isVerified = user.emailVerified === true;

  if (email === targetEmail && isVerified) {
    if (user.uid && user.uid !== ADMIN_CONFIG.uid) {
      console.warn(`Admin uid differs from config: ${user.uid}`);
    } else if (user.uid) {
      console.log(`Admin uid verified: ${user.uid}`);
    }
    return true;
  }
  return false;
}
