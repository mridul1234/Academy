/* ═══════════════════════════════════════
   INSIGHTS.JS — Funnels & Objections
═══════════════════════════════════════ */

function renderInsights(container) {
  // 1. Calculate Funnel Drop-off
  const total = state.leads.length || 1; // avoid /0
  const demoBooked = state.leads.filter(l => ['demo_done', 'follow_up', 'converted'].includes(l.stage)).length;
  const converted = state.leads.filter(l => l.stage === 'converted').length;
  
  const pTotal = 100;
  const pDemo = ((demoBooked / total) * 100).toFixed(0);
  const pConv = ((converted / total) * 100).toFixed(0);

  // 2. Aggregate Lost Reasons
  const reasons = {};
  LOST_REASONS.forEach(r => reasons[r.id] = { label: r.label, count: 0 });
  let lostTotal = 0;
  state.leads.forEach(l => {
    if (l.stage === 'lost' && l.lostReason && reasons[l.lostReason]) {
      reasons[l.lostReason].count++;
      lostTotal++;
    }
  });

  const objectionsHtml = Object.values(reasons)
    .sort((a,b) => b.count - a.count)
    .map(r => {
      const pct = lostTotal ? (r.count / lostTotal) * 100 : 0;
      return `
        <div class="objection-bar">
          <div class="objection-label">${r.label}</div>
          <div class="objection-track">
            <div class="objection-fill" style="width: 0%" data-width="${pct}%"></div>
          </div>
          <div class="objection-count">${r.count}</div>
        </div>
      `;
    }).join('');

  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title-sm">Sales Insights</h2>
        <p class="section-sub-sm">Analyze drop-offs and common objections</p>
      </div>
    </div>

    <div class="charts-grid mt-16">
      
      <!-- Objections Tracker -->
      <div class="card">
        <div class="chart-card-title">Common Objections Tracker</div>
        <div class="chart-card-sub">Why are leads marking as "Lost"?</div>
        <div class="mt-24" id="objectionBars">
          ${objectionsHtml}
        </div>
      </div>

      <!-- Funnel -->
      <div class="card">
        <div class="chart-card-title">Pipeline Funnel</div>
        <div class="chart-card-sub">Overall conversion flow</div>
        
        <div class="mt-24" id="funnelBars">
          <div class="funnel-step">
            <div class="funnel-label">Total Leads</div>
            <div class="funnel-track"><div class="funnel-fill funnel-fill--1" style="width:0%" data-width="100%">${total}</div></div>
          </div>
          <div class="funnel-step">
            <div class="funnel-label">Demo Booked/Done</div>
            <div class="funnel-track"><div class="funnel-fill funnel-fill--2" style="width:0%" data-width="${pDemo}%">${demoBooked}</div></div>
          </div>
          <div class="funnel-step">
            <div class="funnel-label">Converted (Paid)</div>
            <div class="funnel-track"><div class="funnel-fill funnel-fill--4" style="width:0%" data-width="${pConv}%">${converted}</div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate bars on next frame
  requestAnimationFrame(() => {
    setTimeout(() => {
      const bars = container.querySelectorAll('.objection-fill, .funnel-fill');
      bars.forEach(b => {
        b.style.width = b.dataset.width;
      });
    }, 50);
  });
}
