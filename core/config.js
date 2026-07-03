/**
 * noname ECOSYSTEM — CENTRAL CONFIGURATION
 * ----------------------------------------
 * Single source of truth for the whole ecosystem. Every page/branch should read
 * from window.NONAME.config instead of hard-coding environment logic.
 *
 * This file replaces the duplicated BASE_URL detection that used to live in
 * script.js / files.js. Those files still read window.BASE_URL, so we keep that
 * global in sync for backwards compatibility.
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
    // NONAME.url('sbplus', { lang }) instead, so renaming a page only
    // touches this object.
    routes: {
      hub: 'index.html',        // ecosystem front door
      sbplus: 'sbplus.html',    // sbplus learning home (was learn.html / index.html)
      files: 'files.html',      // resource explorer
      about: 'about.html',
      help: 'help.html',
      contact: 'contact.html',
      feedback: 'feedback.html',
      privacy: 'privacy.html',
      read: 'read.html',        // Read hub: library grid + search
      reader: 'reader.html',    // Read chapter viewer (article engine)
    },

    // --- Localisation ---
    defaultLang: 'en',
    langs: ['en', 'de', 'fr'],            // display order: English · German · French
    langNames: { en: 'English', de: 'Deutsch', fr: 'Français' },
    langShort: { en: 'EN', de: 'DE', fr: 'FR' },

    // --- Feature flags (flip these as branches mature) ---
    flags: {
      hub: true,        // ecosystem portal is the new front door
      auth: true,       // Firebase Google login (auth.js)
      analytics: true,  // Firebase analytics
    },

    // --- Google AdSense (left/right side rails, injected by layout.js) ---
    // `client` = "ca-pub-" + your AdSense publisher number. Create "Display ad"
    // units in AdSense and paste their numeric slot IDs below (left/right may reuse
    // the same slot). Flip `enabled` to false to remove every ad site-wide. The
    // side rails only appear on screens wide enough for the page gutters (~1500px+).
    // NOTE: ads stay blank until the domain is approved in your AdSense account,
    // and there must be an /ads.txt at the site root with this publisher ID.
    ads: {
      enabled: true,
      client: 'ca-pub-3541004256525869',
      slotLeft: '7450286002',
      slotRight: '7450286002',
    },

    // --- Navbar links per context ---
    // Two identities: the ecosystem (noname) and the Syllabus+ product.
    // No text links — you switch apps via the launcher (9-square icon).
    nav: {
      hub:    [],
      page:   [],
      sbplus: [],
      read:   [],
    },

    // --- Brand identity per context (independent logos, Google-style) ---
    // mark: 'noname' = constellation squircle; 'sbplus' = the Syllabus+ icon.
    brands: {
      hub:    { name: 'noname',    mark: 'noname', route: 'hub' },
      page:   { name: 'noname',    mark: 'noname', route: 'hub' },
      sbplus: { name: 'Syllabus+', mark: 'sbplus', route: 'sbplus' },
      read:   { name: 'Read',      mark: 'read',   route: 'read' },
    },

    // --- App launcher (the 9-square toolbox) — every app, hub included ---
    launcher: [
      { name: 'noname',    tagline: 'Ecosystem home',  mark: 'noname', route: 'hub' },
      { name: 'Syllabus+', tagline: 'Study & quizzes',  mark: 'sbplus', route: 'sbplus' },
      { name: 'Read',      tagline: 'Books & chapters', mark: 'read',   route: 'read' },
    ],

    // --- Footer (uniform on every page = ecosystem cohesion). About the whole
    //     of noname, not just one app. Vision/Roadmap are anchors on About. ---
    footer: [
      {
        i18n: 'footer_ecosystem', en: 'Ecosystem',
        links: [
          { i18n: 'nav_about', en: 'About', route: 'about' },
          { i18n: 'footer_vision', en: 'Vision', route: 'about', hash: '#vision' },
          { i18n: 'footer_roadmap', en: 'Roadmap', route: 'about', hash: '#roadmap' },
        ],
      },
      {
        i18n: 'footer_support', en: 'Support',
        links: [
          { i18n: 'footer_help', en: 'Help Center', route: 'help' },
          { i18n: 'footer_contact', en: 'Contact Us', route: 'contact' },
          { i18n: 'footer_feedback', en: 'Feedback', route: 'feedback' },
          { i18n: 'footer_privacy', en: 'Privacy', route: 'privacy' },
        ],
      },
    ],
  };

  const NS = (global.NONAME = global.NONAME || {});
  NS.config = Config;

  /**
   * Build an internal URL from a route key (no hard-coded filenames in callers).
   *   NONAME.url('files', { subject: 'Maths', lang: 'fr' })
   *     -> "files.html?subject=Maths&lang=fr"
   *   NONAME.url('sbplus', { lang: 'en' }, '#subjects')
   *     -> "sbplus.html?lang=en#subjects"
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
