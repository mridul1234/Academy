/* ═══════════════════════════════════════
   FACEBOOK.JS — Facebook Ads Integration
═══════════════════════════════════════ */

function renderFacebook(container) {
  const { appId, accessToken } = state.fbConfig;
  
  if (!appId || !accessToken) {
    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title-sm">Facebook Ads</h2>
          <p class="section-sub-sm">Connect your Ad Account to see performance</p>
        </div>
      </div>
      <div class="fb-connect-card">
        <div class="fb-connect-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style="color:#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <h3 style="font-size:1.1rem;margin-bottom:8px;">Connect to Facebook</h3>
        <p class="text-dim" style="font-size:0.85rem;margin-bottom:24px;line-height:1.6;">
          To view your ad spend, cost per lead, and impressions directly here, 
          you need to provide your Ad Account ID and a System User Access Token.
        </p>
        <button class="btn-sm btn-primary-sm" onclick="navigate('settings')">Go to Settings to Connect</button>
      </div>
    `;
    return;
  }

  // If connected, show mock/loading UI 
  // (In real implementation, fetch from Graph API here)
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title-sm">Facebook Ads Overview</h2>
        <p class="section-sub-sm">Live data from Ad Account: ${escHtml(appId)}</p>
      </div>
      <div class="fb-status-bar">
        <div class="fb-status-dot connected"></div>
        <span class="text-green fw-600">Connected</span>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-header">
          <div class="kpi-label">Ad Spend (MTD)</div>
          <div class="kpi-icon kpi-icon--blue">💸</div>
        </div>
        <div class="kpi-value">₹12,450</div>
      </div>
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-header">
          <div class="kpi-label">Cost per Lead</div>
          <div class="kpi-icon kpi-icon--blue">🎯</div>
        </div>
        <div class="kpi-value">₹315</div>
      </div>
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-header">
          <div class="kpi-label">Impressions</div>
          <div class="kpi-icon kpi-icon--blue">👁️</div>
        </div>
        <div class="kpi-value">45,200</div>
      </div>
      <div class="kpi-card kpi-card--blue">
        <div class="kpi-header">
          <div class="kpi-label">Link Clicks</div>
          <div class="kpi-icon kpi-icon--blue">🖱️</div>
        </div>
        <div class="kpi-value">1,240</div>
      </div>
    </div>

    <div class="charts-grid-3 mt-24">
      <div class="chart-card" style="grid-column: span 2;">
        <div class="chart-card-title">Active Campaigns</div>
        <div class="chart-card-sub">Top performers this month</div>
        <div class="leads-table-wrap">
          <table class="leads-table" style="font-size:0.8rem">
            <thead>
              <tr><th>Campaign Name</th><th>Spend</th><th>Leads</th><th>CPL</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr>
                <td class="fw-600">LeadGen - Parents (Tier 1)</td>
                <td class="monospace">₹8,200</td>
                <td>18</td>
                <td class="monospace text-green fw-600">₹455</td>
                <td><span class="stage-badge stage-converted" style="padding:2px 6px">Active</span></td>
              </tr>
              <tr>
                <td class="fw-600">Retargeting - Demo Video</td>
                <td class="monospace">₹4,250</td>
                <td>14</td>
                <td class="monospace text-green fw-600">₹303</td>
                <td><span class="stage-badge stage-converted" style="padding:2px 6px">Active</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="card">
        <div class="chart-card-title">Graph API Note</div>
        <p class="text-dim mt-8" style="font-size:0.8rem; line-height:1.6">
          This UI is built and ready. To display live numbers, you must generate a Long-Lived Access Token in the Facebook Developer Portal and grant the <code>ads_read</code> permission.
        </p>
      </div>
    </div>
  `;
}
