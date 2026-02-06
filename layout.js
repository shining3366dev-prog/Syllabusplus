// 1. Define the Navigation Bar HTML (Clean - No Dropdown)
const headerHTML = `
    <header class="header">
        <a href="index.html" class="logo">Syllabus+</a>
        
        <button class="menu-toggle" id="mobile-menu-btn" aria-label="Toggle Menu">
            <i class="fa-solid fa-bars"></i>
        </button>

        <nav class="navbar" id="main-nav">
            <a href="index.html">Home</a>
            <a href="index.html#subjects">Subjects</a>
            <a href="#about">About</a>
            <a href="#" class="btn-login" onclick="loginGoogle()">Login</a>
        </nav>
    </header>
`;

// 2. Footer
const footerHTML = `
    <footer id="main-footer">
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

    // Mobile Menu Logic
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
