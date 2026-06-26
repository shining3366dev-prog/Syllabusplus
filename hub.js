/**
 * noname ECOSYSTEM HUB — renderer
 * -------------------------------
 * Data-driven: reads window.NONAME.config + window.NONAME.branches and paints
 * the premium "explore" grid. Icon geometry is the iOS squircle (clip-path
 * #squircle defined in hub.html). Live branches link out; others are ghosts.
 */
(function () {
  function iconMarkup(b) {
    const grad = (b.gradient && b.gradient.length === 2)
      ? `linear-gradient(145deg, ${b.gradient[0]}, ${b.gradient[1]})`
      : (b.color || '#5b8cff');

    // Inner content: the app's own image if provided, else a glyph.
    const inner = b.iconImage
      ? `<img class="app-icon-img" src="${b.iconImage}" alt="" />`
      : `<i class="app-icon-glyph ${b.icon}"></i>`;

    return `
      <span class="app-icon" style="background:${grad}">
        <span class="app-icon-sheen"></span>
        ${inner}
      </span>`;
  }

  function statusChip(status) {
    if (status === 'live') return '';
    const label = status === 'beta' ? 'Beta' : 'Soon';
    return `<span class="chip chip-soon">${label}</span>`;
  }

  function card(b) {
    const live = b.status === 'live' && b.href && b.href !== '#';
    const tag = live ? 'a' : 'button';
    const attrs = live ? `href="${b.href}"` : 'type="button" disabled aria-disabled="true"';
    const cta = live
      ? `<span class="app-cta">Open <i class="fa-solid fa-arrow-right"></i></span>`
      : `<span class="app-cta muted">In the workshop</span>`;

    return `
      <${tag} class="app-card ${live ? '' : 'is-ghost'}" ${attrs} style="--accent:${b.color || '#5b8cff'}">
        <span class="app-card-glow"></span>
        ${iconMarkup(b)}
        <span class="app-meta">
          <span class="app-title">${b.name} ${statusChip(b.status)}</span>
          <span class="app-tagline">${b.tagline}</span>
          <span class="app-desc">${b.description}</span>
        </span>
        ${cta}
      </${tag}>`;
  }

  function render() {
    const grid = document.getElementById('explore-grid');
    if (!grid || !window.NONAME) return;
    const branches = window.NONAME.branches || [];
    grid.innerHTML = branches.map(card).join('');

    const count = window.NONAME.liveBranches ? window.NONAME.liveBranches().length : 0;
    const counter = document.getElementById('explore-count');
    if (counter) counter.textContent = count === 1 ? '1 app · more soon' : `${count} apps`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.NONAME && window.NONAME.config;
    if (cfg) {
      const t = document.getElementById('hub-tagline');
      if (t) t.textContent = cfg.tagline;
    }
    render();

    // Staggered entrance once cards exist.
    requestAnimationFrame(() => {
      document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${0.06 * i}s`;
        el.classList.add('in');
      });
    });
  });
})();
