# CODEBASE_SUMMARY.md
> Generated: 2026-05-26 | Auditor: AI Code Review | Version: as-built

---

## 1. System Summary

**Ledger** is a client-side-only personal finance tracking web application. It allows two named users (IAN and ALLAN) to log income and expense transactions, categorise spending, set per-category monthly budgets, and view cashflow charts and trend reports. It is designed as a private shared tool for two known users, not a general-purpose SaaS product.

| Attribute | Value |
|---|---|
| **Project name** | Ledger — Personal Finance Tracker |
| **Runtime** | Browser (no server) |
| **Language** | Vanilla JavaScript (ES Modules) |
| **Framework** | None — plain HTML/CSS/JS |
| **Database** | `localStorage` (browser-native, per-user keyed) |
| **Hosting** | GitHub Pages (`sodsodsystems.github.io/ledger/`) |
| **External services** | Google Fonts CDN, cdnjs (Chart.js, SheetJS/xlsx) |
| **Auth strategy** | Local-first: credentials stored in `localStorage` under key `ledger_secret_auth`. Plaintext password comparison. Session token stored in `localStorage` under `ledger_session`. No server, no JWT, no OAuth. |
| **Deployment** | Single environment — `main` branch → GitHub Pages. No staging. No build step. Static file serving only. |

---

## 2. Codebase Summary

### 2a. Directory Tree

```
FINANCE-TRACKER/
├── css/
│   └── style.css              # Entire visual design system (Apple HIG tokens, components, responsive)
├── js/
│   ├── app.js                 # Main application controller: state, routing, rendering, CRUD handlers
│   ├── auth.js                # Authentication module: localStorage credential store, session management
│   └── db.js                  # Data access layer: localStorage read/write for transactions & budgets
├── .gitignore                 # Excludes users.json, .env, OS/IDE files, node_modules
├── CODEBASE_SUMMARY.md        # This file
├── README.md                  # Virtually empty (22 bytes)
├── SYS-DESIGN_SPEC.md         # Apple HIG + UX Laws frontend design specification
├── finance-tracker.html       # Legacy/alternate entry point (106 KB — not the active app shell)
├── index.html                 # Primary application shell: auth screen, all views, modals, bottom tab bar
├── setup-accounts.html        # Standalone one-time vault setup utility (crypto-vault based, legacy)
└── users.json                 # Local-only credential file (gitignored). Not used by the current auth flow.
```

---

### 2b. Core Modules & Files

#### Auth Domain

| File | Role | Key Exports / Functions | Notes |
|---|---|---|---|
| `js/auth.js` | Credential store and session management | `Auth._loadUsers()`, `Auth.hasUsers()`, `Auth.setupInitialUser()`, `Auth.login()`, `Auth.logout()`, `Auth.getCurrentUser()` | Credentials stored in `localStorage['ledger_secret_auth']` as `{ USERNAME: { password: "..." } }`. Passwords stored and compared in **plaintext**. Session stored in `localStorage['ledger_session']` as `{ name, loginAt }`. No expiry. No hashing. |

#### Data Domain

| File | Role | Key Exports / Functions | Notes |
|---|---|---|---|
| `js/db.js` | localStorage CRUD for transactions and budgets | `DB.getTransactions()`, `DB.saveTransaction()`, `DB.deleteTransaction()`, `DB.getBudgets()`, `DB.saveBudget()`, `DB.deleteBudget()` | User-namespaced keys: `ledger_db_IAN`, `ledger_db_ALLAN`. All data stored as a single JSON blob `{ transactions: [], budgets: {} }`. No schema validation. No migrations. ID generated via `Date.now().toString(36) + Math.random().toString(36).slice(2)`. |

#### UI / Application Domain

