/* ==========================================================================
   noname — shared chrome (nav + footer + language + app launcher)
   Injected on EVERY page. Two brand identities (ecosystem "noname" vs the
   "Syllabus+" product) chosen by window.NONAME_PAGE.context. The 9-square
   launcher (toolbox) switches between apps, the hub included.
     window.NONAME_PAGE = { context: 'hub'|'sbplus'|'page', active?: 'route' };
   ========================================================================== */
window.I18N_DATA = window.I18N_DATA || {};

function getLangFromURL() {
  const p = new URLSearchParams(window.location.search).get('lang');
  return (p && ['en', 'de', 'fr'].includes(p)) ? p : 'en';
}

const PAGE = window.NONAME_PAGE || { context: 'page' };
const CFG = (window.NONAME && window.NONAME.config) || {};
const LANG_NAMES = CFG.langNames || { en: 'English', de: 'Deutsch', fr: 'Français' };

/* ----- squircle clip (Apple curvature), injected once for all icons ----- */
const SQUIRCLE_DEF =
  `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <clipPath id="squircle" clipPathUnits="objectBoundingBox">
      <path d="M0.5,0 C0.18,0 0.06,0.02 0.04,0.04 C0.02,0.06 0,0.18 0,0.5 C0,0.82 0.02,0.94 0.04,0.96 C0.06,0.98 0.18,1 0.5,1 C0.82,1 0.94,0.98 0.96,0.96 C0.98,0.94 1,0.82 1,0.5 C1,0.18 0.98,0.06 0.96,0.04 C0.94,0.02 0.82,0 0.5,0 Z"/>
    </clipPath>
  </defs></svg>`;

/* ecosystem mark: ink squircle + constellation (one home, many nodes) */
const MARK_NONAME =
  `<svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22,2 C10,2 5,2.5 3.7,3.7 C2.5,5 2,10 2,22 C2,34 2.5,39 3.7,40.3 C5,41.5 10,42 22,42 C34,42 39,41.5 40.3,40.3 C41.5,39 42,34 42,22 C42,10 41.5,5 40.3,3.7 C39,2.5 34,2 22,2 Z" fill="#161513"/>
    <g stroke="#faf9f7" stroke-width="1.6" stroke-linecap="round" opacity=".9">
      <line x1="22" y1="22" x2="13" y2="14"/><line x1="22" y1="22" x2="31" y2="15"/><line x1="22" y1="22" x2="17" y2="31"/>
    </g>
    <g fill="#faf9f7"><circle cx="22" cy="22" r="3"/><circle cx="13" cy="14" r="2"/><circle cx="31" cy="15" r="2"/><circle cx="17" cy="31" r="2"/></g>
  </svg>`;

/* Read mark: ink squircle + open book (same treatment as the noname mark) */
const MARK_READ =
  `<svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22,2 C10,2 5,2.5 3.7,3.7 C2.5,5 2,10 2,22 C2,34 2.5,39 3.7,40.3 C5,41.5 10,42 22,42 C34,42 39,41.5 40.3,40.3 C41.5,39 42,34 42,22 C42,10 41.5,5 40.3,3.7 C39,2.5 34,2 22,2 Z" fill="#161513"/>
    <g stroke="#faf9f7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M22,15 C19,12.7 15,12.7 12,14.2 L12,29 C15,27.5 19,27.5 22,29.8 C25,27.5 29,27.5 32,29 L32,14.2 C29,12.7 25,12.7 22,15 Z"/>
      <path d="M22,15 L22,29.8"/>
    </g>
  </svg>`;

/* 9-square toolbox (squircle squares = Apple curvature) */
const WAFFLE_SVG =
  `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="3" y="3" width="4" height="4" rx="1.4"/><rect x="10" y="3" width="4" height="4" rx="1.4"/><rect x="17" y="3" width="4" height="4" rx="1.4"/>
    <rect x="3" y="10" width="4" height="4" rx="1.4"/><rect x="10" y="10" width="4" height="4" rx="1.4"/><rect x="17" y="10" width="4" height="4" rx="1.4"/>
    <rect x="3" y="17" width="4" height="4" rx="1.4"/><rect x="10" y="17" width="4" height="4" rx="1.4"/><rect x="17" y="17" width="4" height="4" rx="1.4"/>
  </svg>`;

function markHTML(type) {
  if (type === 'sbplus') return `<span class="brand-img"><img src="images/favicon.png" alt=""></span>`;
  if (type === 'read') return MARK_READ;
  return MARK_NONAME;
}

/* ----- helpers ----- */
function linkHref(item, lang) {
  if (item.route) return NONAME.url(item.route, { lang }, item.hash || '');
  return item.hash || '#';
}
function navItems(context) {
  return (CFG.nav && (CFG.nav[context] || CFG.nav.page)) || [];
}
function brandFor(context) {
  return (CFG.brands && (CFG.brands[context] || CFG.brands.page)) || { name: 'noname', mark: 'noname', route: 'hub' };
}

