// 1. Helper: Get Subject from URL
function getSubjectFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('subject');
}

// 2. Main Load Function
async function loadFiles() {
    const currentSubject = getSubjectFromURL();
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');
    
    if (!currentSubject) {
        titleElement.innerText = "Select a Subject";
        return;
    }
    titleElement.innerText = currentSubject;

    // STEP A: Setup the dynamic dropdown first
    await setupYearDropdown(currentSubject);

    // STEP B: Get the saved year (synced with Home)
    let savedYear = localStorage.getItem('selectedYear') || "ALL";
    const dropdown = document.getElementById('file-year-select');
    
    // Safety check: if savedYear isn't an option in the new dynamic list, default to first option
    if (dropdown && !Array.from(dropdown.options).some(opt => opt.value === savedYear)) {
        savedYear = dropdown.options[0].value;
    }
    if (dropdown) dropdown.value = savedYear;

    // STEP C: Determine CSV URL
    let FILES_URL = 'https://shining3366dev-prog.github.io/Syllabusplus-Database/subject-files.csv';
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        FILES_URL = '../Syllabusplus-Database/subject-files.csv'; 
    }
    
    console.log('Loading files from:', FILES_URL);
    console.log('Current subject:', currentSubject);
    console.log('Selected year:', savedYear); 

    fetch(FILES_URL)
        .then(res => res.text())
        .then(csvText => {
            const rows = csvText.split('\n').slice(1);
            let totalFiles = 0;
            const fileStructure = {};

            rows.forEach(row => {
                if (!row.trim()) return;
                const cols = row.split(';');
                const rowSubject  = cols[0]?.trim(); 
                const rowYear     = cols[1]?.trim(); 
                const rowPath     = cols[2]?.trim();
                const rowFileName = cols[3]?.trim(); 
                const rowLink     = cols[4]?.trim();

                // Debug logging
                console.log('Processing row:', { rowSubject, rowYear, rowPath, rowFileName, rowLink });

                if (rowSubject && rowSubject.toLowerCase() === currentSubject.toLowerCase()) {
                    // Filter by Year - Only filter if savedYear is not "ALL"
                    if (savedYear !== "ALL" && rowYear && rowYear !== savedYear) {
                        console.log(`Skipping file: year mismatch (${rowYear} !== ${savedYear})`);
                        return;
                    }

                    console.log('Adding file:', rowFileName);
                    totalFiles++;
                    const folders = rowPath ? rowPath.split(/[/\\]/).filter(f => f.trim()) : []; 
                    let currentLevel = fileStructure;
                    folders.forEach(folder => {
                        if (!folder) return;
                        if (!currentLevel[folder]) currentLevel[folder] = {};
                        currentLevel = currentLevel[folder];
                    });
                    if (!currentLevel['__FILES__']) currentLevel['__FILES__'] = [];
                    currentLevel['__FILES__'].push({ name: rowFileName, link: rowLink });
                }
            });

            console.log('Total files found:', totalFiles);
            console.log('File structure:', fileStructure);

            if (totalFiles === 0) {
                treeContainer.innerHTML = `<p style="padding:20px; font-style:italic; color:#666;">No content found for ${savedYear === 'ALL' ? 'this subject' : savedYear}.</p>`;
                return;
            }
            treeContainer.innerHTML = renderStructure(fileStructure);
        })
        .catch(err => {
            console.error('Error loading files:', err);
            treeContainer.innerHTML = `<p style="padding:20px; color:red;">Error loading files. Check console.</p>`;
        });
}

// 3. THE DYNAMIC DROPDOWN ENGINE
async function setupYearDropdown(subjectName) {
    let WIDGET_URL = 'https://shining3366dev-prog.github.io/Syllabusplus-Database/course-card-widgets.csv';
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        WIDGET_URL = '../Syllabusplus-Database/course-card-widgets.csv'; 
    }

    try {
        const res = await fetch(WIDGET_URL);
        const csvText = await res.text();
        const rows = csvText.split('\n').slice(1);
        const dropdown = document.getElementById('file-year-select');
        if (!dropdown) return;

        // Find the row for the current subject
        const subjectRow = rows.find(row => row.split(';')[0]?.trim().toLowerCase() === subjectName.toLowerCase());
        if (!subjectRow) return;

        const cols = subjectRow.split(';');
        const yearsString = cols[5]?.trim(); // Column 6 = Years
        const yearsArray = yearsString ? yearsString.split(',').map(y => y.trim()) : [];

        // Clear old options
        dropdown.innerHTML = '';

        // Add "All Years" only if more than 1 year exists
        if (yearsArray.length > 1) {
            const allOpt = document.createElement('option');
            allOpt.value = "ALL";
            allOpt.textContent = "All Years";
            dropdown.appendChild(allOpt);
        }

        // Add the years that exist for this subject
        yearsArray.forEach(year => {
            const opt = document.createElement('option');
            opt.value = year.trim();
            opt.textContent = `${year.trim()} (Year ${year.replace('S','')})`;
            dropdown.appendChild(opt);
        });

        // Set saved year if available
        const savedYear = localStorage.getItem('selectedYear');
        if (savedYear && Array.from(dropdown.options).some(o => o.value === savedYear)) {
            dropdown.value = savedYear;
        } else {
            // Default to "ALL" if available, otherwise first year
            if (yearsArray.length > 1) {
                dropdown.value = "ALL";
                localStorage.setItem('selectedYear', 'ALL');
            } else if (yearsArray.length) {
                dropdown.value = yearsArray[0];
                localStorage.setItem('selectedYear', yearsArray[0]);
            }
        }

    } catch (err) {
        console.error("Dropdown Sync Error:", err);
    }
}

