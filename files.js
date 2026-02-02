// Helper: Get Subject from URL
function getSubjectFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('subject');
}

// 1. Click Handler (Updates the Preview Pane)
window.previewFile = function(url, element) {
    const viewer = document.getElementById('pdf-viewer');
    const emptyState = document.getElementById('empty-state');
    
    // Switch view
    emptyState.style.display = 'none';
    viewer.classList.remove('hidden');
    viewer.src = url;

    // Update Active Styling in Sidebar
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');
}

// 2. Fetch & Render Logic
function loadFiles() {
    const currentSubject = getSubjectFromURL();
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');

    if (!currentSubject) {
        titleElement.innerText = "Select a Subject";
        return;
    }

    titleElement.innerText = currentSubject;

    // Use your GitHub Database URL
    const FILES_URL = 'https://raw.githubusercontent.com/shining3366dev-prog/Syllabusplus-Database/main/subject-files.csv';

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

                // Only process files for the Current Subject
                if (fullPath && fileLink) {
                    const parts = fullPath.split(/[/\\]/);
                    const rowSubject = parts[0];

                    if (rowSubject.toLowerCase() === currentSubject.toLowerCase()) {
                        totalFiles++;
                        const folders = parts.slice(1); // Get folders + filename
                        
                        // Build nested object
                        let currentLevel = fileStructure;
                        folders.forEach(folder => {
                            if (!currentLevel[folder]) currentLevel[folder] = {};
                            currentLevel = currentLevel[folder];
                        });

                        // Store file info
                        if (!currentLevel['__FILES__']) currentLevel['__FILES__'] = [];
                        currentLevel['__FILES__'].push({ name: displayName, link: fileLink });
                    }
                }
            });

            if (totalFiles === 0) {
                treeContainer.innerHTML = `<p style="padding:20px; font-style:italic;">No files found.</p>`;
                return;
            }

            treeContainer.innerHTML = renderStructure(fileStructure);
        })
        .catch(err => {
            console.error(err);
            treeContainer.innerHTML = "<p style='color:red; padding:20px;'>Error loading files.</p>";
        });
}
function renderStructure(structure) {
    let html = '';
    
    // Render FOLDERS
    for (const key in structure) {
        if (key !== '__FILES__') {
            // Note: We use <i class="folder-icon"></i> without a specific class like fa-folder
            // The CSS handles switching the icon content based on [open] state
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