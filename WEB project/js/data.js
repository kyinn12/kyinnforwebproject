
const productListContainer = document.getElementById('product-list-container');
let allProducts = []; 

const STORAGE_KEY = 'codedlookProducts';
const WISHLIST_KEY = 'codedlookWishlist'; 
const CART_KEY = 'codedlookCart';       

const defaultProducts = [
    { "id": 101, "name": "Classic White T-Shirt", "price": 25000, "category": "Tops", "tags": ["Basic", "Cotton"], "stock": 50, 
      "imageUrl": "https://picsum.photos/id/10/280/280" }, 
    { "id": 102, "name": "Slim Fit Denim Pants", "price": 59000, "category": "Bottoms", "tags": ["Popular", "Daily"], "stock": 15, 
      "imageUrl": "https://picsum.photos/id/20/280/280" },
    { "id": 103, "name": "Lightweight Overfit Jacket", "price": 88000, "category": "Outerwear", "tags": ["New Arrival", "Sale"], "stock": 0, 
      "imageUrl": "https://picsum.photos/id/30/280/280" },
    { "id": 104, "name": "Vintage Pattern Skirt", "price": 42000, "category": "Bottoms", "tags": ["Women's", "Sale"], "stock": 35, 
      "imageUrl": "https://picsum.photos/id/40/280/280" },
    { "id": 105, "name": "Wool Knit Vest", "price": 31000, "category": "Tops", "tags": ["Autumn", "Warm"], "stock": 20, 
      "imageUrl": "https://picsum.photos/id/50/280/280" },
    { "id": 106, "name": "Minimal Necklace", "price": 18000, "category": "Accessories", "tags": ["Jewelry", "Gift"], "stock": 40, 
      "imageUrl": "https://picsum.photos/id/60/280/280" },
    { "id": 107, "name": "Corduroy Shirts", "price": 55000, "category": "Tops", "tags": ["Warm", "Trendy"], "stock": 10, 
      "imageUrl": "https://picsum.photos/id/70/280/280" },
    { "id": 108, "name": "Stylish Winter Coat", "price": 120000, "category": "Outerwear", "tags": ["Premium", "Winter"], "stock": 5, 
      "imageUrl": "https://picsum.photos/id/80/280/280" },
];


function getProductsFromStorage() {
    const productsJson = localStorage.getItem(STORAGE_KEY);
    return productsJson ? JSON.parse(productsJson) : defaultProducts;
}

function saveProductsToStorage(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function initializeData() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        saveProductsToStorage(defaultProducts);
        console.log("Initial default products loaded into localStorage."); 
    }
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
        imageUrl: newProduct.image || 'https://via.placeholder.com/280x200?text=No+Image+Available' 
    };

    products.push(product); 
    saveProductsToStorage(products); 
    allProducts = products; 
    
    renderSellerProducts(); 
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
    
    const wishlistIds = getWishlistIds(); 
    const productHtmlArray = productsToRender.map(product => {
        const formattedPrice = product.price.toLocaleString('ko-KR') + '원';
        const soldOutClass = product.stock <= 0 ? 'sold-out-overlay' : '';
        const stockStatus = product.stock > 0 ? 'In Stock' : 'Sold Out';
        const buttonDisabled = product.stock <= 0 ? 'disabled' : '';
        const isWished = wishlistIds.includes(product.id); 

        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                <div class="${soldOutClass}"></div> 
                
                <button class="btn-wishlist ${isWished ? 'active' : ''}" data-id="${product.id}">
                    <span class="heart-icon">${isWished ? '❤️' : '♡'}</span> 
                </button>
                
                <h3>${product.name}</h3>
                <p class="price">${formattedPrice}</p>
                <p class="category">Category: ${product.category}</p>
                <p class="tags">Tags: ${product.tags.join(', ')}</p>
                
                <button class="btn-add-to-cart btn-primary" ${buttonDisabled} data-id="${product.id}">
                    ${stockStatus} | Add to Cart
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




function updateWishlistCount(count) {
    const wishlistCountElement = document.querySelector('#wishlist-btn');
    if (wishlistCountElement) {
        wishlistCountElement.textContent = `Wishlist (${count})`; 
    }
}

function getWishlistIds() {
    const wishlistJson = localStorage.getItem(WISHLIST_KEY);
    return wishlistJson ? JSON.parse(wishlistJson) : []; 
}

function saveWishlistIds(ids) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    updateWishlistCount(ids.length); 
}

function toggleWishlist(productId) {
    let wishlistIds = getWishlistIds();
    const index = wishlistIds.indexOf(productId);

    if (index === -1) {
        wishlistIds.push(productId);
        alert(`Product ${productId} added to Wishlist!`);
    } else {
        wishlistIds.splice(index, 1);
        alert(`Product ${productId} removed from Wishlist!`);
    }

    saveWishlistIds(wishlistIds); 
    loadEmbeddedProducts();
}

function updateCartCount(count) {
    const cartCountElement = document.querySelector('#cart-btn');
    if (cartCountElement) {
        cartCountElement.textContent = `Cart (${count})`; 
    }
}

function getCartItems() {
    const cartJson = localStorage.getItem(CART_KEY);
    return cartJson ? JSON.parse(cartJson) : {}; 
}

function saveCartItems(items) {
    const itemIds = Object.keys(items);
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartCount(itemIds.length); 
}

function addToCart(productId) {
    let cartItems = getCartItems();
    
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
        alert("This item is currently sold out and cannot be added to the cart.");
        return;
    }

    cartItems[productId] = (cartItems[productId] || 0) + 1;
    
    saveCartItems(cartItems);
    alert(`Product ${productId} added to Cart. Current quantity: ${cartItems[productId]}`);
}




