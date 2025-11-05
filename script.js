// script.js

// -----------------------------------------------------------
// 1. ROLE-BASED AUTHENTICATION (Virtual Session)
// -----------------------------------------------------------

function handleRoleSwitch() {
    // 1. 로그인 버튼 요소를 가져옵니다.
    const loginButton = document.getElementById('main-login-btn');
    
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            
            // 2. 현재 선택된 라디오 버튼의 'value' (buyer 또는 seller)를 가져옵니다.
            const selectedRole = document.querySelector('input[name="user-role"]:checked').value;
            
            // (Note: 여기서는 ID/PW 검증은 생략합니다.)
            
            // 3. localStorage에 역할을 저장합니다. (가상 로그인 상태)
            localStorage.setItem('role', selectedRole);
            
            // 4. 역할에 따라 페이지를 이동시킵니다.
            if (selectedRole === 'buyer') {
                // 구매자 페이지 (index.html)로 이동
                window.location.href = 'buyer.html'; 
            } else if (selectedRole === 'seller') {
                // 판매자 페이지 (seller.html)로 이동
                window.location.href = 'seller.html'; 
            }
        });
    }
}

// -----------------------------------------------------------
// 2. DATA FETCHING AND RENDERING (For Buyer Page: index.html)
// -----------------------------------------------------------

const productListContainer = document.getElementById('product-list-container');
let allProducts = []; // Stores the master list for filtering/sorting

// Fetches data from our virtual API (products.json)
async function fetchProducts() {
    const url = 'products.json';
    
    try {
        const response = await fetch(url); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json(); 
        
        allProducts = products; // Save original data
        
        // Render products after successful fetch
        renderProducts(allProducts);

    } catch (error) {
        console.error("Error fetching data:", error);
        productListContainer.innerHTML = "<p>Failed to load product data. Check console for details.</p>";
    }
}

// Generates and inserts HTML cards into the DOM
function renderProducts(productsToRender) {
    if (productsToRender.length === 0) {
        productListContainer.innerHTML = "<p>No products match your criteria.</p>";
        return;
    }
    
    const productHtmlArray = productsToRender.map(product => {
        // Price formatting: KRW 25,000 
        const formattedPrice = product.price.toLocaleString('en-US', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0
        }).replace('KRW', 'KRW ');

        const stockStatus = product.stock > 0 ? 'In Stock' : 'Sold Out';
        const buttonClass = product.stock > 0 ? 'btn-primary' : 'btn-disabled';

        // HTML Template Literal for the product card
        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                <h3>${product.name}</h3>
                <p class="price">${formattedPrice}</p>
                <p class="category">Category: ${product.category}</p>
                <p class="tags">Tags: ${product.tags.join(', ')}</p>
                <button class="${buttonClass}" ${product.stock > 0 ? '' : 'disabled'}>
                    ${stockStatus} | Wishlist (Demo)
                </button>
            </div>
        `;
    });

    productListContainer.innerHTML = productHtmlArray.join('');
}


// -----------------------------------------------------------
// 3. MAIN EXECUTION
// -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Role Switching on the Login page
    handleRoleSwitch(); 
    
    const currentPage = window.location.pathname.split('/').pop();

    // 2. Start data loading only on the Buyer's main page
    if (currentPage === 'index.html') {
        fetchProducts(); 
    }
    
    // (Logic for seller.html will be added later)
});