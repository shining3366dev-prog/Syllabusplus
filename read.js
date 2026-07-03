/**
 * Read branch — library grid + search.
 * Fetches books-catalog.csv from the content backend, renders the book grid,
 * filters it live from the search box, and surfaces "featured" books first
 * (hand-curated via a `featured` tag) when the search is empty.
 * Chapter reading happens on reader.html (same article engine as sbplus).
 */
let allBooks = [];

function readLang() {
    const p = new URLSearchParams(window.location.search).get('lang');
    return (p && ['en', 'de', 'fr'].includes(p)) ? p : 'en';
}

function readUI(key, fallback) {
    const lang = readLang();
    return (window.I18N_DATA && window.I18N_DATA[key] && window.I18N_DATA[key][lang]) || fallback;
}

function loadBooks() {
    const CATALOG_URL = NONAME.dataUrl('books-catalog.csv', true);

    fetch(CATALOG_URL)
        .then(res => {
            if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
            return res.text();
        })
        .then(csvText => {
            if (csvText.trim().startsWith('<!DOCTYPE')) throw new Error('Invalid CSV: got an HTML error page.');

            allBooks = csvText.split('\n').slice(1).map(row => {
                if (!row || row.trim() === '') return null;
                const cols = row.split(';');
                if (cols.length < 3) return null;

                let image = cols[5] ? cols[5].trim() : '';
                let imageUrl = '';
                if (image) {
                    imageUrl = image.startsWith('http') ? image : NONAME.dataUrl(image);
                }

                return {
                    title: cols[0].trim(),
                    author: cols[1] ? cols[1].trim() : '',
                    desc: cols[2] ? cols[2].trim() : '',
                    isAvailable: cols[3] ? cols[3].trim().toUpperCase() === 'TRUE' : false,
                    bgColor: cols[4] ? cols[4].trim() : '',
                    image: imageUrl,
                    isSvg: /\.svg(?:[?#]|$)/i.test(image),
                    tags: cols[6] ? cols[6].replace(/[\r\n]/g, '').trim().split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [],
                };
            }).filter(Boolean);

            window.renderBooks();
        })
        .catch(err => {
            console.error('Read catalog error:', err);
            const grid = document.getElementById('book-grid');
            if (grid) grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--ink-3)">${readUI('error_loading', 'Error loading files.')}</p>`;
        });
}

// Fetch an .svg cover and inline it (same trick as the subject grid) so it is
// crisp and can use the page's loaded fonts. Failure keeps the hue fallback.
function injectCover(el, url) {
    if (!el || !url) return;
    fetch(url)
        .then(res => res.ok ? res.text() : Promise.reject(res.status))
        .then(txt => { if (txt.indexOf('<svg') !== -1) el.innerHTML = txt; })
        .catch(() => { /* keep background colour */ });
}

window.renderBooks = function () {
    const grid = document.getElementById('book-grid');
    if (!grid) return;
    const lang = readLang();

    // Localize the search placeholder (translatePage only handles textContent).
    const searchBox = document.getElementById('book-search');
    const query = searchBox ? searchBox.value.trim().toLowerCase() : '';
    if (searchBox) searchBox.placeholder = readUI('read_search', 'Search by title, author or tag…');

    // Filter: title / author / tags. Empty query = whole library, featured first.
    let books = allBooks.filter(b =>
        !query ||
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.tags.some(t => t.includes(query))
    );
    if (!query) {
        books = books.slice().sort((a, b) =>
            (b.tags.includes('featured') ? 1 : 0) - (a.tags.includes('featured') ? 1 : 0));
    }

    const title = document.getElementById('library-title');
    if (title) {
        title.textContent = query
            ? readUI('read_results', 'Results')
            : readUI('read_library', 'Library');
    }

    if (books.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--ink-3)">${readUI('read_no_books', 'No books match your search.')}</p>`;
        return;
    }

    grid.innerHTML = '';
    books.forEach(book => {
        const featured = book.tags.includes('featured');
        const buttonText = book.isAvailable
            ? readUI('read_open', 'Read')
            : readUI('coming_soon', 'Coming Soon');
        const readerUrl = NONAME.url('reader', { book: book.title, lang });
        const linkHTML = book.isAvailable
            ? `<button onclick="window.location.href='${readerUrl.replace(/'/g, '&#39;')}'">${buttonText}</button>`
            : `<button disabled>${buttonText}</button>`;
        const tagChips = book.tags.filter(t => t !== 'featured')
            .map(t => `<span class="book-tag">${t}</span>`).join('');

        const card = document.createElement('div');
        card.className = `course-card ${book.isAvailable ? '' : 'disabled'}`;
        card.innerHTML = `
            <div class="card-image" style="background-color:${book.bgColor || 'var(--paper-2)'};"></div>
            <div class="card-text">
                <h3>${book.title}${featured ? ` <span class="book-featured" title="Featured">★</span>` : ''}</h3>
                <p class="book-author">${book.author}</p>
                <p>${book.desc || ''}</p>
                ${tagChips ? `<div class="book-tags">${tagChips}</div>` : ''}
                ${linkHTML}
            </div>`;
        grid.appendChild(card);

        if (book.isSvg && book.image) injectCover(card.querySelector('.card-image'), book.image);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
    const searchBox = document.getElementById('book-search');
    if (searchBox) searchBox.addEventListener('input', () => window.renderBooks());
});
