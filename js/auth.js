export const Auth = {
  // Key for storing user credential map (name -> password)
  _STORAGE_KEY: 'ledger_secret_auth',

  async _loadUsers() {
    const raw = localStorage.getItem(this._STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  },

  async hasUsers() {
    const users = await this._loadUsers();
    return Object.keys(users).length > 0;
  },

  async setupInitialUser(username, password) {
    const userKey = username.trim().toUpperCase();
    const users = await this._loadUsers();
    users[userKey] = { password: password.trim() };
    localStorage.setItem(this._STORAGE_KEY, JSON.stringify(users));
    return this.login(username, password);
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
