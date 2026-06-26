/**
 * noname hub — renders the Apps grid from the branch registry.
 * Minimal: one card per real branch (today: sbplus). No placeholder slots.
 */
(function () {
  function iconMarkup(b) {
    const inner = b.iconImage
      ? `<img class="app-icon-img" src="${b.iconImage}" alt="" />`
      : `<i class="app-icon-glyph ${b.icon}"></i>`;
    return `<span class="app-icon">${inner}</span>`;
  }

  function uiText(key, fallback) {
    const lang = (typeof getLangFromURL === 'function') ? getLangFromURL() : 'en';
    return (window.I18N_DATA && window.I18N_DATA[key] && window.I18N_DATA[key][lang]) || fallback;
  }

  function card(b) {
    const live = b.status === 'live' && b.href && b.href !== '#';
    const tag = live ? 'a' : 'div';
    const href = live ? ` href="${b.href}"` : '';
    const cta = live
      ? `<span class="app-cta">${uiText('hub_open', 'Open')} <i class="fa-solid fa-arrow-right"></i></span>`
      : `<span class="app-cta">${uiText('hub_soon', 'Coming soon')}</span>`;
    return `
      <${tag} class="app-card reveal"${href}>
        ${iconMarkup(b)}
        <span class="app-meta">
          <span class="app-title">${b.name}</span>
          <span class="app-tagline">${b.tagline}</span>
          <span class="app-desc">${b.description}</span>
          ${cta}
        </span>
      </${tag}>`;
  }

  window.renderBranches = function () {
    const grid = document.getElementById('apps-grid');
    if (!grid || !window.NONAME) return;
    const branches = window.NONAME.branches || [];
    grid.innerHTML = branches.map(card).join('');
    requestAnimationFrame(() => grid.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${0.05 * i}s`; el.classList.add('in');
    }));
    const count = document.getElementById('apps-count');
    if (count) count.textContent = uiText('hub_count', '1 app · more on the way');
  };

  document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.NONAME && window.NONAME.config;
    const t = document.getElementById('hub-tagline');
    if (cfg && t) t.textContent = cfg.tagline;
    window.renderBranches();
    requestAnimationFrame(() => document.querySelectorAll('.hub-hero .reveal').forEach((el, i) => {
      el.style.transitionDelay = `${0.06 * i}s`; el.classList.add('in');
    }));
  });
})();
