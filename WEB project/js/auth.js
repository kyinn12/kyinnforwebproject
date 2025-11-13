
function handleRoleSwitch() {
    const loginButton = document.getElementById('main-login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const hardcodedRole = 'buyer'; 
            localStorage.setItem('role', hardcodedRole);
            window.location.href = '../html/user.html'; 
        });
    }
}



function handleMainPageRedirect() {
    const mainButton = document.getElementById('go-to-main-btn');
    if (mainButton) {
        mainButton.addEventListener('click', () => {
            window.location.href = '../html/mainpage.html';
        });
    }
}



function handlePartnerLogin() {
    const partnerLoginButton = document.getElementById('partner-login-btn');
    if (partnerLoginButton) {
        partnerLoginButton.addEventListener('click', () => {
            const hardcodedRole = 'seller'; 
            localStorage.setItem('role', hardcodedRole);
            window.location.href = '../html/seller.html'; 
        });
    }
}



function handleLogout() {
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('role'); 
            alert("Logout successful."); 
            window.location.href = '../html/login.html'; 
        });
    }
}



function handleAccessCheck(requiredRole, redirectPage) {
    const role = localStorage.getItem('role');
    
    if (role !== requiredRole) {
        alert(`Access Denied. Please log in as a ${requiredRole}.`);
        localStorage.removeItem('role'); 
        window.location.href = redirectPage; 
        return false;
    }
    return true; 
}