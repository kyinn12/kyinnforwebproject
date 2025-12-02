// js/data.js

const productListContainer = document.getElementById('product-list-container');
let allProducts = []; 
let editingProductId = null;

const STORAGE_KEY = 'codedlookProducts';
const WISHLIST_KEY = 'codedlookWishlist'; 
const CART_KEY = 'codedlookCart';       
const DELETED_PRODUCTS_KEY = 'codedlookDeletedProducts';
const API_BASE_URL = 'http://localhost:4000';
const USE_API = false; // Set to false for GitHub Pages (uses static JSON file)

// Cloud storage for sharing across browsers
// Using JSONBin.io (free JSON storage service)
const CLOUD_STORAGE_URL = 'https://api.jsonbin.io/v3/b';
const CLOUD_STORAGE_BIN_ID = '692e8f8ad0ea881f400d3e91'; // Your bin ID
const USE_CLOUD_STORAGE = true; // Set to true to enable cloud storage
// IMPORTANT: JSONBin.io requires an API key for write operations
// Get your API key from: https://jsonbin.io/app/account/api-keys
// Then add it below:
const JSONBIN_API_KEY = '$2a$10$NuhW8DlovuYhDBgGTIGsJeR0935I.7JzDzd8CkF0VVnYvgog3YZfG'; // X-MASTER-KEY from JSONBin.io

async function fetchProductsFromApi() {
  if (USE_API) {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (!res.ok) {
        throw new Error('Failed to fetch products from API');
      }
      const products = await res.json();
      return products.map(p => ({
        ...p,
        id: typeof p.id === 'string' ? parseInt(p.id) : p.id
      }));
    } catch (err) {
      console.warn('API not available, falling back to static JSON file');
      return fetchProductsFromFile();
    }
  } else {
    return fetchProductsFromFile();
  }
}

async function fetchProductsFromFile() {
  try {
    // Get the directory where this script is located
    const scripts = document.getElementsByTagName('script');
    let scriptPath = 'js';
    for (let script of scripts) {
      if (script.src && script.src.includes('data.js')) {
        const url = new URL(script.src, window.location.href);
        scriptPath = url.pathname.substring(0, url.pathname.lastIndexOf('/'));
        break;
      }
    }
    
    // Try multiple paths - works for both local and GitHub Pages
    const paths = [
      `${scriptPath}/items.json`,
      'js/items.json',
      '../js/items.json',
      '/js/items.json',
      './js/items.json',
      'kyinnforwebproject/js/items.json'
    ];
    
    let lastError = null;
    for (const path of paths) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          const data = await res.json();
          const products = data.products || data;
          console.log(`✅ Successfully loaded ${products.length} products from ${path}`);
          return products.map(p => ({
            ...p,
            id: typeof p.id === 'string' ? parseInt(p.id) : p.id
          }));
        }
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    
    throw lastError || new Error('Failed to load items.json from all paths');
  } catch (err) {
    console.error('Failed to load products from file:', err);
    console.warn('Falling back to localStorage');
    return getProductsFromStorage();
  }
}

const defaultProducts = [];

function getProductsFromStorage() {
    const productsJson = localStorage.getItem(STORAGE_KEY);
    return productsJson ? JSON.parse(productsJson) : defaultProducts;
}

function saveProductsToStorage(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    if (USE_CLOUD_STORAGE && CLOUD_STORAGE_BIN_ID) {
        syncToCloudStorage(products).catch(err => {
            console.warn('Failed to sync to cloud storage:', err);
        });
    }
}

