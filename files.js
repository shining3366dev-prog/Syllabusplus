/**
 * SYLLABUS+ FILE EXPLORER ENGINE
 * Handles: File Tree, PDF Preview, Wiki Rendering, Math/Scratch Widgets, Sound Effects, and Navigation.
 */

// --- CONFIGURATION ---
// UI_STRINGS now comes from window.I18N_DATA loaded via localisation.csv
function getUIString(key, lang) {
    return window.I18N_DATA?.[key]?.[lang] || key;
}

const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = IS_LOCAL ? '../Syllabusplus-Database' : 'https://shining3366dev-prog.github.io/Syllabusplus-Database';
// --- AUTO-ADD LANGUAGE TO ALL LINKS ---
function updateLinksWithLanguage() {
    const lang = getLangFromURL();
    
    // Update all internal links
    document.querySelectorAll('a[href^="index.html"], a[href^="files.html"]').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('lang=')) {
            const separator = href.includes('?') ? '&' : '?';
            link.setAttribute('href', `${href}${separator}lang=${lang}`);
        }
    });
}

// Call this in loadLayout() after injecting HTML
function loadLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    
    // ... existing code ...
    
    // Update all links with current language
    updateLinksWithLanguage();
    
    initLocalisation();
}
// Make BASE_URL globally accessible
window.BASE_URL = BASE_URL;
window.quizzes = window.quizzes || {};

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