| File | Role | Key Exports / Functions | Notes |
|---|---|---|---|
| `js/app.js` | Application controller | `init()`, `navigate()`, `renderDashboard()`, `renderTransactionTable()`, `renderBudget()`, `renderReports()`, `renderTxItem()`, `saveTransaction()`, `deleteTx()`, `saveBudget()`, `deleteBudget()`, `buildMonthOptions()`, `showToast()`, `bindEvents()` | Monolithic 479-line file. Contains constants, state, rendering, chart management, event binding, and CRUD orchestration. No separation of concerns. All window globals. |
| `index.html` | Application shell | N/A | Houses auth screen (login + setup views), sidebar nav, all 4 view sections (dashboard, transactions, budget, reports), 2 modals (tx, budget), bottom tab bar, toast container. Loads `js/app.js` as ES module. |
| `css/style.css` | Design system + all component styles | N/A | 923 lines. Apple HIG token system. Light and dark mode via `@media (prefers-color-scheme: dark)`. Includes `@media (prefers-reduced-motion)`. Bottom tab bar for mobile. |
| `finance-tracker.html` | Legacy/alternate app shell | N/A | 106 KB standalone file. Appears to be an older monolithic version of the app with embedded CSS/JS. Its relationship to `index.html` is unclear — both exist in root. **Not the active GitHub Pages entry point.** [NEEDS CLARIFICATION — whether this file is intentionally maintained or should be deleted.] |
| `setup-accounts.html` | One-time vault initialisation utility | `setup()`, `createVault()`, `deriveKey()` | Uses `crypto.subtle` for AES-GCM encrypted vault creation. Creates `ledger_vault_IAN`, `ledger_vault_ALLAN` in `localStorage`. This crypto-vault approach was the **previous** auth system. It is **incompatible** with the current `auth.js` localStorage plaintext store. References `finance-tracker.html` in its UI text. |
| `SYS-DESIGN_SPEC.md` | Frontend design specification | N/A | Apple HIG + 14 UX Laws applied. Defines colour tokens, type scale, spacing grid, component specs, motion tokens, interaction patterns, and accessibility rules. |
| `users.json` | Local-only credential bootstrap file | N/A | Gitignored. Contains plaintext credentials for IAN and ALLAN. **No longer read by `auth.js`** — `auth.js` was refactored to use `localStorage`. This file is a leftover and is now unused by the application. |
| `.gitignore` | Git exclusion rules | N/A | Excludes `users.json`, `.env`, `*.log`, `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`, `node_modules/`, `dist/`. |
| `README.md` | Project readme | N/A | Contains only 22 bytes — effectively empty. |

---

### 2c. Data Models / Schema

All data is stored in `localStorage`. There is no server-side schema.

#### `localStorage['ledger_secret_auth']` — Credential Store

```json
{
  "IAN":   { "password": "iloveallan" },
  "ALLAN": { "password": "iloveian"   }
}
```

| Field | Type | Notes |
|---|---|---|
| `[USERNAME]` | `string` (key) | Normalised to uppercase. Username is the storage key. |
| `password` | `string` | **Plaintext. No hashing. ⚠️ Security debt.** |

---

#### `localStorage['ledger_session']` — Active Session

```json
{ "name": "IAN", "loginAt": 1716700000000 }
```

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Uppercase username |
| `loginAt` | `number` | Unix ms timestamp. **Never validated for expiry.** Session is permanent until `logout()` is called. ⚠️ |

---

#### `localStorage['ledger_db_<USERNAME>']` — User Data Blob

```json
{
  "transactions": [ ... ],
  "budgets": { "Food & Dining": 5000 }
}
```

##### Transaction Object

| Field | Type | Business Logic | Notes |
|---|---|---|---|
| `id` | `string` | Generated on insert: `Date.now().toString(36) + random` | Unique within user's data. Not globally unique. |
| `type` | `string enum` | `"income"` \| `"expense"` | Controls sign in UI, category picker, and chart grouping. |
| `date` | `string` | `YYYY-MM-DD` | Used for month filtering (`date.slice(0,7)`). |
| `amount` | `number` | Always positive. Sign inferred from `type`. | No negation validation at write time. |
| `description` | `string` | Displayed as primary label. Falls back to `category` if empty. | Optional in `saveTransaction`. |
| `category` | `string` | One of the 23 predefined expense categories or 7 income categories. | Free-form string — no schema enforcement at write. |
| `subcategory` | `string` | Populated from subcategory list per parent category. | Stored but not used in any chart or filter. |
| `payment_method` | `string` | One of: Cash, GCash, Maya, Credit Card, Debit Card, Bank Transfer. | Displayed in transaction table. Not used in aggregations. |
| `notes` | `string` | Optional. Displayed in table. | No length limit. |
| `tags` | `string` | Optional. Free-form comma-separated. | Stored but **not searchable** in current UI. No tag filter exists. |

