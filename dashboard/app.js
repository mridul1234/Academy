/* ═══════════════════════════════════════
   APP.JS — Main Entry Point
═══════════════════════════════════════ */

// This file acts as the loader for all the separate modules
// In a real build system, this would be bundled. Here we just inject scripts.

const SCRIPTS = [
  'dashboard/core.js',
  'dashboard/store.js',
  'dashboard/overview.js',
  'dashboard/leads-table.js',
  'dashboard/leads-kanban.js',
  'dashboard/leads-drawer.js',
  'dashboard/payments.js',
  'dashboard/facebook.js',
  'dashboard/insights.js',
  'dashboard/settings.js'
];

let loadedCount = 0;

function loadScripts() {
  SCRIPTS.forEach(src => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false; // Maintain execution order
    script.onload = () => {
      loadedCount++;
      if (loadedCount === SCRIPTS.length) {
        // All scripts loaded, we can boot the app
        bootApp();
      }
    };
    document.body.appendChild(script);
  });
}

function bootApp() {
  // Check auth immediately
  if (isLoggedIn()) {
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('dashApp').style.display  = 'flex';
    initApp();
  }
}

// Global initialization
function initApp() {
  loadData();
  updateDate();
  updateSidebarLeadCount();
  navigate('overview');

  // Handle window resize for charts
  window.addEventListener('resize', () => {
    if (currentPage === 'overview' && chartInstances.rev) {
      chartInstances.rev.resize();
      chartInstances.src.resize();
    }
  });
}

// Start loading
loadScripts();
