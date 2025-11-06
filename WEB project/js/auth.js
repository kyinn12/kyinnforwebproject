// auth.js - Handles virtual session and page navigation

// -----------------------------------------------------------
// 1. ROLE-BASED AUTHENTICATION (Virtual Session)
// -----------------------------------------------------------

function handleRoleSwitch() {
    const loginButton = document.getElementById('main-login-btn');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const hardcodedRole = 'user'; 
            localStorage.setItem('role', hardcodedRole);
            
            // Assuming user.html is in the /html folder (current location)
            window.location.href = 'user.html'; 
        });
    }
}

// -----------------------------------------------------------
// 1B. NAVIGATION HANDLER (Go to Main Page)
// -----------------------------------------------------------

function handleMainPageRedirect() {
    const mainButton = document.getElementById('go-to-main-btn');
    
    if (mainButton) {
        mainButton.addEventListener('click', () => {
            // Path from /html folder to mainpage.html (assuming mainpage.html is in /html)
            window.location.href = 'mainpage.html'; // Assuming mainpage.html is in project root
        });
    }
}
// Add this to your auth.js file

// -----------------------------------------------------------
// 1C. PARTNER LOGIN HANDLER
// -----------------------------------------------------------

function handlePartnerLogin() {
    // Target the specific button ID on the partner_login.html page
    const partnerLoginButton = document.getElementById('partner-login-btn');

    if (partnerLoginButton) {
        partnerLoginButton.addEventListener('click', () => {
            const hardcodedRole = 'seller'; // Set the role to 'seller'
            localStorage.setItem('role', hardcodedRole);
            
            // Redirect to the seller's main page (assuming it's seller.html)
            // Since partner_login.html is in /html, seller.html should also be in /html
            window.location.href = 'seller.html'; 
            
            // NOTE: If seller.html is in the project root, use '../seller.html'
        });
    }
}

// -----------------------------------------------------------
// 3. LOGOUT HANDLER (Virtual Session End)
// -----------------------------------------------------------

function handleLogout() {
    const logoutButton = document.getElementById('logout-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('role'); 
            
            // Path from user.html (in /html) to login.html (assuming login.html is in /html)
            window.location.href = 'login.html'; 
        });
    }
}