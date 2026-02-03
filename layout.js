// 1. Define the Navigation Bar HTML
const headerHTML = `
    <header class="header">
        <a href="index.html" class="logo">Syllabus+</a>
        
        <button class="menu-toggle" id="mobile-menu-btn" aria-label="Toggle Menu">
            <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="navbar" id="main-nav">
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

// 2. Footer
const footerHTML = `
    <footer>
        <p>&copy; 2026 SYLLABUSPLUS. All rights reserved.</p>
    </footer>
`;

// 3. Inject Function
function loadLayout() {
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);
    
    // Highlight Active Link
    const currentPage = window.location.pathname.split("/").pop();
    document.querySelectorAll('.navbar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) link.classList.add('active');
    });

    // Recover Saved Year
    const savedYear = localStorage.getItem('selectedYear');
    const selectBox = document.getElementById('nav-year-select');
    if (savedYear && selectBox) selectBox.value = savedYear;

    // --- MOBILE MENU LOGIC ---
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
            const icon = menuBtn.querySelector('i');
            if (nav.classList.contains('nav-open')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }
}

loadLayout();
