/* ═══════════════════════════════════════
   SETTINGS.JS — Config & Exports
═══════════════════════════════════════ */

function renderSettings(container) {
  const fb = state.fbConfig;
  
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title-sm">Settings</h2>
        <p class="section-sub-sm">Manage dashboard configuration and data</p>
      </div>
    </div>

    <!-- Security -->
    <div class="settings-section">
      <div class="settings-section-title">Security</div>
      <p class="settings-section-sub">Change your dashboard access password.</p>
      <div class="settings-form">
        <div class="form-group">
          <label class="form-label">New Password</label>
          <input type="password" id="set_pwd" class="form-input" placeholder="Leave blank to keep current">
        </div>
        <button class="btn-sm btn-primary-sm" style="align-self:flex-start" onclick="savePassword()">Update Password</button>
      </div>
    </div>

    <!-- Facebook API -->
    <div class="settings-section">
      <div class="settings-section-title">Facebook Ads API</div>
      <p class="settings-section-sub">Requires a System User Access Token from Facebook Developer Portal.</p>
      <div class="settings-form">
        <div class="form-group">
          <label class="form-label">Ad Account ID</label>
          <input type="text" id="set_fb_id" class="form-input" placeholder="e.g. act_123456789" value="${escHtml(fb.appId)}">
        </div>
        <div class="form-group">
          <label class="form-label">Access Token</label>
          <input type="password" id="set_fb_token" class="form-input" placeholder="EAAB..." value="${escHtml(fb.accessToken)}">
        </div>
        <button class="btn-sm btn-primary-sm" style="align-self:flex-start" onclick="saveFbConfig()">Save API Keys</button>
      </div>
    </div>

    <!-- Data Export -->
    <div class="settings-section">
      <div class="settings-section-title">Data Management</div>
      <p class="settings-section-sub">Export your data or reset the dashboard to factory settings.</p>
      <div class="flex-row mt-16">
        <button class="btn-sm btn-ghost" onclick="exportData('leads')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Leads CSV
        </button>
        <button class="btn-sm btn-ghost" onclick="exportData('payments')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Payments CSV
        </button>
      </div>
      <div class="divider"></div>
      <div class="flex-between">
        <div>
          <div class="fw-600 text-red" style="font-size:0.85rem">Danger Zone</div>
          <div class="text-dim" style="font-size:0.75rem">This will delete all local storage data.</div>
        </div>
        <button class="btn-sm btn-danger danger-zone" onclick="resetData()">Reset All Data</button>
      </div>
    </div>
  `;
}

function savePassword() {
  const pwd = document.getElementById('set_pwd').value.trim();
  if (pwd) {
    localStorage.setItem(PASSWORD_KEY, pwd);
    document.getElementById('set_pwd').value = '';
    showToast('Password updated successfully', 'success');
  } else {
    showToast('Password cannot be empty', 'error');
  }
}

function saveFbConfig() {
  state.fbConfig.appId = document.getElementById('set_fb_id').value.trim();
  state.fbConfig.accessToken = document.getElementById('set_fb_token').value.trim();
  saveData('fbConfig');
  showToast('Facebook configuration saved', 'success');
}

function exportData(type) {
  const data = type === 'leads' ? state.leads : state.payments;
  if (!data.length) return showToast('No data to export', 'error');

  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(item => keys.map(k => `"${(item[k]||'').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chessgum_${type}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function resetData() {
  if (confirm('Are you absolutely sure? This will delete all leads and payments data locally.')) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }
}
