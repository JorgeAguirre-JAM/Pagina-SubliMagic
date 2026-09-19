import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import { SITE_CONFIG } from './config.js';

const app = getApps().length ? getApps()[0] : initializeApp(SITE_CONFIG.firebase);
export const customerAuth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });
const persistenceReady = setPersistence(customerAuth, browserLocalPersistence).catch(() => undefined);

export function observeCustomer(callback) {
  return onAuthStateChanged(customerAuth, callback);
}

export async function signInCustomerWithGoogle() {
  await persistenceReady;
  return signInWithPopup(customerAuth, provider);
}

export async function signOutCustomer() {
  await signOut(customerAuth);
}

export async function getCustomerIdToken(forceRefresh = false) {
  await persistenceReady;
  const user = customerAuth.currentUser;
  if (!user) return '';
  return user.getIdToken(forceRefresh);
}
