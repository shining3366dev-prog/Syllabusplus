/**
 * SYLLABUS+ FILE EXPLORER ENGINE
 * Handles: File Tree, PDF Preview, Wiki Rendering, Math/Scratch Widgets, and Sound Effects.
 */

// --- CONFIGURATION ---
const IS_LOCAL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = IS_LOCAL ? '../Syllabusplus-Database' : 'https://shining3366dev-prog.github.io/Syllabusplus-Database';

// --- SOUND EFFECTS CONFIGURATION ---
// I picked these specifically for your "Yippee / Oh Hell Nah" request.
const QUIZ_SOUNDS = {
    correct: "https://www.myinstants.com/media/sounds/correct.mp3",  
    wrong:   "https://www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3", 
    win:     "https://www.myinstants.com/media/sounds/tadaaa.mp3",          
    lose:    "https://www.myinstants.com/media/sounds/sound-fail-fallo.mp3"         
};

// Helper to play sound safely
function playSound(type) {
    try {
        const audio = new Audio(QUIZ_SOUNDS[type]);
        audio.volume = 0.5; // Keep it at 50% so it's not ear-blasting
        audio.play().catch(e => console.log("Audio autoplay blocked:", e));
    } catch (e) {
        console.warn("Sound error:", e);
    }
}

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

    const availableYears = await setupYearDropdown(currentSubject);

    let savedYear = localStorage.getItem('selectedYear') || "ALL";
    const dropdown = document.getElementById('file-year-select');

    if (availableYears.length > 0 && !availableYears.includes(savedYear) && savedYear !== "ALL") {
        savedYear = availableYears.length > 1 ? "ALL" : availableYears[0];
        localStorage.setItem('selectedYear', savedYear);
    }
    if (dropdown) dropdown.value = savedYear;

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
                if (savedYear !== "ALL" && year && year !== savedYear) return;

                totalFiles++;
                const folders = path ? path.split(/[/\\]/).filter(f => f.trim()) : []; 
                
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

    Object.values(views).forEach(el => el.classList.add('hidden'));
    views.empty.style.display = 'none';
    
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

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

        await waitForKaTeX();

        const html = `
            <div class="wiki-container">
                <header class="wiki-header">
                    <h1>${parseInlineMath(data.title)}</h1>
                    <p class="wiki-meta"><i class="fa-solid fa-clock-rotate-left"></i> Updated: ${data.lastUpdated}</p>
                </header>
                <div class="wiki-body">
                    ${data.sections.map((s, index) => renderSection(s, index)).join('')}
                </div>
            </div>`;

        container.innerHTML = html;

        data.sections.forEach((s, i) => {
            if (s.type === 'formula' && s.latex) renderBlockMath(s.latex, `math-${i}`);
        });

        // Initialize Quizzes
        const quizElements = container.querySelectorAll('.quiz-window');
        quizElements.forEach(el => {
            if (window.renderQuizQuestion) window.renderQuizQuestion(el.id);
        });

    } catch (err) {
        container.innerHTML = `<div class="error-msg">⚠️ ${err.message}</div>`;
    }
}

