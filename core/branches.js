/**
 * noname ECOSYSTEM — BRANCH REGISTRY
 * ----------------------------------
 * A "branch" is a self-contained app/section living under the noname umbrella.
 * The hub (index/portal) renders this list. To grow the ecosystem you add an
 * entry here — no other file needs to change for it to appear on the hub.
 *
 * The learning app (Syllabus+) is the first branch. It used to BE the whole
 * website; now it is one card among many.
 *
 * Branch shape:
 *   id          unique slug (used in routes, analytics, deep links)
 *   name        display name of the branch
 *   tagline     one short line under the title
 *   description longer sentence for the card body
 *   icon        Font Awesome class
 *   color       accent color (CSS) used by the card
 *   href        where the card links to ('#' if not yet built)
 *   status      'live' | 'beta' | 'soon'
 *   tags        free-form labels for future search/filtering
 */
(function (global) {
  const NS = (global.NONAME = global.NONAME || {});

  const branches = [
    {
      id: 'learn',
      name: 'Syllabus+',
      tagline: 'Study guides, past papers & quizzes',
      description: 'Interactive articles, math and quizzes for years S1–S7.',
      icon: 'fa-solid fa-graduation-cap',
      iconImage: 'images/favicon.png', // the learning app's own icon
      gradient: ['#5b8cff', '#7c5cff'],
      color: '#5b8cff',
      // Resolved from the central route registry so renaming the page only
      // touches core/config.js (routes.learnHome).
      href: (NS.config && NS.config.routes.learnHome) || 'learn.html',
      status: 'live',
      tags: ['education', 'study', 'school'],
    },
    {
      id: 'tools',
      name: 'Toolbox',
      tagline: 'Calculators & focused utilities',
      description: 'Small single-purpose tools. In the workshop.',
      icon: 'fa-solid fa-wand-magic-sparkles',
      gradient: ['#2bd4a8', '#19a7c4'],
      color: '#2bd4a8',
      href: '#',
      status: 'soon',
      tags: ['utilities', 'tools'],
    },
    {
      id: 'community',
      name: 'Community',
      tagline: 'Discuss, share & ask',
      description: 'Forums, shared notes and Q&A. In the workshop.',
      icon: 'fa-solid fa-comment-dots',
      gradient: ['#ff8a5b', '#ff5c8a'],
      color: '#ff7a6b',
      href: '#',
      status: 'soon',
      tags: ['social', 'community'],
    },
  ];

  NS.branches = branches;
  NS.getBranch = (id) => branches.find((b) => b.id === id) || null;
  NS.liveBranches = () => branches.filter((b) => b.status === 'live');
})(typeof window !== 'undefined' ? window : globalThis);
