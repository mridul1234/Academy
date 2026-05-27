/* ═══════════════════════════════════════
   CORE.JS — Auth, Router, Toast, Utils
═══════════════════════════════════════ */

// ── Constants ──────────────────────────
const DEFAULT_PASSWORD = 'chess@admin';
const SESSION_KEY      = 'chg_session';
const PASSWORD_KEY     = 'chg_password';

// Page metadata
const PAGES = {
  overview: { title: 'Overview',      sub: 'Your business at a glance' },
  leads:    { title: 'Leads',         sub: 'Manage your pipeline & follow-ups' },
  payments: { title: 'Payments',      sub: 'Razorpay collections & analytics' },
  facebook: { title: 'Facebook Ads',  sub: 'Ad performance & spend tracking' },
  insights: { title: 'Insights',      sub: 'Drop-offs, objections & patterns' },
  settings: { title: 'Settings',      sub: 'Dashboard configuration & exports' },
};

// Stage config
const STAGES = [
  { id: 'demo_form_filled', label: 'Demo Form Filled', color: '#3B82F6', dot: '#3B82F6' },
  { id: 'demo_done',        label: 'Demo Done',        color: '#F59E0B', dot: '#F59E0B' },
  { id: 'follow_up',        label: 'Follow Up',        color: '#F97316', dot: '#F97316' },
  { id: 'converted',        label: 'Converted',        color: '#10B981', dot: '#10B981' },
  { id: 'lost',             label: 'Lost',             color: '#EF4444', dot: '#EF4444' },
];

const STAGE_LABELS = {
  demo_form_filled: 'Demo Form Filled',
  demo_done:        'Demo Done',
  follow_up:        'Follow Up',
  converted:        'Converted',
  lost:             'Lost',
};

const SOURCE_LABELS = {
  facebook_ad:  'Facebook Ad',
  website_form: 'Website Form',
};

const LOST_REASONS = [
  { id: 'price_high',         label: '💰 Price too high' },
  { id: 'timing',             label: '⏰ Timing doesn\'t work' },
  { id: 'not_interested',     label: '😐 Child not interested' },
  { id: 'enrolled_elsewhere', label: '🏫 Enrolled elsewhere' },
  { id: 'no_response',        label: '🔇 No response / ghosted' },
  { id: 'other',              label: '📝 Other' },
];

const PLAN_LABELS = {
  buddy_beginner:       'Buddy · Beginner',
  individual_beginner:  'Individual · Beginner',
  buddy_intermediate:   'Buddy · Intermediate',
  individual_intermediate: 'Individual · Intermediate',
  buddy_advanced:       'Buddy · Advanced',
  individual_advanced:  'Individual · Advanced',
};

// ── Auth ───────────────────────────────
function getStoredPassword() {
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function handleLogin() {
  const input = document.getElementById('authPassword');
  const error = document.getElementById('authError');
  const btn   = document.getElementById('authBtn');

  const password = input.value;
  if (!password) { input.focus(); return; }

  btn.innerHTML = '<span>Verifying…</span>';
  btn.style.opacity = '0.7';

  setTimeout(() => {
    if (password === getStoredPassword()) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      document.getElementById('authGate').style.display = 'none';
      document.getElementById('dashApp').style.display  = 'flex';
      error.style.display = 'none';
      initApp();
    } else {
      error.style.display = 'flex';
      input.value = '';
      input.focus();
      btn.innerHTML = '<span>Enter Dashboard</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
      btn.style.opacity = '1';
    }
  }, 400);
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

function toggleAuthEye() {
  const input = document.getElementById('authPassword');
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ── Router ─────────────────────────────
let currentPage = 'overview';
let chartInstances = {};

function navigate(page) {
  if (!PAGES[page]) return;
  currentPage = page;

  // Hide all pages
  document.querySelectorAll('.dash-page').forEach(el => el.style.display = 'none');
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.style.display = 'block';

  // Update sidebar active
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update header
  document.getElementById('dashPageTitle').textContent = PAGES[page].title;
  document.getElementById('dashPageSub').textContent   = PAGES[page].sub;

  // Close sidebar on mobile
  if (window.innerWidth <= 900) closeSidebar();

  // Render the page
  renderPage(page);
}

function renderPage(page) {
  const el = document.getElementById('page-' + page);
  if (!el) return;
  switch (page) {
    case 'overview': renderOverview(el); break;
    case 'leads':    renderLeads(el);    break;
    case 'payments': renderPayments(el); break;
    case 'facebook': renderFacebook(el); break;
    case 'insights': renderInsights(el); break;
    case 'settings': renderSettings(el); break;
  }
}

// ── Sidebar Toggle ─────────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ── Toast Notifications ────────────────
function showToast(message, type = 'info', duration = 3000) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fading');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Utility Helpers ────────────────────
function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(ts) {
  return new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function daysSince(ts) {
  return Math.floor((Date.now() - ts) / 86400000);
}
function uid() {
  return '_' + Math.random().toString(36).substr(2, 9);
}
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function updateDate() {
  const el = document.getElementById('dashDate');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function destroyCharts() {
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch(e){} });
  chartInstances = {};
}

function animateCountUp(el, target, prefix = '', suffix = '', duration = 1200) {
  const start = Date.now();
  const isFloat = String(target).includes('.');
  function step() {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = isFloat ? (target * ease).toFixed(1) : Math.floor(target * ease);
    el.textContent = prefix + val.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
