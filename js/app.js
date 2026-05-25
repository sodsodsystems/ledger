import { Auth } from './auth.js';
import { DB } from './db.js';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS & CATEGORIES
// ═══════════════════════════════════════════════════════════

const CATEGORIES = {
  income: {
    "Salary & Wages": ["Regular Salary", "Part-time Salary", "Overtime Pay", "Bonuses", "Commission"],
    "Freelance & Contract": ["Consulting Fees", "Freelance Projects", "Contract Work", "Gig Economy"],
    "Business Revenue": ["Product Sales", "Service Revenue", "Business Profit", "Partnership Income"],
    "Investments": ["Stock Dividends", "Bond Interest", "Capital Gains", "Crypto Returns", "UITF/Mutual Fund"],
    "Rental Income": ["Residential Rental", "Commercial Rental", "Airbnb/Short-term"],
    "Government & Benefits": ["SSS Benefits", "PhilHealth Refund", "Pag-IBIG Benefits", "Tax Refund", "Scholarship"],
    "Other Income": ["Gifts Received", "Inheritance", "Insurance Claim", "Reselling", "Miscellaneous"]
  },
  expense: {
    "Housing": ["Rent / Mortgage", "Electric Bill", "Water Bill", "Internet & Cable", "Gas (LPG/Cooking)", "Property Tax", "Home Insurance", "HOA Dues", "Maintenance & Repairs", "Home Improvement"],
    "Food & Dining": ["Groceries & Supermarket", "Restaurants & Dining Out", "Coffee & Beverages", "Takeout & Food Delivery", "Work Lunches", "Snacks & Street Food"],
    "Transportation": ["Gas & Fuel", "Car Payment (Amortization)", "Auto Insurance", "Vehicle Registration", "Jeepney / Bus / Tricycle", "MRT / LRT", "Grab / Ride-hailing", "Parking Fees", "Car Maintenance & Repair", "Toll Fees"],
    "Healthcare": ["Health Insurance (HMO)", "Doctor / Clinic Visits", "Prescription Medications", "Over-the-counter Meds", "Dental Care", "Vision Care & Eyeglasses", "Mental Health / Therapy", "Laboratory & Diagnostics", "Hospital Bills"],
    "Personal Care": ["Clothing & Apparel", "Footwear", "Haircut & Salon", "Skincare & Beauty Products", "Gym & Fitness Membership", "Personal Hygiene Products"],
    "Entertainment": ["Movies & Cinema", "Concerts & Events", "Gaming", "Books & Magazines", "Sports & Recreational Activities", "Streaming Subscriptions (Netflix, etc.)", "Music Subscriptions", "Hobbies"],
    "Technology": ["Mobile Phone Bill", "Software Subscriptions", "Electronics & Gadgets", "Cloud Storage", "App Purchases"],
    "Financial Obligations": ["Credit Card Payment", "Personal Loan Payment", "Car Loan Payment", "Housing Loan (Pag-IBIG)", "Bank & ATM Fees", "Late Payment Penalties"],
    "Savings & Investments": ["Emergency Fund", "Time Deposit", "Stock Market", "Mutual Fund / UITF", "Crypto Investment", "Pag-IBIG Contribution", "SSS Voluntary Contribution"],
    "Education": ["Tuition & School Fees", "Books & School Supplies", "Online Courses & E-learning", "Tutorials & Coaching", "Student Loan Payment", "Professional Development"],
    "Travel & Vacation": ["Airfare & Boat Tickets", "Hotel & Accommodation", "Vacation Activities & Tours", "Travel Insurance", "Pasalubong & Souvenirs", "Travel Essentials"],
    "Gifts & Charity": ["Birthday & Occasion Gifts", "Christmas Gifts", "Charitable Donations", "Church & Religious Offerings", "Bayanihan / Community Help"],
    "Children & Family": ["Childcare & Daycare", "School Allowance", "Baby & Toddler Supplies", "Kids' Activities & Toys", "Pet Food & Veterinary", "Family Support / Remittance"],
    "Business Expenses": ["Office Supplies", "Professional Services (Lawyer, CPA)", "Marketing & Advertising", "Business Insurance", "Business Travel", "Employee Salaries"],
    "Taxes & Government": ["Income Tax", "Business Tax", "Government Fees & Permits", "LTO Fees", "NBI / Police Clearance"],
    "Miscellaneous": ["ATM Withdrawal Fees", "Notarial & Documentary Fees", "Fines & Penalties", "Subscriptions (Other)", "Unclassified Expenses"]
  }
};

