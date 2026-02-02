function getSubjectFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('subject');
}

function loadFiles() {
    const currentSubject = getSubjectFromURL();
    const titleElement = document.getElementById('subject-title');
    const container = document.getElementById('file-list');

    if (!currentSubject) {
        titleElement.innerText = "Error";
        container.innerHTML = "<p style='color:red'>No subject selected.</p>";
        return;
    }

    titleElement.innerText = currentSubject + " Resources";

    fetch('https://shining3366dev-prog.github.io/Syllabusplus-Database/images/subject-files.csv')
        .then(response => {
            if (!response.ok) throw new Error("CSV not found");
            return response.text();
        })
        .then(csvText => {
            const rows = csvText.split('\n');
            container.innerHTML = ''; 

            let totalFiles = 0;
            const fileStructure = {};

            rows.slice(1).forEach(row => {
                if (row.trim() === '') return;
                const cols = row.split(';');
                
                // FORMAT: Path;Name;Link
                const fullPath = cols[0]?.trim(); 
                const displayName = cols[1]?.trim();
                const fileLink = cols[2]?.trim();

                if (fullPath && fileLink) {
                    const parts = fullPath.split(/[/\\]/);
                    const rowSubject = parts[0];

                    if (rowSubject.toLowerCase() === currentSubject.toLowerCase()) {
                        totalFiles++;
                        const folders = parts.slice(1);
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
                container.innerHTML = `<p style='color:#777;'>No files found for ${currentSubject}.</p>`;
                return;
            }

            // --- RECURSIVE RENDER WITH COLLAPSIBLE FOLDERS ---
            function renderStructure(structure) {
                let html = '<div class="file-group">';
                
                // 1. Render FOLDERS first (looks better for organization)
                for (const key in structure) {
                    if (key !== '__FILES__') {
                        html += `
                            <details class="folder-details">
                                <summary class="folder-summary">
                                    <span class="folder-icon">📁</span> ${key}
                                </summary>
                                <div class="folder-content">
                                    ${renderStructure(structure[key])}
                                </div>
                            </details>
                        `;
                    }
                }

                // 2. Render FILES
                if (structure['__FILES__']) {
                    structure['__FILES__'].forEach(file => {
                        html += `
                            <div class="file-item">
                                <span class="file-icon">📄</span>
                                <a href="${file.link}" class="file-link" target="_blank">${file.name}</a>
                            </div>
                        `;
                    });
                }

                html += '</div>';
                return html;
            }

            container.innerHTML = renderStructure(fileStructure);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = "<p style='color:red'>Error loading file database.</p>";
        });
}

loadFiles();