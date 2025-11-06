// main.js - Coordinates execution on page load

document.addEventListener('DOMContentLoaded', () => {
    
    // Auth functions are called globally on ALL pages where this script is loaded.
    handleRoleSwitch(); 
    handleMainPageRedirect();
    
    const currentPage = window.location.pathname.split('/').pop();

    // Data and Logout handlers are ONLY called on the user page.
    if (currentPage === 'user.html') {
        // The data loading function defined in data.js
        loadEmbeddedProducts(); 
        
        // The logout handler defined in auth.js
        handleLogout(); 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    
    // ... (existing calls: handleRoleSwitch, handleMainPageRedirect) ...
    
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'user.html') {
        // ... (user page logic) ...
    } 
    
    // NEW: Partner Login Logic
    if (currentPage === 'partner_login.html') {
        handlePartnerLogin(); // Activate the seller login button
        handleMainPageRedirect(); // Activate the "Go to Main Page" button
    }
    
    // ... (rest of main.js) ...
});