/* ----- builders (re-callable so language switch can re-render) ----- */
function buildNav() {
  const lang = getLangFromURL();
  const b = brandFor(PAGE.context);

  const links = navItems(PAGE.context).map((it) => {
    const active = PAGE.active && it.route === PAGE.active ? ' active' : '';
    return `<a class="nav-link${active}" href="${linkHref(it, lang)}" data-i18n="${it.i18n}">${it.en}</a>`;
  }).join('');

  return `
    <div class="nav-inner">
      <a class="nav-brand" href="${NONAME.url(b.route, { lang })}" aria-label="${b.name} home">
        <span class="nav-brand-mark">${markHTML(b.mark)}</span><span class="nav-brand-word">${b.name}</span>
      </a>
      <nav class="nav-links" id="nav-links">${links}</nav>
      <div class="nav-right">
        ${buildLauncher(lang)}
        ${buildLang(lang)}
        <a href="#" class="btn btn-ghost btn-login" data-i18n="nav_signin" onclick="if(window.loginGoogle){loginGoogle();}return false;">Sign in</a>
      </div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
    </div>`;
}

function buildLang(lang) {
  const opts = (CFG.langs || ['en', 'de', 'fr']).map((code) => `
    <a href="javascript:void(0)" class="lang-opt ${code === lang ? 'active' : ''}" onclick="changeLanguage('${code}')">${LANG_NAMES[code]}</a>`).join('');
  return `
    <div class="lang" id="lang">
      <button class="lang-btn" id="lang-btn" aria-label="Language">
        <i class="fa-solid fa-globe"></i><span id="lang-current">${LANG_NAMES[lang]}</span>
        <i class="fa-solid fa-chevron-down lang-chevron"></i>
      </button>
      <div class="lang-menu">${opts}</div>
    </div>`;
}

function buildLauncher(lang) {
  const apps = (CFG.launcher || []).map((a) => `
    <a class="launch-app" href="${NONAME.url(a.route, { lang })}">
      <span class="launch-icon">${markHTML(a.mark)}</span>
      <span class="launch-name">${a.name}</span>
    </a>`).join('');
  return `
    <div class="launch" id="launch">
      <button class="launch-btn" id="launch-btn" aria-label="Apps">${WAFFLE_SVG}</button>
      <div class="launch-menu">
        <div class="launch-head" data-i18n="launcher_title">Apps</div>
        <div class="launch-grid">${apps}</div>
      </div>
    </div>`;
}

function buildFooter() {
  const lang = getLangFromURL();
  const f = CFG.footer;
  const footerCols = Array.isArray(f) ? f : (f && (f[PAGE.context] || f.page)) || [];
  const cols = footerCols.map((col) => {
    const links = col.links.map((l) =>
      `<a href="${linkHref(l, lang)}" data-i18n="${l.i18n}">${l.en}</a>`).join('');
    return `<div class="foot-col"><h4 data-i18n="${col.i18n}">${col.en}</h4>${links}</div>`;
  }).join('');

  return `
    <div class="foot-inner">
      <div class="foot-brand">
        <div class="foot-brand-word">noname</div>
        <p class="foot-tagline" data-i18n="footer_tagline">A small, growing ecosystem of focused tools.</p>
      </div>
      ${cols}
    </div>
    <div class="foot-bottom">
      <span class="foot-copy">© 2026 noname. <span data-i18n="footer_rights">All rights reserved.</span></span>
      <div class="foot-social">
        <a href="https://discord.gg/hQGbsEfH" target="_blank" rel="noopener" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
        <a href="https://github.com/shining3366dev-prog" target="_blank" rel="noopener" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
      </div>
    </div>`;
}

/* ----- i18n ----- */
async function initLocalisation() {
  const LOC_URL = (window.NONAME && window.NONAME.dataUrl)
    ? window.NONAME.dataUrl('localisation.csv', true)
    : `${window.BASE_URL || '../Syllabusplus-Database'}/localisation.csv?t=${Date.now()}`;
  try {
    const res = await fetch(LOC_URL);
    const rows = (await res.text()).split('\n').slice(1);
    rows.forEach((row) => {
      if (!row.trim()) return;
      const [key, en, fr, de] = row.split(';').map((c) => c?.trim());
      if (key) window.I18N_DATA[key] = { en, fr, de };
    });
    translatePage();
  } catch (err) {
    console.error('Localisation failed:', err);
  }
}

function translatePage() {
  const lang = getLangFromURL();
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const set = window.I18N_DATA[el.getAttribute('data-i18n')];
    if (!set || !set[lang]) return;
    // Strings with markup (bold, icons) need innerHTML so <strong>/<i> survive;
    // plain strings stay on textContent. Source is our own trusted CSV.
    if (set[lang].indexOf('<') !== -1) el.innerHTML = set[lang];
    else el.textContent = set[lang];
  });
}
window.translatePage = translatePage;

