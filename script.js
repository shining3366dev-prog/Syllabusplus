// Function to load and parse the CSV data
// Function to load and parse the CSV data
function loadSubjects() {
    // NEW: Points to your Database Repository
    const WIDGETS_URL = 'https://raw.githubusercontent.com/shining3366dev-prog/Syllabusplus-Database/main/course-card-widgets.csv';

    fetch(WIDGETS_URL)
        .then(response => {
            if (!response.ok) throw new Error("File not found on GitHub");
            return response.text();
        })
        .then(csvText => {
            if (csvText.trim().startsWith("<!DOCTYPE")) {
                throw new Error("File is HTML, not CSV. Check repository permissions.");
            }

            const rows = csvText.split('\n');
            const grid = document.getElementById('subject-grid');
            grid.innerHTML = ''; 

            rows.slice(1).forEach(row => {
                if (row.trim() === '') return;
                const cols = row.split(';');

                const title = cols[0]?.trim();
                const rawDescription = cols[1]?.trim();
                const isAvailable = cols[2]?.trim().toUpperCase() === 'TRUE';
                const bgColor = cols[3]?.trim();
                const imageFile = cols[4]?.trim(); 

                if (title) {
                    const displayDescription = isAvailable ? (rawDescription || 'Resources Available') : 'Not Available';
                    const disabledClass = isAvailable ? '' : 'disabled';
                    const buttonText = isAvailable ? 'View Files' : 'Unavailable';
                    
                    let backgroundStyle = '';
                    if (imageFile && imageFile.length > 0) {
                        // NOTE: This assumes images remain in your UI repository's images/ folder
                        backgroundStyle = `background-image: url('images/${imageFile}');`;
                    } else if (isAvailable) {
                        backgroundStyle = `background-color: ${bgColor || '#3498db'};`;
                    } else {
                        backgroundStyle = `background-color: #95a5a6;`;
                    }

                    const linkHTML = isAvailable 
                        ? `<a href="./files.html?subject=${title}" style="text-decoration:none;">
                            <button style="cursor:pointer;">${buttonText}</button>
                        </a>`
                        : `<button disabled>${buttonText}</button>`;

                    const card = document.createElement('div');
                    card.className = `course-card ${disabledClass}`;
                    card.innerHTML = `
                        <div class="card-image" style="${backgroundStyle}"></div>
                        <div class="card-text">
                            <h3>${title}</h3>
                            <p>${displayDescription}</p>
                            ${linkHTML}
                        </div>
                    `;
                    grid.appendChild(card);
                }
            });
        })
        .catch(err => {
            console.error('Error loading subjects:', err);
            const grid = document.getElementById('subject-grid');
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;"><h3>⚠️ Database Connection Failed</h3></div>`;
        });
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

    // NEW: Points to your Database Repository
    const FILES_URL = 'https://raw.githubusercontent.com/shining3366dev-prog/Syllabusplus-Database/main/subject-files.csv';

    fetch(FILES_URL)
        .then(response => {
            if (!response.ok) throw new Error("CSV not found on GitHub");
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

            container.innerHTML = renderStructure(fileStructure);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = "<p style='color:red'>Error loading file database.</p>";
        });
}

loadSubjects();