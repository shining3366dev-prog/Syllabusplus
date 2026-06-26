/**
 * noname ECOSYSTEM — CENTRAL CONFIGURATION
 * ----------------------------------------
 * Single source of truth for the whole ecosystem. Every page/branch should read
 * from window.NONAME.config instead of hard-coding environment logic.
 *
 * This file replaces the duplicated BASE_URL detection that currently lives in
 * script.js, files.js and localisation.js. Those files still read window.BASE_URL,
 * so we keep that global in sync for backwards compatibility during migration.
 *
 * Load order: this MUST load before branches.js and before any app script.
 */
(function (global) {
  const loc = global.location || { hostname: '' };
  const host = loc.hostname;
  const IS_LOCAL = host === 'localhost' || host === '127.0.0.1' || host === '';

  const Config = {
    // --- Identity ---
    brand: 'noname',                  // the ECOSYSTEM name (umbrella over all branches)
    tagline: 'One home. Many tools.', // shown on the hub
    version: '0.1.0',

    // --- Environment ---
    env: IS_LOCAL ? 'local' : 'production',
    isLocal: IS_LOCAL,

    // --- Content backend (Syllabusplus-Database repo, served via GitHub Pages) ---
    databaseUrl: IS_LOCAL
      ? '../Syllabusplus-Database'
      : 'https://shining3366dev-prog.github.io/Syllabusplus-Database',

    // --- Routes (single place that knows page filenames) ---
    // JS should NEVER hard-code a page filename. Reference these keys via
    // NONAME.url('learnHome', { lang }) instead, so renaming a page only
    // touches this object.
    routes: {
      hub: 'index.html',        // ecosystem front door
      learnHome: 'learn.html',  // Syllabus+ learning home (was index.html)
      files: 'files.html',      // resource explorer
    },

    // --- Localisation ---
    defaultLang: 'en',
    langs: ['en', 'fr', 'de'],

    // --- Feature flags (flip these as branches mature) ---
    flags: {
      hub: true,        // ecosystem portal is the new front door
      auth: true,       // Firebase Google login (auth.js)
      analytics: true,  // Firebase analytics
    },
  };

  const NS = (global.NONAME = global.NONAME || {});
  NS.config = Config;

  /**
   * Build an internal URL from a route key (no hard-coded filenames in callers).
   *   NONAME.url('files', { subject: 'Maths', lang: 'fr' })
   *     -> "files.html?subject=Maths&lang=fr"
   *   NONAME.url('learnHome', { lang: 'en' }, '#subjects')
   *     -> "learn.html?lang=en#subjects"
   * Unknown keys fall through as-is, so NONAME.url('files.html') still works.
   */
  NS.url = function (route, params, hash) {
    const path = (Config.routes && Config.routes[route]) || route;
    const qs = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach((k) => {
        const v = params[k];
        if (v !== undefined && v !== null && v !== '') qs.set(k, v);
      });
    }
    const q = qs.toString();
    return path + (q ? '?' + q : '') + (hash || '');
  };

  /** Asset URL on the content backend, e.g. NONAME.dataUrl('images/x.png'). */
  NS.dataUrl = function (path, bustCache) {
    const base = Config.databaseUrl.replace(/\/$/, '');
    const clean = String(path || '').replace(/^\//, '');
    return base + '/' + clean + (bustCache ? '?t=' + Date.now() : '');
  };

  // --- Back-compat bridge: legacy scripts read window.BASE_URL ---
  global.BASE_URL = Config.databaseUrl;
})(typeof window !== 'undefined' ? window : globalThis);
