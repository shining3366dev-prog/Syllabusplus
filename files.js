/**
 * SYLLABUS+ FILE EXPLORER ENGINE
 * Handles: File Tree, PDF Preview, Wiki Rendering, and Math/Scratch Widgets.
 */

// --- CONFIGURATION ---
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = IS_LOCAL ? '../Syllabusplus-Database' : 'https://shining3366dev-prog.github.io/Syllabusplus-Database';

// 1. HELPER: Get Subject from URL
function getSubjectFromURL() {
    return new URLSearchParams(window.location.search).get('subject');
}

// 2. MAIN LOAD FUNCTION
async function loadFiles() {
    const currentSubject = getSubjectFromURL();
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');
    
    if (!currentSubject) {
        titleElement.innerText = "Select a Subject";
        return;
    }
    titleElement.innerText = currentSubject;

    // A. Setup Dropdown & Get Available Years
    const availableYears = await setupYearDropdown(currentSubject);

    // B. Validate Saved Year
    let savedYear = localStorage.getItem('selectedYear') || "ALL";
    const dropdown = document.getElementById('file-year-select');

    // If saved year isn't valid for this subject, default to first available
    if (availableYears.length > 0 && !availableYears.includes(savedYear) && savedYear !== "ALL") {
        savedYear = availableYears.length > 1 ? "ALL" : availableYears[0];
        localStorage.setItem('selectedYear', savedYear);
    }
    if (dropdown) dropdown.value = savedYear;

    // C. Fetch Files
    const FILES_URL = `${BASE_URL}/subject-files.csv?t=${Date.now()}`;
    
    try {
        const res = await fetch(FILES_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);
        
        let totalFiles = 0;
        const fileStructure = {};

        rows.forEach(row => {
            if (!row.trim()) return;
            const [subj, year, path, name, link] = row.split(';').map(c => c?.trim());

            if (subj && subj.toLowerCase() === currentSubject.toLowerCase()) {
                // Filter Logic
                if (savedYear !== "ALL" && year && year !== savedYear) return;

                totalFiles++;
                const folders = path ? path.split(/[/\\]/).filter(f => f.trim()) : []; 
                
                // Build Tree
                let current = fileStructure;
                folders.forEach(folder => {
                    if (!current[folder]) current[folder] = {};
                    current = current[folder];
                });
                
                if (!current['__FILES__']) current['__FILES__'] = [];
                current['__FILES__'].push({ name, link });
            }
        });

        if (totalFiles === 0) {
            treeContainer.innerHTML = `<p style="padding:20px; font-style:italic; color:#666;">No content found for ${savedYear}.</p>`;
        } else {
            treeContainer.innerHTML = renderTree(fileStructure);
        }

    } catch (err) {
        console.error('File Load Error:', err);
        treeContainer.innerHTML = `<p style="padding:20px; color:red;">Error loading files.</p>`;
    }
}

// 3. WIDGET: Dynamic Year Dropdown
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
        if (years.length > 1) {
            dropdown.add(new Option("All Years", "ALL"));
        }
        years.forEach(y => dropdown.add(new Option(`${y} (Year ${y.replace('S','')})`, y)));

        return years;
    } catch (e) { console.error(e); return []; }
}

window.updateFileYear = (year) => {
    localStorage.setItem('selectedYear', year);
    loadFiles();
};

// 4. PREVIEW LOGIC
window.previewFile = (url, element) => {
    const views = {
        pdf: document.getElementById('pdf-viewer'),
        wiki: document.getElementById('article-viewer'),
        empty: document.getElementById('empty-state')
    };

    // Reset UI
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views.empty.style.display = 'none';
    
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    // Determine Type
    if (url.endsWith('.json')) {
        views.wiki.classList.remove('hidden');
        const fullUrl = url.startsWith('http') ? url : `${BASE_URL}/articles_data/${url}`;
        renderWiki(fullUrl);
    } else {
        views.pdf.classList.remove('hidden');
        views.pdf.src = `${url}#toolbar=0`;
    }
};

