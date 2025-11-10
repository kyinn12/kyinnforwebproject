
document.addEventListener('DOMContentLoaded', () => {
    
    handleRoleSwitch(); 
    handleMainPageRedirect();
    
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'user.html') {
        loadEmbeddedProducts(); 
        handleLogout(); 
    }
});

document.addEventListener('DOMContentLoaded', () => {
    
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'user.html') {
        
    } 
   
    if (currentPage === 'partner_login.html') {
        handlePartnerLogin(); 
        handleMainPageRedirect(); 
    }
    
});