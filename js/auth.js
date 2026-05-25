import { Store } from './store.js';

export const Auth = {
  // These are the credentials provided by the user
  DEFAULT_USERS: {
    "IAN": "iloveallan",
    "ALLAN": "iloveian"
  },

  async login(username, password) {
    const userKey = username.toUpperCase();
    if (this.DEFAULT_USERS[userKey] === password) {
        const session = { name: userKey, loginAt: Date.now() };
        localStorage.setItem('ledger_session', JSON.stringify(session));
        return session;
    }
    throw new Error("Invalid Username or Password");
  },

  logout() {
    localStorage.removeItem('ledger_session');
    location.reload();
  },

  async getCurrentUser() {
    const session = localStorage.getItem('ledger_session');
    if (!session) return null;
    return JSON.parse(session);
  }
};
