/* ═══════════════════════════════════════
   LEADS-TABLE.JS — Leads List View
═══════════════════════════════════════ */

let currentLeadsView = 'kanban';
let leadSearchQuery = '';
let leadStageFilter = 'all';

function renderLeads(container) {
  container.innerHTML = `
    <div class="leads-toolbar">
      <div class="search-input-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" class="search-input" id="leadSearch" placeholder="Search by name, parent, phone..." value="${escHtml(leadSearchQuery)}">
      </div>
      <select class="filter-select" id="leadStageFilter">
        <option value="all" ${leadStageFilter==='all'?'selected':''}>All Stages</option>
        ${STAGES.map(s => `<option value="${s.id}" ${leadStageFilter===s.id?'selected':''}>${s.label}</option>`).join('')}
      </select>
      <div style="flex:1"></div>
      <div class="view-toggle">
        <button class="view-toggle-btn ${currentLeadsView==='list'?'active':''}" onclick="setLeadsView('list')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          List
        </button>
        <button class="view-toggle-btn ${currentLeadsView==='kanban'?'active':''}" onclick="setLeadsView('kanban')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="13" rx="1"/></svg>
          Board
        </button>
      </div>
    </div>
    <div id="leadsContainer"></div>
  `;

  document.getElementById('leadSearch').addEventListener('input', (e) => {
    leadSearchQuery = e.target.value;
    updateLeadsView();
  });
  document.getElementById('leadStageFilter').addEventListener('change', (e) => {
    leadStageFilter = e.target.value;
    updateLeadsView();
  });

  updateLeadsView();
}

function setLeadsView(view) {
  currentLeadsView = view;
  renderLeads(document.getElementById('page-leads'));
}

function updateLeadsView() {
  const container = document.getElementById('leadsContainer');
  if (!container) return;

  let filtered = state.leads;
  if (leadSearchQuery) {
    const q = leadSearchQuery.toLowerCase();
    filtered = filtered.filter(l => 
      (l.parentName && l.parentName.toLowerCase().includes(q)) ||
      (l.childName && l.childName.toLowerCase().includes(q))
    );
  }
  if (leadStageFilter !== 'all') {
    filtered = filtered.filter(l => l.stage === leadStageFilter);
  }

  if (currentLeadsView === 'list') {
    renderLeadsList(container, filtered);
  } else {
    renderLeadsKanban(container, filtered);
  }
}

function renderLeadsList(container, leads) {
  if (leads.length === 0) {
    container.innerHTML = `
      <div class="empty-state card">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No leads found</div>
        <div class="empty-state-sub">Try adjusting your search or filters.</div>
      </div>
    `;
    return;
  }

  const rows = leads.map(l => {
    const days = daysSince(l.addedAt);
    let daysClass = '';
    if (days > 14 && !['converted','lost'].includes(l.stage)) daysClass = 'very-stale';
    else if (days > 7 && !['converted','lost'].includes(l.stage)) daysClass = 'stale';

    return `
      <tr onclick="openLeadDrawer('${l.id}')">
        <td class="lead-name-cell">
          <div class="lead-parent">${escHtml(l.parentName)}</div>
          <div class="lead-child">Child: ${escHtml(l.childName)}</div>
        </td>
        <td><div class="lead-age-badge">${l.age} yrs</div></td>
        <td>
          <div class="source-badge source-${l.source}">
            ${l.source === 'facebook_ad' ? 'FB' : 'Web'} ${SOURCE_LABELS[l.source]}
          </div>
        </td>
        <td><div class="stage-badge stage-${l.stage}">${STAGE_LABELS[l.stage]}</div></td>
        <td class="monospace text-dim">${formatCurrency(l.value)}</td>
        <td>
          <div class="lead-days-badge ${daysClass}">${days === 0 ? 'Today' : days + 'd ago'}</div>
        </td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="leads-table-wrap">
      <table class="leads-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Source</th>
            <th>Stage</th>
            <th>Value</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