async function syncToCloudStorage(products) {
    if (!CLOUD_STORAGE_BIN_ID) {
        console.warn('⚠️ No cloud storage bin ID configured');
        return false;
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add API key if available (required for write operations)
        if (JSONBIN_API_KEY) {
            headers['X-Master-Key'] = JSONBIN_API_KEY;
            // Debug: Log first few characters to verify key is set (don't log full key for security)
            console.log('🔑 Using API key:', JSONBIN_API_KEY.substring(0, 10) + '...');
        } else {
            console.warn('⚠️ No API key provided - write operations will fail');
        }
        
        // Also sync deleted products list so deletions sync across browsers
        const deletedProducts = getDeletedProductIds();
        
        const url = `${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}`;
        console.log('📤 Syncing to:', url);
        console.log('📦 Products to sync:', products.length);
        console.log('🗑️ Deleted products to sync:', deletedProducts.length);
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ 
                products,
                deletedProducts 
            })
        });
        
        if (response.ok) {
            const result = await response.json().catch(() => ({}));
            console.log('✅ Synced to cloud storage successfully - all browsers will see this change');
            console.log('📦 Synced products:', products.length);
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorText = await response.text().catch(() => '');
            console.error('❌ Cloud storage sync FAILED:', response.status);
            console.error('📋 Error details:', errorData || errorText);
            console.error('🔑 API Key used:', JSONBIN_API_KEY ? JSONBIN_API_KEY.substring(0, 10) + '...' : 'NONE');
            console.error('🆔 Bin ID:', CLOUD_STORAGE_BIN_ID);
            
            if (response.status === 401 || response.status === 403) {
                console.error('💡 401/403 ERROR: Authentication failed');
                console.error('💡 Possible causes:');
                console.error('   1. API key is incorrect or incomplete');
                console.error('   2. API key and bin are from different accounts');
                console.error('   3. Bin is private and requires API key (you have one, so check #1 or #2)');
                console.error('💡 SOLUTION:');
                console.error('   - Verify bin exists: https://jsonbin.io/app/bins');
                console.error('   - Verify API key: https://jsonbin.io/app/account/api-keys');
                console.error('   - Make sure both are from the SAME account');
                console.error('   - Copy the ENTIRE X-MASTER-KEY (starts with $2a$10$)');
                console.error('   - Make bin public: Go to bin settings → Change to "Public"');
            } else if (response.status === 404) {
                console.error('💡 404 ERROR: Bin ID not found');
                console.error('💡 Check CLOUD_STORAGE_BIN_ID is correct:', CLOUD_STORAGE_BIN_ID);
            }
            return false;
        }
    } catch (err) {
        console.error('❌ Cloud storage sync error (data saved locally):', err.message);
        return false;
    }
}

async function syncFromCloudStorage() {
    if (!USE_CLOUD_STORAGE || !CLOUD_STORAGE_BIN_ID) return null;
    try {
        const headers = {};
        if (JSONBIN_API_KEY) {
            headers['X-Master-Key'] = JSONBIN_API_KEY;
        }
        
        const url = `${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}/latest`;
        console.log('📥 Syncing from:', url);
        if (JSONBIN_API_KEY) {
            console.log('🔑 Using API key:', JSONBIN_API_KEY.substring(0, 10) + '...');
        } else {
            console.log('ℹ️ No API key - bin must be public for reads');
        }
        
        const res = await fetch(url, {
            headers: headers
        });
        
        if (res.ok) {
            const data = await res.json();
            const cloudProducts = data.record?.products || [];
            const cloudDeletedProducts = data.record?.deletedProducts || [];
            
            if (Array.isArray(cloudProducts)) {
                // Always sync deleted products list from cloud (even if empty)
                // Cloud deleted list is the source of truth
                if (Array.isArray(cloudDeletedProducts)) {
                    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(cloudDeletedProducts));
                    console.log('✅ Synced deleted products list from cloud:', cloudDeletedProducts.length, 'deleted IDs:', cloudDeletedProducts);
                } else {
                    // If cloud doesn't have deletedProducts, initialize empty array
                    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify([]));
                    console.log('✅ Initialized empty deleted products list');
                }
                
                // Get all products: cloud (from storage), local storage, and items.json
                const localProducts = getProductsFromStorage();
                const fileProducts = await fetchProductsFromFile();
                
                // Create a map - CLOUD is source of truth, then local, then items.json
                const mergedMap = new Map();
                
                // CLOUD is the source of truth for storage products
                // Use cloud products directly (they are the storage products from cloud)
                // Then add items.json products (static file)
                
                // Step 1: Add items.json products first (base products)
                fileProducts.forEach(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    if (!isNaN(id) && id > 0) {
                        mergedMap.set(id, { ...p, id });
                    }
                });
                
                // Step 2: Add cloud products (source of truth for storage products - overrides items.json if same ID)
                // Cloud products are the storage products synced from cloud
                cloudProducts.forEach(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    if (!isNaN(id) && id > 0) {
                        mergedMap.set(id, { ...p, id });
                    }
                });
                
                // Step 3: Add any local storage products that aren't in cloud (newer local additions that haven't synced yet)
                // Only add if they're not already in cloud (cloud is source of truth)
                localProducts.forEach(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    if (!isNaN(id) && id > 0 && !mergedMap.has(id)) {
                        // This product exists locally but not in cloud - add it
                        mergedMap.set(id, { ...p, id });
                    }
                });
                
                // Save ONLY storage products (cloud + any new local) to localStorage
                // Exclude items.json products from storage
                const fileProductIds = fileProducts.map(fp => {
                    const fid = typeof fp.id === 'string' ? parseInt(fp.id) : fp.id;
                    return isNaN(fid) ? 0 : fid;
                });
                const storageProductsOnly = Array.from(mergedMap.values()).filter(p => {
                    const pid = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return !fileProductIds.includes(pid);
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProductsOnly));
                
                // Filter out deleted products and update allProducts
                // Use the cloud deleted list (already synced to localStorage above)
                const deletedIds = getDeletedProductIds();
                console.log('🔍 Filtering products. Deleted IDs to exclude:', deletedIds);
                
                const beforeFilter = Array.from(mergedMap.values()).length;
                const finalProducts = Array.from(mergedMap.values()).filter(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    // Normalize deleted IDs for comparison
                    const normalizedDeletedIds = deletedIds.map(did => typeof did === 'string' ? parseInt(did) : did);
                    const isDeleted = normalizedDeletedIds.includes(id);
                    if (isDeleted) {
                        console.log('🚫 Filtering out deleted product ID:', id, '(was in deleted list:', deletedIds, ')');
                    }
                    return !isNaN(id) && id > 0 && !isDeleted;
                });
                
                allProducts = finalProducts; // Update global allProducts
                console.log('✅ Synced from cloud storage:', cloudProducts.length, 'cloud products,', fileProducts.length, 'from items.json,', beforeFilter, 'before filter,', finalProducts.length, 'after filtering deleted');
                return finalProducts;
            }
        } else {
            const errorText = await res.text().catch(() => '');
            if (res.status === 404) {
                console.error('❌ Bin ID not found (404). The bin does not exist.');
                console.error('💡 SOLUTION: Create a new bin at https://jsonbin.io/app/bins');
                console.error('💡 Then update CLOUD_STORAGE_BIN_ID in data.js with your new bin ID');
                console.error('💡 See SETUP_JSONBIN.md for detailed instructions');
            } else {
                console.warn('⚠️ Cloud storage read failed:', res.status, errorText);
                if (res.status === 401 || res.status === 403) {
                    console.warn('💡 TIP: Bin might be private. Make it public or add API key.');
                }
            }
        }
    } catch (err) {
        console.warn('⚠️ Failed to sync from cloud storage (using local data):', err.message);
    }
    return null;
}