##### Budget Object

```json
{ "Food & Dining": 5000, "Transportation": 3000 }
```

| Field | Type | Notes |
|---|---|---|
| `[category]` | `number` (value) | Monthly spending limit in PHP. One entry per expense category. `saveBudget` is upsert — no history or prior-value log. |

---

### 2d. API Surface

**None.** This is a fully client-side application. There are no HTTP API routes, no REST endpoints, no GraphQL. All data operations are `localStorage` reads/writes.

---

### 2e. State Management

State lives entirely in the module-level `state` object in `js/app.js`.

```javascript
let state = {
  user: null,          // Auth session object from localStorage
  transactions: [],    // Flat array loaded from DB on init and after every write
  budgets: {},         // Budget map loaded from DB on init and after every write
  editId: null         // Transaction ID being edited. null means "add mode".
};
```

| Aspect | Detail |
|---|---|
| **Scope** | Module-level singleton. Not reactive. No watchers. |
| **Update pattern** | Full reload: every CRUD operation calls `await loadAppData()` then `renderView()` — a full re-render of the current view. |
| **Persistence** | `localStorage` via `DB` module. |
| **Chart instances** | `cashflowChart`, `pieChart`, `trendChart`, `reportPieChart` are module-level mutable vars. Destroyed and recreated on each render. |
| **Known inconsistency** | `filterMonth` filter state lives in the DOM (`<select>` value), not in `state`. Side-effects possible if DOM element is accessed before it's populated. |
| **Known inconsistency** | After `saveTransaction`, current view is re-rendered by reading `.nav-item.active` from the DOM. If the active nav item is desynced from the actual visible view, rendering will be incorrect. |

---

### 2f. Shared Components & Utilities

| Component / Utility | What it does | Where used | Limitations / Edge Cases |
|---|---|---|---|
| `const $ = id => document.getElementById(id)` | ID shorthand | Throughout `app.js` | Returns `null` silently if element missing — no guard. |
| `const fmt = n => '₱' + ...` | Formats a number to PHP currency string with 2 decimal places | All monetary displays | Uses `Math.abs(n)` — always positive. Sign (+ / −) added separately by callers. Input `n = null` returns `₱0.00`. |
| `renderTxItem(tx)` | Returns HTML string for a single transaction row in the dashboard recent list | `renderDashboard()` | Uses `getCatIcon()` which only maps 9 categories. All others fall back to first uppercase letter. |
| `getCatIcon(cat)` | Maps category name to a single uppercase letter abbreviation | `renderTxItem()`, `renderTransactionTable()` | Incomplete map: only 9 of 23 expense categories defined. `Healthcare` and `Housing` both map to `'H'` (key collision — `Housing` is overwritten). |
| `showToast(msg, type)` | Displays a temporary notification toast for 3 seconds | All CRUD operations, login, setup | Only one toast can be shown at a time. A second call before 3s will replace the previous without clearing the first timer. |
| `buildMonthOptions()` | Populates the month filter `<select>` from distinct months in `state.transactions` | `initApp()` | Called once on init — does not re-populate if new transactions are added mid-session. Month options become stale after adding a transaction in a new month. |
| `populateCatSelect(type)` / `updateSubcats()` | Populates category and subcategory `<select>` elements based on transaction type | `initApp()`, type radio change, category change | Hardcoded to `CATEGORIES` object in `app.js`. No way to add custom categories without editing source. |
| `getFilteredTransactions()` | Returns transactions filtered by month filter DOM value | All render functions | Reads DOM directly, not from `state`. |
| `bindEvents()` | Attaches click listeners to nav items, tab items, cat select, type radios, month filter | `initApp()` | Called only once. If nav items are added dynamically later, they won't be bound. |

