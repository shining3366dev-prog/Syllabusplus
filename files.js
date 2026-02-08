/**
 * SYLLABUS+ FILE EXPLORER ENGINE
 * Fixed: Year switching scrolls to top, clears file URL param, handles empty file lists
 */

// --- CONFIGURATION ---
function getUIString(key, lang) {
    return window.I18N_DATA?.[key]?.[lang] || key;
}

const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = IS_LOCAL ? '../Syllabusplus-Database' : 'https://shining3366dev-prog.github.io/Syllabusplus-Database';

window.BASE_URL = BASE_URL;
window.quizzes = window.quizzes || {};

// Detect if mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// --- SOUND EFFECTS ---
const QUIZ_SOUNDS = {
    correct: "https://www.myinstants.com/media/sounds/correct.mp3",  
    wrong: "https://www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3", 
    win: "https://www.myinstants.com/media/sounds/tadaaa.mp3",          
    lose: "https://www.myinstants.com/media/sounds/sound-fail-fallo.mp3"         
};

// --- HELPER FUNCTIONS ---
function getLangFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('lang') || 'en';
}

function getSubjectFromURL() {
    return new URLSearchParams(window.location.search).get('subject');
}

function getFileFromURL() {
    return new URLSearchParams(window.location.search).get('file');
}

function playSound(type) {
    try {
        const audio = new Audio(QUIZ_SOUNDS[type]);
        audio.volume = 0.5; 
        audio.play().catch(e => console.log("Audio autoplay blocked:", e));
    } catch (e) { 
        console.warn("Sound error:", e); 
    }
}

function translateSubjectTitle(subjectName) {
    const lang = getLangFromURL();
    const subjectKey = `subject_${subjectName.toLowerCase().replace(/\s+/g, '_')}`;
    return window.I18N_DATA?.[subjectKey]?.[lang] || subjectName;
}

// --- LANGUAGE UPDATE FUNCTION ---
window.updateArticleLanguage = async function(fileLink, langCode) {
    const container = document.getElementById('article-viewer');
    if (!container) return;
    
    const scrollPos = container.scrollTop;
    
    try {
        const res = await fetch(`${BASE_URL}/articles_data/${fileLink}`);
        if (!res.ok) {
            console.error("Failed to fetch article:", res.status);
            return;
        }
        const data = await res.json();
        
        // 1. Update Title
        const titleElement = container.querySelector('.wiki-header h1');
        if (titleElement) {
            const displayTitle = data[`title_${langCode}`] || data.title;
            titleElement.innerHTML = parseInlineMath(displayTitle);
        }
        
        // 2. Update ALL sections
        const sections = container.querySelectorAll('.wiki-section');
        data.sections.forEach((sectionData, index) => {
            if (!sections[index]) return;
            
            const section = sections[index];
            const getField = (base) => sectionData[`${base}_${langCode}`] || sectionData[base] || '';
            
            const heading = section.querySelector('h2');
            const headingText = getField('heading');
            if (heading && headingText) {
                heading.textContent = headingText;
            }
            
            switch(sectionData.type) {
                case 'intro':
                case 'text':
                    const paragraph = section.querySelector('p');
                    const textContent = getField('content');
                    if (paragraph && textContent) {
                        paragraph.innerHTML = parseInlineMath(getField('content'));
                    }
                    break;
                    
                case 'formula':
                    const formulaP = section.querySelector('p');
                    const formulaContent = getField('content');
                    if (formulaP && formulaContent) {
                        formulaP.innerHTML = parseInlineMath(formulaContent);
                    }
                    break;
                    
                case 'example':
                    const exampleBox = section.querySelector('.example-box');
                    const exampleContent = getField('content');
                    if (exampleBox && exampleContent) {
                        exampleBox.innerHTML = `<strong>${getUIString('ui_example', langCode)}:</strong> ${parseInlineMath(exampleContent)}`;
                    }
                    break;
                    
                case 'scratch':
                    const scratchTitle = section.querySelector('.scratch-sidebar h3');
                    const scratchDesc = section.querySelector('.scratch-description');
                    
                    const titleText = getField('widgetTitle') || getField('title') || "Interactive Demo";
                    if (scratchTitle) {
                        scratchTitle.textContent = titleText;
                    }
                    if (scratchDesc) {
                        const descText = getField('description');
                        scratchDesc.innerHTML = descText ? parseInlineMath(descText) : "Click the Green Flag to start.";
                    }
                    break;
                    
                case 'quiz':
                    const quizId = `quiz-sec-${index}`;
                    if (window.quizzes && window.quizzes[quizId]) {
                        window.quizzes[quizId].questions = sectionData.questions.map(q => ({
                            question: q[`question_${langCode}`] || q.question,
                            options: q[`options_${langCode}`] || q.options,
                            correct: q.correct
                        }));
                        
                        if (window.renderQuizQuestion) {
                            window.renderQuizQuestion(quizId);
                        }
                    }
                    break;
            }
        });
        
        // 3. Update Navigation Buttons
        const navButtons = container.querySelectorAll('.nav-btn .nav-info span:first-child');
        navButtons.forEach(label => {
            const text = label.textContent.trim().toLowerCase();
            if (text.includes('previous') || text.includes('précédent') || text.includes('zurück')) {
                label.textContent = getUIString('ui_prev_nav', langCode);
            } else if (text.includes('next') || text.includes('suivant') || text.includes('weiter')) {
                label.textContent = getUIString('ui_next_nav', langCode);
            } else if (text.includes('back') || text.includes('retour')) {
                label.textContent = getUIString('ui_back', langCode);
            }
        });
        
        container.setAttribute('data-current-lang', langCode);
        
        requestAnimationFrame(() => {
            container.scrollTop = scrollPos;
        });
        
    } catch (err) {
        console.error("Language update error:", err);
    }
};