function getDeletedProductIds() {
    const deletedJson = localStorage.getItem(DELETED_PRODUCTS_KEY);
    const ids = deletedJson ? JSON.parse(deletedJson) : [];
    // Normalize all IDs to numbers for consistent comparison
    return ids.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id) && id > 0);
}

function addToDeletedProducts(productId) {
    const deletedIds = getDeletedProductIds();
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    if (!deletedIds.includes(normalizedId)) {
        deletedIds.push(normalizedId);
        localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(deletedIds));
    }
}

function removeFromDeletedProducts(productId) {
    const deletedIds = getDeletedProductIds();
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    const filtered = deletedIds.filter(id => id !== normalizedId);
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(filtered));
}

function initializeData() {
    try {
    if (!localStorage.getItem(STORAGE_KEY)) {
        saveProductsToStorage(defaultProducts);
        }
    } catch (err) {
        console.log('initializeData: Using API for products');
    }
}

async function addNewProduct(newProduct) {
    const productPayload = {
        name: newProduct.name,
        price: parseInt(newProduct.price),
        category: newProduct.category,
        tags: newProduct.tags.split(',').map(tag => tag.trim()),
        stock: parseInt(newProduct.stock),
      imageUrl: newProduct.image || 'https://i.imgur.com/FRTPdpc.jpeg',
    };
  
    if (USE_API) {
      try {
        await fetch(`${API_BASE_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload),
        });
        allProducts = await fetchProductsFromApi();
      } catch (err) {
        console.error('API not available, saving to localStorage only');
        let products = getProductsFromStorage();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 101;
        productPayload.id = newId;
        products.push(productPayload);
        saveProductsToStorage(products);
        allProducts = products;
      }
    } else {
      try {
        if (USE_CLOUD_STORAGE) {
            await syncFromCloudStorage();
        }
        const fileProducts = await fetchProductsFromFile();
        const storageProducts = getProductsFromStorage();
        const allExistingProducts = [...fileProducts, ...storageProducts];
        const numericIds = allExistingProducts
          .map(p => {
            const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return isNaN(id) ? 0 : id;
          })
          .filter(id => id > 0);
        const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 110;
        productPayload.id = newId;
        
        let storageProducts2 = getProductsFromStorage();
        storageProducts2.push(productPayload);
        
        // Save locally first
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts2));
        
        // Force sync to cloud storage after add (wait for it to complete)
        if (USE_CLOUD_STORAGE) {
          const syncSuccess = await syncToCloudStorage(storageProducts2);
          if (syncSuccess) {
            console.log('✅ Product added and synced - visible in all browsers now!');
          } else {
            console.warn('⚠️ Product added locally but failed to sync to cloud.');
            console.warn('⚠️ Other browsers may not see it. Check console for API key instructions.');
          }
        }
        
        const deletedIds = getDeletedProductIds();
        const mergedProducts = [...fileProducts, ...storageProducts2];
        const mergedMap = new Map();
        mergedProducts.forEach(p => {
          const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          if (!isNaN(id) && id > 0 && !deletedIds.includes(id)) {
            mergedMap.set(id, { ...p, id });
          }
        });
        allProducts = Array.from(mergedMap.values());
      } catch (err) {
        console.warn('Error merging products:', err);
        let products = getProductsFromStorage();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 110;
        productPayload.id = newId;
        products.push(productPayload);
    saveProductsToStorage(products); 
    allProducts = products; 
      }
    }
    
    renderSellerProducts(); 
}

async function updateProduct(id, updatedProduct) {
    const normalizedId = typeof id === 'string' ? parseInt(id) : id;
    const updated = {
      name: updatedProduct.name,
      price: parseInt(updatedProduct.price),
      category: updatedProduct.category,
      tags: updatedProduct.tags.split(',').map(tag => tag.trim()),
      stock: parseInt(updatedProduct.stock),
      imageUrl: updatedProduct.image || '',
    };
  
    if (USE_API) {
      try {
        await fetch(`${API_BASE_URL}/products/${normalizedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        allProducts = await fetchProductsFromApi();
      } catch (err) {
        console.error('API not available, updating localStorage only');
    let products = getProductsFromStorage();
        const index = products.findIndex(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return pId === normalizedId;
        });
        if (index !== -1) {
          products[index] = { ...products[index], ...updated, id: normalizedId };
          saveProductsToStorage(products);
          allProducts = products;
        }
      }
    } else {
      try {
        if (USE_CLOUD_STORAGE) {
            await syncFromCloudStorage();
        }
        const fileProducts = await fetchProductsFromFile();
        let storageProducts = getProductsFromStorage();
        
        const fileProductIds = fileProducts.map(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return isNaN(pId) ? 0 : pId;
        });
        
        if (fileProductIds.includes(normalizedId)) {
          alert('Cannot edit products from items.json. Only products you added can be edited.');
          return;
        }
        
        const index = storageProducts.findIndex(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return pId === normalizedId;
        });
        
        if (index !== -1) {
          storageProducts[index] = { ...storageProducts[index], ...updated, id: normalizedId };
          
          // Save locally first
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
          
          // Force sync to cloud storage after update (wait for it to complete)
          if (USE_CLOUD_STORAGE) {
            const syncSuccess = await syncToCloudStorage(storageProducts);
            if (syncSuccess) {
              console.log('✅ Product updated and synced - visible in all browsers now!');
            } else {
              console.warn('⚠️ Update saved locally but failed to sync to cloud.');
              console.warn('⚠️ Other browsers may not see the change. Check console for API key instructions.');
            }
          }
          
          const deletedIds = getDeletedProductIds();
          const mergedProducts = [...fileProducts, ...storageProducts];
          const mergedMap = new Map();
          mergedProducts.forEach(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            if (!isNaN(pId) && pId > 0 && !deletedIds.includes(pId)) {
              mergedMap.set(pId, { ...p, id: pId });
            }
          });
          allProducts = Array.from(mergedMap.values());
          console.log(`✅ Product ID ${normalizedId} updated successfully.`);
        } else {
          console.warn(`Product ID ${normalizedId} not found in localStorage`);
          alert('Product not found. It may have been deleted or is from items.json.');
        }
      } catch (err) {
        console.error('Error updating product:', err);
        alert('Error updating product. Please try again.');
        return;
      }
    }
    
    await renderSellerProducts(); 
}