---

### 2g. Known Technical Debt

| # | Location | Issue | Severity |
|---|---|---|---|
| 1 | `js/auth.js` | Passwords stored and compared in **plaintext** in `localStorage`. Any script with access to the same origin can read all credentials. | **Critical** |
| 2 | `js/auth.js` | Session `loginAt` is stored but **never validated**. Sessions never expire — a browser tab left open for months is still authenticated. | High |
| 3 | `js/app.js` | Monolithic 479-line file mixes constants, state, DOM manipulation, chart logic, CRUD orchestration, and event binding. Violates single-responsibility and separation-of-concerns principles. | High |
| 4 | `js/app.js` | `getCatIcon()` has a key collision: both `Housing` and `Healthcare` are mapped to `'H'` — `Housing` entry is silently overwritten. Only `Healthcare` → `'H'` survives at runtime. | Medium |
| 5 | `js/app.js` | `renderView()` after CRUD reads the active nav item from the DOM (`.nav-item.active`). On mobile where the sidebar is hidden and the bottom tab bar is used, the `.nav-item.active` state in the sidebar does sync via `navigate()`, but this indirect DOM query is fragile. | Medium |
| 6 | `js/app.js` | `buildMonthOptions()` only runs once at `initApp()`. Adding a transaction in a new calendar month does not update the month filter dropdown. | Medium |
| 7 | `js/app.js` | `CATEGORIES` object (23 expense + 7 income categories, ~100 subcategories) is hardcoded inline. Not configurable, not in a separate constants/config file. | Medium |
| 8 | `js/app.js` | `CAT_COLORS` is a hardcoded inline array. Not connected to the CSS design token system (`SYS-DESIGN_SPEC.md`). Chart colors do not reflect `--accent-*` CSS variables. | Low |
| 9 | `js/app.js` | `tags` field is saved to every transaction but there is **no tag search, no tag filter, and no tag display** anywhere in the UI. Dead feature. | Low |
| 10 | `js/app.js` | `subcategory` is saved but **never rendered or used** in any chart, filter, or table column. Dead feature. | Low |
| 11 | `js/app.js` | `showToast` has a timer leak: rapid successive calls stack timers without cancelling the previous one. | Low |
| 12 | `finance-tracker.html` | A 106 KB legacy monolithic HTML file exists in the root. It appears to be the original application, but its current status (maintained, deprecated, broken?) is unknown. It references `setup-accounts.html`. | High |
| 13 | `setup-accounts.html` | References `AES-GCM` encrypted vault system (`ledger_vault_IAN`, `ledger_vault_ALLAN`). This is the **previous** auth architecture. It is entirely incompatible with the current `auth.js` plaintext localStorage system. Running `setup-accounts.html` creates orphaned keys that will never be read. | High |
| 14 | `users.json` | File is gitignored but still physically present in the working directory. It contains plaintext credentials for IAN and ALLAN. The application no longer reads this file at runtime (since `auth.js` refactor), but it remains as a security risk if accidentally committed. | High |
| 15 | `index.html` | `<meta name="description">` states "secure, cloud-synced" — neither claim is accurate. Auth is not secure (plaintext). There is no cloud sync (data is browser-local only). | Low |
| 16 | `index.html` | Font imports from Google Fonts (`Sora`, `JetBrains Mono`) but the CSS design system specifies `-apple-system` as the primary font. Loaded fonts are partially overridden by `style.css` and partially still in use (legacy remnants in `.form-input`, `.form-select` via inherited `font-family: 'Sora', sans-serif` in old CSS). | Low |
| 17 | `README.md` | Effectively empty (22 bytes). No setup instructions, no usage guide, no tech overview. | Low |

---

### 2h. Dependencies