// --- MAIN LOAD FUNCTION ---
async function loadFiles(isSilent = false) {
    const currentSubject = getSubjectFromURL();
    const currentLang = getLangFromURL();
    const fileToAutoLoad = getFileFromURL(); 
    
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');
    
    if (!currentSubject) {
        if (titleElement) titleElement.innerText = "Select a Subject";
        return;
    }
    
    if (titleElement) titleElement.innerText = currentSubject;

    const availableYears = await setupYearDropdown(currentSubject);

    let savedYear = localStorage.getItem('selectedYear') || "ALL";
    const dropdown = document.getElementById('file-year-select');

    if (availableYears.length > 0 && !availableYears.includes(savedYear) && savedYear !== "ALL") {
        savedYear = availableYears.length > 1 ? "ALL" : availableYears[0];
        localStorage.setItem('selectedYear', savedYear);
    }
    if (dropdown) {
        dropdown.value = savedYear;
        // Prevent auto-scroll when dropdown value is set programmatically
        dropdown.blur();
    }

    if (!isSilent && treeContainer) {
        treeContainer.innerHTML = '<p style="padding:20px; opacity:0.5;">Loading...</p>';
        
        // Show empty state while loading (only on desktop or if no file param)
        const emptyState = document.getElementById('empty-state');
        if (emptyState && !fileToAutoLoad && !isMobile()) {
            emptyState.style.display = 'flex';
        }
    }

    const FILES_URL = `${BASE_URL}/subject-files.csv?t=${Date.now()}`;
    
    try {
        // 1. FETCH DATA
        const res = await fetch(FILES_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);
        
        let totalFiles = 0;
        const fileStructure = {};
        window.currentFilesList = []; 

        const filesToFetch = [];

        rows.forEach(row => {
            if (!row.trim()) return;
            const [subj, year, path, link] = row.split(';').map(c => c?.trim());

            if (subj && subj.toLowerCase() === currentSubject.toLowerCase()) {
                if (savedYear !== "ALL" && year && year !== savedYear) return;

                totalFiles++;
                const folders = path ? path.split(/[/\\]/).filter(f => f.trim()) : []; 
                filesToFetch.push({ folders, link });
            }
        });

        // 2. FETCH TITLES
        const titlePromises = filesToFetch.map(async (file) => {
            if (!file.link.endsWith('.json')) {
                return { ...file, title: file.link };
            }
            try {
                const jsonRes = await fetch(`${BASE_URL}/articles_data/${file.link}`);
                if (!jsonRes.ok) throw new Error();
                const jsonData = await jsonRes.json();
                const title = jsonData[`title_${currentLang}`] || jsonData.title || file.link;
                return { ...file, title };
            } catch (err) {
                return { ...file, title: file.link.replace('.json', '') };
            }
        });

        const filesWithTitles = await Promise.all(titlePromises);

        // 3. BUILD TREE DATA
        filesWithTitles.forEach(file => {
            let current = fileStructure;
            file.folders.forEach(folder => {
                const folderKey = `folder_${folder.toLowerCase().replace(/\s+/g, '_')}`;
                const translatedFolder = window.I18N_DATA?.[folderKey]?.[currentLang] || folder;
                
                if (!current[translatedFolder]) current[translatedFolder] = {};
                current = current[translatedFolder];
            });
            
            if (!current['__FILES__']) current['__FILES__'] = [];
            
            const fileObj = { name: file.title, link: file.link };
            current['__FILES__'].push(fileObj);
            window.currentFilesList.push(fileObj);
        });

        // 4. RENDER TREE TO DOM
        if (totalFiles === 0) {
            treeContainer.innerHTML = `<p style="padding:20px; font-style:italic; color:#666;">No content found.</p>`;
        } else {
            treeContainer.innerHTML = renderTree(fileStructure);
        }

        if (titleElement) {
            titleElement.innerText = translateSubjectTitle(currentSubject);
        }

        // 5. AUTO-SELECT FILE - DISABLED ON MOBILE
        // ⚠️ FIX: Only auto-load if there are files available
        if (!isSilent && !isMobile() && window.currentFilesList.length > 0) {
            console.log("✓ Auto-load enabled (desktop mode)");
            console.log("📊 Total files available:", window.currentFilesList.length);
            
            requestAnimationFrame(() => {
                setTimeout(() => {
                    let targetFile = null;
                    
                    console.log("🔍 Starting auto-load process...");
                    
                    // Option A: Try to load file from URL parameter (only if it exists in current list)
                    if (fileToAutoLoad) {
                        console.log("🤖 Checking file from URL:", fileToAutoLoad);
                        const decoded = decodeURIComponent(fileToAutoLoad);
                        
                        targetFile = window.currentFilesList.find(f => 
                            f.link === decoded ||
                            f.link.endsWith(decoded) ||
                            f.link.includes(decoded) ||
                            f.name === decoded ||
                            f.name.includes(decoded)
                        );
                        
                        if (targetFile) {
                            console.log("✅ Found file from URL:", targetFile.link);
                        } else {
                            console.warn("❌ File from URL not in current year/filter:", decoded);
                        }
                    }
                    
                    // Option B: If no URL param or file not found, load first available file
                    if (!targetFile && window.currentFilesList.length > 0) {
                        targetFile = window.currentFilesList[0];
                        console.log("📄 Loading first file by default:", targetFile.link);
                    }
                    
                    // Load the target file
                    if (targetFile) {
                        console.log("🎯 Opening file:", targetFile.link);
                        
                        // Find the DOM element and expand folders
                        const treeItem = document.querySelector(`.file-item[data-link="${targetFile.link}"]`);
                        if (treeItem) {
                            console.log("✅ Found DOM element for file");
                            // Expand parent folders
                            let parent = treeItem.parentElement;
                            while (parent && parent !== treeContainer) {
                                if (parent.tagName === 'DETAILS') {
                                    parent.open = true;
                                }
                                parent = parent.parentElement;
                            }
                            
                            // Scroll to it
                            treeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        
                        // Call previewFile to display the content
                        console.log("🚀 Calling previewFile()");
                        previewFile(targetFile.link, treeItem);
                    }
                }, 400);
            });
        } 
        else if (!isSilent && !isMobile() && window.currentFilesList.length === 0) {
            // ⚠️ FIX: Show empty state when no files available
            console.log("⚠️ No files available for this year/filter");
            const emptyState = document.getElementById('empty-state');
            if (emptyState) {
                emptyState.style.display = 'flex';
            }
            
            // Hide PDF and article viewers
            const pdfViewer = document.getElementById('pdf-viewer');
            const articleViewer = document.getElementById('article-viewer');
            if (pdfViewer) pdfViewer.classList.add('hidden');
            if (articleViewer) articleViewer.classList.add('hidden');
        }
        else if (!isSilent && isMobile()) {
            console.log("📱 Mobile detected - auto-load disabled, showing file tree");
            // On mobile, keep showing the file tree - don't auto-load
            const emptyState = document.getElementById('empty-state');
            if (emptyState) emptyState.style.display = 'none';
            
            // If there's a file param AND files are available, load it
            if (fileToAutoLoad && window.currentFilesList.length > 0) {
                console.log("📱 File param detected, will load:", fileToAutoLoad);
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        const decoded = decodeURIComponent(fileToAutoLoad);
                        const targetFile = window.currentFilesList.find(f => 
                            f.link === decoded || f.link.endsWith(decoded) || f.link.includes(decoded)
                        );
                        if (targetFile) {
                            const treeItem = document.querySelector(`.file-item[data-link="${targetFile.link}"]`);
                            previewFile(targetFile.link, treeItem);
                        }
                    }, 400);
                });
            }
        }
        else if (isSilent) {
            console.log("⊘ Auto-load skipped (silent mode - language switch)");
            // Language switch logic
            const activeLink = document.getElementById('article-viewer')?.getAttribute('data-current-file');
            if (activeLink) {
                setTimeout(() => {
                    const activeItem = document.querySelector(`.file-item[data-link="${activeLink}"]`);
                    if (activeItem) activeItem.classList.add('active');
                }, 50);
            }
        }

    } catch (err) {
        console.error('File Load Error:', err);
        if (treeContainer) treeContainer.innerHTML = `<p style="color:red;">Error loading files.</p>`;
        
        // Show empty state on error (only on desktop)
        if (!isMobile()) {
            const emptyState = document.getElementById('empty-state');
            if (emptyState) emptyState.style.display = 'flex';
        }
    }
}