const CAT_COLORS = ['#0A84FF','#30D158','#FF453A','#FF9F0A','#BF5AF2','#64D2FF','#5E5CE6','#FF375F','#AC8E68','#8E8E93'];

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════

let state = {
  user: null,
  transactions: [],
  budgets: {},
  editId: null
};

const $ = id => document.getElementById(id);
const DOM = {
  filterMonth: $('filterMonth'),
  txModal: $('txModal'),
  budgetModal: $('budgetModal'),
  txCat: $('txCat'),
  txSubcat: $('txSubcat'),
  txPayment: $('txPayment'),
  searchInput: $('searchInput'),
  typeFilter: $('typeFilter'),
  catFilter: $('catFilter'),
  sortFilter: $('sortFilter'),
  txDate: $('txDate'),
  txAmount: $('txAmount'),
  txDesc: $('txDesc'),
  txNotes: $('txNotes'),
  txTags: $('txTags'),
  modalTitle: $('modalTitle'),
  budgetCat: $('budgetCat'),
  budgetAmount: $('budgetAmount')
};

const fmt = n => '₱' + Math.abs(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = n => {
  if (n >= 1000000) return '₱' + (n/1000000).toFixed(1) + 'M';
  if (n >= 1000) return '₱' + (n/1000).toFixed(1) + 'K';
  return fmt(n);
};

// ═══════════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════════

async function init() {
  state.user = await Auth.getCurrentUser();
  
  if (state.user) {
    if (!window.LEDGER_CONFIG || window.LEDGER_CONFIG.GITHUB_TOKEN === "YOUR_GITHUB_TOKEN") {
      showToast('Config incomplete. Please check config.js', 'error');
      $('auth-screen').classList.remove('hidden');
      return;
    }
    $('auth-screen').classList.add('hidden');
    await loadAppData();
    initApp();
  } else {
    $('auth-screen').classList.remove('hidden');
  }
}

async function loadAppData() {
  showToast('Opening Vault...', 'neutral');
  try {
    state.transactions = await DB.getTransactions();
    state.budgets = await DB.getBudgets();
    showToast('Vault Opened!', 'success');
  } catch (err) {
    console.error('Failed to load data:', err);
    showToast('Vault Sync Error. Check GitHub token.', 'error');
  }
}

function initApp() {
  buildMonthOptions();
  navigate('dashboard');
  bindEvents();
  populateCatSelect('expense');
}

// ═══════════════════════════════════════════════════════════
//  HANDLERS (AUTH)
// ═══════════════════════════════════════════════════════════

window.handleLogin = async () => {
    const user = $('loginUser').value.trim();
    const pass = $('loginPassword').value.trim();
    if (!user || !pass) { showToast('Name and Password required', 'error'); return; }
    try {
        await Auth.login(user, pass);
        location.reload();
    } catch (e) { showToast(e.message, 'error'); }
};

window.logout = () => Auth.logout();

// ═══════════════════════════════════════════════════════════
//  NAVIGATION & UI
// ═══════════════════════════════════════════════════════════

const VIEW_META = {
  dashboard: { title: 'Dashboard', sub: 'Your financial overview' },
  transactions: { title: 'Transactions', sub: 'All income and expense records' },
  budget: { title: 'Budget Tracker', sub: 'Monthly spending limits by category' },
  reports: { title: 'Reports & Analytics', sub: 'Trends, insights and summaries' }
};

window.navigate = (viewId) => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = $('view-' + viewId);
  if (target) target.classList.add('active');
  
  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');
  
  const meta = VIEW_META[viewId];
  $('viewTitle').textContent = meta.title;
  $('viewSub').textContent = meta.sub;

  if (viewId === 'dashboard') updateGreeting();
  renderView(viewId);
};

function updateGreeting() {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
    const name = state.user?.name || 'User';
    const randoms = [`Welcome Back, ${name}!`, `${name} returns!`, `Master ${name} has come back!`];
    const pool = [`${g}, ${name}!`, ...randoms];
    $('dashboardGreeting').textContent = pool[Math.floor(Math.random() * pool.length)];
}

function renderView(id) {
  if (id === 'dashboard') renderDashboard();
  if (id === 'transactions') renderTransactionTable();
  if (id === 'budget') renderBudget();
  if (id === 'reports') renderReports();
}