async function deleteProduct(id) {
    const normalizedId = typeof id === 'string' ? parseInt(id) : id;
    
    if (USE_API) {
      try {
        await fetch(`${API_BASE_URL}/products/${normalizedId}`, {
          method: 'DELETE',
        });
        allProducts = await fetchProductsFromApi();
      } catch (err) {
        console.error('API not available, deleting from localStorage only');
        let products = getProductsFromStorage();
        products = products.filter(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return pId !== normalizedId;
        });
        saveProductsToStorage(products);
        allProducts = products;
      }
    } else {
      try {
        // Sync from cloud first to get latest state
        if (USE_CLOUD_STORAGE) {
            await syncFromCloudStorage();
        }
        
        const fileProducts = await fetchProductsFromFile();
        let storageProducts = getProductsFromStorage();
        
        const fileProductIds = fileProducts.map(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return isNaN(pId) ? 0 : pId;
        });
        
        if (fileProductIds.includes(normalizedId)) {
          // Product is from items.json - mark as deleted
          addToDeletedProducts(normalizedId);
          // Get the updated deleted list AFTER adding
          const deletedIds = getDeletedProductIds();
          console.log('🗑️ Deleted product ID:', normalizedId);
          console.log('🗑️ Updated deleted list:', deletedIds);
          console.log('🗑️ Verifying deleted list in localStorage:', localStorage.getItem(DELETED_PRODUCTS_KEY));
          
          // Sync deleted list AND current storage products to cloud
          if (USE_CLOUD_STORAGE) {
            // Double-check deleted list is correct before syncing
            const verifyDeleted = getDeletedProductIds();
            console.log('🗑️ Verifying deleted list before sync:', verifyDeleted);
            const syncSuccess = await syncToCloudStorage(storageProducts);
            if (syncSuccess) {
              console.log('✅ Product deleted (from items.json) and synced - removed from all browsers now!');
              console.log('🗑️ Deleted IDs synced to cloud:', verifyDeleted);
            } else {
              console.warn('⚠️ Delete saved locally but failed to sync to cloud.');
              console.warn('⚠️ Other browsers may not see the change. Check console for API key instructions.');
            }
          }
        } else {
          // Product is from storage - remove it from storage
          const beforeCount = storageProducts.length;
          storageProducts = storageProducts.filter(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return pId !== normalizedId;
          });
          
          if (storageProducts.length === beforeCount) {
            console.warn(`Product ID ${normalizedId} not found in localStorage`);
            // Product might exist in cloud but not local - still sync to ensure consistency
            if (USE_CLOUD_STORAGE) {
              await syncToCloudStorage(storageProducts);
            }
            return;
          }
          
          // Save locally first
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
          console.log('🗑️ Removed product from storage. Storage products now:', storageProducts.length);
          
          // Force sync to cloud storage after delete (wait for it to complete)
          if (USE_CLOUD_STORAGE) {
            const syncSuccess = await syncToCloudStorage(storageProducts);
            if (syncSuccess) {
              console.log('✅ Product deleted (from storage) and synced - removed from all browsers now!');
            } else {
              console.warn('⚠️ Delete saved locally but failed to sync to cloud.');
              console.warn('⚠️ Other browsers may not see the change. Check console for API key instructions.');
            }
          }
        }
        
        const deletedIds = getDeletedProductIds();
        console.log('🔍 After delete - Deleted IDs list:', deletedIds);
        const mergedProducts = [...fileProducts, ...storageProducts];
        const mergedMap = new Map();
        mergedProducts.forEach(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          // Normalize deleted IDs for comparison
          const normalizedDeletedIds = deletedIds.map(did => typeof did === 'string' ? parseInt(did) : did);
          const isDeleted = normalizedDeletedIds.includes(pId);
          if (!isNaN(pId) && pId > 0 && !isDeleted) {
            mergedMap.set(pId, { ...p, id: pId });
          } else if (isDeleted) {
            console.log('🚫 Excluding deleted product ID:', pId);
          }
        });
        allProducts = Array.from(mergedMap.values());
        console.log(`✅ Product ID ${normalizedId} deleted successfully.`);
        console.log(`📊 Total products after delete: ${allProducts.length}`);
        console.log(`📋 Products in list:`, allProducts.map(p => p.id));
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error deleting product. Please try again.');
        return;
      }
    }
  
    // Re-render to show updated list (will sync from cloud if enabled)
    // Small delay to ensure cloud sync completes
    await new Promise(resolve => setTimeout(resolve, 500));
    await renderSellerProducts();
}