// --- YEAR DROPDOWN ---
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
        const lang = getLangFromURL();
        const allYearsLabel = window.I18N_DATA?.['all_years']?.[lang] || 'All Years';
        const yearLabel = window.I18N_DATA?.['year_label']?.[lang] || 'Year';
        dropdown.innerHTML = '';
        if (years.length > 1) dropdown.add(new Option(allYearsLabel, "ALL"));
        years.forEach(y => dropdown.add(new Option(`${y} (${yearLabel} ${y.replace('S','')})`, y)));
        return years;
    } catch (e) { 
        console.error(e); 
        return []; 
    }
}

// ⚠️ FIX: Scroll to top when switching years so empty state is visible
window.updateFileYear = (year) => {
    localStorage.setItem('selectedYear', year);
    
    // Clear the file parameter from URL when switching years to prevent loading wrong file
    const currentSubject = getSubjectFromURL();
    const currentLang = getLangFromURL();
    const newUrl = `files.html?subject=${encodeURIComponent(currentSubject)}&lang=${currentLang}`;
    window.history.pushState({}, '', newUrl);
    
    // Hide current preview and show empty state
    const views = {
        pdf: document.getElementById('pdf-viewer'),
        wiki: document.getElementById('article-viewer'),
        empty: document.getElementById('empty-state')
    };
    
    if (views.pdf) views.pdf.classList.add('hidden');
    if (views.wiki) views.wiki.classList.add('hidden');
    if (views.empty && !isMobile()) views.empty.style.display = 'flex';
    
    // Clear active file selection
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    
    // Scroll to top immediately so the empty state is visible
    window.scrollTo(0, 0);
    const sidebarElement = document.querySelector('.file-tree-content');
    if (sidebarElement) {
        sidebarElement.scrollTop = 0;
    }
    
    loadFiles();
};

