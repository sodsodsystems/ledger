// User credentials — edit this object to add/remove users or change passwords
const USERS = {
  "IAN":   "iloveallan",
  "ALLAN": "iloveian"
};

export const Auth = {
  async login(username, password) {
    const userKey = username.trim().toUpperCase();
    if (USERS[userKey] && USERS[userKey] === password.trim()) {
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
