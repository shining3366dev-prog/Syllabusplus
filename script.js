// Function to load and parse the CSV data
function loadSubjects() {
    fetch('course-card-widgets.csv')
        .then(response => {
            if (!response.ok) throw new Error("File not found (404)");
            return response.text();
        })
        .then(csvText => {
            if (csvText.trim().startsWith("<!DOCTYPE")) {
                throw new Error("File is HTML, not CSV. Check filename.");
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
                    // 1. Text Logic
                    const displayDescription = isAvailable ? (rawDescription || 'Resources Available') : 'Not Available';
                    
                    // 2. Class Logic
                    const disabledClass = isAvailable ? '' : 'disabled';
                    const buttonText = isAvailable ? 'View Files' : 'Unavailable';
                    
                    // 3. Background Logic (UPDATED)
                    let backgroundStyle = '';

                    // Rule 1: If an image exists, ALWAYS use it (even if unavailable)
                    // The CSS .disabled class will handle turning it gray.
                    if (imageFile && imageFile.length > 0) {
                        backgroundStyle = `background-image: url('images/${imageFile}');`;
                    } 
                    // Rule 2: If no image, but available, use the custom color
                    else if (isAvailable) {
                        backgroundStyle = `background-color: ${bgColor || '#3498db'};`;
                    } 
                    // Rule 3: If no image and unavailable, use generic gray
                    else {
                        backgroundStyle = `background-color: #95a5a6;`;
                    }

                    // 4. Build the HTML Card
                    const card = document.createElement('div');
                    card.className = `course-card ${disabledClass}`;

                    card.innerHTML = `
                        <div class="card-image" style="${backgroundStyle}"></div>
                        <div class="card-text">
                            <h3>${title}</h3>
                            <p>${displayDescription}</p>
                            <button ${!isAvailable ? 'disabled' : ''}>${buttonText}</button>
                        </div>
                    `;

                    grid.appendChild(card);
                }
            });
        })
        .catch(err => {
            console.error('Error loading subjects:', err);
            const grid = document.getElementById('subject-grid');
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: red; padding: 20px; border: 1px solid red;">
                    <h3>⚠️ Error Loading Data</h3>
                    <p>Could not find <b>course-card-widgets.csv</b>.</p>
                </div>
            `;
        });
}

loadSubjects();