async function loadEmbeddedProducts() {
    try {
      if (USE_API) {
        const products = await fetchProductsFromApi();
        allProducts = products;
        renderProducts(allProducts);
      } else {
        if (USE_CLOUD_STORAGE) {
            await syncFromCloudStorage();
        }
        const fileProducts = await fetchProductsFromFile();
        const storageProducts = getProductsFromStorage();
        const deletedIds = getDeletedProductIds();
        const mergedProducts = [...fileProducts, ...storageProducts];
        const mergedMap = new Map();
        mergedProducts.forEach(p => {
          const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          if (!isNaN(id) && id > 0 && !deletedIds.includes(id)) {
            mergedMap.set(id, { ...p, id });
          }
        });
        allProducts = Array.from(mergedMap.values());
        if (!allProducts || allProducts.length === 0) {
          console.error('No products found.');
          if (productListContainer) {
            productListContainer.innerHTML = `
              <p style="text-align: center; padding: 40px; color: #666;">
                No products available.
              </p>
            `;
          }
        } else {
          renderProducts(allProducts);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
    allProducts = getProductsFromStorage(); 
      if (!allProducts || allProducts.length === 0) {
        console.error('No products found.');
        if (productListContainer) {
          productListContainer.innerHTML = `
            <p style="text-align: center; padding: 40px; color: #666;">
              No products available.
            </p>
          `;
        }
      } else {
    renderProducts(allProducts);
      }
    }
}

function renderProducts(productsToRender) {
    if (!productListContainer) return;

    if (productsToRender.length === 0) {
        productListContainer.innerHTML = "<p class='text-center w-full'>No products match your criteria.</p>";
        return;
    }
    
    const wishlistIds = getWishlistIds().map(id => parseInt(id));
    const productHtmlArray = productsToRender.map(product => {
        const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
        const formattedPrice = product.price.toLocaleString('ko-KR') + '원';
        const soldOutClass = product.stock <= 0 ? 'sold-out-overlay' : '';
        const stockStatus = product.stock > 0 ? 'In Stock' : 'Sold Out';
        const buttonDisabled = product.stock <= 0 ? 'disabled' : '';
        const isWished = wishlistIds.includes(productId); 

        return `
            <div class="product-card" data-id="${productId}" data-category="${product.category}">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                <div class="${soldOutClass}"></div> 
                
                <button class="btn-wishlist ${isWished ? 'active' : ''}" data-id="${productId}">
                    <span class="heart-icon">${isWished ? '❤️' : '♡'}</span> 
                </button>
                
                <h3>${product.name}</h3>
                <p class="price">${formattedPrice}</p>
                <p class="category">Category: ${product.category}</p>
                <p class="tags">Tags: ${product.tags.join(', ')}</p>
                
                <button class="btn-add-to-cart btn-primary ${buttonDisabled ? 'btn-disabled' : ''}" ${buttonDisabled ? 'disabled' : ''} data-id="${productId}">
                    ${stockStatus} | Add to Cart
                </button>
            </div>
        `;
    });

    productListContainer.innerHTML = productHtmlArray.join('');
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
             e.preventDefault();
             toggleWishlist(productId);
             return; 
        }
        
        const cartButton = e.target.closest('.btn-add-to-cart');
        if (cartButton && !cartButton.disabled) {
            e.preventDefault();
            addToCart(productId); 
        }
    });
}

