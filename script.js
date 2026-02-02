let allSubjects = []; // Store data here so we don't fetch twice

// 1. Fetch and Parse Data
function loadSubjects() {
    // SWITCH THIS URL FOR LIVE VS LOCAL
    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const WIDGETS_URL = isLocal 
        ? './course-card-widgets.csv' 
        : 'https://raw.githubusercontent.com/shining3366dev-prog/Syllabusplus-Database/main/course-card-widgets.csv';

    fetch(WIDGETS_URL)
        .then(res => res.text())
        .then(csvText => {
            const rows = csvText.split('\n').slice(1); // Skip header
            
            allSubjects = rows.map(row => {
                if (row.trim() === '') return null;
                const cols = row.split(';');
                
                return {
                    title: cols[0]?.trim(),
                    desc: cols[1]?.trim(),
                    isAvailable: cols[2]?.trim().toUpperCase() === 'TRUE',
                    bgColor: cols[3]?.trim(),
                    image: cols[4]?.trim(),
                    // NEW: Split the "S1,S2..." string into an array ['S1', 'S2']
                    years: cols[5] ? cols[5].trim().split(',') : []
                };
            }).filter(item => item !== null); // Remove empty rows

            // Render "ALL" by default initially
            renderGrid("ALL");
        })
        .catch(err => console.error("Error loading CSV:", err));
}

// 2. Render the Grid based on Year Filter

function renderGrid(selectedYear) {
    const grid = document.getElementById('subject-grid');
    if (!grid) return; // Stop if we are not on the index page

    grid.innerHTML = '';

    allSubjects.forEach(subject => {
        // FILTER LOGIC: Check if "ALL" is selected OR if the subject's years include the selection
        const shouldShow = selectedYear === "ALL" || subject.years.includes(selectedYear);

        if (shouldShow && subject.title) {
            // 1. Text Logic
            const displayDesc = subject.isAvailable ? (subject.desc || 'Resources Available') : 'Not Available';
            const disabledClass = subject.isAvailable ? '' : 'disabled';
            const buttonText = subject.isAvailable ? 'View Files' : 'Unavailable';

            // 2. Background Logic
            let backgroundStyle = '';
            if (subject.image) {
                backgroundStyle = `background-image: url('images/${subject.image}');`;
            } else {
                backgroundStyle = `background-color: ${subject.bgColor || '#3498db'};`;
            }

            // 3. Button Logic
            const linkHTML = subject.isAvailable 
                ? `<a href="./files.html?subject=${subject.title}">
                     <button>${buttonText}</button>
                   </a>`
                : `<button disabled>${buttonText}</button>`;

            // 4. Build the HTML Card
            const card = document.createElement('div');
            card.className = `course-card ${disabledClass}`;
            card.innerHTML = `
                <div class="card-image" style="${backgroundStyle}"></div>
                <div class="card-text">
                    <h3>${subject.title}</h3>
                    <p>${displayDesc}</p>
                    ${linkHTML}
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

// 3. Listen for Dropdown Changes
document.addEventListener('DOMContentLoaded', () => {
    loadSubjects(); // Start loading
    
    const yearSelect = document.getElementById('year-select');
    if(yearSelect) {
        yearSelect.addEventListener('change', (e) => {
            renderGrid(e.target.value); // Re-render when user picks a year
        });
    }
});
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

function renderGrid(selectedYear) {
    const grid = document.getElementById('subject-grid');
    if (!grid) return; // Stop if we are not on the index page

    grid.innerHTML = '';

    allSubjects.forEach(subject => {
        // Filter logic
        const shouldShow = selectedYear === "ALL" || subject.years.includes(selectedYear);

        if (shouldShow && subject.title) {
             // ... (Your existing card creation code goes here) ...
             // Copy the code from previous step here (creating the div, innerHTML, etc.)
             // ...
             grid.appendChild(card);
        }
    });
}

// Global Event Listener
document.addEventListener('DOMContentLoaded', () => {
    loadSubjects(); // Load CSV data

    const navSelect = document.getElementById('nav-year-select');
    
    // 1. If the selector exists (layout.js loaded), set up the listener
    if (navSelect) {
        
        // A. If we have a saved year, use it immediately
        const savedYear = localStorage.getItem('selectedYear') || "ALL";
        navSelect.value = savedYear;

        // B. Listen for changes
        navSelect.addEventListener('change', (e) => {
            const newYear = e.target.value;
            
            // Save to browser memory
            localStorage.setItem('selectedYear', newYear);
            
            // If we are on the Home page, update grid immediately
            renderGrid(newYear);
            
            // If user changes year while on 'files.html', maybe redirect home?
            if (!document.getElementById('subject-grid')) {
                window.location.href = "index.html"; 
            }
        });
    }
});

// Update loadSubjects to render with the SAVED year, not just "ALL"
// In your loadSubjects function, change: renderGrid("ALL"); 
// to: renderGrid(localStorage.getItem('selectedYear') || "ALL");