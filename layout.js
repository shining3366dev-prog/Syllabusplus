/* ==========================================================================
   noname — shared chrome (nav + footer + language)
   Injected on EVERY page so the hub, sbplus and content pages feel like one
   ecosystem. Page declares its context via window.NONAME_PAGE before this loads:
     window.NONAME_PAGE = { context: 'hub'|'sbplus'|'page', active: 'about' };
   ========================================================================== */
window.I18N_DATA = window.I18N_DATA || {};

function getLangFromURL() {
  const p = new URLSearchParams(window.location.search).get('lang');
  return (p && ['en', 'de', 'fr'].includes(p)) ? p : 'en';
}

const PAGE = window.NONAME_PAGE || { context: 'page' };
const CFG = (window.NONAME && window.NONAME.config) || {};
const LANG_NAMES = CFG.langNames || { en: 'English', de: 'Deutsch', fr: 'Français' };

/* compact ecosystem mark: ink squircle + constellation (one home, many nodes) */
const BRAND_MARK = `
  <svg class="nav-brand-mark" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M22,2 C10,2 5,2.5 3.7,3.7 C2.5,5 2,10 2,22 C2,34 2.5,39 3.7,40.3 C5,41.5 10,42 22,42 C34,42 39,41.5 40.3,40.3 C41.5,39 42,34 42,22 C42,10 41.5,5 40.3,3.7 C39,2.5 34,2 22,2 Z" fill="#161513"/>
    <g stroke="#faf9f7" stroke-width="1.6" stroke-linecap="round" opacity=".9">
      <line x1="22" y1="22" x2="13" y2="14"/><line x1="22" y1="22" x2="31" y2="15"/><line x1="22" y1="22" x2="17" y2="31"/>
    </g>
    <g fill="#faf9f7"><circle cx="22" cy="22" r="3"/><circle cx="13" cy="14" r="2"/><circle cx="31" cy="15" r="2"/><circle cx="17" cy="31" r="2"/></g>
  </svg>`;

/* ----- helpers ----- */
function linkHref(item, lang) {
  if (item.route) return NONAME.url(item.route, { lang }, item.hash || '');
  return item.hash || '#';
}
function navItems(context) {
  return (CFG.nav && CFG.nav[context]) || CFG.nav?.page || [];
}

/* ----- builders (re-callable so language switch can re-render) ----- */
function buildNav() {
  const lang = getLangFromURL();
  const suffix = PAGE.context !== 'hub' && PAGE.suffix
    ? `<span class="nav-brand-suffix">${PAGE.suffix}</span>` : '';

  const links = navItems(PAGE.context).map((it) => {
    const active = PAGE.active && it.route === PAGE.active ? ' active' : '';
    return `<a class="nav-link${active}" href="${linkHref(it, lang)}" data-i18n="${it.i18n}">${it.en}</a>`;
  }).join('');

  return `
    <div class="nav-inner">
      <a class="nav-brand" href="${NONAME.url('hub', { lang })}" aria-label="noname home">
        ${BRAND_MARK}<span class="nav-brand-word">noname</span>${suffix}
      </a>
      <nav class="nav-links" id="nav-links">${links}</nav>
      <div class="nav-right">
        ${buildLang(lang)}
        <a href="#" class="btn btn-ghost btn-login" data-i18n="nav_signin" onclick="if(window.loginGoogle){loginGoogle();}return false;">Sign in</a>
      </div>
      <button class="nav-toggle" id="nav-toggle" aria-label="Menu"><i class="fa-solid fa-bars"></i></button>
    </div>`;
}

function buildLang(lang) {
  const opts = (CFG.langs || ['en', 'de', 'fr']).map((code) => `
    <a href="javascript:void(0)" class="lang-opt ${code === lang ? 'active' : ''}" onclick="changeLanguage('${code}')">
      ${LANG_NAMES[code]}
    </a>`).join('');
  return `
    <div class="lang" id="lang">
      <button class="lang-btn" id="lang-btn" aria-label="Language">
        <i class="fa-solid fa-globe"></i><span id="lang-current">${LANG_NAMES[lang]}</span>
        <i class="fa-solid fa-chevron-down lang-chevron"></i>
      </button>
      <div class="lang-menu">${opts}</div>
    </div>`;
}

function buildFooter() {
  const lang = getLangFromURL();
  const cols = (CFG.footer || []).map((col) => {
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
    if (set && set[lang]) el.textContent = set[lang];
  });
}

window.changeLanguage = function (langCode) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', langCode);
  window.history.pushState({}, '', url);

  // re-render chrome (updates link langs, active option, button label) then translate
  renderChrome();
  translatePage();

  // re-render live surfaces if present
  if (typeof window.updateArticleLanguage === 'function') {
    const active = document.querySelector('.file-item.active');
    const link = active && active.getAttribute('data-link');
    if (link) window.updateArticleLanguage(link, langCode);
  }
  if (typeof loadFiles === 'function') loadFiles(true);
  if (typeof renderGrid === 'function') renderGrid(localStorage.getItem('selectedYear') || 'ALL');
  if (typeof window.renderBranches === 'function') window.renderBranches();
};

/* ----- mount ----- */
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
  const lang = document.getElementById('lang');
  const langBtn = document.getElementById('lang-btn');
  if (lang && langBtn) {
    langBtn.onclick = (e) => { e.stopPropagation(); lang.classList.toggle('open'); };
    document.addEventListener('click', (e) => { if (!lang.contains(e.target)) lang.classList.remove('open'); });
  }
}

function renderChrome() {
  const nav = document.getElementById('site-nav');
  const foot = document.getElementById('site-foot');
  if (nav) nav.innerHTML = buildNav();
  if (foot) foot.innerHTML = buildFooter();
  wireNavInteractions();
}

function loadLayout() {
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
}

/* back-compat helpers some scripts still call */
window.goToHome = function (e) { if (e) e.preventDefault(); window.location.href = NONAME.url('sbplus', { lang: getLangFromURL() }); };
window.goToSubjects = function (e) { if (e) e.preventDefault(); window.location.href = NONAME.url('sbplus', { lang: getLangFromURL() }, '#subjects'); };

loadLayout();