async function renderSellerProducts() {
    const sellerTableBody = document.querySelector('#product-table tbody');
    if (!sellerTableBody) return;
  
    // Always sync from cloud storage first to get latest changes from other browsers
    let products = null;
    if (USE_CLOUD_STORAGE && !USE_API) {
        try {
            products = await syncFromCloudStorage();
            // syncFromCloudStorage now includes items.json + cloud + local, and updates allProducts
            if (products && Array.isArray(products) && products.length > 0) {
                allProducts = products; // Use synced products (already filtered and merged)
                console.log('✅ Using synced products from cloud:', products.length);
            } else {
                console.warn('⚠️ Sync returned empty or invalid products, using fallback');
            }
        } catch (err) {
            console.error('❌ Error syncing from cloud:', err);
        }
    }
  
    // If sync didn't return products or we're not using cloud storage, build from local data
    if (!products || !Array.isArray(products) || products.length === 0) {
      if (USE_API) {
        products = await fetchProductsFromApi();
        allProducts = products;
      } else {
        // Fallback: build from local data
        console.log('📦 Building products from local data (fallback)');
        const fileProducts = await fetchProductsFromFile();
        const storageProducts = getProductsFromStorage();
        const deletedIds = getDeletedProductIds();
        const mergedProducts = [...fileProducts, ...storageProducts];
        const mergedMap = new Map();
        mergedProducts.forEach(p => {
          const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          if (!isNaN(id) && id > 0 && !deletedIds.includes(id)) {
            mergedMap.set(id, { ...p, id });
          }
        });
        products = Array.from(mergedMap.values());
        allProducts = products;
      }
    }
    
    // Use allProducts (which is now up-to-date) for rendering
    products = allProducts;
  
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
          <button class="btn-seller-edit" data-id="${product.id}">Edit</button>
            </td>
        `;
    });
    
    const deleteButtons = document.querySelectorAll('.btn-seller-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            console.log(`Attempting to delete product ID ${productId}.`);
            deleteProduct(productId);
        });
    });

    const editButtons = document.querySelectorAll('.btn-seller-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            startEditProduct(productId);
        });
    });
}

function startEditProduct(productId) {
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    const product = allProducts.find(p => {
        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return pId === normalizedId;
    });
    if (!product) {
        console.error(`Product with ID ${productId} not found in allProducts`);
        return;
    }

    const nameInput = document.getElementById('p-name');
    const imageInput = document.getElementById('p-image');
    const priceInput = document.getElementById('p-price');
    const categorySelect = document.getElementById('p-category');
    const stockInput = document.getElementById('p-stock');
    const tagsInput = document.getElementById('p-tags');
    const submitButton = document.getElementById('submit-new-product');
    const formTitle = document.querySelector('#product-registration-form h2');

    if (!nameInput || !priceInput || !categorySelect || !stockInput || !tagsInput) return;

    nameInput.value = product.name;
    if (imageInput) imageInput.value = product.imageUrl || '';
    priceInput.value = product.price;
    categorySelect.value = product.category;
    stockInput.value = product.stock;
    tagsInput.value = Array.isArray(product.tags) ? product.tags.join(', ') : '';

    editingProductId = productId;
    if (submitButton) submitButton.textContent = 'Save Changes';
    if (formTitle) formTitle.textContent = `✏️ Edit Product #${productId}`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        document.querySelectorAll('button[data-category]').forEach(btn => btn.classList.remove('active'));
        document.querySelector('button[data-category="All"]').classList.add('active');
    });
}