// --- PREVIEW LOGIC ---
window.previewFile = (url, element) => {
    console.log('📄 previewFile() called with:', url);
    
    const views = {
        pdf: document.getElementById('pdf-viewer'),
        wiki: document.getElementById('article-viewer'),
        empty: document.getElementById('empty-state')
    };

    const isSameFile = views.wiki.getAttribute('data-current-file') === url;

    if (!isSameFile) {
        window.scrollTo(0, 0); 
        if (views.wiki) views.wiki.scrollTop = 0; 
    }

    // Hide all views
    Object.values(views).forEach(el => {
        if (el) el.classList.add('hidden');
    });
    if (views.empty) views.empty.style.display = 'none';

    // Update active state
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    
    if (!element) {
        element = document.querySelector(`.file-item[data-link="${url}"]`);
    }
    
    if (element) {
        element.classList.add('active');
        console.log('✅ File item marked as active');
    }

    // Mobile view handling
    if (isMobile()) {
        const wrapper = document.querySelector('.explorer-wrapper');
        if (wrapper) wrapper.classList.add('preview-mode');
    }

    // Update URL without page refresh
    const currentSubject = getSubjectFromURL();
    const currentLang = getLangFromURL();
    const fileName = url.split('/').pop();
    const newUrl = `files.html?subject=${encodeURIComponent(currentSubject)}&lang=${currentLang}&file=${encodeURIComponent(fileName)}`;
    window.history.pushState({ file: url }, '', newUrl);

    // Load content
    if (url.endsWith('.json')) {
        if (views.wiki) views.wiki.classList.remove('hidden');
        renderWiki(`${BASE_URL}/articles_data/${url}`, url);
    } else {
        if (views.pdf) {
            views.pdf.classList.remove('hidden');
            views.pdf.src = `${BASE_URL}/${url}#toolbar=0`;
        }
    }
};

