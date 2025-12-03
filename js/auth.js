// js/auth.js

const VALID_CREDENTIALS = {
    buyer: { id: "user", pw: "1234" },
    seller: { id: "seller", pw: "5678" }
};

function authenticateAndRedirect(role, username, password, redirectPage) {
    const credentials = VALID_CREDENTIALS[role];

    if (username === credentials.id && password === credentials.pw) {
        localStorage.setItem('role', role);
        console.log(`Authentication successful. Welcome, ${username} (${role})!`);
        window.location.href = redirectPage;
    } else {
        alert("Login failed. Check ID and Password.");
    }
}

function handleRoleSwitch() {
    const loginButton = document.getElementById('main-login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            authenticateAndRedirect('buyer', username, password, '../html/user.html');
        });
    }
}

function handlePartnerLogin() {
    // Try to find the button - use setTimeout to ensure DOM is ready if called too early
    const findButton = () => {
        const partnerLoginButton = document.getElementById('partner-login-btn');
        console.log('handlePartnerLogin called, button found:', !!partnerLoginButton);
        
        if (partnerLoginButton) {
            // Check if listener is already attached to prevent duplicates
            if (partnerLoginButton.hasAttribute('data-listener-attached')) {
                console.log('Partner login listener already attached, skipping');
                return;
            }
            
            partnerLoginButton.setAttribute('data-listener-attached', 'true');
            partnerLoginButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Partner login button clicked (handlePartnerLogin)');
                const usernameInput = document.getElementById('username');
                const passwordInput = document.getElementById('password');
                const username = usernameInput ? usernameInput.value : '';
                const password = passwordInput ? passwordInput.value : '';
                console.log('Username:', username, 'Password:', password ? '***' : '');
                if (username && password) {
                    authenticateAndRedirect('seller', username, password, '../html/seller.html');
                } else {
                    alert('Please enter username and password');
                }
            });
            console.log('Partner login button listener attached successfully');
        } else {
            console.warn('Partner login button not found, retrying in 100ms...');
            // Retry after a short delay in case DOM isn't ready yet
            setTimeout(findButton, 100);
        }
    };
    
    findButton();
}

function handleMainPageRedirect() {
    const mainButton = document.getElementById('go-to-main-btn');
    if (mainButton) {
        mainButton.addEventListener('click', () => {
            window.location.href = '../html/mainpage.html';
        });
    }
}

function performLogout() {
    localStorage.removeItem('role'); 
    alert("Logout successful."); 
    window.location.href = '../html/login.html'; 
}

function handleLogout() {
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', performLogout); 
    }
}

function handleAccessCheck(requiredRole, redirectPage) {
    const role = localStorage.getItem('role');
    
    if (role !== requiredRole) {
        localStorage.removeItem('role'); 
        alert(`Access Denied. Please log in as a ${requiredRole}.`);
        window.location.href = redirectPage; 
        return false;
    }
    return true; 
}