// 6. SECTION RENDERER
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
            const desc = s.description ? parseInlineMath(s.description) : "Click the Green Flag to start.";
            const embedUrl = s.turboMode 
                ? `https://turbowarp.org/${id}/embed?turbo` 
                : `https://scratch.mit.edu/projects/${id}/embed`;

            html += `
                <div class="scratch-container">
                    <div class="scratch-frame-wrapper">
                        <iframe src="${embedUrl}" 
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

        case 'quiz':
            const quizId = `quiz-${Date.now()}-${index}`;
            if (!window.quizzes) window.quizzes = {};
            window.quizzes[quizId] = {
                questions: s.questions,
                currentQ: 0,
                score: 0,
                total: s.questions.length
            };

            html += `
                <div id="${quizId}" class="quiz-window">
                    <div class="quiz-header">
                        <div class="quiz-progress-text">Question 1 of ${s.questions.length}</div>
                        <div class="quiz-progress-track">
                            <div class="quiz-progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="quiz-body" id="${quizId}-body"></div>
                    <div class="quiz-footer">
                        <button class="btn-next hidden" onclick="nextQuestion('${quizId}')">
                            Next Question <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>`;
            break;
    }

    html += '</section>';
    return html;
}

// --- ADVANCED QUIZ ENGINE ---
window.renderQuizQuestion = function(quizId) {
    const data = window.quizzes[quizId];
    const q = data.questions[data.currentQ];
    const body = document.getElementById(`${quizId}-body`);
    const nextBtn = document.querySelector(`#${quizId} .btn-next`);
    const progressText = document.querySelector(`#${quizId} .quiz-progress-text`);
    const progressFill = document.querySelector(`#${quizId} .quiz-progress-fill`);

    progressText.innerText = `Question ${data.currentQ + 1} of ${data.total}`;
    progressFill.style.width = `${((data.currentQ) / data.total) * 100}%`;
    nextBtn.classList.add('hidden');

    // Shuffle options logic
    let mixedOptions = q.options.map((opt, i) => ({ 
        text: opt, 
        isCorrect: i === q.correct 
    }));
    mixedOptions.sort(() => Math.random() - 0.5);

    body.innerHTML = `
        <h3 class="quiz-question-text">${parseInlineMath(q.question)}</h3>
        <div class="quiz-options-grid">
            ${mixedOptions.map(opt => `
                <button class="quiz-option-btn" onclick="handleAnswer('${quizId}', this, ${opt.isCorrect})">
                    ${parseInlineMath(opt.text)}
                </button>
            `).join('')}
        </div>
        <div class="quiz-feedback-msg"></div>
    `;
};

window.handleAnswer = function(quizId, btn, isCorrect) {
    const data = window.quizzes[quizId];
    const container = document.getElementById(quizId);
    const allBtns = container.querySelectorAll('.quiz-option-btn');
    const feedback = container.querySelector('.quiz-feedback-msg');
    const nextBtn = container.querySelector('.btn-next');

    allBtns.forEach(b => {
        b.disabled = true;
        if (b === btn) {
            b.classList.add(isCorrect ? 'correct' : 'wrong');
        } else {
            b.classList.add('muted');
        }
    });

    if (isCorrect) {
        data.score++;
        playSound('correct'); // PLAY "PING"
        feedback.innerHTML = `<span class="text-correct"><i class="fa-solid fa-circle-check"></i> Correct!</span>`;
    } else {
        playSound('wrong'); // PLAY "BUZZER"
        feedback.innerHTML = `<span class="text-wrong"><i class="fa-solid fa-circle-xmark"></i> Incorrect.</span>`;
    }

    nextBtn.classList.remove('hidden');
    if (data.currentQ === data.total - 1) {
        nextBtn.innerHTML = `See Results <i class="fa-solid fa-trophy"></i>`;
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

window.showQuizResults = function(quizId) {
    const data = window.quizzes[quizId];
    const container = document.getElementById(quizId);
    const percentage = Math.round((data.score / data.total) * 100);
    
    let color = '#e74c3c'; // Red
    let msg = "Keep practicing!";
    
    // SOUND LOGIC FOR RESULTS
    if (percentage >= 50) {
        playSound('win'); // PLAY "YIPPEE"
        color = '#f1c40f'; 
        msg = "Good job!"; 
    } else {
        playSound('lose'); // PLAY "OH HELL NAH"
    }
    
    if (percentage >= 80) { 
        color = '#2ecc71'; 
        msg = "Outstanding!"; 
    }

    container.innerHTML = `
        <div class="quiz-results-screen">
            <div class="circular-chart" style="background: conic-gradient(${color} ${percentage * 3.6}deg, #ecf0f1 0deg);">
                <div class="inner-circle">
                    <span class="score-percent">${percentage}%</span>
                </div>
            </div>
            <h2>${msg}</h2>
            <p>You got ${data.score} out of ${data.total} correct.</p>
            <button class="btn-restart" onclick="location.reload()">Try Again</button>
        </div>
    `;
};

// 7. MATH UTILITIES
function parseInlineMath(text) {
    if (!text) return '';
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

// 8. TREE RENDERER
function renderTree(structure) {
    let html = '';
    Object.keys(structure).forEach(key => {
        if (key === '__FILES__') return;
        html += `
            <details class="folder-details" open>
                <summary class="folder-summary"><i class="folder-icon"></i><span>${key}</span></summary>
                <div class="folder-content">${renderTree(structure[key])}</div>
            </details>`;
    });
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