window.changeLanguage = function (langCode) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', langCode);
  window.history.pushState({}, '', url);

  renderChrome();
  translatePage();

  if (typeof window.updateArticleLanguage === 'function') {
    const active = document.querySelector('.file-item.active');
    const viewer = document.getElementById('article-viewer');
    const link = (active && active.getAttribute('data-link'))
      || (viewer && viewer.getAttribute('data-current-file')); // reader.html has no sidebar items
    if (link) window.updateArticleLanguage(link, langCode);
  }
  if (typeof loadFiles === 'function') loadFiles(true);
  if (typeof renderGrid === 'function') renderGrid(localStorage.getItem('selectedYear') || 'ALL');
  if (typeof window.renderBranches === 'function') window.renderBranches();
  if (typeof window.renderBooks === 'function') window.renderBooks();
};

/* ----- mount ----- */
function dropdownToggle(wrapId, btnId) {
  const wrap = document.getElementById(wrapId);
  const btn = document.getElementById(btnId);
  if (!wrap || !btn) return;
  btn.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.lang.open, .launch.open').forEach((el) => { if (el !== wrap) el.classList.remove('open'); });
    wrap.classList.toggle('open');
  };
}

function wireNavInteractions() {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.onclick = () => {
      nav.classList.toggle('menu-open');
      const i = toggle.querySelector('i');
      i.className = nav.classList.contains('menu-open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    };
  }
  dropdownToggle('lang', 'lang-btn');
  dropdownToggle('launch', 'launch-btn');
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.lang.open, .launch.open').forEach((el) => {
      if (!el.contains(e.target)) el.classList.remove('open');
    });
  });
}

function renderChrome() {
  const nav = document.getElementById('site-nav');
  const foot = document.getElementById('site-foot');
  if (nav) nav.innerHTML = buildNav();
  if (foot) foot.innerHTML = buildFooter();
  wireNavInteractions();
  if (typeof window.applyAuthUI === 'function') window.applyAuthUI();
}

/* ----- Google AdSense side rails (config-driven, desktop-only) ----- */
function loadAds() {
  const ads = CFG.ads;
  if (!ads || !ads.enabled || !ads.client) return;

  // 1. Loader script (once)
  if (!document.getElementById('adsbygoogle-js')) {
    const s = document.createElement('script');
    s.id = 'adsbygoogle-js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ads.client;
    document.head.appendChild(s);
  }

  // 2. Scoped styles for the rails (once) — fixed in the page gutters, only on
  //    screens wide enough that they can't overlap the centred content.
  if (!document.getElementById('ad-rail-style')) {
    const st = document.createElement('style');
    st.id = 'ad-rail-style';
    st.textContent =
      '.ad-rail{position:fixed;top:90px;width:160px;z-index:50;display:none}' +
      '.ad-rail .ad-tag{display:block;font-size:.6rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3,#a09b91);margin-bottom:6px;text-align:center}' +
      '.ad-rail ins{display:block;width:160px;height:600px}' +
      '.ad-rail.ad-left{left:calc((100vw - var(--maxw, 1120px)) / 2 - 184px)}' +
      '.ad-rail.ad-right{right:calc((100vw - var(--maxw, 1120px)) / 2 - 184px)}' +
      '@media (min-width:1550px){.ad-rail{display:block}}';
    document.head.appendChild(st);
  }

  // 3. The two rails (once)
  if (!document.getElementById('ad-rail-left')) {
    [['left', ads.slotLeft], ['right', ads.slotRight]].forEach(function (pair) {
      const side = pair[0], slot = pair[1];
      if (!slot) return;
      const aside = document.createElement('aside');
      aside.className = 'ad-rail ad-' + side;
      aside.id = 'ad-rail-' + side;
      aside.setAttribute('aria-hidden', 'true');
      aside.innerHTML =
        '<span class="ad-tag">Advertisement</span>' +
        '<ins class="adsbygoogle" style="display:block;width:160px;height:600px" data-ad-client="' +
        ads.client + '" data-ad-slot="' + slot + '"></ins>';
      document.body.appendChild(aside);
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    });
  }
}

function loadLayout() {
  if (!document.getElementById('squircle')) {
    document.body.insertAdjacentHTML('afterbegin', SQUIRCLE_DEF);
  }
  if (!document.getElementById('site-nav')) {
    const header = document.createElement('header');
    header.className = 'nav'; header.id = 'site-nav';
    document.body.insertAdjacentElement('afterbegin', header);
  }
  if (!document.getElementById('site-foot')) {
    const footer = document.createElement('footer');
    footer.className = 'foot'; footer.id = 'site-foot';
    document.body.insertAdjacentElement('beforeend', footer);
  }
  renderChrome();
  initLocalisation();
  loadAds();
}

/* back-compat helpers some scripts still call */
window.goToHome = function (e) { if (e) e.preventDefault(); window.location.href = NONAME.url('sbplus', { lang: getLangFromURL() }); };
window.goToSubjects = function (e) { if (e) e.preventDefault(); window.location.href = NONAME.url('sbplus', { lang: getLangFromURL() }, '#subjects'); };

loadLayout();
