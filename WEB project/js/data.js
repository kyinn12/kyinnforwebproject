
const productListContainer = document.getElementById('product-list-container');
let allProducts = []; 

const STORAGE_KEY = 'codedlookProducts';

function getProductsFromStorage() {
    const productsJson = localStorage.getItem(STORAGE_KEY);
    return productsJson ? JSON.parse(productsJson) : defaultProducts;
}

function saveProductsToStorage(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}



function addNewProduct(newProduct) {
    let products = getProductsFromStorage();
    
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 101;
    
    const product = {
        id: newId,
        name: newProduct.name,
        price: parseInt(newProduct.price),
        category: newProduct.category,
        tags: newProduct.tags.split(',').map(tag => tag.trim()),
        stock: parseInt(newProduct.stock),
        imageUrl: newProduct.image || '../resources/default_item.jpg' 
    };

    products.push(product); 
    saveProductsToStorage(products); 
    allProducts = products; 
}

function deleteProduct(id) {
    let products = getProductsFromStorage();
    
    const updatedProducts = products.filter(product => product.id !== id);
    
    saveProductsToStorage(updatedProducts); 
    allProducts = updatedProducts; 
    
    alert(`Product ID ${id} deleted.`);
    
    renderSellerProducts(); 
}


function loadEmbeddedProducts() {
    allProducts = getProductsFromStorage(); 
    renderProducts(allProducts);
}


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


document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        saveProductsToStorage(defaultProducts);
    }
});