function sortProducts(option) {
    if (!allProducts || allProducts.length === 0) {
        console.warn('No products available to sort');
        return;
    }
    
    let sortedProducts = [...allProducts]; 

    if (option === 'price-asc') {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (option === 'price-desc') {
        sortedProducts.sort((a, b) => b.price - a.price);
    } else if (option === 'name-asc') {
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (option === 'default') {
        sortedProducts = allProducts;
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
    if (!allProducts || allProducts.length === 0) {
        console.warn('No products available to search');
        return;
    }
    
    if (!keyword.trim()) {
        renderProducts(allProducts);
        return;
    }
    
    const searchResults = allProducts.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(keyword);
        const tags = Array.isArray(product.tags) ? product.tags : [];
        const tagMatch = tags.some(tag => tag.toLowerCase().includes(keyword)); 
        
        return nameMatch || tagMatch;
    });
    
    renderProducts(searchResults);
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
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    wishlistIds = wishlistIds.map(id => typeof id === 'string' ? parseInt(id) : id);
    const index = wishlistIds.indexOf(normalizedId);

    if (index === -1) {
        wishlistIds.push(normalizedId);
        console.log(`Product ${normalizedId} added to Wishlist!`);
    } else {
        wishlistIds.splice(index, 1);
        console.log(`Product ${normalizedId} removed from Wishlist!`);
    }

    saveWishlistIds(wishlistIds); 
    loadEmbeddedProducts();
}

function viewWishlist() {
    const wishlistIds = getWishlistIds().map(id => typeof id === 'string' ? parseInt(id) : id);
    const items = allProducts
        .filter(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return wishlistIds.includes(pId);
        })
        .map(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return `
            <div class="wishlist-item" data-id="${pId}">
                <img src="${p.imageUrl}" class="wishlist-img" alt="${p.name}">
                <div class="item-details">
                    <h4>${p.name}</h4>
                    <p class="price">${p.price.toLocaleString('ko-KR')}원</p>
                </div>
                <button class="btn-remove-wishlist" data-id="${pId}">❌</button>
            </div>
        `;
        });
        
    const modalTitle = document.getElementById('modal-title');
    const modalListContainer = document.getElementById('modal-list-container');
    const modalSummary = document.getElementById('modal-summary');

    modalTitle.textContent = "My Wishlist";
    modalListContainer.innerHTML = `<div class="wishlist-grid-container">${items.length > 0 ? items.join('') : '<p class="p-4 text-center">Your wishlist is empty.</p>'}</div>`;
    modalSummary.innerHTML = `Total Items: <strong>${wishlistIds.length}</strong>`;

    document.getElementById('app-modal').style.display = 'flex';

    document.querySelectorAll('.btn-remove-wishlist').forEach(button => {
        button.addEventListener('click', (e) => {
            const idToRemove = parseInt(e.target.dataset.id);
            toggleWishlist(idToRemove);
            viewWishlist();
        });
    });
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
    const uniqueItemCount = Object.keys(items).length;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCartCount(uniqueItemCount); 
}

