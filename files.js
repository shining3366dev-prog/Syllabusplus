// Function to get query params
function getSubjectFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('subject');
}

// 1. Preview Logic
window.previewFile = function(url, element) {
    const viewer = document.getElementById('pdf-viewer');
    const emptyState = document.getElementById('empty-state');
    
    // Hide empty state, show viewer
    emptyState.style.display = 'none';
    viewer.classList.remove('hidden');
    
    // Load the URL
    viewer.src = url;

    // Remove 'active' class from all other files
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    
    // Add 'active' class to clicked element
    if (element) {
        element.classList.add('active');
    }
}

// 2. Load Logic
function loadFiles() {
    const currentSubject = getSubjectFromURL();
    const titleElement = document.getElementById('subject-title');
    const treeContainer = document.getElementById('file-tree');

    if (!currentSubject) {
        titleElement.innerText = "No Subject Selected";
        return;
    }

    titleElement.innerText = currentSubject;

    // FETCH FROM DATABASE REPO
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

                if (fullPath && fileLink) {
                    const parts = fullPath.split(/[/\\]/); // Handle / or \
                    const rowSubject = parts[0];

                    if (rowSubject.toLowerCase() === currentSubject.toLowerCase()) {
                        totalFiles++;
                        // Build hierarchy: Subject -> Folder -> Subfolder
                        const folders = parts.slice(1); // Remove subject name from path
                        
                        let currentLevel = fileStructure;
                        folders.forEach(folder => {
                            if (!currentLevel[folder]) { currentLevel[folder] = {}; }
                            currentLevel = currentLevel[folder];
                        });

                        if (!currentLevel['__FILES__']) { currentLevel['__FILES__'] = []; }
                        currentLevel['__FILES__'].push({ name: displayName, link: fileLink });
                    }
                }
            });

            if (totalFiles === 0) {
                treeContainer.innerHTML = `<p style="padding:20px;">No files found for ${currentSubject}.</p>`;
                return;
            }

            // Render the sidebar
            treeContainer.innerHTML = renderStructure(fileStructure);
        })
        .catch(err => {
            console.error(err);
            treeContainer.innerHTML = "<p style='color:red; padding:20px;'>Error loading files.</p>";
        });
}

// 3. Recursive Render Logic (Updated for Sidebar)
function renderStructure(structure) {
    let html = '';
    
    // Render FOLDERS
    for (const key in structure) {
        if (key !== '__FILES__') {
            html += `
                <details class="folder-details" open>
                    <summary class="folder-summary">
                        <i class="fa-regular fa-folder folder-icon"></i> ${key}
                    </summary>
                    <div class="folder-content">
                        ${renderStructure(structure[key])}
                    </div>
                </details>
            `;
        }
    }

    // Render FILES (Clickable Divs now, not Links)
    if (structure['__FILES__']) {
        structure['__FILES__'].forEach(file => {
            // Note: We escape the URL string to prevent errors
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

// Run on load
document.addEventListener('DOMContentLoaded', loadFiles);