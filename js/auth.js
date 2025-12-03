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
    let retryCount = 0;
    const maxRetries = 10;
    
    const findButton = () => {
        const partnerLoginButton = document.getElementById('partner-login-btn');
        console.log('handlePartnerLogin called, button found:', !!partnerLoginButton, 'retry:', retryCount);
        
        if (partnerLoginButton) {
            // Remove any existing listener by cloning the button (clean slate)
            if (partnerLoginButton.hasAttribute('data-listener-attached')) {
                console.log('Removing old listener and reattaching...');
                const newButton = partnerLoginButton.cloneNode(true);
                partnerLoginButton.parentNode.replaceChild(newButton, partnerLoginButton);
                // Get the new button reference
                const newButtonRef = document.getElementById('partner-login-btn');
                if (newButtonRef) {
                    attachListener(newButtonRef);
                }
                return;
            }
            
            attachListener(partnerLoginButton);
        } else {
            retryCount++;
            if (retryCount < maxRetries) {
                console.warn(`Partner login button not found, retrying in 100ms... (${retryCount}/${maxRetries})`);
                setTimeout(findButton, 100);
            } else {
                console.error('Partner login button not found after', maxRetries, 'retries');
                // Last resort: try to attach directly when button becomes available
                const observer = new MutationObserver(() => {
                    const btn = document.getElementById('partner-login-btn');
                    if (btn && !btn.hasAttribute('data-listener-attached')) {
                        console.log('Button found via MutationObserver, attaching listener');
                        attachListener(btn);
                        observer.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }
    };
    
    const attachListener = (button) => {
        button.setAttribute('data-listener-attached', 'true');
        button.addEventListener('click', (e) => {
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
