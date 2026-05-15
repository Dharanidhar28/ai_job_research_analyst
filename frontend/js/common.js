document.addEventListener('DOMContentLoaded', () => {
    injectNavbar();
    injectFooter();
    checkAuthRedirect();
});

function injectNavbar() {
    const nav = document.createElement('nav');
    nav.className = 'nav';
    
    const isLoggedIn = !!localStorage.getItem('token');
    const currentPath = window.location.pathname;

    const navLinks = [
        { name: 'Jobs', path: '/jobs.html' },
        { name: 'Resumes', path: '/resumes.html' },
        { name: 'Upload', path: '/upload.html' },
        { name: 'Tailor', path: '/tailor.html' },
    ];

    const linksHtml = navLinks.map(link => {
        const activeClass = currentPath.endsWith(link.path) ? 'active' : '';
        return `<a href="${link.path}" class="${activeClass}">${link.name}</a>`;
    }).join('');

    const authButton = isLoggedIn 
        ? `<button onclick="handleLogout()" class="btn btn-outline">Logout</button>`
        : `<a href="/login.html" class="btn ${currentPath.endsWith('/login.html') ? 'btn-primary' : 'btn-outline'}">Login</a>`;

    nav.innerHTML = `
        <div class="container">
            <div class="nav-inner">
                <a href="/index.html" class="logo">
                    JobResearch<span>AI</span>
                </a>
                <div class="nav-links">
                    ${linksHtml}
                    ${authButton}
                </div>
            </div>
        </div>
    `;

    document.body.prepend(nav);
}

function injectFooter() {
    const footer = document.createElement('footer');
    const year = new Date().getFullYear();
    footer.innerHTML = `
        <div class="container">
            &copy; ${year} JobResearchAI. All rights reserved.
        </div>
    `;
    document.body.appendChild(footer);
}

function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

function checkAuthRedirect() {
    // Handle OAuth token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
        localStorage.setItem('token', urlToken);
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        window.location.reload();
    }
}