| Package | Version | Source | Why It's Here | Can It Be Removed? |
|---|---|---|---|---|
| `Chart.js` | `4.4.1` | cdnjs CDN | Renders the cashflow bar chart, spending donut chart, trend line chart, and report pie chart | No — central to all data visualisation |
| `SheetJS (xlsx)` | `0.18.5` | cdnjs CDN | Excel export functionality (the Export Data button calls `exportToExcel()`) | Potentially — `exportToExcel` is referenced in `index.html` button but the function body is not present in `app.js`. **[NEEDS CLARIFICATION — the function may be defined in `finance-tracker.html` or is missing from `app.js`.]** |
| `Sora` | Variable | Google Fonts CDN | Used for form inputs (partially — inherited from old CSS declarations) | Potentially — largely overridden by `style.css` which uses `-apple-system`. Removal would require auditing all `font-family: 'Sora'` references. |
| `JetBrains Mono` | Variable | Google Fonts CDN | Monospace font for financial figures and code-like data | Partially — `style.css` now uses `font-variant-numeric: tabular-nums` on system fonts. `JetBrains Mono` is only referenced in utility class `.mono` which is used in the tx table. Could be replaced with system monospace. |

---

## Engineering Standards & Rules

The following rules are non-negotiable constraints for any developer or AI agent modifying this codebase. These apply to all changes, regardless of scope.

### General Standards

- [ ] **Separation of concerns** — Route handlers contain no business logic. Logic lives in service/controller layer. DB queries live in repository/data-access layer only. *(In this project: `app.js` should not contain inline data transformation logic that belongs in `db.js` or a service layer.)*
- [ ] **Single Responsibility** — Each module, file, and function does one thing. If a function needs an "and" in its description, split it.
- [ ] **No magic values** — All constants (status codes, enums, thresholds, timeouts) are defined in a single constants file and imported. Never inline.
- [ ] **Consistent error handling** — All async functions are wrapped. Errors are caught at the boundary, not scattered. A single global error handler formats user-facing messages.
- [ ] **Environment config is centralised** — All env vars are accessed through a single config module. Never via `process.env` scattered inline. *(N/A for this fully client-side project, but applies if a backend is ever added.)*
- [ ] **Input validation at the edge** — All incoming data (form fields, URL params) is validated before it reaches any service or storage call.
- [ ] **No raw storage calls in view functions** — `localStorage` reads/writes belong in `db.js` or `auth.js` only. Never call `localStorage` directly from `app.js` or `index.html`.
- [ ] **Logging is structured** — No `console.log` left in production code.
- [ ] **Return types are explicit** — Functions that return data must have clear, documented shapes. No ambiguous or mixed return types.
- [ ] **Pagination on all list endpoints** — The dashboard enforces a max-7 cap (Miller's Law). The transactions view shows all records with no pagination — **add pagination before the dataset grows large.**
- [ ] **Confirmation before destructive actions** — All delete operations must confirm via `confirm()` or a modal. Never silently delete.

### Project-Specific Rules (Non-Negotiable)

- [ ] **Do not touch `auth.js` or `db.js` for UI tasks.** If a frontend change appears to require modifying the auth or data layer, stop and flag it explicitly. Do not silently alter storage keys, session shape, or credential structure.
- [ ] **Prevent codebloat** — Before adding a new function, utility, or component, search `app.js`, `auth.js`, and `db.js` for an existing one that can be reused or extended. `renderTxItem`, `fmt`, `showToast`, `getCatIcon`, and the `DOM` cache object already exist — use them.
- [ ] **Use existing CSS tokens** — Never add raw hex values or hardcoded pixel values to new CSS. Always use variables from the `:root` token block in `style.css` (e.g., `var(--accent-blue)`, `var(--radius-md)`, `var(--ease-spring)`).
- [ ] **Avoid scratchpad patterns** — Do not write temp files, use in-memory global state to pass values between functions, or add module-level mutable variables. Scope temporary data within the function that needs it.
- [ ] **Do not commit `users.json`** — It is gitignored for a reason. It contains plaintext credentials. Any workflow that stages this file must be rejected.
- [ ] **Do not use `finance-tracker.html` as a reference** — It is the legacy monolith. The canonical source of truth is `index.html` + `js/`.
- [ ] **Do not run `setup-accounts.html` against the current auth system** — It creates `ledger_vault_*` keys that the current `auth.js` never reads. Running it will not fix login; it will create orphaned data.