window.closePreview = () => {
    window.scrollTo(0, 0); 
    const wrapper = document.querySelector('.explorer-wrapper');
    if (wrapper) wrapper.classList.remove('preview-mode');
};

// --- NAVIGATION ---
window.backToSubjects = () => {
    // On mobile, close preview mode and show file tree
    if (isMobile()) {
        window.closePreview();
    } else {
        // On desktop, navigate to subjects page
        const currentLang = getLangFromURL();
        window.location.href = `index.html?lang=${currentLang}#subjects`;
    }
};

window.goBackToSubjects = (event) => {
    if (event) event.preventDefault();
    const currentLang = getLangFromURL();
    window.location.href = `index.html?lang=${currentLang}#subjects`;
};

// --- WIKI RENDERER ---
async function renderWiki(url, originalFilename) {
    const container = document.getElementById('article-viewer');
    const currentLang = getLangFromURL();
    
    const storedFile = container.getAttribute('data-current-file');
    const storedLang = container.getAttribute('data-current-lang');
    const isLanguageSwitch = (storedFile === originalFilename && storedLang !== currentLang);
    const isSameFile = (storedFile === originalFilename && storedLang === currentLang);

    if (!isSameFile) {
        // Show loading state with spinner
        container.innerHTML = `
            <div class="article-loading-state">
                <div class="loading-spinner-wrapper">
                    <div class="loading-spinner-circle"></div>
                </div>
                <h3 class="loading-text">Loading article...</h3>
                <p class="loading-subtext">Preparing your content</p>
            </div>
        `;
        
        if (!isLanguageSwitch) {
            window.scrollTo(0, 0);
            container.scrollTop = 0;
        }
    }

    window.quizzes = {}; 
    container.setAttribute('data-current-file', originalFilename);
    container.setAttribute('data-current-lang', currentLang);

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const data = await res.json();
        await waitForKaTeX();

        const idx = window.currentFilesList.findIndex(f => f.link === originalFilename);
        const prev = window.currentFilesList[idx - 1];
        const next = window.currentFilesList[idx + 1];

        const displayTitle = data[`title_${currentLang}`] || data.title;

        let navHtml = `<div class="article-navigation"><div class="nav-top-row">`;
        navHtml += prev ? `<button class="nav-btn prev" onclick="previewFile('${prev.link}')"><i class="fa-solid fa-arrow-left"></i><div class="nav-info"><span>${getUIString('ui_prev_nav', currentLang)}</span><span class="nav-title">${prev.name}</span></div></button>` : `<div class="nav-spacer"></div>`;
        navHtml += next ? `<button class="nav-btn next" onclick="previewFile('${next.link}')"><div class="nav-info"><span>${getUIString('ui_next_nav', currentLang)}</span><span class="nav-title">${next.name}</span></div><i class="fa-solid fa-arrow-right"></i></button>` : `<div class="nav-spacer"></div>`;
        navHtml += `</div><button class="nav-btn bottom-explorer-btn mobile-only" onclick="backToSubjects()"><i class="fa-solid fa-chevron-left"></i><div class="nav-info"><span>${getUIString('ui_back', currentLang)}</span><span class="nav-title">Explorer</span></div></button></div>`;

        container.innerHTML = `
            <div class="wiki-container">
                <header class="wiki-header">
                    <h1>${parseInlineMath(displayTitle)}</h1>
                    <p class="wiki-meta"><i class="fa-solid fa-clock-rotate-left"></i> Updated: ${data.lastUpdated}</p>
                </header>
                <div class="wiki-body">${data.sections.map((s, i) => renderSection(s, i, currentLang)).join('')}</div>
                <footer class="wiki-footer-area">${navHtml}</footer>
            </div>`;

        data.sections.forEach((s, i) => { 
            if (s.type === 'formula' && s.latex) renderBlockMath(s.latex, `math-${i}`); 
        });
        
        container.querySelectorAll('.quiz-window').forEach(el => {
            window.renderQuizQuestion(el.id);
        });
        
    } catch (err) { 
        console.error("Render error:", err);
        container.innerHTML = `<div class="error-msg">⚠️ ${err.message}</div>`; 
    }
}

