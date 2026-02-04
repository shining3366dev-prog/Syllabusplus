let allSubjects = [];

// 1. Load Data
function loadSubjects() {
    // Force fresh load from GitHub
    const WIDGETS_URL = 'https://shining3366dev-prog.github.io/Syllabusplus-Database/course-card-widgets.csv?t=' + Date.now();
    
    // THIS IS THE MISSING PART THAT FIXES YOUR IMAGES
    const IMAGES_BASE_URL = 'https://shining3366dev-prog.github.io/Syllabusplus-Database/images/';

    console.log("Fetching URL:", WIDGETS_URL);

    fetch(WIDGETS_URL)
        .then(res => {
            if (!res.ok) throw new Error(`Database connection failed: ${res.status}`);
            return res.text();
        })
        .then(csvText => {
            if (csvText.trim().startsWith("<!DOCTYPE")) {
                throw new Error("Invalid CSV: GitHub returned an HTML error page.");
            }

            const rows = csvText.split('\n').slice(1);
            
            allSubjects = rows.map(row => {
                if (!row || row.trim() === '') return null;
                const cols = row.split(';');
                if (cols.length < 3) return null;

                // --- IMAGE LOGIC RESTORED ---
                let imageName = cols[4]?.trim();
                let finalImageUrl = '';

                // If CSV has a filename (e.g. "math.jpg"), combine it with base URL
                if (imageName && imageName.length > 0) {
                    // Check if it's already a full link (http), otherwise add base path
                    if (imageName.startsWith('http')) {
                        finalImageUrl = imageName;
                    } else {
                        finalImageUrl = IMAGES_BASE_URL + imageName;
                    }
                }
                // -----------------------------

                return {
                    title: cols[0]?.trim(),
                    desc: cols[1]?.trim(),
                    isAvailable: cols[2]?.trim().toUpperCase() === 'TRUE',
                    bgColor: cols[3]?.trim(),
                    image: finalImageUrl, // Use the constructed URL
                    years: cols[5] ? cols[5].replace(/[\r\n]/g, "").trim().split(',') : []
                };
            }).filter(item => item !== null);

            // Recover saved year from Sidebar selection
            let savedYear = localStorage.getItem('selectedYear');
            if (!savedYear || savedYear === "null") savedYear = "ALL";
            
            updateActiveButton(savedYear);
            renderGrid(savedYear);
        })
        .catch(err => {
            console.error("Critical Error:", err);
            const grid = document.getElementById('subject-grid');
            if (grid) grid.innerHTML = `<p style="color:red; text-align:center;">Error loading data. Check console.</p>`;
        });
}

// 1. Unified Filter Function
window.filterYear = function(year) {
    // Save selection
    localStorage.setItem('selectedYear', year);
    
    // Update UI (Sync both Dropdown and Buttons)
    updateActiveButton(year);
    
    // Render
    renderGrid(year);
}

// 2. Sync Helper (Updates both Inputs)
function updateActiveButton(year) {
    // A. Update Buttons (Desktop)
    const buttons = document.querySelectorAll('.year-btn');
    buttons.forEach(btn => {
        if(btn.innerText.includes(year) || (year === 'ALL' && btn.innerText.includes('All'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // B. Update Dropdown (Mobile)
    const dropdown = document.getElementById('mobile-year-select');
    if (dropdown) {
        dropdown.value = year;
    }
}

// 3. Render Grid
function renderGrid(selectedYear) {
    const grid = document.getElementById('subject-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    const filteredSubjects = allSubjects.filter(sub => {
        if (selectedYear === "ALL") return true;
        // Trim allows "S1 " to match "S1"
        return sub.years.some(y => y.trim() === selectedYear);
    });

    if (filteredSubjects.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#888;">No subjects found for this year.</p>';
        return;
    }

    filteredSubjects.forEach(subject => {
        const buttonText = subject.isAvailable ? 'View Files' : 'Coming Soon';
        const linkHTML = subject.isAvailable 
            ? `<button onclick="window.location.href='files.html?subject=${encodeURIComponent(subject.title)}'">${buttonText}</button>`
            : `<button disabled>${buttonText}</button>`;
            
        let yearBadgeHTML = '';
        if (subject.years && subject.years.length > 0) {
            yearBadgeHTML = `<p style="color:#27ae60; font-weight:700; font-size:0.8rem; margin-bottom:5px;">🎓 ${subject.years.join(', ')}</p>`;
        }

        // Background Logic: Image OR Color
        let backgroundStyle = '';
        if (subject.image) {
            backgroundStyle = `background-image: url('${subject.image}');`;
        } else {
            backgroundStyle = `background-color: ${subject.bgColor || '#3498db'};`;
        }

        const card = document.createElement('div');
        card.className = `course-card ${subject.isAvailable ? '' : 'disabled'}`;
        card.innerHTML = `
            <div class="card-image" style="${backgroundStyle}"></div>
            <div class="card-text">
                <h3>${subject.title}</h3>
                <p>${subject.desc || ''}</p>
                ${yearBadgeHTML}
                ${linkHTML}
            </div>
        `;
        grid.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', loadSubjects);