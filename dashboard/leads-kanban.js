/* ═══════════════════════════════════════
   LEADS-KANBAN.JS — Kanban Board
═══════════════════════════════════════ */

let kanbanSortables = [];

function renderLeadsKanban(container, leads) {
  // Group leads by stage
  const cols = {};
  STAGES.forEach(s => cols[s.id] = []);
  leads.forEach(l => { if(cols[l.stage]) cols[l.stage].push(l); });

  const html = `
    <div class="kanban-board" id="kanbanBoard">
      ${STAGES.map(s => {
        const stageLeads = cols[s.id];
        return `
          <div class="kanban-col">
            <div class="kanban-col-header">
              <div class="kanban-col-name">
                <div class="col-dot" style="background:${s.dot}"></div>
                ${s.label}
              </div>
              <div class="kanban-col-count" id="kanban-count-${s.id}">${stageLeads.length}</div>
            </div>
            <div class="kanban-cards" id="kanban-col-${s.id}" data-stage="${s.id}">
              ${stageLeads.map(l => createKanbanCard(l)).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  container.innerHTML = html;

  initSortable();
}

function createKanbanCard(l) {
  const days = daysSince(l.addedAt);
  let daysClass = '';
  if (days > 14 && !['converted','lost'].includes(l.stage)) daysClass = 'very-stale';
  else if (days > 7 && !['converted','lost'].includes(l.stage)) daysClass = 'stale';

  return `
    <div class="kanban-card" data-id="${l.id}" onclick="openLeadDrawer('${l.id}')">
      <div class="kc-name">${escHtml(l.parentName)}</div>
      <div class="kc-child">${escHtml(l.childName)} · ${l.age} yrs</div>
      <div class="kc-footer">
        <div class="source-badge source-${l.source}">${l.source === 'facebook_ad' ? 'FB' : 'Web'}</div>
        <div class="kc-days ${daysClass}">${days === 0 ? 'Today' : days + 'd'}</div>
      </div>
    </div>
  `;
}

function initSortable() {
  kanbanSortables.forEach(s => s.destroy());
  kanbanSortables = [];

  if (!window.Sortable) return;

  STAGES.forEach(s => {
    const el = document.getElementById(`kanban-col-${s.id}`);
    if (el) {
      const sortable = new Sortable(el, {
        group: 'leads',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: function(evt) {
          const itemEl = evt.item;
          const leadId = itemEl.dataset.id;
          const newStage = evt.to.dataset.stage;
          const oldStage = evt.from.dataset.stage;
          
          if (newStage !== oldStage) {
            if (newStage === 'lost') {
              // Revert drag visually until reason is provided
              evt.from.appendChild(itemEl);
              openLostModal(leadId, evt.from, evt.to);
            } else {
              updateLead(leadId, { stage: newStage });
              updateKanbanCounts();
              updateSidebarLeadCount();
              showToast(`Moved to ${STAGE_LABELS[newStage]}`, 'success');
            }
          }
        }
      });
      kanbanSortables.push(sortable);
    }
  });
}

function updateKanbanCounts() {
  STAGES.forEach(s => {
    const el = document.getElementById(`kanban-col-${s.id}`);
    const countEl = document.getElementById(`kanban-count-${s.id}`);
    if (el && countEl) {
      countEl.textContent = el.children.length;
    }
  });
}
