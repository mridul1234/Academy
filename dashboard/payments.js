/* ═══════════════════════════════════════
   PAYMENTS.JS — Razorpay Log & CSV Import
═══════════════════════════════════════ */

function renderPayments(container) {
  const cap = state.payments.filter(p => p.status === 'captured').reduce((s,p)=>s+p.amount, 0);
  const ref = state.payments.filter(p => p.status === 'refunded').reduce((s,p)=>s+p.amount, 0);
  
  container.innerHTML = `
    <div class="section-header">
      <div>
        <h2 class="section-title-sm">Payment History</h2>
        <p class="section-sub-sm">All collections via Razorpay</p>
      </div>
      <button class="btn-sm btn-ghost" onclick="document.getElementById('csvInput').click()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Import CSV
      </button>
      <input type="file" id="csvInput" class="csv-file-input" accept=".csv" onchange="handleCSVUpload(event)">
    </div>

    <div class="kpi-grid">
      <div class="kpi-card kpi-card--green">
        <div class="kpi-header">
          <div class="kpi-label">Total Captured</div>
          <div class="kpi-icon kpi-icon--green">💰</div>
        </div>
        <div class="kpi-value">${formatCurrency(cap)}</div>
      </div>
      <div class="kpi-card kpi-card--yellow">
        <div class="kpi-header">
          <div class="kpi-label">Total Refunded</div>
          <div class="kpi-icon kpi-icon--yellow">💸</div>
        </div>
        <div class="kpi-value">${formatCurrency(ref)}</div>
      </div>
    </div>

    ${state.payments.length === 0 ? `
      <div class="csv-dropzone" onclick="document.getElementById('csvInput').click()">
        <div class="csv-dropzone-icon">📄</div>
        <div class="csv-dropzone-title">Upload Razorpay Export</div>
        <div class="csv-dropzone-sub">Drop your payments.csv file here or click to browse</div>
      </div>
    ` : `
      <div class="leads-table-wrap mt-24">
        <table class="leads-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Plan / Note</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${state.payments.sort((a,b)=>b.date-a.date).map(p => `
              <tr>
                <td class="text-dim">${formatDate(p.date)}</td>
                <td class="monospace">${p.orderId}</td>
                <td class="fw-600 color-text">${escHtml(p.customerName)}</td>
                <td>${escHtml(p.plan)}</td>
                <td class="monospace fw-700 text-purple">${formatCurrency(p.amount)}</td>
                <td><div class="payment-status payment-status--${p.status}">${p.status.toUpperCase()}</div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

function handleCSVUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    parseRazorpayCSV(text);
  };
  reader.readAsText(file);
  e.target.value = ''; // reset
}

function parseRazorpayCSV(csvText) {
  // Simple parser: assuming standard Razorpay export format
  // columns: id, entity, amount, currency, status, order_id, created_at, notes...
  const lines = csvText.split('\\n');
  if (lines.length < 2) {
    showToast('Invalid CSV file', 'error');
    return;
  }
  
  const headers = lines[0].toLowerCase().split(',');
  const idxId = headers.findIndex(h => h.includes('payment id') || h.includes('id'));
  const idxAmount = headers.findIndex(h => h.includes('amount'));
  const idxStatus = headers.findIndex(h => h.includes('status'));
  const idxOrder = headers.findIndex(h => h.includes('order'));
  const idxEmail = headers.findIndex(h => h.includes('email'));
  const idxContact = headers.findIndex(h => h.includes('contact'));
  
  if (idxId === -1 || idxAmount === -1) {
    showToast('Unrecognized CSV format. Need Amount and ID columns.', 'error');
    return;
  }

  let added = 0;
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    // simple split, does not handle quotes with commas inside perfectly, but ok for now
    const row = lines[i].split(',');
    
    const id = row[idxId];
    if (state.payments.find(p => p.id === id)) continue; // skip duplicates
    
    // Razorpay amount is often in paise
    let amtStr = row[idxAmount];
    let amt = parseFloat(amtStr);
    if (amtStr && !amtStr.includes('.')) amt = amt / 100; 

    state.payments.push({
      id: id,
      date: Date.now(), // ideally parse created_at
      orderId: idxOrder > -1 ? row[idxOrder] : 'N/A',
      customerName: (idxEmail > -1 ? row[idxEmail] : '') || (idxContact > -1 ? row[idxContact] : 'Unknown'),
      plan: 'Imported Payment',
      amount: amt,
      status: idxStatus > -1 ? row[idxStatus].toLowerCase() : 'captured'
    });
    added++;
  }
  
  if (added > 0) {
    saveData('payments');
    showToast(`Imported ${added} new payments successfully!`, 'success');
    if (currentPage === 'payments') renderPayments(document.getElementById('page-payments'));
  } else {
    showToast('No new payments found in CSV.', 'info');
  }
}