function viewWishlist() {
    const wishlistIds = getWishlistIds();
    const productNames = allProducts
        .filter(p => wishlistIds.includes(p.id))
        .map(p => p.name);
        
    if (productNames.length === 0) {
        alert("Wishlist is empty.");
        return;
    }

    alert(`[Wishlist Items]\n\n${productNames.join('\n')}`);
    console.log("Current Wishlist:", productNames);
}

function viewCart() {
    const cartItems = getCartItems();
    const itemIds = Object.keys(cartItems);

    if (itemIds.length === 0) {
        alert("Cart is empty.");
        return;
    }

    let cartSummary = itemIds.map(id => {
        const product = allProducts.find(p => p.id === parseInt(id));
        return `${product.name} (Qty: ${cartItems[id]})`;
    }).join('\n');

    alert(`[Cart Items]\n\n${cartSummary}`);
    console.log("Current Cart:", cartItems);
}



function initProductControls() {
    updateWishlistCount(getWishlistIds().length);
    updateCartCount(Object.keys(getCartItems()).length);
    
    const container = document.getElementById('product-list-container');
    if (!container) return;

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;

        const productId = parseInt(card.dataset.id);
        if (isNaN(productId)) return;

        const heartButton = e.target.closest('.btn-wishlist');
        if (heartButton) {
             toggleWishlist(productId);
             return; 
        }
        
        const cartButton = e.target.closest('.btn-add-to-cart');
        if (cartButton && !cartButton.disabled) {
            addToCart(productId); 
        }
    });
}


function handleLogout() {
    
    alert('You have been logged out!');
    window.location.href = 'mainpage.html';
}

function initNavControls() {
    const wishlistLink = document.getElementById('wishlist-btn');
    const cartLink = document.getElementById('cart-btn');
    const logoutButton = document.getElementById('logout-btn');

    if (wishlistLink) {
        wishlistLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            viewWishlist(); 
        });
    }

    if (cartLink) {
        cartLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            viewCart(); 
        });
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

function initFilterControls() {
    const controlPanel = document.getElementById('control-panel');
    if (!controlPanel) return;

    const filterButtons = controlPanel.querySelectorAll('button[data-category]'); 

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
    
    const sortSelect = document.querySelector('#sort-options');
    if (sortSelect) initSortControls();         

    const searchInput = document.querySelector('#search-input');
    if (searchInput) initSearchControls();
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

function initSortControls() {
    const sortSelect = document.getElementById('sort-options');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.value;
        sortProducts(selectedOption);
    });
}

function sortProducts(option) {
    let productsToRender = getProductsFromStorage();
    let sortedProducts = [...productsToRender]; 

    if (option === 'price-asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (option === 'price-desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (option === 'name-asc') {
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    renderProducts(sortedProducts);
}

function initSearchControls() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        
        searchProducts(keyword);
    });
}

function searchProducts(keyword) {
    const productsToSearch = getProductsFromStorage();
    
    if (!keyword.trim()) {
        renderProducts(productsToSearch);
        return;
    }
    
    const searchResults = productsToSearch.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(keyword);
        const tagMatch = product.tags.some(tag => tag.toLowerCase().includes(keyword)); 
        
        return nameMatch || tagMatch;
    });
    
    renderProducts(searchResults);
}




document.addEventListener('DOMContentLoaded', () => {
    initializeData();
    
    loadEmbeddedProducts();
    
    initProductControls();
    
    initNavControls();

    initFilterControls();
    
});