// ═══════════════════════════════════════════════════════════
//  RENDERING & CHARTS
// ═══════════════════════════════════════════════════════════

let cashflowChart, pieChart, trendChart, reportPieChart;

function getFilteredTransactions() {
  const month = DOM.filterMonth.value;
  return state.transactions.filter(tx => month === 'all' || tx.date.startsWith(month));
}

function renderDashboard() {
  const txs = getFilteredTransactions();
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = income - expenses;
  const rate = income > 0 ? ((net / income) * 100).toFixed(1) : 0;

  $('kpiIncome').textContent = fmt(income);
  $('kpiExpenses').textContent = fmt(expenses);
  const balEl = $('kpiBalance');
  balEl.textContent = (net < 0 ? '-' : '') + fmt(Math.abs(net));
  balEl.className = 'kpi-value mono ' + (net >= 0 ? 'text-green' : 'text-red');
  $('kpiSavings').textContent = rate + '%';
  $('kpiTxCount').textContent = txs.length + ' transactions';
  $('kpiIncomeChange').textContent = txs.filter(t=>t.type==='income').length + ' entries';
  $('kpiExpensesChange').textContent = txs.filter(t=>t.type==='expense').length + ' entries';

  const recent = [...txs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0, 8);
  const rList = $('recentTxList');
  if (recent.length === 0) {
    rList.innerHTML = `<div class="empty-state"><h3>No transactions yet</h3></div>`;
  } else {
    rList.innerHTML = recent.map(tx => renderTxItem(tx)).join('');
  }

  buildCashflowChart(txs);
  buildPieChart(txs);
}

function renderTxItem(tx) {
  const isIncome = tx.type === 'income';
  const icon = getCatIcon(tx.category);
  const bg = isIncome ? 'var(--accent-green-dim)' : 'var(--accent-red-dim)';
  const d = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const pill = `<span class="pill ${isIncome?'green':'red'}">${tx.category}</span>`;
  return `
    <div class="tx-item" onclick="editTx('${tx.id}')">
      <div class="tx-avatar" style="background:${bg};">${icon}</div>
      <div>
        <div class="tx-desc">${tx.description || tx.subcategory || tx.category}</div>
        <div class="tx-meta">${d} · ${tx.subcategory || ''} · ${tx.payment_method || ''}</div>
      </div>
      ${pill}
      <div class="tx-amount ${tx.type}">${isIncome ? '+' : '-'}${fmt(tx.amount)}</div>
    </div>`;
}

function getCatIcon(cat) {
  const map = {
    'Housing':'H','Food & Dining':'F','Transportation':'T','Healthcare':'H',
    'Personal Care':'P','Entertainment':'E','Technology':'T','Financial Obligations':'F',
    'Savings & Investments':'S','Education':'E','Travel & Vacation':'V','Gifts & Charity':'G',
    'Children & Family':'C','Business Expenses':'B','Taxes & Government':'T','Miscellaneous':'M',
    'Salary & Wages':'S','Freelance & Contract':'F','Business Revenue':'B','Investments':'I',
    'Rental Income':'R','Government & Benefits':'G','Other Income':'O'
  };
  return map[cat] || cat.slice(0, 2).toUpperCase();
}

// Transaction List View
function renderTransactionTable() {
    const txs = getFilteredTransactions();
    const tbody = $('txTableBody');
    if (txs.length === 0) {
        tbody.innerHTML = '';
        $('txEmptyState').style.display = 'block';
        $('txCount').textContent = '0 transactions';
        $('txTotal').textContent = 'Total: ₱0.00';
    } else {
        $('txEmptyState').style.display = 'none';
        tbody.innerHTML = txs.map(tx => `
            <tr onclick="editTx('${tx.id}')">
                <td><div class="tx-avatar small">${getCatIcon(tx.category)}</div></td>
                <td class="mono" style="font-size:12px;">${tx.date}</td>
                <td><div class="fw-500">${tx.description}</div><div class="text-muted" style="font-size:11px;">${tx.tags || ''}</div></td>
                <td><span class="pill">${tx.category}</span></td>
                <td>${tx.payment_method}</td>
                <td class="text-muted" style="font-size:11px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${tx.notes || ''}</td>
                <td class="mono fw-600 ${tx.type}" style="text-align:right;">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</td>
                <td style="text-align:center;"><button class="btn btn-ghost" style="padding:4px;" onclick="event.stopPropagation(); deleteTx('${tx.id}')">✕</button></td>
            </tr>
        `).join('');
        $('txCount').textContent = `${txs.length} transactions`;
        const total = txs.reduce((s,t) => s + (t.type==='income'?t.amount:-t.amount), 0);
        $('txTotal').textContent = `Total: ${fmt(total)}`;
    }
}

