let allSubjects = []; // Store data here so we don't fetch twice

// 1. Fetch and Parse Data
function loadSubjects() {
    // Detect if we are on Localhost or Live Website
    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    
    // CHANGE THIS: If you are testing locally, make sure this file exists!
    const WIDGETS_URL = isLocal 
        ? './course-card-widgets.csv' 
        : 'https://raw.githubusercontent.com/shining3366dev-prog/Syllabusplus-Database/main/course-card-widgets.csv';

    console.log("Fetching from:", WIDGETS_URL); // Debugging

    fetch(WIDGETS_URL)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.text();
        })
        .then(csvText => {
            // Check if file is actually HTML (GitHub 404 error)
            if (csvText.trim().startsWith("<!DOCTYPE")) {
                throw new Error("File is HTML, not CSV. Check your URL or file path.");
            }

            const rows = csvText.split('\n').slice(1); // Skip header row
            
            allSubjects = rows.map(row => {
                if (row.trim() === '') return null;
                const cols = row.split(';');
                
                return {
                    title: cols[0]?.trim(),
                    desc: cols[1]?.trim(),
                    isAvailable: cols[2]?.trim().toUpperCase() === 'TRUE',
                    bgColor: cols[3]?.trim(),
                    image: cols[4]?.trim(),
                    // Parse the "S1,S2,S3..." string into an array
                    years: cols[5] ? cols[5].trim().split(',') : []
                };
            }).filter(item => item !== null); // Remove empty rows

            console.log("Loaded Subjects:", allSubjects.length); // Debugging

            // Render based on saved selection (or Default to ALL)
            const savedYear = localStorage.getItem('selectedYear') || "ALL";
            renderGrid(savedYear);
        })
        .catch(err => {
            console.error("Error loading CSV:", err);
            const grid = document.getElementById('subject-grid');
            if (grid) grid.innerHTML = `<p style="color:red; text-align:center;">Error loading data: ${err.message}</p>`;
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