export const Auth = {
  async login(username, password) {
    try {
      const res = await fetch('users.json');
      if (!res.ok) throw new Error("Could not load users.json");
      const data = await res.json();
      
      const userKey = username.toUpperCase();
      const user = data.users[userKey];

      if (user && user.password === password) {
        const session = { name: userKey, loginAt: Date.now() };
        localStorage.setItem('ledger_session', JSON.stringify(session));
        return session;
      }
    } catch (e) {
      console.error(e);
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
