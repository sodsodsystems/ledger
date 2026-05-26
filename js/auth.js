export const Auth = {
  async _loadUsers() {
    try {
      const response = await fetch('users.json');
      if (!response.ok) throw new Error("Could not load user data");
      const data = await response.json();
      return data.users || {};
    } catch (e) {
      console.error("Auth Error:", e);
      return {};
    }
  },

  async login(username, password) {
    const users = await this._loadUsers();
    const userKey = username.trim().toUpperCase();
    const user = users[userKey];

    if (user && user.password === password.trim()) {
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
