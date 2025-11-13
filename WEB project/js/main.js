
function initSellerDashboard() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const newProduct = {
            name: document.getElementById('p-name').value,
            price: document.getElementById('p-price').value,
            category: document.getElementById('p-category').value,
            stock: document.getElementById('p-stock').value,
            tags: document.getElementById('p-tags').value,
            image: document.getElementById('p-image').value 
        };

        addNewProduct(newProduct);

        alert(`Product "${newProduct.name}" registered successfully!`);
        form.reset(); 
    });

    renderSellerProducts(); 
}


document.addEventListener('DOMContentLoaded', () => {
    
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'login.html' || currentPage === 'partner_login.html') {
        handleRoleSwitch(); 
        handlePartnerLogin(); 
        handleMainPageRedirect();
    }

    else if (currentPage === 'user.html') {
        const hasAccess = handleAccessCheck('buyer', '../html/login.html'); 
        
        if (hasAccess) {
             handleLogout();             
             loadEmbeddedProducts();     
             initFilterControls();       
        }
    }
    
    else if (currentPage === 'seller.html') {
        const hasAccess = handleAccessCheck('seller', '../html/partner_login.html'); 
        
        if (hasAccess) {
             handleLogout();             
             initSellerDashboard(); 
        }
    }
});