// Budget View
async function renderBudget() {
    const txs = getFilteredTransactions();
    const budgets = state.budgets;
    const grid = $('budgetGrid');
    
    const cats = Object.keys(CATEGORIES.expense);
    if (!Object.keys(budgets).length) {
        grid.innerHTML = '';
        $('budgetEmpty').style.display = 'block';
    } else {
        $('budgetEmpty').style.display = 'none';
        grid.innerHTML = Object.entries(budgets).map(([cat, limit]) => {
            const spent = txs.filter(t => t.category === cat && t.type === 'expense').reduce((s,t)=>s+t.amount, 0);
            const percent = Math.min(100, (spent/limit)*100);
            const remain = limit - spent;
            const color = percent > 90 ? 'var(--accent-red)' : percent > 70 ? 'var(--accent-orange)' : 'var(--accent-blue)';
            return `
                <div class="card budget-card">
                    <div class="budget-header">
                        <div><div class="fw-600">${cat}</div><div class="text-muted" style="font-size:12px;">Limit: ${fmt(limit)}</div></div>
                        <button class="btn btn-ghost" style="padding:4px" onclick="deleteBudget('${cat}')">✕</button>
                    </div>
                    <div class="progress-bar" style="height:8px; margin:12px 0;"><div class="progress-fill" style="width:${percent}%; background:${color};"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:13px;">
                        <span>Spent: ${fmt(spent)}</span>
                        <span class="fw-600" style="color:${remain < 0 ? 'var(--accent-red)' : ''}">${remain < 0 ? 'Over' : 'Left'}: ${fmt(Math.abs(remain))}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Populate budget modal dropdown
    $('budgetCat').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

// Reports View
function renderReports() {
    const txs = state.transactions;
    // Build Trend Chart
    const months = {};
    txs.forEach(tx => {
        const m = tx.date.slice(0, 7);
        if (!months[m]) months[m] = { income: 0, expense: 0 };
        if (tx.type === 'income') months[m].income += tx.amount;
        else months[m].expense += tx.amount;
    });
    const sortedMo = Object.keys(months).sort().slice(-6);
    if (trendChart) trendChart.destroy();
    trendChart = new Chart($('trendChart'), {
        type: 'line',
        data: {
            labels: sortedMo,
            datasets: [
                { label: 'Income', data: sortedMo.map(m=>months[m].income), borderColor: '#30D158', tension: 0.3, fill: false },
                { label: 'Expenses', data: sortedMo.map(m=>months[m].expense), borderColor: '#FF453A', tension: 0.3, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Summary table
    $('summaryBody').innerHTML = sortedMo.reverse().map(m => {
        const { income, expense } = months[m];
        const net = income - expense;
        const rate = income > 0 ? ((net / income) * 100).toFixed(1) : 0;
        return `<tr><td class="mono">${m}</td><td style="text-align:right" class="text-green">${fmt(income)}</td><td style="text-align:right" class="text-red">${fmt(expense)}</td><td style="text-align:right" class="fw-600">${fmt(net)}</td><td style="text-align:right">${rate}%</td><td style="text-align:right">${txs.filter(t=>t.date.startsWith(m)).length}</td></tr>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
//  CHARTS UTILS
// ═══════════════════════════════════════════════════════════

function buildCashflowChart(txs) {
    const months = {};
    txs.forEach(tx => {
      const m = tx.date.slice(0, 7);
      if (!months[m]) months[m] = { income: 0, expenses: 0 };
      if (tx.type === 'income') months[m].income += tx.amount;
      else months[m].expenses += tx.amount;
    });
    const labels = Object.keys(months).sort().map(m => m);
    if (cashflowChart) cashflowChart.destroy();
    cashflowChart = new Chart($('cashflowChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Income', data: labels.map(m => months[m].income), backgroundColor: 'rgba(48,209,88,0.2)', borderColor: '#30D158', borderWidth: 1.5, borderRadius: 6 },
          { label: 'Expenses', data: labels.map(m => months[m].expenses), backgroundColor: 'rgba(255,69,58,0.2)', borderColor: '#FF453A', borderWidth: 1.5, borderRadius: 6 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: v => fmtShort(v) } } } }
    });
}