// --- SECTION RENDERER ---
function renderSection(s, index, lang) {
    const getField = (base) => s[`${base}_${lang}`] || s[base] || '';
    const heading = getField('heading');
    const content = parseInlineMath(getField('content'));
    
    let html = `<section class="wiki-section">`;
    if (heading) html += `<h2>${heading}</h2>`;

    switch (s.type) {
        case 'intro':
        case 'text':
            html += `<p>${content}</p>`; 
            break;
            
        case 'formula':
            if (content) html += `<p>${content}</p>`;
            html += `<div class="math-card" id="math-${index}"></div>`; 
            break;
            
        case 'example':
            html += `<div class="example-box"><strong>${getUIString('ui_example', lang)}:</strong> ${content}</div>`; 
            break;

        case 'scratch':
            const scratchMatch = s.url.match(/projects\/(\d+)/);
            const scratchId = scratchMatch ? scratchMatch[1] : s.url;
            const scratchTitle = getField('widgetTitle') || getField('title') || "Interactive Demo";
            const scratchDesc = getField('description') ? parseInlineMath(getField('description')) : "Click the Green Flag to start.";
            const scratchEmbedUrl = s.turboMode 
                ? `https://turbowarp.org/${scratchId}/embed?turbo` 
                : `https://scratch.mit.edu/projects/${scratchId}/embed`;

            html += `
                <div class="scratch-container" onclick="this.classList.toggle('expanded')">
                    <div class="scratch-frame-wrapper">
                        <iframe src="${scratchEmbedUrl}" allowtransparency="true" frameborder="0" scrolling="no" allowfullscreen></iframe>
                    </div>
                    <div class="scratch-sidebar">
                        <h3>${scratchTitle}</h3>
                        <div class="scratch-description">${scratchDesc}</div>
                        <a href="https://scratch.mit.edu/projects/${scratchId}/" 
                        target="_blank" 
                        class="btn-scratch" 
                        style="margin-top: 15px;" 
                        onclick="event.stopPropagation()">
                            <i class="fa-solid fa-code-branch"></i> View & Remix
                        </a>
                    </div>
                </div>`;
            break;
            
        case 'quiz':
            const qId = `quiz-sec-${index}`; 
            const quizTitle = getField('title') || getUIString('ui_quiz_title', lang);
            const quizDesc = getField('description') || '';
            
            window.quizzes[qId] = { 
                questions: s.questions.map(q => ({
                    question: q[`question_${lang}`] || q.question,
                    options: q[`options_${lang}`] || q.options,
                    correct: q.correct
                })),
                currentQ: 0, 
                score: 0, 
                total: s.questions.length,
                started: false,
                title: quizTitle,
                description: quizDesc
            };
            html += `
                <div id="${qId}" class="quiz-window">
                    <div class="quiz-header hidden">
                        <div class="quiz-progress-text"></div>
                        <div class="quiz-progress-track"><div class="quiz-progress-fill"></div></div>
                    </div>
                    <div class="quiz-body" id="${qId}-body"></div>
                    <div class="quiz-footer">
                        <button class="btn-next hidden" onclick="nextQuestion('${qId}')"></button>
                    </div>
                </div>`;
            break;
    }
    return html + `</section>`;
}