// 5. WIKI RENDERER (The Engine)
async function renderWiki(url) {
    const container = document.getElementById('article-viewer');
    container.innerHTML = '<div class="loading-spinner">Loading Article...</div>';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Article not found");
        const data = await res.json();

        // Wait for Math Engine (KaTeX)
        await waitForKaTeX();

        const html = `
            <div class="wiki-container">
                <header class="wiki-header">
                    <h1>${parseInlineMath(data.title)}</h1>
                    <p class="wiki-meta"><i class="fa-solid fa-clock-rotate-left"></i> Updated: ${data.lastUpdated}</p>
                </header>
                <div class="wiki-body">
                    ${data.sections.map(renderSection).join('')}
                </div>
            </div>`;

        container.innerHTML = html;

        // Post-Render: Render Block Math
        data.sections.forEach((s, i) => {
            if (s.type === 'formula' && s.latex) renderBlockMath(s.latex, `math-${i}`);
        });

    } catch (err) {
        container.innerHTML = `<div class="error-msg">⚠️ ${err.message}</div>`;
    }
}

// 6. SECTION RENDERER (Switch Logic)
function renderSection(s, index) {
    const content = s.content ? parseInlineMath(s.content) : '';
    let html = '<section class="wiki-section">';
    
    if (s.heading) html += `<h2>${s.heading}</h2>`;

    switch (s.type) {
        case 'intro':
        case 'text':
            html += `<p>${content}</p>`;
            break;

        case 'html':
            html += `<div class="custom-html">${s.content}</div>`;
            break;

        case 'formula':
            if (s.content) html += `<p>${content}</p>`;
            html += `<div class="math-card" id="math-${index}"></div>`;
            break;

        case 'example':
            html += `<div class="example-box"><strong>Example:</strong> ${content}</div>`;
            break;

        case 'scratch':
            const match = s.url.match(/projects\/(\d+)/);
            const id = match ? match[1] : s.url;
            const title = s.widgetTitle || "Interactive Demo";
            const desc = s.description || "Click the Green Flag to start.";
            
            html += `
                <div class="scratch-container">
                    <div class="scratch-frame-wrapper">
                        <iframe src="https://scratch.mit.edu/projects/${id}/embed" 
                                allowtransparency="true" frameborder="0" scrolling="no" allowfullscreen></iframe>
                    </div>
                    <div class="scratch-sidebar">
                        <h3>${title}</h3>
                        <p>${desc}</p>
                        <a href="https://scratch.mit.edu/projects/${id}/" target="_blank" class="btn-scratch">
                            <i class="fa-solid fa-code-branch"></i> View & Remix
                        </a>
                    </div>
                </div>`;
            break;
    }

    html += '</section>';
    return html;
}

// 7. MATH UTILITIES
function parseInlineMath(text) {
    if (!text) return '';
    // Replaces $...$ with KaTeX HTML
    return text.replace(/\$([^$]+)\$/g, (match, tex) => {
        try {
            return katex.renderToString(tex, { throwOnError: false, displayMode: false });
        } catch { return match; }
    });
}

function renderBlockMath(tex, elementId) {
    const el = document.getElementById(elementId);
    if (el && window.katex) {
        try {
            katex.render(tex, el, { displayMode: true, throwOnError: false });
        } catch (e) {
            el.innerHTML = `<code style="color:red">${tex}</code>`;
        }
    }
}

function waitForKaTeX() {
    return new Promise(resolve => {
        if (window.katex) return resolve();
        const check = setInterval(() => {
            if (window.katex) { clearInterval(check); resolve(); }
        }, 100);
    });
}

// 8. TREE RENDERER (Recursive)
function renderTree(structure) {
    let html = '';
    
    // Folders
    Object.keys(structure).forEach(key => {
        if (key === '__FILES__') return;
        html += `
            <details class="folder-details" open>
                <summary class="folder-summary"><i class="folder-icon"></i><span>${key}</span></summary>
                <div class="folder-content">${renderTree(structure[key])}</div>
            </details>`;
    });

    // Files
    if (structure['__FILES__']) {
        structure['__FILES__'].forEach(f => {
            html += `
                <div class="file-item" onclick="previewFile('${f.link}', this)">
                    <i class="fa-regular fa-file-pdf file-icon"></i><span>${f.name}</span>
                </div>`;
        });
    }
    return html;
}

document.addEventListener('DOMContentLoaded', loadFiles);