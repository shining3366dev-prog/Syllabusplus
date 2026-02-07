window.I18N_DATA = {}; // Global dictionary

async function initLocalisation() {
    const lang = getLangFromURL();
    const LOC_URL = `${BASE_URL}/localisation.csv?t=${Date.now()}`;

    try {
        const res = await fetch(LOC_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);

        rows.forEach(row => {
            if (!row.trim()) return;
            const [key, en, fr, de] = row.split(';').map(c => c?.trim());
            window.I18N_DATA[key] = { en, fr, de };
        });

        translatePage(); // Run initial translation
    } catch (err) {
        console.error("Localisation failed:", err);
    }
}

// Add this to your translatePage function logic
function translatePage() {
    const lang = getLangFromURL();
    
    // 1. Translate Static HTML elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translationSet = window.I18N_DATA[key];
        if (translationSet) {
            el.innerText = translationSet[lang] || translationSet['en'];
        }
    });

    // 2. Translate Year Buttons (S1, S2, etc.)
    document.querySelectorAll('.year-btn').forEach(btn => {
        const text = btn.innerText;
        if (text.includes('Year')) {
            const yearNum = text.match(/\d+/)[0];
            const yearLabel = { en: 'Year', fr: 'Année', de: 'Jahr' }[lang] || 'Year';
            btn.innerHTML = `S${yearNum} (${yearLabel} ${yearNum})`;
        }
        if (text.includes('All')) {
             btn.innerText = { en: 'All Years', fr: 'Toutes les années', de: 'Alle Jahre' }[lang] || 'All Years';
        }
    });
}