// 4. UPDATE FUNCTION - Called when user changes dropdown
window.updateFileYear = function(selectedYear) {
    // Save the selection
    localStorage.setItem('selectedYear', selectedYear);
    
    // Reload files with new filter
    loadFiles();
}

// 5. Enhanced Preview Logic
window.previewFile = function(url, element) {
    const pdfViewer = document.getElementById('pdf-viewer');
    const articleViewer = document.getElementById('article-viewer');
    const emptyState = document.getElementById('empty-state');
    
    emptyState.style.display = 'none';
    pdfViewer.classList.add('hidden');
    articleViewer.classList.add('hidden');
    
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    // 2. PATH LOGIC: Decide where to look for JSON files
    let finalUrl = '';
    
    if (url.endsWith('.json')) {
        articleViewer.classList.remove('hidden');
        
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            // Local mode: Look in the sibling folder
            finalUrl = `../Syllabusplus-Database/articles_data/${url}`;
        } else {
            // GitHub mode: Full URL to the Database repo
            finalUrl = `https://shining3366dev-prog.github.io/Syllabusplus-Database/articles_data/${url}`;
        }
        
        renderArticle(finalUrl);
    } else {
        // Mode: PDF / External Link
        pdfViewer.classList.remove('hidden');
        // Add #toolbar=0 to hide PDF toolbar and prevent downloads
        const pdfUrl = url.includes('?') ? `${url}&toolbar=0` : `${url}#toolbar=0`;
        pdfViewer.src = pdfUrl;
    }
}

// 6. The Article Translation Engine
function renderArticle(jsonUrl) {
    const container = document.getElementById('article-viewer');
    container.innerHTML = '<div class="loading-spinner">Fetching Wiki Data...</div>';

    fetch(jsonUrl)
        .then(res => {
            if (!res.ok) throw new Error("Article data not found");
            return res.json();
        })
        .then(data => {
            // Wait for KaTeX to be available before rendering
            waitForKaTeX(() => {
                let html = `
                    <div class="wiki-container">
                        <header class="wiki-header">
                            <h1>${data.title}</h1>
                            <p class="wiki-meta">
                                <i class="fa-solid fa-clock-rotate-left"></i> Last updated: ${data.lastUpdated}
                            </p>
                        </header>
                        <div class="wiki-body">
                `;

                data.sections.forEach((section, index) => {
                    html += `<section class="wiki-section">`;
                    if (section.heading) html += `<h2>${section.heading}</h2>`;
                    if (section.content) html += `<p>${section.content}</p>`;
                    
                    // Render Math Formulas with KaTeX
                    if (section.type === 'formula' && section.latex) {
                        const mathId = `math-${index}`;
                        html += `<div class="math-card" id="${mathId}"></div>`;
                        
                        // Render immediately after adding to DOM
                        setTimeout(() => {
                            const mathElement = document.getElementById(mathId);
                            if (mathElement && typeof katex !== 'undefined') {
                                try {
                                    katex.render(section.latex, mathElement, {
                                        displayMode: true,
                                        throwOnError: false,
                                        output: 'html'
                                    });
                                } catch (err) {
                                    console.error('KaTeX error:', err);
                                    mathElement.innerHTML = `<code style="color: red;">Error: ${section.latex}</code>`;
                                }
                            }
                        }, 50);
                    }
                    
                    // Render Examples in a highlighted box
                    if (section.type === 'example') {
                        html += `<div class="example-box"><strong>Example:</strong> ${section.content}</div>`;
                    }
                    html += `</section>`;
                });

                container.innerHTML = html + `</div></div>`;
            });
        })
        .catch(err => {
            container.innerHTML = `
                <div class="error-msg" style="padding: 40px; text-align: center;">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 2rem; color: #e74c3c;"></i>
                    <p style="margin-top: 10px;">Failed to find article data.</p>
                    <small style="color: #888;">Path: ${jsonUrl}</small>
                </div>`;
        });
}

// 6b. Wait for KaTeX to load
function waitForKaTeX(callback) {
    if (typeof katex !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForKaTeX(callback), 100);
    }
}

// 7. Render Tree HTML (Recursive)
function renderStructure(structure) {
    let html = '';
    
    // A. Render FOLDERS
    for (const key in structure) {
        if (key !== '__FILES__') {
            html += `
                <details class="folder-details" open>
                    <summary class="folder-summary">
                        <i class="folder-icon"></i> 
                        <span>${key}</span>
                    </summary>
                    <div class="folder-content">
                        ${renderStructure(structure[key])}
                    </div>
                </details>
            `;
        }
    }

    // B. Render FILES
    if (structure['__FILES__']) {
        structure['__FILES__'].forEach(file => {
            html += `
                <div class="file-item" onclick="previewFile('${file.link}', this)">
                    <i class="fa-regular fa-file-pdf file-icon"></i>
                    <span>${file.name}</span>
                </div>
            `;
        });
    }

    return html; 
}

document.addEventListener('DOMContentLoaded', loadFiles);