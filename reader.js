/**
 * Read branch — chapter viewer driver.
 * Loads AFTER files.js (the shared article engine, running in READER_CONFIG
 * mode). This file only: reads ?book= & ?file=, fetches the chapter index
 * (book-chapters.csv), fills window.currentFilesList so the engine's prev/next
 * navigation works, and opens the requested (or first) chapter via previewFile.
 */
(function () {
    function getParam(k) {
        return new URLSearchParams(window.location.search).get(k);
    }

    async function initReader() {
        const book = getParam('book');
        const fileParam = getParam('file');
        const lang = getLangFromURL();

        const backLink = document.getElementById('back-to-library');
        if (backLink) backLink.href = NONAME.url('read', { lang });

        const bookTitleEl = document.getElementById('reader-book-title');
        const viewer = document.getElementById('article-viewer');

        if (!book) {
            // No book chosen — bounce to the library.
            window.location.replace(NONAME.url('read', { lang }));
            return;
        }
        if (bookTitleEl) bookTitleEl.textContent = book;

        try {
            const res = await fetch(NONAME.dataUrl('book-chapters.csv', true));
            if (!res.ok) throw new Error(`Chapter index failed: ${res.status}`);
            const rows = (await res.text()).split('\n').slice(1);

            // Book;Chapter;Link — row order = reading order.
            window.currentFilesList = [];
            rows.forEach(row => {
                if (!row.trim()) return;
                const [b, chapter, link] = row.split(';').map(c => c && c.trim());
                if (b && link && b.toLowerCase() === book.toLowerCase()) {
                    window.currentFilesList.push({ name: chapter || link, link });
                }
            });

            if (window.currentFilesList.length === 0) {
                if (viewer) viewer.innerHTML = `<div class="empty-state"><h3>${book}</h3><p data-i18n="read_no_chapters">No chapters yet — check back soon.</p></div>`;
                if (typeof translatePage === 'function') translatePage();
                return;
            }

            const first = window.currentFilesList[0].link;
            const wanted = fileParam && window.currentFilesList.some(f => f.link === decodeURIComponent(fileParam))
                ? decodeURIComponent(fileParam)
                : first;
            previewFile(wanted);
        } catch (err) {
            console.error('Reader init error:', err);
            if (viewer) viewer.innerHTML = `<div class="error-msg">⚠️ ${err.message}</div>`;
        }
    }

    document.addEventListener('DOMContentLoaded', initReader);
})();