// --- QUIZ LOGIC ---
window.renderQuizQuestion = function(quizId) {
    const data = window.quizzes[quizId];
    if (!data) return;
    
    const lang = getLangFromURL();
    const body = document.getElementById(`${quizId}-body`);
    const container = document.getElementById(quizId);
    const header = container.querySelector('.quiz-header');
    const footer = container.querySelector('.quiz-footer');
    
    if (!data.started) {
        header.classList.add('hidden');
        footer.classList.add('hidden');
        
        body.innerHTML = `
            <div class="quiz-start-screen">
                <div class="quiz-start-icon">
                    <i class="fa-solid fa-brain"></i>
                </div>
                <h2 class="quiz-start-title">${parseInlineMath(data.title)}</h2>
                ${data.description ? `<p class="quiz-start-desc">${parseInlineMath(data.description)}</p>` : ''}
                <div class="quiz-start-stats">
                    <div class="quiz-stat-item">
                        <i class="fa-solid fa-list-check"></i>
                        <span>${data.total} ${getUIString('ui_questions', lang)}</span>
                    </div>
                </div>
                <button class="btn-start-quiz" onclick="startQuiz('${quizId}')">
                    ${getUIString('ui_start_quiz', lang)} <i class="fa-solid fa-play"></i>
                </button>
            </div>
        `;
        return;
    }
    
    header.classList.remove('hidden');
    footer.classList.remove('hidden');
    
    const q = data.questions[data.currentQ];
    const nextBtn = container.querySelector('.btn-next');
    const progressText = container.querySelector('.quiz-progress-text');
    const progressFill = container.querySelector('.quiz-progress-fill');

    const qLabel = getUIString('ui_question', lang);
    if (progressText) progressText.innerText = `${qLabel} ${data.currentQ + 1} / ${data.total}`;
    
    const progressPercent = (data.currentQ / data.total) * 100;
    if (progressFill) progressFill.style.width = `${progressPercent}%`;

    if (nextBtn) {
        nextBtn.classList.remove('hidden');
        nextBtn.innerHTML = `${getUIString('ui_skip', lang)} <i class="fa-solid fa-forward"></i>`;
        nextBtn.dataset.answered = "false";
    }

    if (body) {
        body.innerHTML = `
            <h3 class="quiz-question-text">${parseInlineMath(q.question)}</h3>
            <div class="quiz-options-grid">
                ${q.options.map((opt, i) => `
                    <button class="quiz-option-btn" onclick="handleAnswer('${quizId}', this, ${i === q.correct})">
                        ${parseInlineMath(opt)}
                    </button>
                `).join('')}
            </div>`;
    }
};

window.startQuiz = function(quizId) {
    const data = window.quizzes[quizId];
    if (!data) return;
    
    data.started = true;
    renderQuizQuestion(quizId);
};

window.handleAnswer = function(quizId, btn, isCorrect) {
    const data = window.quizzes[quizId];
    const lang = getLangFromURL(); 
    
    const container = document.getElementById(quizId);
    const allBtns = container.querySelectorAll('.quiz-option-btn');
    const nextBtn = container.querySelector('.btn-next');
    const progressFill = container.querySelector('.quiz-progress-fill');
    
    const correctIdx = data.questions[data.currentQ].correct;

    allBtns.forEach(b => {
        b.disabled = true;
        b.classList.add('muted');
    });

    if (isCorrect) {
        data.score++;
        btn.classList.add('correct');
        btn.classList.remove('muted');
        playSound('correct');
    } else {
        btn.classList.add('wrong');
        btn.classList.remove('muted');
        allBtns[correctIdx].classList.add('correct'); 
        allBtns[correctIdx].classList.remove('muted');
        playSound('wrong');
    }

    const completionPercent = ((data.currentQ + 1) / data.total) * 100;
    if (progressFill) progressFill.style.width = `${completionPercent}%`;

    if (nextBtn) {
        nextBtn.dataset.answered = "true";
        if (data.currentQ === data.total - 1) {
            nextBtn.innerHTML = `${getUIString('ui_results', lang)} <i class="fa-solid fa-trophy"></i>`;
        } else {
            nextBtn.innerHTML = `${getUIString('ui_next', lang)} <i class="fa-solid fa-arrow-right"></i>`;
        }
    }
};

window.nextQuestion = function(quizId) {
    const data = window.quizzes[quizId];
    data.currentQ++;
    if (data.currentQ < data.total) {
        renderQuizQuestion(quizId);
    } else {
        showQuizResults(quizId);
    }
};

