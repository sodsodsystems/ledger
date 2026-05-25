import { Auth } from './auth.js';

export const DB = {
  // Each user gets their own key in localStorage: ledger_db_IAN, ledger_db_ALLAN
  async getUserStorageKey() {
    const user = await Auth.getCurrentUser();
    return user ? `ledger_db_${user.name}` : null;
  },

  async getData() {
    const key = await this.getUserStorageKey();
    if (!key) return { transactions: [], budgets: {} };
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { transactions: [], budgets: {} };
  },

  async saveData(data) {
    const key = await this.getUserStorageKey();
    if (key) localStorage.setItem(key, JSON.stringify(data));
  },

  async getTransactions() {
    const data = await this.getData();
    return data.transactions || [];
  },

  async saveTransaction(tx) {
    const data = await this.getData();
    if (!data.transactions) data.transactions = [];

    if (tx.id) {
      const idx = data.transactions.findIndex(t => t.id === tx.id);
      if (idx > -1) data.transactions[idx] = { ...data.transactions[idx], ...tx };
    } else {
      tx.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      data.transactions.push(tx);
    }

    await this.saveData(data);
    return tx;
  },

  async deleteTransaction(id) {
    const data = await this.getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    await this.saveData(data);
  },

  async getBudgets() {
    const data = await this.getData();
    return data.budgets || {};
  },

  async saveBudget(category, limit) {
    const data = await this.getData();
    if (!data.budgets) data.budgets = {};
    data.budgets[category] = limit;
    await this.saveData(data);
  },

  async deleteBudget(category) {
    const data = await this.getData();
    if (data.budgets) delete data.budgets[category];
    await this.saveData(data);
  }
};
