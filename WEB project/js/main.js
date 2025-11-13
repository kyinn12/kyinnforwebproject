// js/main.js
// 모든 JavaScript 실행을 통합하고, 페이지별로 필요한 함수만 호출합니다.

// -------------------------------------------------------------------
// 1. 판매자 대시보드 초기화 및 이벤트 연결 (이미지 필드 포함)
// -------------------------------------------------------------------
function initSellerDashboard() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    // 1. 폼 제출 이벤트
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // 페이지 새로고침 방지

        // 폼에서 데이터를 수집
        const newProduct = {
            name: document.getElementById('p-name').value,
            price: document.getElementById('p-price').value,
            category: document.getElementById('p-category').value,
            stock: document.getElementById('p-stock').value,
            tags: document.getElementById('p-tags').value,
            image: document.getElementById('p-image').value 
        };

        // data.js의 상품 등록 함수 호출
        addNewProduct(newProduct);

        alert(`Product "${newProduct.name}" registered successfully!`);
        form.reset(); // 폼 초기화
    });

    // 2. 초기 테이블 로딩
    renderSellerProducts(); 
}

// -------------------------------------------------------------------
// 2. 메인 실행 부분 (DOMContentLoaded)
// -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'login.html' || currentPage === 'partner_login.html') {
        handleRoleSwitch(); 
        handlePartnerLogin(); 
        handleMainPageRedirect();
    }

    // 구매자 페이지 (user.html) - 접근 통제 및 상품 출력/필터링
    else if (currentPage === 'user.html') {
        const hasAccess = handleAccessCheck('buyer', '../html/login.html'); 
        
        if (hasAccess) {
             handleLogout();             
             loadEmbeddedProducts();     // 상품 데이터 로딩 및 출력
             initFilterControls();       // 카테고리 필터링 컨트롤러 활성화
        }
    }
    
    // 판매자 페이지 (seller.html) - 접근 통제 및 상품 등록 폼 활성화
    else if (currentPage === 'seller.html') {
        const hasAccess = handleAccessCheck('seller', '../html/partner_login.html'); 
        
        if (hasAccess) {
             handleLogout();             
             initSellerDashboard(); // 판매자 대시보드 로직 활성화
        }
    }
});

