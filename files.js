// Helper: Get Subject from URL
function getSubjectFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('subject');
}

// 1. Preview Logic
window.previewFile = function(url, element) {
    const viewer = document.getElementById('pdf-viewer');
    const emptyState = document.getElementById('empty-state');
    
    emptyState.style.display = 'none';
    viewer.classList.remove('hidden');
    viewer.src = url;

    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
}

// 2. NEW: Handle Dropdown Change
window.updateFileYear = function(selectedYear) {
    // Save to memory (Syncs with Home Page)
    localStorage.setItem('selectedYear', selectedYear);
    
    // Reload files with new filter
    loadFiles();
}

// 3. Main Load Function
function loadFiles() {
    const currentSubject = getSubjectFromURL();
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');
    
    // NEW: Get the saved year or default to ALL
    const savedYear = localStorage.getItem('selectedYear') || "ALL";
    
    // NEW: Update the Dropdown UI to match saved year
    const dropdown = document.getElementById('file-year-select');
    if(dropdown) dropdown.value = savedYear;

    if (!currentSubject) {
        titleElement.innerText = "Select a Subject";
        return;
    }

    titleElement.innerText = currentSubject;

    let FILES_URL = 'https://shining3366dev-prog.github.io/Syllabusplus-Database/subject-files.csv';
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // local server: fetch from local folder
        FILES_URL = './files/subject-files.csv'; // make sure this exists in your project
    } 
    fetch(FILES_URL)
        .then(res => res.text())
        .then(csvText => {
            const rows = csvText.split('\n').slice(1);
            let totalFiles = 0;
            const fileStructure = {};

            rows.forEach(row => {
                if (!row.trim()) return;
                const cols = row.split(';');
                
                const fullPath = cols[0]?.trim(); 
                const displayName = cols[1]?.trim();
                const fileLink = cols[2]?.trim();

                if (fullPath && fileLink) {
                    const parts = fullPath.split(/[/\\]/);
                    const rowSubject = parts[0];

                    // Check Subject Match
                    if (rowSubject.toLowerCase() === currentSubject.toLowerCase()) {
                        
                        // --- NEW: YEAR FILTERING LOGIC ---
                        // If selectedYear is "ALL", show everything.
                        // If selectedYear is "S1", only show files where path contains "S1"
                        if (savedYear !== "ALL") {
                            // We check if the path (e.g. "Math/S1/Worksheet") includes the year "S1"
                            // Using toUpperCase to be safe
                            if (!fullPath.toUpperCase().includes(savedYear)) {
                                return; // Skip this file
                            }
                        }
                        // ---------------------------------

                        totalFiles++;
                        const folders = parts.slice(1); 
                        
                        let currentLevel = fileStructure;
                        folders.forEach(folder => {
                            if (!currentLevel[folder]) currentLevel[folder] = {};
                            currentLevel = currentLevel[folder];
                        });

                        if (!currentLevel['__FILES__']) currentLevel['__FILES__'] = [];
                        currentLevel['__FILES__'].push({ name: displayName, link: fileLink });
                    }
                }
            });

            if (totalFiles === 0) {
                treeContainer.innerHTML = `<p style="padding:20px; font-style:italic; color:#666;">No files found for ${savedYear === 'ALL' ? 'this subject' : savedYear}.</p>`;
                return;
            }

            treeContainer.innerHTML = renderStructure(fileStructure);
        })
        .catch(err => {
            console.error(err);
            treeContainer.innerHTML = "<p style='color:red; padding:20px;'>Error loading files.</p>";
        });
}

// 4. Render Tree HTML
function renderStructure(structure) {
    let html = '';
    
    // Render FOLDERS
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

    // Render FILES
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