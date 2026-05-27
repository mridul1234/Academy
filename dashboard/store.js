/* ═══════════════════════════════════════
   STORE.JS — Data State & Seed Data
═══════════════════════════════════════ */

// LocalStorage Keys
const KEYS = {
  leads:    'chg_leads',
  payments: 'chg_payments',
  fbconfig: 'chg_fb_config'
};

// ── State ──────────────────────────────
let state = {
  leads: [],
  payments: [],
  fbConfig: { appId: '', accessToken: '' }
};

// ── Seed Data (Fallback) ───────────────
const SEED_LEADS = [
  { id: 'l_1', parentName: 'Reena Sharma', childName: 'Ayaan', age: 5, source: 'facebook_ad', plan: 'buddy_beginner', stage: 'converted', addedAt: Date.now() - 30*86400000, value: 3500, notes: [{text:'Enrolled after free trial', ts:Date.now()-28*86400000}], lostReason: null },
  { id: 'l_2', parentName: 'Amit Desai', childName: 'Rohan', age: 8, source: 'website_form', plan: 'individual_intermediate', stage: 'demo_form_filled', addedAt: Date.now() - 2*86400000, value: 5775, notes: [], lostReason: null },
  { id: 'l_3', parentName: 'Sneha Patel', childName: 'Diya', age: 10, source: 'facebook_ad', plan: 'individual_beginner', stage: 'demo_done', addedAt: Date.now() - 7*86400000, value: 5500, notes: [{text:'Loved the demo, asking husband', ts:Date.now()-6*86400000}], lostReason: null },
  { id: 'l_4', parentName: 'Vikram Singh', childName: 'Arjun', age: 13, source: 'website_form', plan: 'individual_advanced', stage: 'follow_up', addedAt: Date.now() - 15*86400000, value: 6050, notes: [{text:'Wants tournament focus', ts:Date.now()-14*86400000}], lostReason: null },
  { id: 'l_5', parentName: 'Kavita Iyer', childName: 'Sia', age: 6, source: 'facebook_ad', plan: 'buddy_beginner', stage: 'lost', addedAt: Date.now() - 40*86400000, value: 3500, notes: [{text:'Price is an issue right now', ts:Date.now()-38*86400000}], lostReason: 'price_high' }
];

const SEED_PAYMENTS = [
  { id: 'pay_1', date: Date.now() - 2*86400000,  orderId: 'order_MbXX1', customerName: 'Reena Sharma', plan: 'Buddy Beginner', amount: 3500, status: 'captured' },
  { id: 'pay_2', date: Date.now() - 15*86400000, orderId: 'order_MbXX2', customerName: 'Neha Gupta',   plan: 'Individual Int', amount: 5775, status: 'captured' },
  { id: 'pay_3', date: Date.now() - 25*86400000, orderId: 'order_MbXX3', customerName: 'Ravi Kumar',   plan: 'Buddy Advanced', amount: 3850, status: 'captured' },
  { id: 'pay_4', date: Date.now() - 40*86400000, orderId: 'order_MbXX4', customerName: 'Priya Verma',  plan: 'Individual Beg', amount: 5500, status: 'refunded' }
];

// ── Init Store ─────────────────────────
function loadData() {
  const sLeads = localStorage.getItem(KEYS.leads);
  const sPays  = localStorage.getItem(KEYS.payments);
  const sFb    = localStorage.getItem(KEYS.fbconfig);

  if (sLeads) state.leads = JSON.parse(sLeads);
  else { state.leads = [...SEED_LEADS]; saveData('leads'); }

  if (sPays) state.payments = JSON.parse(sPays);
  else { state.payments = [...SEED_PAYMENTS]; saveData('payments'); }

  if (sFb) state.fbConfig = JSON.parse(sFb);
}

function saveData(type) {
  if (type === 'leads' || !type)    localStorage.setItem(KEYS.leads, JSON.stringify(state.leads));
  if (type === 'payments' || !type) localStorage.setItem(KEYS.payments, JSON.stringify(state.payments));
  if (type === 'fbConfig' || !type) localStorage.setItem(KEYS.fbconfig, JSON.stringify(state.fbConfig));
}

// ── Lead Operations ────────────────────
function addLead(leadData) {
  const newLead = {
    id: uid(),
    ...leadData,
    addedAt: Date.now(),
    notes: leadData.notes ? [{ text: leadData.notes, ts: Date.now() }] : [],
    lostReason: null
  };
  state.leads.unshift(newLead);
  saveData('leads');
  updateSidebarLeadCount();
  return newLead;
}

function updateLead(id, updates) {
  const idx = state.leads.findIndex(l => l.id === id);
  if (idx > -1) {
    state.leads[idx] = { ...state.leads[idx], ...updates };
    saveData('leads');
  }
}

function addLeadNote(id, text) {
  const lead = state.leads.find(l => l.id === id);
  if (lead) {
    lead.notes.unshift({ text, ts: Date.now() });
    saveData('leads');
  }
}

function getLead(id) {
  return state.leads.find(l => l.id === id);
}

function updateSidebarLeadCount() {
  const count = state.leads.filter(l => l.stage !== 'lost' && l.stage !== 'converted').length;
  const badge = document.getElementById('sidebarLeadCount');
  if (badge) badge.textContent = count;
}