function addToCart(productId) {
    let cartItems = getCartItems();
    
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    const product = allProducts.find(p => {
        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return pId === normalizedId;
    });
    if (!product || product.stock <= (cartItems[normalizedId] || 0)) {
        alert("Cannot add more. Stock limit reached or item sold out.");
        return;
    }

    cartItems[normalizedId] = (cartItems[normalizedId] || 0) + 1;
    
    saveCartItems(cartItems);
    console.log(`Product ${normalizedId} added to Cart. Current quantity: ${cartItems[normalizedId]}`);
}

function viewCart() {
    const cartItems = getCartItems();
    const itemIds = Object.keys(cartItems);

    let totalPrice = 0;

    const itemsHtml = itemIds.map(id => {
        const searchId = parseInt(id);
        const product = allProducts.find(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return pId === searchId;
        });
        if (!product) return ''; 

        const quantity = cartItems[id];
        const itemTotal = product.price * quantity;
        totalPrice += itemTotal;

        return `
            <tr data-id="${id}">
                <td><img src="${product.imageUrl}" class="cart-img" alt="${product.name}">${product.name}</td>
                <td>${product.category}</td>
                <td>${product.price.toLocaleString('ko-KR')}원</td>
                <td>
                    <button class="btn-qty btn-qty-minus" data-id="${id}">-</button>
                    <span class="cart-qty" data-id="${id}">${quantity}</span>
                    <button class="btn-qty btn-qty-plus" data-id="${id}">+</button>
                </td>
                <td>${itemTotal.toLocaleString('ko-KR')}원</td>
                <td><button class="btn-remove-cart" data-id="${id}">Remove</button></td>
            </tr>
        `;
    }).join('');

    const modalTitle = document.getElementById('modal-title');
    const modalListContainer = document.getElementById('modal-list-container');
    const modalSummary = document.getElementById('modal-summary');
    const modal = document.getElementById('app-modal');

    modalTitle.textContent = "Shopping Cart";
    modalListContainer.innerHTML = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml.length > 0 ? itemsHtml : '<tr><td colspan="6" class="text-center">Your cart is empty.</td></tr>'}
            </tbody>
        </table>
    `;
    modalSummary.innerHTML = `
        <div>
            Grand Total: <span class="total-price" id="cart-grand-total">${totalPrice.toLocaleString('ko-KR')}원</span>
        </div>
        <button id="go-to-payment-btn" class="btn-payment">Go to Payment</button>
    `;

    modal.style.display = 'flex';

    document.querySelectorAll('.btn-remove-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const idToRemove = parseInt(e.target.dataset.id);
            removeProductFromCart(idToRemove);
            viewCart();
        });
    });

    document.querySelectorAll('.btn-qty-plus').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            changeCartQuantity(id, 1);
            viewCart();
        });
    });

    document.querySelectorAll('.btn-qty-minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            changeCartQuantity(id, -1);
            viewCart();
        });
    });

    const paymentBtn = document.getElementById('go-to-payment-btn');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', () => {
            alert(`Proceeding to payment. ${document.getElementById('cart-grand-total').textContent}`);
        });
    }
}

function removeProductFromCart(productId) {
    let cartItems = getCartItems();
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    
    if (cartItems[normalizedId]) {
        delete cartItems[normalizedId];
        saveCartItems(cartItems);
        console.log(`Product ${normalizedId} removed entirely from cart.`);
    }
}

function changeCartQuantity(productId, delta) {
    let cartItems = getCartItems();
    const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
    const currentQty = cartItems[normalizedId] || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
        removeProductFromCart(normalizedId);
        return;
    }

    const product = allProducts.find(p => {
        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return pId === normalizedId;
    });
    if (!product) return;

    if (newQty > product.stock) {
        alert("Cannot add more. Stock limit reached.");
        return;
    }

    cartItems[normalizedId] = newQty;
    saveCartItems(cartItems);
}
