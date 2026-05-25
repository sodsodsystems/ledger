import { Store } from './store.js';
import { Auth } from './auth.js';

export const DB = {
  async getUserData() {
    const user = await Auth.getCurrentUser();
    if (!user) return null;
    
    // Ensure store is initialized with config
    Store.init(window.LEDGER_CONFIG.GITHUB_TOKEN, window.LEDGER_CONFIG.GITHUB_REPO);
    
    const db = await Store.getDb();
    if (!db.content.users) db.content.users = {};
    if (!db.content.users[user.name]) {
        db.content.users[user.name] = { transactions: [], budgets: {} };
    }
    return { data: db.content.users[user.name], sha: db.sha, fullContent: db.content };
  },

  async getTransactions() {
    const res = await this.getUserData();
    return res ? res.data.transactions : [];
  },

  async saveTransaction(tx) {
    const user = await Auth.getCurrentUser();
    const res = await this.getUserData();
    if (!res) throw new Error("Not logged in");

    let txs = res.data.transactions;
    if (tx.id) {
      const idx = txs.findIndex(t => t.id === tx.id);
      if (idx > -1) txs[idx] = { ...txs[idx], ...tx };
    } else {
      tx.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      txs.push(tx);
    }

    res.fullContent.users[user.name].transactions = txs;
    await Store.saveDb(res.fullContent, res.sha);
    return tx;
  },

  async deleteTransaction(id) {
    const user = await Auth.getCurrentUser();
    const res = await this.getUserData();
    if (!res) return;

    res.fullContent.users[user.name].transactions = res.data.transactions.filter(t => t.id !== id);
    await Store.saveDb(res.fullContent, res.sha);
  },

  async getBudgets() {
    const res = await this.getUserData();
    return res ? res.data.budgets : {};
  },

  async saveBudget(category, limit) {
    const user = await Auth.getCurrentUser();
    const res = await this.getUserData();
    if (!res) return;

    res.fullContent.users[user.name].budgets[category] = limit;
    await Store.saveDb(res.fullContent, res.sha);
  },

  async deleteBudget(category) {
    const user = await Auth.getCurrentUser();
    const res = await this.getUserData();
    if (!res) return;

    delete res.fullContent.users[user.name].budgets[category];
    await Store.saveDb(res.fullContent, res.sha);
  }
};