function buildPieChart(txs) {
    const cats = {};
    txs.filter(t => t.type === 'expense').forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0, 8);
    if (pieChart) pieChart.destroy();
    const total = sorted.reduce((s, [,v]) => s + v, 0);
    pieChart = new Chart($('pieChart').getContext('2d'), {
      type: 'doughnut',
      data: { labels: sorted.map(([k]) => k), datasets: [{ data: sorted.map(([,v]) => v), backgroundColor: CAT_COLORS }] },
      options: { plugins: { legend: { display: false } }, cutout: '72%', maintainAspectRatio: false }
    });
    $('catLegend').innerHTML = sorted.map(([k, v], i) => `
      <div class="cat-item">
        <div class="cat-item-header"><span style="font-size:12px;"><div class="cat-dot" style="background:${CAT_COLORS[i]}"></div> ${k}</span> <span>${fmt(v)}</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${v/total*100}%; background:${CAT_COLORS[i]};"></div></div>
      </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
//  CRUD UI PART 2
// ═══════════════════════════════════════════════════════════

window.saveTransaction = async () => {
    const tx = {
        id: state.editId || undefined,
        type: document.querySelector('input[name="txType"]:checked').value,
        date: $('txDate').value,
        amount: parseFloat($('txAmount').value),
        description: $('txDesc').value,
        category: $('txCat').value,
        subcategory: $('txSubcat').value,
        payment_method: $('txPayment').value,
        notes: $('txNotes').value,
        tags: $('txTags').value
    };
    if (!tx.date || !tx.amount || !tx.description) { showToast('Complete required fields', 'error'); return; }
    try {
        showToast('Syncing Vault...', 'neutral');
        await DB.saveTransaction(tx);
        showToast('Vault Updated!', 'success');
        closeModal();
        await loadAppData();
        renderView(document.querySelector('.nav-item.active').dataset.view);
    } catch (e) { showToast(e.message, 'error'); }
};

window.deleteTx = async (id) => {
    if (!confirm('Permanent delete from vault?')) return;
    try {
        showToast('Syncing Vault...', 'neutral');
        await DB.deleteTransaction(id);
        await loadAppData();
        renderView(document.querySelector('.nav-item.active').dataset.view);
    } catch(e) { showToast(e.message, 'error'); }
};

window.openBudgetModal = () => {
    $('budgetAmount').value = '';
    $('budgetModal').classList.add('open');
};
window.closeBudgetModal = () => $('budgetModal').classList.remove('open');

window.saveBudget = async () => {
    const cat = $('budgetCat').value;
    const amt = parseFloat($('budgetAmount').value);
    if (!amt) return;
    try {
        showToast('Syncing Vault...', 'neutral');
        await DB.saveBudget(cat, amt);
        showToast('Budget Updated!', 'success');
        closeBudgetModal();
        await loadAppData();
        renderView('budget');
    } catch(e) { showToast(e.message, 'error'); }
};

window.deleteBudget = async (cat) => {
    if (!confirm('Remove budget for ' + cat + '?')) return;
    try {
        await DB.deleteBudget(cat);
        await loadAppData();
        renderView('budget');
    } catch(e) { showToast(e.message, 'error'); }
};

// ═══════════════════════════════════════════════════════════
//  HELPERS & UTILS
// ═══════════════════════════════════════════════════════════

function buildMonthOptions() {
  const set = new Set(state.transactions.map(t => t.date.slice(0, 7)));
  const sorted = [...set].sort().reverse();
  $('filterMonth').innerHTML = '<option value="all">All Time</option>' + sorted.map(m => `<option value="${m}">${m}</option>`).join('');
}

function showToast(msg, type = 'success') {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3200);
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.view)));
  $('txCat').addEventListener('change', () => updateSubcats());
  document.querySelectorAll('input[name="txType"]').forEach(r => r.addEventListener('change', (e) => populateCatSelect(e.target.value)));
  $('filterMonth').addEventListener('change', () => renderView(document.querySelector('.nav-item.active').dataset.view));
}

window.toggleSidebar = () => $('sidebar').classList.toggle('open');
window.closeSidebar = () => $('sidebar').classList.remove('open');

init();
