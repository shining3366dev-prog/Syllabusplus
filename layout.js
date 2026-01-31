// 1. Define the Navigation Bar HTML
const headerHTML = `
    <header class="header">
        <div class="logo">Syllabus+</div>
        <nav class="navbar">
            <a href="index.html">Home</a>
            <a href="index.html#subjects">Subjects</a>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
            //<a href="#" class="btn-login" onclick="loginGoogle()">Login</a>
        </nav>
    </header>
`;

// 2. Define the Footer HTML
const footerHTML = `
    <footer>
        <p>&copy; 2026 EIGT PLUS. All rights reserved.</p>
    </footer>
`;

// 3. Inject them into the page
function loadLayout() {
    // Insert Header at the very top of the body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    // Insert Footer at the very bottom of the body
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // Optional: Highlight the active link based on current URL
    highlightActiveLink();
}

function highlightActiveLink() {
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.navbar a');

    navLinks.forEach(link => {
        // If link matches current page (e.g., 'index.html'), add 'active' class
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Run immediately
loadLayout();