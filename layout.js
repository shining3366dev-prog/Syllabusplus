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
        <a href="#" onclick="goToHome(event)" class="logo">Syllabus+</a>
        
        <button class="menu-toggle" id="mobile-menu-btn" aria-label="Toggle Menu">
            <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="navbar" id="main-nav">
            <a href="#" onclick="goToHome(event)" data-i18n="nav_home">Home</a>
            <a href="#" onclick="goToSubjects(event)" data-i18n="nav_subjects">Subjects</a>
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
        <div class="footer-container">
            <div class="footer-brand">
                <div class="footer-logo">Syllabus+</div>
                <p class="footer-tagline" data-i18n="footer_tagline">Empowering students with quality resources</p>
            </div>
            
            <div class="footer-links">
                <div class="footer-column">
                    <h4 data-i18n="footer_explore">Explore</h4>
                    <a href="#" onclick="goToHome(event)" data-i18n="nav_home">Home</a>
                    <a href="#" onclick="goToSubjects(event)" data-i18n="nav_subjects">Subjects</a>
                    <a href="#about" data-i18n="nav_about">About</a>
                </div>
                
                <div class="footer-column">
                    <h4 data-i18n="footer_resources">Resources</h4>
                    <a href="#" data-i18n="footer_study_guides">Study Guides</a>
                    <a href="#" data-i18n="footer_past_papers">Past Papers</a>
                    <a href="#" data-i18n="footer_worksheets">Worksheets</a>
                </div>
                
                <div class="footer-column">
                    <h4 data-i18n="footer_support">Support</h4>
                    <a href="#" data-i18n="footer_help">Help Center</a>
                    <a href="#" data-i18n="footer_contact">Contact Us</a>
                    <a href="#" data-i18n="footer_feedback">Feedback</a>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="footer-left">
                <p>&copy; 2026 SYLLABUSPLUS. <span data-i18n="footer_rights">All rights reserved.</span></p>
            </div>
            
            <div class="footer-center">
                <div class="theme-switcher">
                    <button class="theme-btn" data-theme="system" title="System theme">
                        <i class="fa-solid fa-circle-half-stroke"></i>
                    </button>
                    <button class="theme-btn" data-theme="light" title="Light theme">
                        <i class="fa-solid fa-sun"></i>
                    </button>
                    <button class="theme-btn" data-theme="dark" title="Dark theme">
                        <i class="fa-solid fa-moon"></i>
                    </button>
                    <div class="theme-indicator"></div>
                </div>
            </div>
            
            <div class="footer-right">
                <div class="footer-social">
                    <a href="https://discord.gg/hQGbsEfH" target="_blank" aria-label="Discord"><i class="fa-brands fa-discord"></i></a>
                    <a href="https://github.com/shining3366dev-prog" target="_blank" aria-label="GitHub"><i class="fa-brands fa-github"></i></a>
                </div>
            </div>
        </div>
    </footer>
`;

// --- NAVIGATION FUNCTIONS ---
window.goToHome = function(event) {
    if (event) event.preventDefault();
    const currentLang = getLangFromURL();
    window.location.href = `index.html?lang=${currentLang}`;
};

window.goToSubjects = function(event) {
    if (event) event.preventDefault();
    const currentLang = getLangFromURL();
    window.location.href = `index.html?lang=${currentLang}#subjects`;
};

// --- CHANGE LANGUAGE FUNCTION ---
window.changeLanguage = function(langCode, event) {
    if (event) event.preventDefault();
    
    const url = new URL(window.location.href);
    url.searchParams.set('lang', langCode);
    window.history.pushState({}, '', url);

    const langBtnSpan = document.querySelector('.lang-btn span');
    if (langBtnSpan) langBtnSpan.textContent = langNames[langCode];

    // Close the dropdown on mobile after selection
    const langWrapper = document.querySelector('.lang-wrapper');
    if (langWrapper) {
        langWrapper.classList.remove('active');
    }

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

    // Mobile language dropdown toggle
    const langWrapper = document.querySelector('.lang-wrapper');
    const langBtn = document.querySelector('.lang-btn');
    
    if (langWrapper && langBtn && window.innerWidth <= 768) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langWrapper.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!langWrapper.contains(e.target)) {
                langWrapper.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => {
                langWrapper.classList.remove('active');
            });
        });
    }

    // Initialize localization
    initLocalisation();
    
    // Initialize theme switcher
    ThemeSwitcher.init();
}
// --- THEME SWITCHER ---
const ThemeSwitcher = {
    init() {
        // Get saved theme or default to 'system'
        const savedTheme = localStorage.getItem('theme') || 'system';
        this.applyTheme(savedTheme);
        
        // Wait for DOM to load
        setTimeout(() => {
            this.setupListeners();
            this.updateActiveButton(savedTheme);
        }, 100);
    },

    setupListeners() {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                const currentTheme = localStorage.getItem('theme');
                if (currentTheme === 'system' || !currentTheme) {
                    this.applyTheme('system');
                }
            });
        }
    },

    setTheme(theme) {
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
        this.updateActiveButton(theme);
    },

    applyTheme(theme) {
        // Remove existing theme classes
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        
        // Add transition class for smooth switching
        document.documentElement.classList.add('theme-transitioning');

        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
        } else if (theme === 'dark') {
            document.documentElement.classList.add('dark-theme');
        } else {
            // System theme - let CSS media query handle it
            // No class needed, will use @media (prefers-color-scheme)
        }

        // Remove transition class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transitioning');
        }, 300);
    },

    updateActiveButton(theme) {
        const buttons = document.querySelectorAll('.theme-btn');
        const indicator = document.querySelector('.theme-indicator');
        
        buttons.forEach((btn, index) => {
            btn.classList.remove('active');
            if (btn.dataset.theme === theme) {
                btn.classList.add('active');
                if (indicator) {
                    indicator.style.transform = `translateX(${index * 100}%)`;
                }
            }
        });
    }
};

// Initialize theme on page load
window.addEventListener('DOMContentLoaded', () => {
    ThemeSwitcher.init();
});
// --- RUN ON PAGE LOAD ---
loadLayout();