// --- GLOBAL LOCALIZATION DATA ---
window.I18N_DATA = {};

function getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') || 'en';
}

// --- LOAD LOCALIZATION CSV ---
async function initLocalisation() {
    const BASE_URL = window.BASE_URL || (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
        ? '../Syllabusplus-Database' 
        : 'https://shining3366dev-prog.github.io/Syllabusplus-Database');
    
    const LOC_URL = `${BASE_URL}/localisation.csv?t=${Date.now()}`;

    try {
        const res = await fetch(LOC_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);

        rows.forEach(row => {
            if (!row.trim()) return;
            const [key, en, fr, de] = row.split(';').map(c => c?.trim());
            if (key) {
                window.I18N_DATA[key] = { en, fr, de };
            }
        });

        translatePage();
    } catch (err) {
        console.error("Localisation failed:", err);
    }
}

// --- TRANSLATE ALL ELEMENTS WITH data-i18n ---
function translatePage() {
    const lang = getLangFromURL();
    
    // 1. Translate static text
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translationSet = window.I18N_DATA[key];
        if (translationSet) {
            el.textContent = translationSet[lang] || translationSet['en'];
        }
    });

    // 2. Update language dropdown active state
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('onclick').includes(`'${lang}'`));
    });
}

// --- NAVIGATION HEADER ---
const currentLang = getLangFromURL();
const langNames = { 'en': 'English', 'fr': 'Français', 'de': 'Deutsch' };

const headerHTML = `
    <header class="header">
        <a href="index.html?lang=${currentLang}" class="logo">Syllabus+</a>
        
        <button class="menu-toggle" id="mobile-menu-btn" aria-label="Toggle Menu">
            <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="navbar" id="main-nav">
            <a href="index.html?lang=${currentLang}" data-i18n="nav_home">Home</a>
            <a href="index.html?lang=${currentLang}#subjects" data-i18n="nav_subjects">Subjects</a>
            <a href="#about" data-i18n="nav_about">About</a>
            
            <div class="lang-wrapper">
                <button class="lang-btn">
                    <i class="fa-solid fa-globe"></i>
                    <span>${langNames[currentLang]}</span>
                    <i class="fa-solid fa-chevron-down lang-chevron"></i>
                </button>
                <div class="lang-dropdown">
                    <a href="javascript:void(0)" onclick="changeLanguage('en', event)" class="lang-option ${currentLang === 'en' ? 'active' : ''}">English</a>
                    <a href="javascript:void(0)" onclick="changeLanguage('fr', event)" class="lang-option ${currentLang === 'fr' ? 'active' : ''}">Français</a>
                    <a href="javascript:void(0)" onclick="changeLanguage('de', event)" class="lang-option ${currentLang === 'de' ? 'active' : ''}">Deutsch</a>
                </div>
            </div>

            <a href="#" class="btn-login" data-i18n="nav_login" onclick="loginGoogle()">Login</a>
        </nav>
    </header>
`;

// --- FOOTER ---
const footerHTML = `
    <footer id="main-footer">
        <p>&copy; 2026 SYLLABUSPLUS. <span data-i18n="footer_rights">All rights reserved.</span></p>
    </footer>
`;

// --- CHANGE LANGUAGE FUNCTION ---
window.changeLanguage = function(langCode, event) {
    if (event) event.preventDefault();
    
    const url = new URL(window.location.href);
    url.searchParams.set('lang', langCode);
    window.history.pushState({}, '', url);

    const langBtnSpan = document.querySelector('.lang-btn span');
    if (langBtnSpan) langBtnSpan.textContent = langNames[langCode];

    // Translate static page elements
    translatePage();

    // Update article content if on files page
    if (typeof window.updateArticleLanguage === 'function') {
        const activeFile = document.querySelector('.file-item.active');
        if (activeFile) {
            const fileLink = activeFile.getAttribute('data-link');
            if (fileLink) {
                window.updateArticleLanguage(fileLink, langCode);
            }
        }
    }
    
    // Reload file tree with translations (files.html)
    if (typeof loadFiles === 'function') {
        loadFiles(true);
    }
    
    // Reload course cards with translations (index.html)
    if (typeof renderGrid === 'function') {
        const savedYear = localStorage.getItem('selectedYear') || 'ALL';
        renderGrid(savedYear);
    }
};

// --- INJECT LAYOUT ---
function loadLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    
    // Highlight active page
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll('.navbar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
            const icon = menuBtn.querySelector('i');
            if (nav.classList.contains('nav-open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Initialize localization
    initLocalisation();
}

// --- RUN ON PAGE LOAD ---
loadLayout();