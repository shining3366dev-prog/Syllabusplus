/**
 * noname ECOSYSTEM — BRANCH REGISTRY
 * ----------------------------------
 * A "branch" is a self-contained app/section living under the noname umbrella.
 * The hub renders this list. To grow the ecosystem you add an entry here — no
 * other file needs to change for it to appear on the hub.
 *
 * Today there is exactly ONE real branch: sbplus (the learning app). Placeholder
 * "coming soon" slots were removed on purpose — we only show what exists.
 *
 * Branch shape:
 *   id          unique slug (used in routes, analytics, deep links)
 *   name        display name of the branch
 *   tagline     one short line under the title
 *   description longer sentence for the card body
 *   icon        Font Awesome class (fallback when no iconImage)
 *   iconImage   optional image used as the app icon
 *   href        where the card links to
 *   status      'live' | 'beta' | 'soon'
 *   tags        free-form labels for future search/filtering
 */
(function (global) {
  const NS = (global.NONAME = global.NONAME || {});

  const branches = [
    {
      id: 'sbplus',
      name: 'Syllabus+',
      tagline: 'Study materials, articles & quizzes',
      description: 'Interactive lessons, math and quizzes for school years S1–S7.',
      icon: 'fa-solid fa-graduation-cap',
      iconImage: 'images/favicon.png',
      // Resolved from the central route registry so renaming the page only
      // touches core/config.js (routes.sbplus).
      href: (NS.config && NS.config.routes.sbplus) || 'sbplus.html',
      status: 'live',
      tags: ['education', 'study', 'school'],
    },
    {
      id: 'read',
      name: 'Read',
      tagline: 'Books, one chapter at a time',
      description: 'A small library of books and topics, read chapter by chapter with translations, vocab, and quizzes.',
      icon: 'fa-solid fa-book-open',
      href: (NS.config && NS.config.routes.read) || 'read.html',
      status: 'live',
      tags: ['reading', 'library'],
    },
  ];

  NS.branches = branches;
  NS.getBranch = (id) => branches.find((b) => b.id === id) || null;
  NS.liveBranches = () => branches.filter((b) => b.status === 'live');
})(typeof window !== 'undefined' ? window : globalThis);
