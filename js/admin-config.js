// Centralized Admin Configuration

export const ADMIN_CONFIG = {
  email: "webworldbd.lmt@gmail.com",
  uid: "dS9uZZToHTUPP1Q3DiWiG25D3Xt2"
};

/**
 * Checks if the given user object meets strict admin credentials.
 * @param {Object} user - Firebase User or User Data object
 * @returns {boolean}
 */
export function isAdminUser(user) {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  const uid = user.uid;
  const isVerified = user.emailVerified === true;
  return uid === ADMIN_CONFIG.uid && email === ADMIN_CONFIG.email && isVerified;
}
