/* ═══════════════════════════════════════
   OVERVIEW.JS — KPI Dashboard & Charts
═══════════════════════════════════════ */

function renderOverview(container) {
  const mtdRev = state.payments.filter(p => p.status === 'captured').reduce((sum, p) => sum + p.amount, 0);
  const totalLeads = state.leads.length;
  const converted = state.leads.filter(l => l.stage === 'converted').length;
  const convRate = totalLeads ? ((converted / totalLeads) * 100).toFixed(1) : 0;
  const activePip = state.leads.filter(l => !['converted', 'lost'].includes(l.stage)).reduce((sum, l) => sum + l.value, 0);

  container.innerHTML = `
    <!-- ROW 1: KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-card--green">
        <div class="kpi-header">
          <div class="kpi-label">Total Revenue (MTD)</div>
          <div class="kpi-icon kpi-icon--green">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
          </div>
        </div>
        <div class="kpi-value" id="kpi-rev">₹0</div>
        <div class="kpi-trend kpi-trend--up">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          <span>+12.5%</span> <span class="kpi-trend-label">vs last month</span>
        </div>
      </div>

      <div class="kpi-card kpi-card--purple">
        <div class="kpi-header">
          <div class="kpi-label">Total Leads</div>
          <div class="kpi-icon kpi-icon--purple">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
        </div>
        <div class="kpi-value" id="kpi-leads">0</div>
        <div class="kpi-trend kpi-trend--up">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></svg>
          <span>+8.2%</span> <span class="kpi-trend-label">vs last month</span>
        </div>
      </div>

      <div class="kpi-card kpi-card--yellow">
        <div class="kpi-header">
          <div class="kpi-label">Conversion Rate</div>
          <div class="kpi-icon kpi-icon--yellow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
        </div>
        <div class="kpi-value" id="kpi-conv">0<span>%</span></div>
        <div class="kpi-trend kpi-trend--neutral">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>0.0%</span> <span class="kpi-trend-label">vs last month</span>
        </div>
      </div>

      <div class="kpi-card kpi-card--blue">
        <div class="kpi-header">
          <div class="kpi-label">Active Pipeline</div>
          <div class="kpi-icon kpi-icon--blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </div>
        </div>
        <div class="kpi-value" id="kpi-pip">₹0</div>
        <div class="kpi-trend kpi-trend-label">Estimated potential</div>
      </div>
    </div>

    <!-- ROW 2: Charts -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-card-title">Revenue Growth</div>
        <div class="chart-card-sub">Last 30 days collections (INR)</div>
        <div class="chart-wrap chart-wrap--lg">
          <canvas id="revChart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-card-title">Lead Sources</div>
        <div class="chart-card-sub">Distribution of new leads</div>
        <div class="chart-wrap chart-wrap--lg" style="display:flex; justify-content:center;">
          <canvas id="sourceChart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Animate KPIs
  animateCountUp(document.getElementById('kpi-rev'), mtdRev, '₹');
  animateCountUp(document.getElementById('kpi-leads'), totalLeads);
  animateCountUp(document.getElementById('kpi-conv'), convRate, '', '%');
  animateCountUp(document.getElementById('kpi-pip'), activePip, '₹');

  initOverviewCharts();
}

function initOverviewCharts() {
  destroyCharts();

  // Revenue Chart (Area)
  const ctxRev = document.getElementById('revChart');
  if (ctxRev) {
    const gradient = ctxRev.getContext('2d').createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
    gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');

    chartInstances.rev = new Chart(ctxRev, {
      type: 'line',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4'],
        datasets: [{
          label: 'Revenue',
          data: [15000, 22000, 18000, 28000], // Mock trend
          borderColor: '#7C3AED',
          backgroundColor: gradient,
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#7C3AED'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false }, ticks: { color: '#94A3B8' } },
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#94A3B8' } }
        }
      }
    });
  }

  // Source Chart (Doughnut)
  const ctxSrc = document.getElementById('sourceChart');
  if (ctxSrc) {
    const fbCount = state.leads.filter(l => l.source === 'facebook_ad').length;
    const webCount = state.leads.filter(l => l.source === 'website_form').length;

    chartInstances.src = new Chart(ctxSrc, {
      type: 'doughnut',
      data: {
        labels: ['Facebook Ads', 'Website Form'],
        datasets: [{
          data: [fbCount || 1, webCount || 1],
          backgroundColor: ['#3B82F6', '#7C3AED'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#F1F5F9', usePointStyle: true, padding: 20 } }
        }
      }
    });
  }
}
