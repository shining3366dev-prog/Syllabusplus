// 1. Define the Navigation Bar HTML
const headerHTML = `
    <header class="header">
        <div class="logo">Syllabus+</div>
        <nav class="navbar">
            <a href="index.html">Home</a>
            
            <select id="nav-year-select" class="nav-select">
                <option value="ALL">All Years</option>
                <option value="S1">Year S1</option>
                <option value="S2">Year S2</option>
                <option value="S3">Year S3</option>
                <option value="S4">Year S4</option>
                <option value="S5">Year S5</option>
                <option value="S6">Year S6</option>
                <option value="S7">Year S7</option>
            </select>

            <a href="index.html#subjects">Subjects</a>
            <a href="#about">About</a>
            <a href="#" class="btn-login" onclick="loginGoogle()">Login</a>
        </nav>
    </header>
`;

// 2. Footer (Same as before)
const footerHTML = `
    <footer>
        <p>&copy; 2026 EIGT PLUS. All rights reserved.</p>
    </footer>
`;

// 3. Inject Function
function loadLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    highlightActiveLink();
    
    // NEW: Recover the saved year from memory (if they selected it before)
    const savedYear = localStorage.getItem('selectedYear');
    const selectBox = document.getElementById('nav-year-select');
    if(savedYear && selectBox) {
        selectBox.value = savedYear;
    }
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

loadLayout();