function playSound(type) {
    try {
        const audio = new Audio(QUIZ_SOUNDS[type]);
        audio.volume = 0.5; 
        audio.play().catch(e => console.log("Audio autoplay blocked:", e));
    } catch (e) { 
        console.warn("Sound error:", e); 
    }
}
// --- TRANSLATE SUBJECT TITLE ---
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
            
            // Update heading
            const heading = section.querySelector('h2');
            const headingText = getField('heading');
            if (heading && headingText) {
                heading.textContent = headingText;
            }
            
            // Update content based on type
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
        
        // 4. Update current language attribute
        container.setAttribute('data-current-lang', langCode);
        
        // 5. Restore scroll position
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
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');
    
    if (!currentSubject) {
        if (titleElement) titleElement.innerText = "Select a Subject";
        return;
    }
    
    if (titleElement) {
    const translatedSubject = translateSubjectTitle(currentSubject);
    titleElement.innerText = translatedSubject;
    }

    const availableYears = await setupYearDropdown(currentSubject);

    let savedYear = localStorage.getItem('selectedYear') || "ALL";
    const dropdown = document.getElementById('file-year-select');

    if (availableYears.length > 0 && !availableYears.includes(savedYear) && savedYear !== "ALL") {
        savedYear = availableYears.length > 1 ? "ALL" : availableYears[0];
        localStorage.setItem('selectedYear', savedYear);
    }
    if (dropdown) dropdown.value = savedYear;

    if (!isSilent && treeContainer) {
        treeContainer.innerHTML = '<p style="padding:20px; opacity:0.5;">Loading...</p>';
    }

    const FILES_URL = `${BASE_URL}/subject-files.csv?t=${Date.now()}`;
    
    try {
        const res = await fetch(FILES_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);
        
        let totalFiles = 0;
        const fileStructure = {};
        window.currentFilesList = [];

        // NEW: Collect all JSON files to fetch titles
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

        // NEW: Fetch all JSON titles in parallel
        const titlePromises = filesToFetch.map(async (file) => {
            if (!file.link.endsWith('.json')) {
                return { ...file, title: file.link };
            }

            try {
                const jsonRes = await fetch(`${BASE_URL}/articles_data/${file.link}`);
                if (!jsonRes.ok) throw new Error();
                const jsonData = await jsonRes.json();
                
                // Get title based on current language
                const title = jsonData[`title_${currentLang}`] || jsonData.title || file.link;
                return { ...file, title };
            } catch (err) {
                console.warn(`Failed to load title for ${file.link}`);
                return { ...file, title: file.link.replace('.json', '') };
            }
        });

        const filesWithTitles = await Promise.all(titlePromises);

        // Build the tree structure with proper titles
        filesWithTitles.forEach(file => {
            let current = fileStructure;
            file.folders.forEach(folder => {
                // Translate folder name
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

        if (totalFiles === 0) {
            const lang = getLangFromURL();
            const noContentMsg = window.I18N_DATA?.['no_content']?.[lang] || 'No content found for';
            treeContainer.innerHTML = `<p style="padding:20px; font-style:italic; color:#666;">${noContentMsg} ${savedYear}.</p>`;
        } else {
            treeContainer.innerHTML = renderTree(fileStructure);
        }

        // Restore active file highlight after language switch
        if (isSilent) {
            const activeLink = document.getElementById('article-viewer')?.getAttribute('data-current-file');
            if (activeLink) {
                const activeItem = document.querySelector(`.file-item[data-link="${activeLink}"]`);
                if (activeItem) activeItem.classList.add('active');
            }
        }

    } catch (err) {
        console.error('File Load Error:', err);
        if (treeContainer) {
            const lang = getLangFromURL();
            const errorMsg = window.I18N_DATA?.['error_loading']?.[lang] || 'Error loading files.';
            treeContainer.innerHTML = `<p style="padding:20px; color:red;">${errorMsg}</p>`;
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

window.updateFileYear = (year) => {
    localStorage.setItem('selectedYear', year);
    loadFiles();
};

// --- PREVIEW LOGIC ---
window.previewFile = (url, element) => {
    const views = {
        pdf: document.getElementById('pdf-viewer'),
        wiki: document.getElementById('article-viewer'),
        empty: document.getElementById('empty-state')
    };

    const isSameFile = views.wiki.getAttribute('data-current-file') === url;

    if (!isSameFile) {
        window.scrollTo(0, 0); 
        views.wiki.scrollTop = 0; 
    }

    Object.values(views).forEach(el => el.classList.add('hidden'));
    views.empty.style.display = 'none';

    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    if (!element) element = document.querySelector(`.file-item[data-link="${url}"]`);
    if (element) element.classList.add('active');

    if (window.innerWidth <= 768) {
        document.querySelector('.explorer-wrapper').classList.add('preview-mode');
    }

    if (url.endsWith('.json')) {
        views.wiki.classList.remove('hidden');
        renderWiki(`${BASE_URL}/articles_data/${url}`, url);
    } else {
        views.pdf.classList.remove('hidden');
        views.pdf.src = `${url}#toolbar=0`;
    }
};

window.closePreview = () => {
    window.scrollTo(0, 0); 
    document.querySelector('.explorer-wrapper').classList.remove('preview-mode');
};

// --- NAVIGATION: BACK TO SUBJECTS ---
window.backToSubjects = () => {
    const currentLang = getLangFromURL();
    window.location.href = `index.html?lang=${currentLang}#subjects`;
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
        container.innerHTML = '<div class="loading-spinner">Loading...</div>';
        
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
            window.quizzes[qId] = { 
                questions: s.questions.map(q => ({
                    question: q[`question_${lang}`] || q.question,
                    options: q[`options_${lang}`] || q.options,
                    correct: q.correct
                })),
                currentQ: 0, score: 0, total: s.questions.length 
            };
            html += `
                <div id="${qId}" class="quiz-window">
                    <div class="quiz-header">
                        <div class="quiz-progress-text"></div>
                        <div class="quiz-progress-track"><div class="quiz-progress-fill"></div></div>
                    </div>
                    <div class="quiz-body" id="${qId}-body"></div>
                    <div class="quiz-footer">
                        <button class="btn-next" onclick="nextQuestion('${qId}')"></button>
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
    
    const q = data.questions[data.currentQ];
    const body = document.getElementById(`${quizId}-body`);
    const nextBtn = document.querySelector(`#${quizId} .btn-next`);
    const progressText = document.querySelector(`#${quizId} .quiz-progress-text`);
    const progressFill = document.querySelector(`#${quizId} .quiz-progress-fill`);

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

    const container = document.getElementById(quizId);
    container.innerHTML = `
        <div class="quiz-header">
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
        
        // The key is already translated when the tree was built
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
document.addEventListener('DOMContentLoaded', loadFiles);