/* ═══════════════════════════════════════
   LEADS-DRAWER.JS — Drawer & Modals
═══════════════════════════════════════ */

// ── Lead Detail Drawer ─────────────────
let activeLeadId = null;

function openLeadDrawer(id) {
  const lead = getLead(id);
  if (!lead) return;
  activeLeadId = id;

  const panel = document.getElementById('drawerPanel');
  const histHtml = STAGES.map((s, i) => {
    const isPast = STAGES.findIndex(x => x.id === lead.stage) >= i;
    const isActive = s.id === lead.stage;
    return `
      <div class="stage-history-item">
        <div class="stage-dot ${isActive ? 'active' : ''}" ${isPast && !isActive ? 'style="background:var(--purple-subtle);border-color:var(--purple-dim)"' : ''}></div>
        <div class="stage-history-content">
          <div class="stage-history-label" style="color: ${isActive ? 'var(--text)' : 'var(--text-mid)'}">${s.label}</div>
        </div>
      </div>
    `;
  }).join('');

  const notesHtml = lead.notes.length ? lead.notes.map(n => `
    <div class="note-item">
      <div class="note-text">${escHtml(n.text)}</div>
      <div class="note-time">${formatDateTime(n.ts)}</div>
    </div>
  `).join('') : '<div class="text-dim text-center mt-12 mb-12" style="font-size:0.8rem">No notes yet.</div>';

  panel.innerHTML = `
    <div class="drawer-topbar">
      <div class="drawer-title">${escHtml(lead.parentName)} / ${escHtml(lead.childName)}</div>
      <button class="drawer-close" onclick="closeDrawer()" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    
    <div class="drawer-body">
      <div class="drawer-section">
        <div class="drawer-section-title">Lead Info</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Stage</div>
            <div class="info-value"><span class="stage-badge stage-${lead.stage}">${STAGE_LABELS[lead.stage]}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Source</div>
            <div class="info-value"><span class="source-badge source-${lead.source}">${SOURCE_LABELS[lead.source]}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Plan Interest</div>
            <div class="info-value">${PLAN_LABELS[lead.plan] || lead.plan}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Lead Value</div>
            <div class="info-value text-purple fw-700">${formatCurrency(lead.value)}</div>
          </div>
          ${lead.lostReason ? `
            <div class="info-item" style="grid-column: 1/-1; margin-top:8px; padding:10px; background:var(--red-dim); border:1px solid rgba(239,68,68,0.2); border-radius:8px;">
              <div class="info-label text-red">Lost Reason</div>
              <div class="info-value text-red">${LOST_REASONS.find(r=>r.id===lead.lostReason)?.label || lead.lostReason}</div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Contact</div>
        <div class="contact-btns">
          <a href="https://wa.me/91${lead.phone || ''}" target="_blank" class="contact-btn contact-btn-wa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> WhatsApp
          </a>
          ${lead.email ? `
          <a href="mailto:${lead.email}" class="contact-btn contact-btn-email">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> Email
          </a>` : ''}
        </div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Timeline</div>
        <div class="stage-history">${histHtml}</div>
      </div>

      <div class="drawer-section">
        <div class="drawer-section-title">Notes</div>
        <div class="note-add-form mb-16">
          <textarea id="drawerNoteInput" class="note-textarea" placeholder="Add a note..."></textarea>
          <button class="btn-sm btn-primary-sm" onclick="submitNote()" style="align-self:flex-end">Post</button>
        </div>
        <div class="notes-list">${notesHtml}</div>
      </div>
    </div>
    
    <div class="drawer-actions">
      ${lead.stage !== 'converted' && lead.stage !== 'lost' ? `
        <button class="btn-sm btn-success" onclick="markLeadConverted('${lead.id}')">Mark Converted</button>
        <button class="btn-sm btn-danger" onclick="openLostModal('${lead.id}')">Mark Lost</button>
      ` : ''}
    </div>
  `;

  document.getElementById('leadDrawer').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('leadDrawer').style.display = 'none';
  document.body.style.overflow = '';
  activeLeadId = null;
  updateLeadsView();
}

function submitNote() {
  const inp = document.getElementById('drawerNoteInput');
  const txt = inp.value.trim();
  if (!txt || !activeLeadId) return;
  addLeadNote(activeLeadId, txt);
  inp.value = '';
  showToast('Note added', 'success');
  openLeadDrawer(activeLeadId); // refresh
}

function markLeadConverted(id) {
  updateLead(id, { stage: 'converted', lostReason: null });
  showToast('Lead marked as converted! 🎉', 'success');
  openLeadDrawer(id);
}

// ── Add Lead Modal ─────────────────────
function openAddLeadModal() {
  const modal = document.getElementById('addLeadModal');
  const card = document.getElementById('addLeadModalCard');
  card.innerHTML = `
    <div class="modal-header">
      <div class="modal-title">Add New Lead</div>
      <button class="modal-close" onclick="closeAddLeadModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="modal-body">
      <form id="addLeadForm" class="form-grid">
        <div class="form-group">
          <label class="form-label">Parent Name <span class="required">*</span></label>
          <input type="text" id="al_pname" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Child Name <span class="required">*</span></label>
          <input type="text" id="al_cname" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">Child Age <span class="required">*</span></label>
          <input type="number" id="al_age" class="form-input" min="4" max="18" required>
        </div>
        <div class="form-group">
          <label class="form-label">Phone <span class="required">*</span></label>
          <input type="tel" id="al_phone" class="form-input" required>
        </div>
        <div class="form-group full">
          <label class="form-label">Email</label>
          <input type="email" id="al_email" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label">Source</label>
          <select id="al_source" class="form-select">
            <option value="website_form">Website Form</option>
            <option value="facebook_ad">Facebook Ad</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Plan Interest</label>
          <select id="al_plan" class="form-select">
            <option value="buddy_beginner">Buddy · Beginner</option>
            <option value="individual_beginner">Individual · Beginner</option>
            <option value="buddy_intermediate">Buddy · Intermediate</option>
            <option value="individual_intermediate">Individual · Intermediate</option>
            <option value="buddy_advanced">Buddy · Advanced</option>
            <option value="individual_advanced">Individual · Advanced</option>
          </select>
        </div>
        <div class="form-group full">
          <label class="form-label">Initial Notes</label>
          <textarea id="al_notes" class="form-textarea"></textarea>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-sm btn-ghost" onclick="closeAddLeadModal()">Cancel</button>
      <button class="btn-sm btn-primary-sm" onclick="submitAddLead()">Save Lead</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function closeAddLeadModal() {
  document.getElementById('addLeadModal').style.display = 'none';
}

function submitAddLead() {
  const pName = document.getElementById('al_pname').value.trim();
  const cName = document.getElementById('al_cname').value.trim();
  const age = document.getElementById('al_age').value;
  const phone = document.getElementById('al_phone').value.trim();
  if (!pName || !cName || !age || !phone) {
    showToast('Please fill all required fields', 'error');
    return;
  }

  // Estimate value based on plan (quarterly)
  const plan = document.getElementById('al_plan').value;
  let val = 3500;
  if(plan==='individual_beginner') val = 5500;
  else if(plan==='buddy_intermediate') val = 3675;
  else if(plan==='individual_intermediate') val = 5775;
  else if(plan==='buddy_advanced') val = 3850;
  else if(plan==='individual_advanced') val = 6050;

  addLead({
    parentName: pName,
    childName: cName,
    age: parseInt(age),
    phone: phone,
    email: document.getElementById('al_email').value.trim(),
    source: document.getElementById('al_source').value,
    plan: plan,
    stage: 'demo_form_filled',
    value: val,
    notes: document.getElementById('al_notes').value.trim()
  });

  closeAddLeadModal();
  showToast('Lead added successfully', 'success');
  if (currentPage === 'leads') updateLeadsView();
}

// ── Mark Lost Modal ────────────────────
let pendingLostLeadId = null;
let pendingLostDomFrom = null;
let pendingLostDomTo = null;

function openLostModal(id, domFrom = null, domTo = null) {
  pendingLostLeadId = id;
  pendingLostDomFrom = domFrom;
  pendingLostDomTo = domTo;
  
  const modal = document.getElementById('lostModal');
  const card = document.getElementById('lostModalCard');
  card.innerHTML = `
    <div class="modal-header">
      <div class="modal-title text-red">Mark as Lost</div>
      <button class="modal-close" onclick="cancelLostModal()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="modal-body">
      <div class="form-group full mb-16">
        <label class="form-label">Why was this lead lost?</label>
        <select id="lm_reason" class="form-select">
          ${LOST_REASONS.map(r => `<option value="${r.id}">${r.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group full">
        <label class="form-label">Additional Details</label>
        <textarea id="lm_details" class="form-textarea" placeholder="Optional notes..."></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-sm btn-ghost" onclick="cancelLostModal()">Cancel</button>
      <button class="btn-sm btn-danger" onclick="submitLost()">Confirm Lost</button>
    </div>
  `;
  modal.style.display = 'flex';
}

function cancelLostModal() {
  document.getElementById('lostModal').style.display = 'none';
  // If reverted from Kanban drag
  if (pendingLostDomFrom && pendingLostDomTo) {
    const el = document.querySelector(`.kanban-card[data-id="${pendingLostLeadId}"]`);
    if(el) pendingLostDomFrom.appendChild(el);
  }
  pendingLostLeadId = null;
}

function submitLost() {
  const reason = document.getElementById('lm_reason').value;
  const details = document.getElementById('lm_details').value.trim();
  
  if (details) addLeadNote(pendingLostLeadId, `Lost Reason Details: ${details}`);
  
  updateLead(pendingLostLeadId, { stage: 'lost', lostReason: reason });
  
  // If dragged in Kanban, move it to the 'lost' column DOM manually to save a full re-render
  if (pendingLostDomFrom && pendingLostDomTo) {
    const el = document.querySelector(`.kanban-card[data-id="${pendingLostLeadId}"]`);
    if(el) pendingLostDomTo.appendChild(el);
    updateKanbanCounts();
  }
  
  document.getElementById('lostModal').style.display = 'none';
  showToast('Lead marked as lost', 'info');
  updateSidebarLeadCount();
  
  if (document.getElementById('leadDrawer').style.display === 'block') {
    openLeadDrawer(pendingLostLeadId); // refresh drawer
  }
  if (!pendingLostDomFrom) updateLeadsView();
  pendingLostLeadId = null;
}
