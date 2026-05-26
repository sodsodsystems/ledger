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
    "Food & Dining": ["Groceries & Supermarket", "Restaurants & Dining Out", "Coffee & Beverages", "Takeout & Food Delivery", "Work Lunches", "Snacks & Food Truck", "Street Food"],
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
    "Miscellaneous": ["ATM Withdrawal Fees", "Notaries", "Fines & Penalties", "Subscriptions (Other)", "Unclassified Expenses"]
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
  userCategories: { income: {}, expense: {} },
  editId: null
};

function getAllCategories() {
    const merged = {
        income: { ...CATEGORIES.income, ...state.userCategories.income },
        expense: { ...CATEGORIES.expense, ...state.userCategories.expense }
    };
    return merged;
}

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

const fmt = n => '₱' + Math.abs(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ═══════════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════════

async function init() {
  state.user = await Auth.getCurrentUser();
  
  if (state.user) {
    $('auth-screen').classList.add('hidden');
    await loadAppData();
    initApp();
  } else {
    $('auth-screen').classList.remove('hidden');
    
    // Check if users exist in localStorage
    const hasUsers = await Auth.hasUsers();
    if (hasUsers) {
      $('login-view').classList.remove('hidden');
      $('setup-view').classList.add('hidden');
    } else {
      $('login-view').classList.add('hidden');
      $('setup-view').classList.remove('hidden');
    }
  }
}

async function loadAppData() {
  state.transactions = await DB.getTransactions();
  state.budgets = await DB.getBudgets();
  state.userCategories = await DB.getUserCategories();
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

window.handleSetup = async () => {
    const user = $('setupUser').value.trim();
    const pass = $('setupPassword').value.trim();
    if (!user || !pass) { showToast('Please enter both name and password', 'error'); return; }
    try {
        await Auth.setupInitialUser(user, pass);
        showToast('Vault Initialized!');
        location.reload();
    } catch (e) { showToast(e.message, 'error'); }
};

window.showSetup = () => {
    $('login-view').classList.add('hidden');
    $('setup-view').classList.remove('hidden');
};

window.showLogin = () => {
    $('setup-view').classList.add('hidden');
    $('login-view').classList.remove('hidden');
};

window.logout = () => Auth.logout();

// ═══════════════════════════════════════════════════════════
//  UI & NAVIGATION
// ═══════════════════════════════════════════════════════════

const VIEW_META = {
  dashboard: { title: 'Dashboard', sub: 'Your financial overview' },
  transactions: { title: 'Transactions', sub: 'All income and expense records' },
  budget: { title: 'Budget Tracker', sub: 'Monthly spending limits by category' },
  reports: { title: 'Reports & Analytics', sub: 'Trends, insights and summaries' },
  settings: { title: 'Settings', sub: 'Customize categories and preferences' }
};

window.navigate = (viewId) => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  // Sync sidebar
  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');
  // Sync bottom tab bar
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const tabItem = document.querySelector(`.tab-item[data-view="${viewId}"]`);
  if (tabItem) tabItem.classList.add('active');

  const target = $('view-' + viewId);
  if (target) target.classList.add('active');

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
    $('dashboardGreeting').textContent = `${g}, ${name}!`;
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
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
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

  // Miller's Law: show max 7 recent transactions
  const recent = [...txs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0, 7);
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
  const d = new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const prefix = isIncome ? '+' : '−';
  return `
    <div class="tx-item" onclick="editTx('${tx.id}')" role="button" aria-label="${isIncome ? 'Income' : 'Expense'} ${fmt(tx.amount)} — ${tx.description || tx.category}">
      <div class="tx-avatar ${tx.type}" aria-hidden="true">${icon}</div>
      <div class="tx-body">
        <div class="tx-desc">${tx.description || tx.category}</div>
        <div class="tx-meta">${d} · ${tx.category}</div>
      </div>
      <div class="tx-amount ${tx.type}" aria-label="${isIncome ? 'Income' : 'Expense'} ${fmt(tx.amount)}">${prefix}${fmt(tx.amount)}</div>
    </div>`;
}

function getCatIcon(cat) {
  const map = { 'Housing':'H','Food & Dining':'F','Transportation':'T','Healthcare':'H','Personal Care':'P','Entertainment':'E','Technology':'T','Miscellaneous':'M','Salary & Wages':'S' };
  return map[cat] || (cat ? cat.slice(0, 1).toUpperCase() : '?');
}

function renderTransactionTable() {
    const txs = getFilteredTransactions();
    const tbody = $('txTableBody');
    if (txs.length === 0) {
        tbody.innerHTML = '';
        $('txEmptyState').style.display = 'block';
    } else {
        $('txEmptyState').style.display = 'none';
        tbody.innerHTML = txs.map(tx => `
            <tr onclick="editTx('${tx.id}')">
                <td><div class="tx-avatar small">${getCatIcon(tx.category)}</div></td>
                <td class="mono">${tx.date}</td>
                <td><div class="fw-500">${tx.description}</div></td>
                <td><span class="pill">${tx.category}</span></td>
                <td>${tx.payment_method}</td>
                <td>${tx.notes || ''}</td>
                <td class="mono fw-600 ${tx.type}" style="text-align:right;">${tx.type==='income'?'+':'-'}${fmt(tx.amount)}</td>
                <td style="text-align:center;"><button class="btn btn-ghost" onclick="event.stopPropagation(); deleteTx('${tx.id}')">✕</button></td>
            </tr>
        `).join('');
    }
}

async function renderBudget() {
    const txs = getFilteredTransactions();
    const budgets = state.budgets;
    const grid = $('budgetGrid');
    
    if (!Object.keys(budgets).length) {
        grid.innerHTML = '';
        $('budgetEmpty').style.display = 'block';
    } else {
        $('budgetEmpty').style.display = 'none';
        grid.innerHTML = Object.entries(budgets).map(([cat, limit]) => {
            const spent = txs.filter(t => t.category === cat && t.type === 'expense').reduce((s,t)=>s+(t.amount||0), 0);
            const percent = Math.min(100, (spent/limit)*100);
            return `
                <div class="card budget-card">
                    <div class="budget-header">
                        <div class="fw-600">${cat}</div>
                        <button class="btn btn-ghost" onclick="deleteBudget('${cat}')">✕</button>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${percent}%; background:${percent>90?'var(--accent-red)':'var(--accent-blue)'}"></div></div>
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:8px;">
                        <span>Spent: ${fmt(spent)}</span>
                        <span>Limit: ${fmt(limit)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    const cats = Object.keys(CATEGORIES.expense);
    $('budgetCat').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderReports() {
    const txs = state.transactions;
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
                { label: 'Income', data: sortedMo.map(m=>months[m].income), borderColor: '#30D158', tension: 0.3 },
                { label: 'Expenses', data: sortedMo.map(m=>months[m].expense), borderColor: '#FF453A', tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
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
    const labels = Object.keys(months).sort();
    if (cashflowChart) cashflowChart.destroy();
    cashflowChart = new Chart($('cashflowChart').getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Income', data: labels.map(m => months[m].income), backgroundColor: 'rgba(48,209,88,0.2)', borderColor: '#30D158', borderWidth: 1 },
          { label: 'Expenses', data: labels.map(m => months[m].expenses), backgroundColor: 'rgba(255,69,58,0.2)', borderColor: '#FF453A', borderWidth: 1 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
}

function buildPieChart(txs) {
    const cats = {};
    txs.filter(t => t.type === 'expense').forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0, 8);
    if (pieChart) pieChart.destroy();
    pieChart = new Chart($('pieChart').getContext('2d'), {
      type: 'doughnut',
      data: { labels: sorted.map(([k]) => k), datasets: [{ data: sorted.map(([,v]) => v), backgroundColor: CAT_COLORS }] },
      options: { plugins: { legend: { display: false } }, cutout: '70%', maintainAspectRatio: false }
    });
}

// ═══════════════════════════════════════════════════════════
//  CRUD UI
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
    if (!tx.date || !tx.amount) { showToast('Date and Amount required', 'error'); return; }
    await DB.saveTransaction(tx);
    showToast('Vault Updated!');
    closeModal();
    await loadAppData();
    renderView(document.querySelector('.nav-item.active').dataset.view);
};

window.deleteTx = async (id) => {
    if (!confirm('Permanent delete from vault?')) return;
    await DB.deleteTransaction(id);
    await loadAppData();
    renderView(document.querySelector('.nav-item.active').dataset.view);
};

window.saveBudget = async () => {
    const cat = $('budgetCat').value;
    const amt = parseFloat($('budgetAmount').value);
    if (!amt) return;
    await DB.saveBudget(cat, amt);
    closeBudgetModal();
    await loadAppData();
    renderView('budget');
};

window.deleteBudget = async (cat) => {
    await DB.deleteBudget(cat);
    await loadAppData();
    renderView('budget');
};

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

function buildMonthOptions() {
  const set = new Set(state.transactions.map(t => t.date.slice(0, 7)));
  const sorted = [...set].sort().reverse();
  $('filterMonth').innerHTML = '<option value="all">All Time</option>' + sorted.map(m => `<option value="${m}">${m}</option>`).join('');
}

function populateCatSelect(type) {
    const allCats = getAllCategories()[type];
    const cats = Object.keys(allCats);
    $('txCat').innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    updateSubcats();
}

function updateSubcats() {
    const type = document.querySelector('input[name="txType"]:checked').value;
    const cat = $('txCat').value;
    const allCats = getAllCategories()[type];
    const subs = allCats[cat] || [];
    $('txSubcat').innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
}

window.handleAddCategory = async () => {
    const type = document.querySelector('input[name="customType"]:checked').value;
    const cat = $('newCatName').value.trim();
    const sub = $('newSubName').value.trim();
    
    if (!cat) { showToast('Category name required', 'error'); return; }
    
    await DB.saveCustomCategory(type, cat, sub || null);
    showToast('Category Added!');
    
    $('newCatName').value = '';
    $('newSubName').value = '';
    
    await loadAppData();
    populateCatSelect(document.querySelector('input[name="txType"]:checked').value);
};

function showToast(msg, type = 'success') {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3000);
}

function bindEvents() {
  document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.view)));
  document.querySelectorAll('.tab-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.view)));
  $('txCat').addEventListener('change', () => updateSubcats());
  document.querySelectorAll('input[name="txType"]').forEach(r => r.addEventListener('change', (e) => populateCatSelect(e.target.value)));
  $('filterMonth').addEventListener('change', () => renderView(document.querySelector('.nav-item.active').dataset.view));
}

window.openModal = (id = null) => {
    state.editId = id;
    const modal = $('txModal');
    modal.classList.add('open');
    
    if (id) {
        const tx = state.transactions.find(t => t.id === id);
        if (tx) {
            $('modalTitle').textContent = 'Edit Transaction';
            document.querySelector(`input[name="txType"][value="${tx.type}"]`).checked = true;
            populateCatSelect(tx.type);
            
            $('txDate').value = tx.date;
            $('txAmount').value = tx.amount;
            $('txDesc').value = tx.description || '';
            $('txCat').value = tx.category;
            updateSubcats();
            $('txSubcat').value = tx.subcategory || '';
            $('txPayment').value = tx.payment_method || 'Cash';
            $('txNotes').value = tx.notes || '';
            $('txTags').value = tx.tags || '';
            
            // Show advanced if notes/tags exist
            if (tx.notes || tx.tags) {
                $('advancedFields').style.display = 'block';
                $('advancedToggle').textContent = '− Hide Advanced';
            }
        }
    } else {
        $('modalTitle').textContent = 'Add Transaction';
        $('txDate').value = new Date().toISOString().split('T')[0];
        $('txAmount').value = '';
        $('txDesc').value = '';
        $('txNotes').value = '';
        $('txTags').value = '';
        $('advancedFields').style.display = 'none';
        $('advancedToggle').textContent = '+ Advanced Options';
    }
};

window.editTx = (id) => openModal(id);

window.closeModal = () => $('txModal').classList.remove('open');
window.openBudgetModal = () => $('budgetModal').classList.add('open');
window.closeBudgetModal = () => $('budgetModal').classList.remove('open');
window.toggleSidebar = () => $('sidebar').classList.toggle('open');
window.closeSidebar  = () => $('sidebar').classList.remove('open');

window.toggleAdvancedFields = () => {
  const fields = $('advancedFields');
  const toggle = $('advancedToggle');
  const isOpen = fields.style.display !== 'none';
  fields.style.display = isOpen ? 'none' : 'contents';
  toggle.textContent = isOpen ? '+ Advanced Options' : '− Hide Advanced';
};

init();
