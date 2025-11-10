
function handleRoleSwitch() {
    const loginButton = document.getElementById('main-login-btn');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const hardcodedRole = 'user'; 
            localStorage.setItem('role', hardcodedRole);
            
            window.location.href = 'user.html'; 
        });
    }
}


function handleMainPageRedirect() {
    const mainButton = document.getElementById('go-to-main-btn');
    
    if (mainButton) {
        mainButton.addEventListener('click', () => {

            window.location.href = 'mainpage.html';
        });
    }
}

function handlePartnerLogin() {

    const partnerLoginButton = document.getElementById('partner-login-btn');

    if (partnerLoginButton) {
        partnerLoginButton.addEventListener('click', () => {
            const hardcodedRole = 'seller'; 
            localStorage.setItem('role', hardcodedRole);
            
            window.location.href = 'seller.html'; 

        });
    }
}


function handleLogout() {
    const logoutButton = document.getElementById('logout-btn');

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('role'); 

            window.location.href = 'login.html'; 
        });
    }
}