window.resetQuiz = function(quizId) {
    const data = window.quizzes[quizId];
    if (!data) return;

    data.currentQ = 0;
    data.score = 0;
    data.started = false;

    const container = document.getElementById(quizId);
    container.innerHTML = `
        <div class="quiz-header hidden">
            <div class="quiz-progress-text"></div>
            <div class="quiz-progress-track">
                <div class="quiz-progress-fill" style="width: 0%"></div>
            </div>
        </div>
        <div class="quiz-body" id="${quizId}-body"></div>
        <div class="quiz-footer">
            <button class="btn-next hidden" onclick="nextQuestion('${quizId}')"></button>
        </div>
    `;

    renderQuizQuestion(quizId);
};

window.showQuizResults = function(quizId) {
    const lang = getLangFromURL();
    const data = window.quizzes[quizId];
    const container = document.getElementById(quizId);
    const percentage = Math.round((data.score / data.total) * 100);
    
    let color = '#e74c3c';
    let msg = getUIString('ui_keep_practicing', lang) || "Keep practicing!";
    
    if (percentage >= 50) { 
        playSound('win'); 
        color = '#f1c40f';
        msg = getUIString('ui_good_job', lang) || "Good job!"; 
    } else {
        playSound('lose');
    }
    
    if (percentage >= 80) { 
        color = '#2ecc71';
        msg = getUIString('ui_outstanding', lang) || "Outstanding!"; 
    }

    const tryAgainLabel = getUIString('ui_try_again', lang) || "Try Again";
    const youGotLabel = getUIString('ui_you_got', lang) || "You got";
    const outOfLabel = getUIString('ui_out_of', lang) || "out of";
    const correctLabel = getUIString('ui_correct', lang) || "correct";

    container.innerHTML = `
        <div class="quiz-results-screen">
            <div class="circular-loader-container">
                <svg class="circular-loader" viewBox="0 0 36 36">
                    <path class="loader-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path class="loader-circle" 
                          stroke="${color}" 
                          stroke-dasharray="0, 100" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div class="loader-text">0%</div>
            </div>
            <h2>${msg}</h2>
            <p>${youGotLabel} ${data.score} ${outOfLabel} ${data.total} ${correctLabel}.</p>
            <button class="btn-restart" onclick="resetQuiz('${quizId}')">${tryAgainLabel}</button>
        </div>
    `;

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const circle = container.querySelector('.loader-circle');
            const textObj = container.querySelector('.loader-text');

            if (circle) {
                circle.style.strokeDasharray = `${percentage}, 100`;
            }

            if (textObj) {
                const duration = 1500; 
                const startTime = performance.now();

                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const currentVal = Math.floor(easeOut * percentage);
                    
                    textObj.innerText = currentVal + "%";

                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    }
                }
                requestAnimationFrame(updateCounter);
            }
        });
    });
};

// --- MATH UTILITIES ---
function parseInlineMath(text) {
    if (!text) return '';
    return text.replace(/\$([^$]+)\$/g, (match, tex) => {
        try { 
            return katex.renderToString(tex, { throwOnError: false, displayMode: false }); 
        } catch { 
            return match; 
        }
    });
}

function renderBlockMath(tex, elementId) {
    const el = document.getElementById(elementId);
    if (el && window.katex) {
        try { 
            katex.render(tex, el, { displayMode: true, throwOnError: false }); 
        } catch (e) {
            console.error("Math render error:", e);
        }
    }
}

function waitForKaTeX() {
    return new Promise(resolve => {
        if (window.katex) return resolve();
        const check = setInterval(() => { 
            if (window.katex) { 
                clearInterval(check); 
                resolve(); 
            } 
        }, 100);
    });
}

// --- TREE RENDERER ---
function renderTree(structure) {
    let html = '';
    
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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("=== PAGE LOADED ===");
    console.log("Subject:", getSubjectFromURL());
    console.log("Language:", getLangFromURL());
    console.log("File param:", getFileFromURL());
    console.log("Mobile:", isMobile());
    console.log("Starting loadFiles()...");
    loadFiles();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.file) {
        previewFile(event.state.file);
    } else {
        const views = {
            pdf: document.getElementById('pdf-viewer'),
            wiki: document.getElementById('article-viewer'),
            empty: document.getElementById('empty-state')
        };
        Object.values(views).forEach(el => {
            if (el) el.classList.add('hidden');
        });
        
        // On mobile, just close preview mode
        if (isMobile()) {
            window.closePreview();
        } else {
            if (views.empty) views.empty.style.display = 'flex';
        }
        
        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    }
});