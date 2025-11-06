// data.js - Contains embedded product data and rendering logic

const productListContainer = document.getElementById('product-list-container');
let allProducts = []; 

// --- EMBEDDED PRODUCT DATA (Bypasses CORS issue for file:/// protocol) ---
const embeddedProducts = [
    { "id": 101, "name": "Classic White T-Shirt", "price": 25000, "category": "Tops", "tags": ["Basic", "Cotton"], "stock": 50 },
    { "id": 102, "name": "Slim Fit Denim Pants", "price": 59000, "category": "Bottoms", "tags": ["Popular", "Daily"], "stock": 15 },
    { "id": 103, "name": "Lightweight Overfit Jacket", "price": 88000, "category": "Outerwear", "tags": ["New Arrival", "Sale"], "stock": 0 },
    { "id": 104, "name": "Vintage Pattern Skirt", "price": 42000, "category": "Bottoms", "tags": ["Women's", "Sale"], "stock": 35 },
    { "id": 105, "name": "Wool Knit Vest", "price": 31000, "category": "Tops", "tags": ["Autumn", "Warm"], "stock": 20 }
];


// Loads data from the embedded variable (replaces fetchProducts)
function loadEmbeddedProducts() {
    
    if (embeddedProducts.length === 0) {
        productListContainer.innerHTML = "<p>No products available.</p>";
        return;
    }
    
    allProducts = embeddedProducts;
    renderProducts(allProducts);
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

        const stockStatus = product.stock > 0 ? '재고 있음 (In Stock)' : '품절 (Sold Out)';
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