// Shared JSON Storage Driver
// Manages a single data.json file on GitHub as a shared database

export const Store = {
  token: null,
  repo: null,
  branch: 'main',
  path: 'data.json',

  init(token, repo) {
    this.token = token;
    this.repo = repo;
  },

  async getDb() {
    const url = `https://api.github.com/repos/${this.repo}/contents/${this.path}?ref=${this.branch}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) return { users: {} };
    if (!res.ok) throw new Error(`Fetch Error: ${res.statusText}`);

    const data = await res.json();
    const content = JSON.parse(atob(data.content));
    return { content, sha: data.sha };
  },

  async saveDb(content, sha) {
    const url = `https://api.github.com/repos/${this.repo}/contents/${this.path}`;
    const body = {
      message: `Database sync via Ledger`,
      content: btoa(JSON.stringify(content, null, 2)),
      branch: this.branch,
      sha: sha
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(`Sync Error: ${err.message}`);
    }
  }
};
