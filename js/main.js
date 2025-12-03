// js/main.js

function closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; 
    }
}

function initSellerDashboard() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    const submitButton = document.getElementById('submit-new-product');
    const formTitle = document.querySelector('#product-registration-form h2');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const newProduct = {
            name: document.getElementById('p-name').value,
            price: document.getElementById('p-price').value,
            category: document.getElementById('p-category').value,
            stock: document.getElementById('p-stock').value,
            tags: document.getElementById('p-tags').value,
            image: document.getElementById('p-image').value 
        };

        try {
            if (typeof editingProductId === 'number' && !isNaN(editingProductId)) {
                await updateProduct(editingProductId, newProduct);
                alert(`Product "${newProduct.name}" updated successfully!`);
                editingProductId = null;
                if (submitButton) submitButton.textContent = 'Register Product';
                if (formTitle) formTitle.textContent = '➕ Add New Product (Image URL Supported)';
            } else {
                await addNewProduct(newProduct);
                alert(`Product "${newProduct.name}" registered successfully!`);
            }

            form.reset(); 
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Error saving product. Please try again.');
        }
    });

    renderSellerProducts().then(() => {
        // Start auto-refresh after initial render
        if (typeof startAutoRefresh === 'function') {
            startAutoRefresh();
        }
    }); 
}

// Removed window.handlePartnerLoginClick - no longer needed since inline onclick was removed

document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeData();
    } catch (err) {
        console.error('Error initializing data:', err);
    } 
    
    const pathname = window.location.pathname;
    const href = window.location.href;
    let currentPage = pathname.split('/').pop();
    
    if (!currentPage || currentPage === '' || currentPage.includes('kyinnforwebproject')) {
        const parts = pathname.split('/').filter(p => p && p.endsWith('.html'));
        if (parts.length > 0) {
            currentPage = parts[parts.length - 1];
        }
    }
    
    if (!currentPage || currentPage === '') {
        if (href.includes('login.html')) currentPage = 'login.html';
        else if (href.includes('partner_login.html')) currentPage = 'partner_login.html';
        else if (href.includes('user.html')) currentPage = 'user.html';
        else if (href.includes('seller.html')) currentPage = 'seller.html';
    }
    
    console.log('Current page detected:', currentPage, 'from pathname:', pathname);

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }

    if (currentPage === 'login.html' || pathname.includes('login.html') || href.includes('login.html')) {
        console.log('Setting up login page handlers');
        try {
            handleRoleSwitch();
            handleMainPageRedirect();
        } catch (err) {
            console.error('Error setting up login handlers:', err);
        }
    }
    
    else if (currentPage === 'partner_login.html' || pathname.includes('partner_login.html') || href.includes('partner_login.html')) {
        console.log('Setting up partner login page handlers');
        try {
            // Call immediately and also with delay to ensure it works
            handlePartnerLogin();
            handleMainPageRedirect();
            
            // Also try after a delay as backup
            setTimeout(() => {
                handlePartnerLogin();
                handleMainPageRedirect();
            }, 100);
        } catch (err) {
            console.error('Error setting up partner login handlers:', err);
        }
    }
    
    else if (currentPage === 'user.html') {
        const hasAccess = handleAccessCheck('buyer', '../html/login.html'); 
        
        if (hasAccess) {
             handleLogout(); 
             loadEmbeddedProducts().then(() => {
                 // Start auto-refresh after initial load
                 if (typeof startAutoRefresh === 'function') {
                     startAutoRefresh();
                 }
             });     
             initProductControls();
             initFilterControls();       
             initSortControls();         
             initSearchControls();       
             
             const wishlistLink = document.getElementById('wishlist-btn');
             const cartLink = document.getElementById('cart-btn');
             const ordersLink = document.getElementById('orders-btn');

             if (wishlistLink) wishlistLink.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (typeof viewWishlist === 'function') {
                     viewWishlist();
                 }
             });
             if (cartLink) cartLink.addEventListener('click', (e) => {
                 e.preventDefault();
                 if (typeof viewCart === 'function') {
                     viewCart();
                 }
             });
             if (ordersLink) ordersLink.addEventListener('click', (e) => {
                 e.preventDefault();
                 console.log('Orders button clicked');
                 if (typeof viewOrders === 'function') {
                     viewOrders();
                 } else {
                     console.error('viewOrders function not found');
                     alert('Error: Orders function not available. Please refresh the page.');
                 }
             });
        }
    }
    
    else if (currentPage === 'seller.html') {
        const hasAccess = handleAccessCheck('seller', '../html/partner_login.html'); 
        
        if (hasAccess) {
             handleLogout(); 
             initSellerDashboard(); 
        }
    }
    
    // Removed fallback handler for partner-login-btn - handlePartnerLogin() already handles it
    // with proper duplicate prevention when on partner_login.html page
});
