(function () {
  const storageKey = 'chessgum_attribution';
  const trackedKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  const params = new URLSearchParams(window.location.search);
  const attribution = {};

  trackedKeys.forEach((key) => {
    const value = params.get(key);
    if (value) attribution[key] = value;
  });

  if (Object.keys(attribution).length) {
    attribution.landing_page = window.location.href;
    attribution.referrer = document.referrer || '';
    attribution.captured_at = new Date().toISOString();
    localStorage.setItem(storageKey, JSON.stringify(attribution));
  }

  function storedAttribution() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  }

  function persistDemoLinkParams() {
    const stored = storedAttribution();
    const utmEntries = trackedKeys
      .filter((key) => stored[key])
      .map((key) => [key, stored[key]]);

    if (!utmEntries.length) return;

    document.querySelectorAll('a[href="/demo"], a[href^="/demo?"]').forEach((link) => {
      const url = new URL(link.getAttribute('href') || '/demo', window.location.origin);
      utmEntries.forEach(([key, value]) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      link.setAttribute('href', `${url.pathname}${url.search}`);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', persistDemoLinkParams);
  } else {
    persistDemoLinkParams();
  }
})();
