let allSubjects = []; // Store data here so we don't fetch twice

// 1. Fetch and Parse Data
function loadSubjects() {
    // FORCE USE OF GITHUB DATABASE (Solves the "Error" / 404 issue)
    const WIDGETS_URL = 'https://raw.githubusercontent.com/shining3366dev-prog/Syllabusplus-Database/main/course-card-widgets.csv';

    console.log("Fetching URL:", WIDGETS_URL); // Debugging line

    fetch(WIDGETS_URL)
        .then(res => {
            if (!res.ok) throw new Error(`Database connection failed: ${res.status}`);
            return res.text();
        })
        .then(csvText => {
            if (csvText.trim().startsWith("<!DOCTYPE")) {
                throw new Error("Invalid CSV: GitHub returned an HTML error page.");
            }

            const rows = csvText.split('\n').slice(1); // Skip header
            
            allSubjects = rows.map(row => {
                // Ignore empty lines
                if (!row || row.trim() === '') return null;
                
                const cols = row.split(';');
                if (cols.length < 3) return null; // Ignore broken rows

                return {
                    title: cols[0]?.trim(),
                    desc: cols[1]?.trim(),
                    isAvailable: cols[2]?.trim().toUpperCase() === 'TRUE',
                    bgColor: cols[3]?.trim(),
                    image: cols[4]?.trim(),
                    // Safety check for years
                    years: cols[5] ? cols[5].trim().split(',') : []
                };
            }).filter(item => item !== null);

            console.log(`Loaded ${allSubjects.length} subjects successfully.`);

            // FIX "NULL" ERROR: Check if saved year is valid, otherwise reset to ALL
            let savedYear = localStorage.getItem('selectedYear');
            if (!savedYear || savedYear === "null" || savedYear === "undefined") {
                savedYear = "ALL";
                localStorage.setItem('selectedYear', "ALL");
            }
            
            renderGrid(savedYear);
        })
        .catch(err => {
            console.error("Critical Error:", err);
            const grid = document.getElementById('subject-grid');
            if (grid) {
                grid.innerHTML = `
                    <div style="text-align: center; color: #e74c3c; padding: 20px;">
                        <h3>⚠️ Error Loading Data</h3>
                        <p>${err.message}</p>
                        <p>Check the Console (F12) for details.</p>
                    </div>
                `;
            }
        });
}

// 2. Render the Grid (THE PART THAT WAS MISSING)
function renderGrid(selectedYear) {
    const grid = document.getElementById('subject-grid');
    if (!grid) return; // Stop if we are not on the index page

    grid.innerHTML = ''; // Clear existing content

    // Filter Logic
    const filteredSubjects = allSubjects.filter(subject => {
        return selectedYear === "ALL" || subject.years.includes(selectedYear);
    });

    if (filteredSubjects.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%;">No subjects found for this year.</p>';
        return;
    }

    filteredSubjects.forEach(subject => {
        if (subject.title) {
            // A. Text Logic
            const displayDesc = subject.isAvailable ? (subject.desc || 'Resources Available') : 'Not Available';
            const disabledClass = subject.isAvailable ? '' : 'disabled';
            const buttonText = subject.isAvailable ? 'View Files' : 'Unavailable';

            // B. Background Logic
            let backgroundStyle = '';
            // Note: This assumes images are in an 'images' folder relative to index.html
            if (subject.image && subject.image.length > 0) {
                backgroundStyle = `background-image: url('images/${subject.image}');`;
            } else {
                backgroundStyle = `background-color: ${subject.bgColor || '#3498db'};`;
            }

            // C. Button Link Logic
            const linkHTML = subject.isAvailable 
                ? `<a href="./files.html?subject=${subject.title}">
                        <button>${buttonText}</button>
                    </a>`
                : `<button disabled>${buttonText}</button>`;

            // D. Create HTML Elements
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
    loadSubjects(); // Run immediately on load

    const navSelect = document.getElementById('nav-year-select');
    
    // If the navbar selector exists
    if (navSelect) {
        // Restore saved selection
        const savedYear = localStorage.getItem('selectedYear') || "ALL";
        navSelect.value = savedYear;

        // Listen for changes
        navSelect.addEventListener('change', (e) => {
            const newYear = e.target.value;
            localStorage.setItem('selectedYear', newYear); // Save to memory
            renderGrid(newYear); // Update grid
            
            // Redirect if not on home page
            if (!document.getElementById('subject-grid')) {
                window.location.href = "index.html";
            }
        });
    }
});