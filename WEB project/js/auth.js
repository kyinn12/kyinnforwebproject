// js/auth.js

// -------------------------------------------------------------------
// 1. 일반 로그인 (login.html) - 'buyer' 역할로 설정
// -------------------------------------------------------------------
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


// -------------------------------------------------------------------
// 2. 메인 페이지로 이동 (go-to-main-btn 사용)
// -------------------------------------------------------------------
function handleMainPageRedirect() {
    const mainButton = document.getElementById('go-to-main-btn');
    if (mainButton) {
        mainButton.addEventListener('click', () => {
            window.location.href = '../html/mainpage.html';
        });
    }
}


// -------------------------------------------------------------------
// 3. 파트너 로그인 (partner_login.html) - 'seller' 역할로 설정
// -------------------------------------------------------------------
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


// -------------------------------------------------------------------
// 4. 로그아웃 (logout-btn 사용)
// -------------------------------------------------------------------
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


// -------------------------------------------------------------------
// 5. 페이지 접근 권한 확인 로직 (12주차 목표)
// -------------------------------------------------------------------
function handleAccessCheck(requiredRole, redirectPage) {
    const role = localStorage.getItem('role');
    
    if (role !== requiredRole) {
        alert(`Access Denied. Please log in as a ${requiredRole}.`);
        localStorage.removeItem('role'); 
        window.location.href = redirectPage; // 지정된 로그인 페이지로 리다이렉션
        return false;
    }
    return true; // 접근 허용
}