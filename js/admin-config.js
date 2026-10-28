import { isAdminUser as checkAdminUser } from './auth.js';

// Centralized Admin Configuration

export const ADMIN_CONFIG = {
  email: "webworldbd.lmt@gmail.com",
  uid: "dS9uZZToHTUPP1Q3DiWiG25D3Xt2"
};

export const isAdminUser = checkAdminUser;
