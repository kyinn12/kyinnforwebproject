// js/data.js

const productListContainer = document.getElementById('product-list-container');
let allProducts = []; 

const STORAGE_KEY = 'codedlookProducts';

// 초기 상품 데이터 (이미지 URL 필드 포함)

// 로컬 스토리지에서 상품 목록을 불러오는 함수
function getProductsFromStorage() {
    const productsJson = localStorage.getItem(STORAGE_KEY);
    return productsJson ? JSON.parse(productsJson) : defaultProducts;
}

// 로컬 스토리지에 상품 목록을 저장하는 함수
function saveProductsToStorage(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}


// -------------------------------------------------------------------
// 1. 상품 등록 (Seller 기능) - 이미지 URL 처리 로직 추가
// -------------------------------------------------------------------
function addNewProduct(newProduct) {
    let products = getProductsFromStorage();
    
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 101;
    
    // 새 상품 객체 생성
    const product = {
        id: newId,
        name: newProduct.name,
        price: parseInt(newProduct.price),
        category: newProduct.category,
        tags: newProduct.tags.split(',').map(tag => tag.trim()),
        stock: parseInt(newProduct.stock),
        // 이미지 URL 처리: URL이 없으면 기본 이미지를 사용
        imageUrl: newProduct.image || '../resources/default_item.jpg' 
    };

    products.push(product); 
    saveProductsToStorage(products); 
    allProducts = products; 
}

// -------------------------------------------------------------------
// 2. 상품 삭제 (Seller 기능)
// -------------------------------------------------------------------
function deleteProduct(id) {
    let products = getProductsFromStorage();
    
    // Array.prototype.filter()를 사용하여 해당 ID를 제외한 새 배열 생성
    const updatedProducts = products.filter(product => product.id !== id);
    
    saveProductsToStorage(updatedProducts); // 로컬 스토리지 업데이트
    allProducts = updatedProducts; // 메모리 업데이트
    
    alert(`Product ID ${id} deleted.`);
    
    // 테이블을 새로고침하여 삭제된 내용 반영
    renderSellerProducts(); 
}


// -------------------------------------------------------------------
// 3. 구매자 페이지 상품 로딩 (user.html)
// -------------------------------------------------------------------

function loadEmbeddedProducts() {
    // 초기화 및 로컬 스토리지에서 상품 불러오기
    allProducts = getProductsFromStorage(); 
    renderProducts(allProducts);
}


// -------------------------------------------------------------------
// 4. 상품 렌더링 함수 - 이미지 태그 추가 (구매자 뷰)
// -------------------------------------------------------------------
function renderProducts(productsToRender) {
    if (!productListContainer) return;

    if (productsToRender.length === 0) {
        productListContainer.innerHTML = "<p>No products match your criteria.</p>";
        return;
    }
    
    const productHtmlArray = productsToRender.map(product => {
        const formattedPrice = product.price.toLocaleString('ko-KR') + '원';
        const stockStatus = product.stock > 0 ? 'In Stock' : 'Sold Out';
        const buttonClass = product.stock > 0 ? 'btn-primary' : 'btn-disabled';

        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                
                <h3>${product.name}</h3>
                <p class="price">${formattedPrice}</p>
                <p class="category">Category: ${product.category}</p>
                <p class="tags">Tags: ${product.tags.join(', ')}</p>
                <button class="${buttonClass}" ${product.stock > 0 ? '' : 'disabled'}>
                    ${stockStatus} | Add to Cart (Demo)
                </button>
            </div>
        `;
    });

    productListContainer.innerHTML = productHtmlArray.join('');
}


// -------------------------------------------------------------------
// 5. 판매자 대시보드 테이블 렌더링 및 삭제 리스너
// -------------------------------------------------------------------

function renderSellerProducts() {
    const sellerTableBody = document.querySelector('#product-table tbody');
    if (!sellerTableBody) return;

    const products = getProductsFromStorage();
    sellerTableBody.innerHTML = ''; 

    products.forEach(product => {
        const row = sellerTableBody.insertRow();
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.price.toLocaleString('ko-KR')}원</td>
            <td>${product.stock > 0 ? product.stock : '품절'}</td>
            <td>
                <button class="btn-seller-delete" data-id="${product.id}">Delete</button>
                <button class="btn-seller-edit" data-id="${product.id}" disabled>Edit (Demo)</button>
            </td>
        `;
    });
    
    // 테이블을 그린 후 삭제 버튼에 이벤트 리스너를 연결
    const deleteButtons = document.querySelectorAll('.btn-seller-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            if (confirm(`Do you really want to delete product ID ${productId}?`)) {
                deleteProduct(productId);
            }
        });
    });
}


// -------------------------------------------------------------------
// 6. 카테고리 필터링 컨트롤러 활성화 (12주차 목표)
// -------------------------------------------------------------------
function initFilterControls() {
    const controlPanel = document.getElementById('control-panel');
    if (!controlPanel) return;

    const filterButtons = controlPanel.querySelectorAll('button'); 

    const allButton = controlPanel.querySelector('button[data-category="All"]');
    if (allButton) allButton.classList.add('active');

    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const selectedCategory = e.target.dataset.category;
            
            filterProducts(selectedCategory);
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

function filterProducts(category) {
    let filteredProducts;
    
    if (category === 'All') {
        filteredProducts = allProducts;
    } else {
        filteredProducts = allProducts.filter(product => 
            product.category === category
        );
    }
    
    renderProducts(filteredProducts);
}

// -------------------------------------------------------------------
// 7. 초기 실행: 로컬 스토리지에 데이터가 없으면 초기 데이터를 저장
// -------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        saveProductsToStorage(defaultProducts);
    }
});