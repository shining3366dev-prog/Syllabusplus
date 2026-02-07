function getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') || 'en'; // Default to English
}

// 2. Navigation UI (Updated for DE, FR, EN)
const currentLang = getLangFromURL();
const langNames = { 'en': 'English', 'fr': 'Français', 'de': 'Deutsch' };

const headerHTML = `
    <header class="header">
        <a href="index.html" class="logo">Syllabus+</a>
        
        <button class="menu-toggle" id="mobile-menu-btn" aria-label="Toggle Menu">
            <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="navbar" id="main-nav">
            <a href="index.html">Home</a>
            <a href="index.html#subjects">Subjects</a>
            <a href="#about">About</a>
            
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

            <a href="#" class="btn-login" onclick="loginGoogle()">Login</a>
        </nav>
    </header>
`;

window.changeLanguage = function(langCode, event) {
    if (event) event.preventDefault();
    
    // 1. Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('lang', langCode);
    window.history.pushState({}, '', url);

    // 2. Update UI dropdown
    const langNames = { 'en': 'English', 'fr': 'Français', 'de': 'Deutsch' };
    const langBtnSpan = document.querySelector('.lang-btn span');
    if (langBtnSpan) langBtnSpan.innerText = langNames[langCode];

    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('onclick').includes(`'${langCode}'`));
    });

    // 3. Update active article content WITHOUT scrolling
    const activeFile = document.querySelector('.file-item.active');
    if (activeFile) {
        const fileLink = activeFile.getAttribute('data-link');
        if (fileLink && fileLink.endsWith('.json')) {
            updateArticleLanguage(fileLink, langCode);
        }
    }
    
    // 4. Reload the file tree with new language
    setTimeout(() => loadFiles(true), 150);
};
// 2. Footer
const footerHTML = `
    <footer id="main-footer">
        <p>&copy; 2026 SYLLABUSPLUS. All rights reserved.</p>
    </footer>
`;

// 3. Inject Function
function loadLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    
    // Highlight Active Link
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll('.navbar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });

    // Mobile Menu Logic
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
}
// 1. MAIN LOAD FUNCTION
async function loadFiles(isSilent = false) {
    const currentSubject = getSubjectFromURL();
    const currentLang = getLangFromURL();
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');
    
    if (!currentSubject) return;
    if (titleElement) titleElement.innerText = currentSubject;

    const availableYears = await setupYearDropdown(currentSubject);

    // Only show "Updating" if we aren't in a silent language switch
    if (!isSilent && treeContainer) {
        treeContainer.innerHTML = '<p style="padding:20px; opacity:0.5;">Loading...</p>';
    }

    const langSuffix = currentLang === 'en' ? '' : `-${currentLang}`;
    const FILES_URL = `${BASE_URL}/subject-files${langSuffix}.csv?t=${Date.now()}`;
    
    try {
        const res = await fetch(FILES_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);
        const fileStructure = {};
        window.currentFilesList = [];

        rows.forEach(row => {
            if (!row.trim()) return;
            const [subj, year, path, name, link] = row.split(';').map(c => c?.trim());
            if (subj && subj.toLowerCase() === currentSubject.toLowerCase()) {
                const folders = path ? path.split(/[/\\]/).filter(f => f.trim()) : []; 
                let current = fileStructure;
                folders.forEach(folder => {
                    if (!current[folder]) current[folder] = {};
                    current = current[folder];
                });
                if (!current['__FILES__']) current['__FILES__'] = [];
                current['__FILES__'].push({ name, link });
                window.currentFilesList.push({ name, link });
            }
        });

        treeContainer.innerHTML = renderTree(fileStructure);

        // Keep the active file highlighted in the sidebar after language switch
        if (isSilent) {
            const activeLink = document.getElementById('article-viewer').getAttribute('data-current-file');
            const activeItem = document.querySelector(`.file-item[data-link="${activeLink}"]`);
            if (activeItem) activeItem.classList.add('active');
        }

    } catch (err) { console.error(err); }
}
// 2. WIDGET: Dynamic Year Dropdown
async function setupYearDropdown(subjectName) {
    const WIDGET_URL = `${BASE_URL}/course-card-widgets.csv`;
    try {
        const res = await fetch(WIDGET_URL);
        const text = await res.text();
        const rows = text.split('\n').slice(1);
        const dropdown = document.getElementById('file-year-select');
        const row = rows.find(r => r.split(';')[0]?.trim().toLowerCase() === subjectName.toLowerCase());
        
        if (!row || !dropdown) return [];
        const years = row.split(';')[5]?.trim().split(',').map(y => y.trim()) || [];
        
        dropdown.innerHTML = '';
        if (years.length > 1) dropdown.add(new Option("All Years", "ALL"));
        years.forEach(y => dropdown.add(new Option(`${y} (Year ${y.replace('S','')})`, y)));
        return years;
    } catch (e) { console.error(e); return []; }
}

// 3. TREE RENDERER (Creates the UI for folders/files)
function renderTree(structure) {
    let html = '';
    
    // Folders
    Object.keys(structure).forEach(key => {
        if (key === '__FILES__') return;
        html += `
            <details class="folder-details" open>
                <summary class="folder-summary">
                    <i class="folder-arrow"></i>
                    <span class="folder-name">${key}</span>
                </summary>
                <div class="folder-content">
                    ${renderTree(structure[key])}
                </div>
            </details>`;
    });
    
    // Files (Nodes)
    if (structure['__FILES__']) {
        const files = structure['__FILES__'];
        files.forEach((f, index) => {
            const isFirst = index === 0 ? 'is-first' : '';
            const isLast = index === files.length - 1 ? 'is-last' : '';
            const isOnly = files.length === 1 ? 'is-only' : '';

            html += `
                <div class="file-item ${isFirst} ${isLast} ${isOnly}" data-link="${f.link}" onclick="previewFile('${f.link}', this)">
                    <i class="fa-solid fa-circle-check node-icon"></i>
                    <span class="file-name">${f.name}</span>
                </div>`;
        });
    }
    return html;
}
loadLayout();
