// js/data.js

const productListContainer = document.getElementById('product-list-container');
let allProducts = []; 
let editingProductId = null;
let autoRefreshInterval = null; // For auto-refreshing seller page

// Race condition prevention: operation locks
let isOperationInProgress = false; // Prevents concurrent operations
let isSyncing = false; // Prevents concurrent cloud syncs
let isDeleting = false; // Specific lock for delete operations to prevent race conditions
let deleteQueue = []; // Queue for delete operations if one is already in progress

const STORAGE_KEY = 'codedlookProducts';
const WISHLIST_KEY = 'codedlookWishlist'; 
const CART_KEY = 'codedlookCart';       
const DELETED_PRODUCTS_KEY = 'codedlookDeletedProducts';
const ORDERS_KEY = 'codedlookOrders';
const API_BASE_URL = 'http://localhost:4000';
const USE_API = false; // Set to false for GitHub Pages (uses static JSON file)

// Cloud storage for sharing across browsers
// Using JSONBin.io (free JSON storage service)
const CLOUD_STORAGE_URL = 'https://api.jsonbin.io/v3/b';
const CLOUD_STORAGE_BIN_ID = '692e8f8ad0ea881f400d3e91'; // Your bin ID
const USE_CLOUD_STORAGE = true; // Set to true to enable cloud storage
// IMPORTANT: JSONBin.io requires an API key for write operations
// Get your API key from: https://jsonbin.io/app/account/api-keys
// SECURITY WARNING: For production, store API key in localStorage or environment variable
// This is a fallback value - users should set their own key via localStorage.setItem('JSONBIN_API_KEY', 'your-key')
const JSONBIN_API_KEY_STORAGE_KEY = 'JSONBIN_API_KEY';
// IMPORTANT: This is a fallback key. JSONBin.io API keys are bcrypt hashes (60 characters).
// If you get 401 errors, verify your API key at https://jsonbin.io/app/account/api-keys
// The key should start with $2a$10$ and be exactly 60 characters long.
// Users should set their own key via: localStorage.setItem('JSONBIN_API_KEY', 'your-complete-60-char-key')
// WARNING: The default key below is INCOMPLETE (58 chars instead of 60). This will cause 401 errors.
// Replace it with your complete 60-character API key from JSONBin.io.
const JSONBIN_API_KEY_DEFAULT = '$2a$10$NuhW8DlovuYhDBgGTIGsJeR0935I.7JzDzd8CkF0VVnYvgog3YZfG'; // INCOMPLETE - Missing 2 characters
// Get API key from localStorage first, fallback to default (for development only)
function getJsonBinApiKey() {
    const storedKey = localStorage.getItem(JSONBIN_API_KEY_STORAGE_KEY);
    const key = storedKey || JSONBIN_API_KEY_DEFAULT;
    
    // Validate key length (bcrypt hashes should be exactly 60 characters)
    if (key && key.length !== 60) {
        console.warn(`⚠️ JSONBin API key length is ${key.length}, expected 60 characters. This may cause 401 authentication errors.`);
        console.warn('⚠️ Please set a complete 60-character API key via: localStorage.setItem("JSONBIN_API_KEY", "your-complete-key")');
    }
    
    return key;
}
// Note: Use getJsonBinApiKey() function instead of JSONBIN_API_KEY constant to get fresh value from localStorage

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

// Function to reset cloud storage to clean state
async function resetCloudStorage() {
    if (!CLOUD_STORAGE_BIN_ID) {
        console.warn('⚠️ No cloud storage bin ID configured');
        return false;
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        const apiKey = getJsonBinApiKey();
        if (apiKey) {
            headers['X-Master-Key'] = apiKey;
        } else {
            console.warn('⚠️ No API key provided - reset will fail');
            return false;
        }
        
        const url = `${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}`;
        
        // Reset to empty state
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ 
                products: [],
                deletedProducts: []
            })
        });
        
        if (response.ok) {
            // Also clear local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
            localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify([]));
            
            return true;
        } else {
            const errorText = await response.text().catch(() => '');
            console.error('❌ Failed to reset cloud storage:', response.status, errorText);
            return false;
        }
    } catch (err) {
        console.error('❌ Error resetting cloud storage:', err.message);
        return false;
    }
}

// Make reset function available globally for console access
if (typeof window !== 'undefined') {
    window.resetCloudStorage = resetCloudStorage;
}

async function syncToCloudStorage(products) {
    if (!CLOUD_STORAGE_BIN_ID) {
        console.warn('⚠️ No cloud storage bin ID configured');
        return false;
    }
    
    // Prevent concurrent syncs
    if (isSyncing) {
        // Wait for current sync to complete (max 5 seconds)
        let waitCount = 0;
        while (isSyncing && waitCount < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
        }
        if (isSyncing) {
            console.warn('⚠️ Sync timeout - another sync is taking too long');
            return false;
        }
    }
    
    isSyncing = true;
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Add API key if available (required for write operations)
        const apiKey = getJsonBinApiKey();
        if (apiKey) {
            headers['X-Master-Key'] = apiKey;
        } else {
            console.warn('⚠️ No API key provided - write operations will fail');
        }
        
        // Also sync deleted products list and orders so deletions and orders sync across browsers
        const deletedProducts = getDeletedProductIds();
        const orders = getOrders();
        
        const url = `${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({ 
                products,
                deletedProducts,
                orders
            })
        });
        
        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorText = await response.text().catch(() => '');
            console.error('❌ Cloud storage sync FAILED:', response.status);
            console.error('📋 Error details:', errorData || errorText);
            const apiKey = getJsonBinApiKey();
            console.error('🔑 API Key used:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');
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
    } finally {
        isSyncing = false;
    }
}

async function syncFromCloudStorage() {
    if (!USE_CLOUD_STORAGE || !CLOUD_STORAGE_BIN_ID) return null;
    try {
        const headers = {};
        const apiKey = getJsonBinApiKey();
        if (apiKey) {
            headers['X-Master-Key'] = apiKey;
        }
        
        const url = `${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}/latest`;
        
        const res = await fetch(url, {
            headers: headers
        });
        
        if (res.ok) {
            const data = await res.json();
            const cloudProducts = data.record?.products || [];
            const cloudDeletedProducts = data.record?.deletedProducts || [];
            const cloudOrders = data.record?.orders || [];
            
            // Sync orders from cloud - merge with local orders (don't overwrite)
            if (Array.isArray(cloudOrders)) {
                const localOrders = getOrders();
                // Merge orders: combine both arrays, remove duplicates by order ID
                const orderMap = new Map();
                // Add local orders first (newer)
                localOrders.forEach(order => {
                    orderMap.set(order.id, order);
                });
                // Add cloud orders (may have orders from other browsers)
                cloudOrders.forEach(order => {
                    if (!orderMap.has(order.id)) {
                        orderMap.set(order.id, order);
                    }
                });
                // Convert back to array, sort by ID (newest first)
                const mergedOrders = Array.from(orderMap.values()).sort((a, b) => b.id - a.id);
                localStorage.setItem(ORDERS_KEY, JSON.stringify(mergedOrders));
            } else {
                // Initialize empty orders if not in cloud, but keep local orders
                const localOrders = getOrders();
                if (localOrders.length === 0 && !localStorage.getItem(ORDERS_KEY)) {
                    localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
                }
            }
            
            if (Array.isArray(cloudProducts)) {
                // Always sync deleted products list from cloud (even if empty)
                // Cloud deleted list is the source of truth
                if (Array.isArray(cloudDeletedProducts)) {
                    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(cloudDeletedProducts));
                } else {
                    // If cloud doesn't have deletedProducts, initialize empty array
                    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify([]));
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
                
                const finalProducts = Array.from(mergedMap.values()).filter(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    // Normalize deleted IDs for comparison
                    const normalizedDeletedIds = deletedIds.map(did => typeof did === 'string' ? parseInt(did) : did);
                    const isDeleted = normalizedDeletedIds.includes(id);
                    return !isNaN(id) && id > 0 && !isDeleted;
                });
                
                allProducts = finalProducts; // Update global allProducts
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
    // Prevent concurrent operations
    if (isOperationInProgress) {
        console.warn('⚠️ Another operation is in progress. Please wait...');
        return;
    }
    
    isOperationInProgress = true;
    
    try {
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
          if (!syncSuccess) {
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
    } finally {
        isOperationInProgress = false;
    }
    
    await renderSellerProducts(); 
}

async function updateProduct(id, updatedProduct) {
    // Prevent concurrent operations
    if (isOperationInProgress) {
        console.warn('⚠️ Another operation is in progress. Please wait...');
        return;
    }
    
    isOperationInProgress = true;
    
    try {
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
        
        // Check if product is from items.json or storage
        const isFromItemsJson = fileProductIds.includes(normalizedId);
        
        if (isFromItemsJson) {
          // Product is from items.json - save edited version to cloud storage
          // This will override the items.json version in the merged view
          const editedProduct = { ...updated, id: normalizedId };
          
          // Check if product already exists in storage (from previous edit)
          const existingIndex = storageProducts.findIndex(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return pId === normalizedId;
          });
          
          if (existingIndex !== -1) {
            // Update existing edited version
            storageProducts[existingIndex] = editedProduct;
          } else {
            // Add new edited version (will override items.json version)
            storageProducts.push(editedProduct);
          }
          
          // Save locally first
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
          
          // Force sync to cloud storage after update
          if (USE_CLOUD_STORAGE) {
            const syncSuccess = await syncToCloudStorage(storageProducts);
            if (!syncSuccess) {
              console.warn('⚠️ Update saved locally but failed to sync to cloud.');
              console.warn('⚠️ Other browsers may not see the change. Check console for API key instructions.');
            }
          }
        } else {
          // Product is from storage - update it normally
          const index = storageProducts.findIndex(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return pId === normalizedId;
          });
          
          if (index !== -1) {
            storageProducts[index] = { ...storageProducts[index], ...updated, id: normalizedId };
            
            // Save locally first
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
            
            // Force sync to cloud storage after update
            if (USE_CLOUD_STORAGE) {
              const syncSuccess = await syncToCloudStorage(storageProducts);
              if (!syncSuccess) {
                console.warn('⚠️ Update saved locally but failed to sync to cloud.');
                console.warn('⚠️ Other browsers may not see the change. Check console for API key instructions.');
              }
            }
          } else {
            console.warn(`Product ID ${normalizedId} not found`);
            alert('Product not found. It may have been deleted.');
            return;
          }
        }
        
        // Update allProducts with merged data
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
      } catch (err) {
        console.error('Error updating product:', err);
        alert('Error updating product. Please try again.');
      }
    }
    } finally {
      isOperationInProgress = false;
    }
    
    await renderSellerProducts(); 
}

async function deleteProduct(id) {
    const normalizedId = typeof id === 'string' ? parseInt(id) : id;
    
    // STRONG race condition prevention: Queue delete operations
    if (isDeleting || isOperationInProgress || isSyncing) {
        // If a delete is already in progress, queue this one
        if (isDeleting) {
            deleteQueue.push(normalizedId);
            console.warn(`⚠️ Delete operation queued for product ${normalizedId}. Another delete is in progress.`);
            return;
        }
        // If other operation is in progress, wait a bit and retry
        console.warn('⚠️ Another operation is in progress. Waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (isDeleting || isOperationInProgress || isSyncing) {
            deleteQueue.push(normalizedId);
            return;
        }
    }
    
    // Set delete lock immediately
    isDeleting = true;
    isOperationInProgress = true;
    
    // Temporarily stop auto-refresh to prevent interference
    const wasAutoRefreshing = autoRefreshInterval !== null;
    if (wasAutoRefreshing) {
        stopAutoRefresh();
    }
    
    try {
        
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
        // Don't sync FROM cloud at start - we'll sync TO cloud after deletion
        // This prevents race conditions where cloud sync overwrites our local deletion
        
        const fileProducts = await fetchProductsFromFile();
        let storageProducts = getProductsFromStorage();
        
        const fileProductIds = fileProducts.map(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          return isNaN(pId) ? 0 : pId;
        });
        
        if (fileProductIds.includes(normalizedId)) {
          // Product is from items.json - mark as deleted
          addToDeletedProducts(normalizedId);
          
          // Ensure localStorage is written before syncing
          // Force a synchronous write by reading back immediately
          const verifyDeleted = getDeletedProductIds();
          if (!verifyDeleted.includes(normalizedId)) {
            // Retry if not saved
            addToDeletedProducts(normalizedId);
          }
          
          // Sync deleted list AND current storage products to cloud
          if (USE_CLOUD_STORAGE) {
            // Wait longer to ensure localStorage write is complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Get fresh deleted list to ensure it's up to date
            let finalDeletedList = getDeletedProductIds();
            
            // Verify the deleted ID is in the list
            if (!finalDeletedList.includes(normalizedId)) {
              // Force add it again
              addToDeletedProducts(normalizedId);
              await new Promise(resolve => setTimeout(resolve, 100));
              finalDeletedList = getDeletedProductIds();
            }
            
            // Retry sync up to 5 times with longer delays for stronger race condition prevention
            let syncSuccess = false;
            for (let attempt = 0; attempt < 5 && !syncSuccess; attempt++) {
              if (attempt > 0) {
                // Longer exponential backoff: 500ms, 1000ms, 2000ms, 3000ms
                await new Promise(resolve => setTimeout(resolve, 500 * Math.min(attempt, 6)));
              }
              
              // Double-check deleted list before each sync attempt
              const currentDeletedList = getDeletedProductIds();
              if (!currentDeletedList.includes(normalizedId)) {
                addToDeletedProducts(normalizedId);
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
              syncSuccess = await syncToCloudStorage(storageProducts);
              
              // Verify sync succeeded by checking cloud
              if (syncSuccess) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const verifyHeaders = {};
                const apiKey = getJsonBinApiKey();
                if (apiKey) {
                  verifyHeaders['X-Master-Key'] = apiKey;
                }
                const verifyRes = await fetch(`${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}/latest`, {
                  headers: verifyHeaders
                });
                if (verifyRes.ok) {
                  const verifyData = await verifyRes.json();
                  const cloudDeleted = verifyData.record?.deletedProducts || [];
                  const normalizedCloudDeleted = cloudDeleted.map(did => typeof did === 'string' ? parseInt(did) : did);
                  if (!normalizedCloudDeleted.includes(normalizedId)) {
                    // Sync didn't actually work, retry
                    syncSuccess = false;
                    console.warn(`⚠️ Delete verification failed for product ${normalizedId}, retrying...`);
                  }
                }
              }
            }
            
            if (syncSuccess) {
              // Update last known state immediately after successful sync
              finalDeletedList = getDeletedProductIds();
              // Always update lastKnownDeletedIds (fixes bug where null check prevented initialization)
              lastKnownDeletedIds = finalDeletedList.sort((a, b) => a - b);
            } else {
              console.warn('⚠️ Delete saved locally but failed to sync to cloud after 5 attempts.');
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
          
          // Save locally first - ensure it's written
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
          
          // Verify the write by reading back
          const verifyStorage = getProductsFromStorage();
          const stillExists = verifyStorage.some(p => {
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return pId === normalizedId;
          });
          if (stillExists) {
            // Retry if product still exists
            storageProducts = storageProducts.filter(p => {
              const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
              return pId !== normalizedId;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
          }
          
          // Force sync to cloud storage after delete (wait for it to complete)
          if (USE_CLOUD_STORAGE) {
            // Wait longer to ensure localStorage write is complete
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // syncToCloudStorage automatically includes deletedProducts from localStorage
            // Make sure deleted list is current before syncing
            let currentDeletedList = getDeletedProductIds();
            
            // Verify product is removed from storage
            const verifyStorage = getProductsFromStorage();
            const stillInStorage = verifyStorage.some(p => {
              const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
              return pId === normalizedId;
            });
            if (stillInStorage) {
              // Force remove again
              storageProducts = storageProducts.filter(p => {
                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return pId !== normalizedId;
              });
              localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Retry sync up to 5 times with verification for stronger race condition prevention
            let syncSuccess = false;
            for (let attempt = 0; attempt < 5 && !syncSuccess; attempt++) {
              if (attempt > 0) {
                // Longer exponential backoff: 500ms, 1000ms, 2000ms, 3000ms
                await new Promise(resolve => setTimeout(resolve, 500 * Math.min(attempt, 6)));
              }
              
              // Re-verify storage before each sync
              const currentStorage = getProductsFromStorage();
              const stillExists = currentStorage.some(p => {
                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return pId === normalizedId;
              });
              if (stillExists) {
                storageProducts = currentStorage.filter(p => {
                  const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                  return pId !== normalizedId;
                });
                localStorage.setItem(STORAGE_KEY, JSON.stringify(storageProducts));
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
              syncSuccess = await syncToCloudStorage(storageProducts);
              
              // Verify sync succeeded by checking cloud
              if (syncSuccess) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const verifyHeaders = {};
                const apiKey = getJsonBinApiKey();
                if (apiKey) {
                  verifyHeaders['X-Master-Key'] = apiKey;
                }
                const verifyRes = await fetch(`${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}/latest`, {
                  headers: verifyHeaders
                });
                if (verifyRes.ok) {
                  const verifyData = await verifyRes.json();
                  const cloudProducts = verifyData.record?.products || [];
                  const cloudDeleted = verifyData.record?.deletedProducts || [];
                  const normalizedCloudDeleted = cloudDeleted.map(did => typeof did === 'string' ? parseInt(did) : did);
                  
                  // Check if product still exists in cloud products OR is not in deleted list
                  const stillInCloud = cloudProducts.some(p => {
                    const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return pId === normalizedId;
                  });
                  const notInDeleted = !normalizedCloudDeleted.includes(normalizedId);
                  
                  if (stillInCloud || notInDeleted) {
                    // Sync didn't actually work, retry
                    syncSuccess = false;
                    console.warn(`⚠️ Delete verification failed for product ${normalizedId}, retrying...`);
                  }
                }
              }
            }
            
            if (syncSuccess) {
              // Update last known state immediately after successful sync
              currentDeletedList = getDeletedProductIds();
              const currentProductIds = allProducts.map(p => {
                const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return isNaN(id) ? 0 : id;
              }).filter(id => id > 0).sort((a, b) => a - b);
              lastKnownProductIds = currentProductIds;
              lastKnownDeletedIds = currentDeletedList.sort((a, b) => a - b);
            } else {
              console.warn('⚠️ Delete saved locally but failed to sync to cloud after 5 attempts.');
              console.warn('⚠️ Other browsers may not see the change. Check console for API key instructions.');
              // Don't return here - continue to update allProducts so UI reflects the local deletion
            }
          }
        }
        
        // ALWAYS update allProducts to reflect the deletion, even if cloud sync failed
        // The product was already removed from localStorage, so UI should show it's deleted
        const deletedIds = getDeletedProductIds();
        const mergedProducts = [...fileProducts, ...storageProducts];
        const mergedMap = new Map();
        mergedProducts.forEach(p => {
          const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
          // Normalize deleted IDs for comparison
          const normalizedDeletedIds = deletedIds.map(did => typeof did === 'string' ? parseInt(did) : did);
          const isDeleted = normalizedDeletedIds.includes(pId);
          if (!isNaN(pId) && pId > 0 && !isDeleted) {
            mergedMap.set(pId, { ...p, id: pId });
          }
        });
        allProducts = Array.from(mergedMap.values());
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error deleting product. Please try again.');
      }
    }
    } finally {
      // Release locks
      isDeleting = false;
      isOperationInProgress = false;
      
      // Restart auto-refresh if it was running
      if (wasAutoRefreshing) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before restarting
        startAutoRefresh();
      }
      
      // Process queued delete operations
      if (deleteQueue.length > 0) {
        const nextId = deleteQueue.shift();
        // Process next delete after a short delay
        setTimeout(() => {
          deleteProduct(nextId);
        }, 500);
      }
    }
  
    // Re-render to show updated list (will sync from cloud if enabled)
    // Longer delay to ensure cloud sync completes
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Re-render seller page if on seller page
    const sellerTableBody = document.querySelector('#product-table tbody');
    if (sellerTableBody) {
        await renderSellerProducts();
    }
    
    // Update last known state after delete
    if (USE_CLOUD_STORAGE && !USE_API) {
        const currentProductIds = allProducts.map(p => {
            const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return isNaN(id) ? 0 : id;
        }).filter(id => id > 0).sort((a, b) => a - b);
        lastKnownProductIds = currentProductIds;
        lastKnownDeletedIds = getDeletedProductIds().sort((a, b) => a - b);
    }
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
        
        // Clean up wishlist after products are loaded
        cleanupWishlist();
        
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
    
    // Get wishlist IDs and normalize them
    const wishlistIds = getWishlistIds()
        .map(id => {
            const normalized = typeof id === 'string' ? parseInt(id) : id;
            return isNaN(normalized) ? 0 : normalized;
        })
        .filter(id => id > 0);
    
    // Clean up wishlist - remove IDs that don't exist in current products
    const validProductIds = productsToRender.map(p => {
        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return isNaN(pId) ? 0 : pId;
    }).filter(id => id > 0);
    
    const validWishlistIds = wishlistIds.filter(id => validProductIds.includes(id));
    if (validWishlistIds.length !== wishlistIds.length) {
        // Some wishlist items are invalid, clean them up
        saveWishlistIds(validWishlistIds);
    }
    
    const productHtmlArray = productsToRender.map(product => {
        if (!product) return '';
        
        const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
        if (isNaN(productId) || productId <= 0) return '';
        
        const formattedPrice = (product.price || 0).toLocaleString('ko-KR') + '원';
        const soldOutClass = (product.stock || 0) <= 0 ? 'sold-out-overlay' : '';
        const stockStatus = (product.stock || 0) > 0 ? 'In Stock' : 'Sold Out';
        const buttonDisabled = (product.stock || 0) <= 0 ? 'disabled' : '';
        const isWished = validWishlistIds.includes(productId); 

        return `
            <div class="product-card" data-id="${productId}" data-category="${product.category || ''}">
                <img src="${product.imageUrl || ''}" alt="${product.name || 'Product'}" class="product-image">
                <div class="${soldOutClass}"></div> 
                
                <button class="btn-wishlist ${isWished ? 'active' : ''}" data-id="${productId}">
                    <span class="heart-icon">${isWished ? '❤️' : '♡'}</span> 
                </button>
                
                <h3>${product.name || 'Unknown Product'}</h3>
                <p class="price">${formattedPrice}</p>
                <p class="category">Category: ${product.category || 'N/A'}</p>
                <p class="tags">Tags: ${Array.isArray(product.tags) ? product.tags.join(', ') : ''}</p>
                
                <button class="btn-add-to-cart btn-primary ${buttonDisabled ? 'btn-disabled' : ''}" ${buttonDisabled ? 'disabled' : ''} data-id="${productId}">
                    ${stockStatus} | Add to Cart
                </button>
            </div>
        `;
    }).filter(html => html.length > 0);

    productListContainer.innerHTML = productHtmlArray.join('');
}

function initProductControls() {
    // Clean up wishlist first to remove invalid IDs
    cleanupWishlist();
    // Then update count with valid items only
    updateWishlistCount(getValidWishlistCount());
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

    // Only sync from cloud if no operation is in progress (prevents race conditions)
    let products = null;
    if (USE_CLOUD_STORAGE && !USE_API && !isOperationInProgress) {
        try {
            products = await syncFromCloudStorage();
            // syncFromCloudStorage now includes items.json + cloud + local, and updates allProducts
            if (products && Array.isArray(products) && products.length > 0) {
                allProducts = products; // Use synced products (already filtered and merged)
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
            e.preventDefault();
            e.stopPropagation();
            // Use currentTarget to get the button element, not the clicked child element
            const buttonElement = e.currentTarget || e.target.closest('.btn-seller-delete');
            const productId = buttonElement ? parseInt(buttonElement.dataset.id) : null;
            if (productId && !isNaN(productId)) {
                // Find the product to get its name for confirmation
                const product = allProducts.find(p => {
                    const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return pId === productId;
                });
                
                if (product) {
                    // Show confirmation dialog with product name
                    const productName = product.name || `Product #${productId}`;
                    const confirmDelete = confirm(`Do you want to delete "${productName}"?\n\nClick "OK" to delete or "Cancel" to cancel.`);
                    
                    if (confirmDelete) {
            deleteProduct(productId);
                    }
                } else {
                    console.error(`Product with ID ${productId} not found`);
                    alert('Product not found. It may have already been deleted.');
                }
            } else {
                console.error('❌ Could not get product ID from delete button. Button element:', buttonElement);
                console.error('❌ Event target:', e.target, 'Current target:', e.currentTarget);
            }
        });
    });

    const editButtons = document.querySelectorAll('.btn-seller-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Use currentTarget to get the button element, not the clicked child element
            const buttonElement = e.currentTarget || e.target.closest('.btn-seller-edit');
            const productId = buttonElement ? parseInt(buttonElement.dataset.id) : null;
            if (productId && !isNaN(productId)) {
                startEditProduct(productId);
            } else {
                console.error('❌ Could not get product ID from edit button.');
            }
        });
    });
    
    // Update last known state after render
    if (USE_CLOUD_STORAGE && !USE_API) {
        const currentProductIds = allProducts.map(p => {
            const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return isNaN(id) ? 0 : id;
        }).filter(id => id > 0).sort((a, b) => a - b);
        lastKnownProductIds = currentProductIds;
        lastKnownDeletedIds = getDeletedProductIds().sort((a, b) => a - b);
    }
}

// Auto-refresh function to detect changes from other browsers
// Initialize as empty arrays to ensure type consistency for comparisons
let lastKnownProductIds = [];
let lastKnownDeletedIds = [];
let isCheckingForChanges = false; // Lock to prevent concurrent executions

async function checkForChanges() {
    if (!USE_CLOUD_STORAGE || USE_API) return;
    
    // STRONG race condition prevention: Skip check if ANY operation is in progress OR if already checking
    if (isOperationInProgress || isSyncing || isDeleting || isCheckingForChanges) {
        return;
    }
    
    // Set lock to prevent concurrent executions
    isCheckingForChanges = true;
    
    try {
        // Get current state from cloud
        const headers = {};
        const apiKey = getJsonBinApiKey();
        if (apiKey) {
            headers['X-Master-Key'] = apiKey;
        }
        
        const url = `${CLOUD_STORAGE_URL}/${CLOUD_STORAGE_BIN_ID}/latest`;
        const res = await fetch(url, { headers: headers });
        
        if (res.ok) {
            const data = await res.json();
            const cloudProducts = data.record?.products || [];
            const cloudDeletedProducts = data.record?.deletedProducts || [];
            
            // Normalize IDs for comparison
            const currentProductIds = cloudProducts.map(p => {
                const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return isNaN(id) ? 0 : id;
            }).filter(id => id > 0).sort((a, b) => a - b);
            
            const currentDeletedIds = (Array.isArray(cloudDeletedProducts) ? cloudDeletedProducts : []).map(id => {
                const normalized = typeof id === 'string' ? parseInt(id) : id;
                return isNaN(normalized) ? 0 : normalized;
            }).filter(id => id > 0).sort((a, b) => a - b);
            
            // Check if anything changed
            // Ensure both sides are arrays for consistent comparison
            const lastProductIds = Array.isArray(lastKnownProductIds) ? lastKnownProductIds : [];
            const lastDeletedIds = Array.isArray(lastKnownDeletedIds) ? lastKnownDeletedIds : [];
            const productIdsChanged = JSON.stringify(currentProductIds) !== JSON.stringify(lastProductIds);
            const deletedIdsChanged = JSON.stringify(currentDeletedIds) !== JSON.stringify(lastDeletedIds);
            
            // Also check if product data changed (for edits)
            let productDataChanged = false;
            if (cloudProducts.length > 0 && allProducts.length > 0) {
                // Compare product data, not just IDs
                const cloudProductMap = new Map();
                cloudProducts.forEach(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    if (!isNaN(id) && id > 0) {
                        cloudProductMap.set(id, JSON.stringify(p));
                    }
                });
                
                const currentProductMap = new Map();
                allProducts.forEach(p => {
                    const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    if (!isNaN(id) && id > 0) {
                        currentProductMap.set(id, JSON.stringify(p));
                    }
                });
                
                // Check if any product data changed
                for (const [id, cloudData] of cloudProductMap) {
                    const currentData = currentProductMap.get(id);
                    if (currentData !== cloudData) {
                        productDataChanged = true;
                        break;
                    }
                }
            }
            
            if (productIdsChanged || deletedIdsChanged || productDataChanged) {
                // Update last known state BEFORE re-rendering
                lastKnownProductIds = currentProductIds;
                lastKnownDeletedIds = currentDeletedIds;
                
                // IMPORTANT: Update local deleted list from cloud BEFORE re-rendering
                localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(currentDeletedIds));
                
                // Re-render seller products if on seller page
                const sellerTableBody = document.querySelector('#product-table tbody');
                if (sellerTableBody) {
                    await renderSellerProducts();
                }
                
                // Re-render user products if on user page
                const userProductContainer = document.getElementById('product-list-container');
                if (userProductContainer) {
                    await loadEmbeddedProducts();
                }
            }
        }
    } catch (err) {
        // Silently fail - don't spam console with errors
        // No console output for auto-refresh
    } finally {
        // Always release lock, even if error occurred
        isCheckingForChanges = false;
    }
}

function startAutoRefresh() {
    // Start if on seller page OR user page and cloud storage is enabled
    const sellerTableBody = document.querySelector('#product-table tbody');
    const userProductContainer = document.getElementById('product-list-container');
    if ((!sellerTableBody && !userProductContainer) || !USE_CLOUD_STORAGE || USE_API) return;
    
    // Clear any existing interval
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Initialize last known state
    const currentProductIds = allProducts.map(p => {
        const id = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return isNaN(id) ? 0 : id;
    }).filter(id => id > 0).sort((a, b) => a - b);
    lastKnownProductIds = currentProductIds;
    lastKnownDeletedIds = getDeletedProductIds().sort((a, b) => a - b);
    
    // Check for changes every 3 seconds (silently)
    // Use a wrapper function to properly handle async execution and prevent concurrent calls
    autoRefreshInterval = setInterval(() => {
        // Don't await - setInterval doesn't support async, but the lock prevents concurrent executions
        checkForChanges().catch(() => {
            // Silently handle any errors - checkForChanges already has error handling
        });
    }, 3000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Stop auto-refresh when page is unloaded
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', stopAutoRefresh);
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

    // Use normalizedId to ensure type consistency with form submission handler
    editingProductId = normalizedId;
    if (submitButton) submitButton.textContent = 'Save Changes';
    if (formTitle) formTitle.textContent = `✏️ Edit Product #${normalizedId}`;

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

// Clean up wishlist by removing IDs that don't exist in allProducts or are deleted
function cleanupWishlist() {
    if (!allProducts || allProducts.length === 0) {
        // If no products loaded yet, just normalize IDs
    let wishlistIds = getWishlistIds();
        wishlistIds = wishlistIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id) && id > 0);
        saveWishlistIds(wishlistIds);
        return;
    }
    
    let wishlistIds = getWishlistIds();
    // Normalize all IDs to integers
    wishlistIds = wishlistIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id) && id > 0);
    
    // Get valid product IDs from allProducts
    const validProductIds = new Set(allProducts.map(p => {
        if (!p) return 0;
        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return isNaN(pId) ? 0 : pId;
    }).filter(id => id > 0));
    
    // Also check deleted products - remove wishlist items for deleted products
    const deletedIds = getDeletedProductIds();
    const deletedSet = new Set(deletedIds.map(did => typeof did === 'string' ? parseInt(did) : did).filter(id => !isNaN(id) && id > 0));
    
    // Filter out invalid and deleted product IDs
    const cleanedWishlistIds = wishlistIds.filter(id => validProductIds.has(id) && !deletedSet.has(id));
    
    // Only save if there were changes
    if (cleanedWishlistIds.length !== wishlistIds.length) {
        saveWishlistIds(cleanedWishlistIds);
    }
}

// Get valid wishlist count (only products that actually exist)
function getValidWishlistCount() {
    if (!allProducts || allProducts.length === 0) {
        return 0;
    }
    
    const wishlistIds = getWishlistIds();
    const normalizedWishlistIds = wishlistIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id) && id > 0);
    
    // Get valid product IDs from allProducts
    const validProductIds = new Set(allProducts.map(p => {
        if (!p) return 0;
        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
        return isNaN(pId) ? 0 : pId;
    }).filter(id => id > 0));
    
    // Check deleted products
    const deletedIds = getDeletedProductIds();
    const deletedSet = new Set(deletedIds.map(did => typeof did === 'string' ? parseInt(did) : did).filter(id => !isNaN(id) && id > 0));
    
    // Count only valid, non-deleted products
    return normalizedWishlistIds.filter(id => validProductIds.has(id) && !deletedSet.has(id)).length;
}

async function toggleWishlist(productId) {
    try {
    let wishlistIds = getWishlistIds();
        const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
        if (isNaN(normalizedId) || normalizedId <= 0) {
            console.error('Invalid product ID for wishlist:', productId);
            return;
        }
        
        wishlistIds = wishlistIds.map(id => typeof id === 'string' ? parseInt(id) : id).filter(id => !isNaN(id) && id > 0);
        const index = wishlistIds.indexOf(normalizedId);

    if (index === -1) {
            wishlistIds.push(normalizedId);
            console.log(`Product ${normalizedId} added to Wishlist!`);
    } else {
        wishlistIds.splice(index, 1);
            console.log(`Product ${normalizedId} removed from Wishlist!`);
    }

    saveWishlistIds(wishlistIds); 
        await loadEmbeddedProducts();
    } catch (err) {
        console.error('Error toggling wishlist:', err);
        alert('Error updating wishlist. Please try again.');
    }
}

function viewWishlist() {
    try {
        const wishlistIds = getWishlistIds().map(id => typeof id === 'string' ? parseInt(id) : id);
    const items = allProducts
            .filter(p => {
                if (!p) return false;
                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return !isNaN(pId) && pId > 0 && wishlistIds.includes(pId);
            })
            .map(p => {
                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return `
                <div class="wishlist-item" data-id="${pId}">
                    <img src="${p.imageUrl || ''}" class="wishlist-img" alt="${p.name || 'Product'}">
                <div class="item-details">
                        <h4>${p.name || 'Unknown Product'}</h4>
                        <p class="price">${(p.price || 0).toLocaleString('ko-KR')}원</p>
                </div>
                    <button class="btn-remove-wishlist" data-id="${pId}">❌</button>
            </div>
            `;
            });
        
    const modalTitle = document.getElementById('modal-title');
    const modalListContainer = document.getElementById('modal-list-container');
    const modalSummary = document.getElementById('modal-summary');
        const modal = document.getElementById('app-modal');

        if (!modalTitle || !modalListContainer || !modalSummary || !modal) {
            console.error('Modal elements not found');
            return;
        }

    modalTitle.textContent = "My Wishlist";
    modalListContainer.innerHTML = `<div class="wishlist-grid-container">${items.length > 0 ? items.join('') : '<p class="p-4 text-center">Your wishlist is empty.</p>'}</div>`;
        modalSummary.innerHTML = `Total Items: <strong>${items.length}</strong>`;

        modal.style.display = 'flex';

    document.querySelectorAll('.btn-remove-wishlist').forEach(button => {
        button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const buttonElement = e.currentTarget || e.target.closest('.btn-remove-wishlist');
                const idToRemove = buttonElement ? parseInt(buttonElement.dataset.id) : null;
                if (idToRemove && !isNaN(idToRemove)) {
                    toggleWishlist(idToRemove);
                    viewWishlist();
                }
        });
    });
    } catch (err) {
        console.error('Error viewing wishlist:', err);
        alert('Error loading wishlist. Please try again.');
    }
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
    try {
    let cartItems = getCartItems();
    
        const normalizedId = typeof productId === 'string' ? parseInt(productId) : productId;
        if (isNaN(normalizedId) || normalizedId <= 0) {
            console.error('Invalid product ID for cart:', productId);
            return;
        }
        
        const product = allProducts.find(p => {
            if (!p) return false;
            const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return !isNaN(pId) && pId === normalizedId;
        });
        
        if (!product) {
            alert("Product not found. It may have been deleted.");
            return;
        }
        
        if (product.stock <= (cartItems[normalizedId] || 0)) {
        alert("Cannot add more. Stock limit reached or item sold out.");
        return;
    }

        cartItems[normalizedId] = (cartItems[normalizedId] || 0) + 1;
    
    saveCartItems(cartItems);
        console.log(`Product ${normalizedId} added to Cart. Current quantity: ${cartItems[normalizedId]}`);
    } catch (err) {
        console.error('Error adding to cart:', err);
        alert('Error adding product to cart. Please try again.');
    }
}

function viewCart() {
    try {
    const cartItems = getCartItems();
    const itemIds = Object.keys(cartItems);

    let totalPrice = 0;
        const validItems = [];

    const itemsHtml = itemIds.map(id => {
            const searchId = parseInt(id);
            if (isNaN(searchId)) return '';
            
            const product = allProducts.find(p => {
                if (!p) return false;
                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return !isNaN(pId) && pId === searchId;
            });
            if (!product) {
                // Product was deleted, remove it from cart
                removeProductFromCart(searchId);
                return '';
            } 

            const quantity = cartItems[id] || 0;
            if (quantity <= 0) {
                removeProductFromCart(searchId);
                return '';
            }
            
            const itemTotal = (product.price || 0) * quantity;
        totalPrice += itemTotal;
            validItems.push({ id: searchId, quantity });

        return `
                <tr data-id="${id}">
                    <td><img src="${product.imageUrl || ''}" class="cart-img" alt="${product.name || 'Product'}">${product.name || 'Unknown Product'}</td>
                    <td>${product.category || 'N/A'}</td>
                    <td>${(product.price || 0).toLocaleString('ko-KR')}원</td>
                    <td>
                        <button class="btn-qty btn-qty-minus" data-id="${id}">-</button>
                        <span class="cart-qty" data-id="${id}">${quantity}</span>
                        <button class="btn-qty btn-qty-plus" data-id="${id}">+</button>
                    </td>
                <td>${itemTotal.toLocaleString('ko-KR')}원</td>
                <td><button class="btn-remove-cart" data-id="${id}">Remove</button></td>
            </tr>
        `;
        }).filter(html => html.length > 0).join('');

    const modalTitle = document.getElementById('modal-title');
    const modalListContainer = document.getElementById('modal-list-container');
    const modalSummary = document.getElementById('modal-summary');
    const modal = document.getElementById('app-modal');

        if (!modalTitle || !modalListContainer || !modalSummary || !modal) {
            console.error('Modal elements not found');
            return;
        }

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
                e.preventDefault();
                e.stopPropagation();
                const buttonElement = e.currentTarget || e.target.closest('.btn-remove-cart');
                const idToRemove = buttonElement ? parseInt(buttonElement.dataset.id) : null;
                if (idToRemove && !isNaN(idToRemove)) {
            removeProductFromCart(idToRemove);
                    viewCart();
                }
        });
    });

        document.querySelectorAll('.btn-qty-plus').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const buttonElement = e.currentTarget || e.target.closest('.btn-qty-plus');
                const id = buttonElement ? parseInt(buttonElement.dataset.id) : null;
                if (id && !isNaN(id)) {
                    changeCartQuantity(id, 1);
                    viewCart();
                }
            });
        });

        document.querySelectorAll('.btn-qty-minus').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const buttonElement = e.currentTarget || e.target.closest('.btn-qty-minus');
                const id = buttonElement ? parseInt(buttonElement.dataset.id) : null;
                if (id && !isNaN(id)) {
                    changeCartQuantity(id, -1);
                    viewCart();
                }
            });
        });

        const paymentBtn = document.getElementById('go-to-payment-btn');
        if (paymentBtn) {
            paymentBtn.addEventListener('click', () => {
                showPaymentModal(totalPrice, validItems);
            });
        }
    } catch (err) {
        console.error('Error viewing cart:', err);
        alert('Error loading cart. Please try again.');
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

// Orders Management Functions
function getOrders() {
    const ordersJson = localStorage.getItem(ORDERS_KEY);
    return ordersJson ? JSON.parse(ordersJson) : [];
}

async function saveOrders(orders) {
    // Save to localStorage FIRST (immediate) - this is JSON format
    try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        
        // Verify it was saved
        const verifyOrders = getOrders();
        if (verifyOrders.length !== orders.length) {
            console.error('⚠️ Order save verification failed! Retrying...');
            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        }
        
        console.log('✅ Orders saved to localStorage (JSON format):', orders.length, 'orders');
        console.log('✅ Orders data:', JSON.stringify(orders, null, 2));
        
        // Sync orders to cloud storage (JSONBin.io) - saves as JSON in cloud
        if (USE_CLOUD_STORAGE && !USE_API) {
            // Get current products to sync along with orders
            const storageProducts = getProductsFromStorage();
            const syncSuccess = await syncToCloudStorage(storageProducts);
            if (syncSuccess) {
                console.log('✅ Orders synced to cloud storage (JSON format)');
            } else {
                console.warn('⚠️ Orders saved locally but cloud sync failed');
            }
        }
    } catch (err) {
        console.error('❌ Error saving orders:', err);
        alert('Error saving orders. Please try again.');
    }
}

// Download orders as PDF file with watermark and seal
function downloadOrdersAsPDFEnglish(orders) {
    try {
        if (typeof window.jspdf === 'undefined') {
            alert('PDF library not loaded. Please refresh the page.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add Codelook watermark across the whole page (diagonal, semi-transparent)
        doc.setTextColor(200, 200, 200); // Light gray
        doc.setFontSize(60);
        doc.setFont(undefined, 'bold');
        doc.text('Codelook', pageWidth / 2, pageHeight / 2, {
            angle: 45,
            align: 'center',
            baseline: 'middle'
        });
        
        // Add "Confirmed Payment" red seal/stamp (continuous, appears on every page)
        doc.setTextColor(220, 53, 69); // Red color
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        const sealText = 'CONFIRMED PAYMENT';
        const sealX = pageWidth - 20;
        const sealY = 20;
        doc.text(sealText, sealX, sealY, {
            angle: 0,
            align: 'right'
        });
        
        // Reset text color for content
        doc.setTextColor(0, 0, 0);
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('My Orders', 14, 30);
        
        // Date (English format)
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const generatedDate = new Date();
        const dateStr = `${generatedDate.getFullYear()}-${String(generatedDate.getMonth() + 1).padStart(2, '0')}-${String(generatedDate.getDate()).padStart(2, '0')}`;
        doc.text(`Generated: ${dateStr}`, 14, 40);
        
        // Prepare table data (English format)
        const tableData = [];
        let grandTotal = 0;
        
        orders.forEach(order => {
            if (!order || !order.items || !Array.isArray(order.items)) return;
            
            const orderDate = new Date(order.date);
            // English date format: YYYY-MM-DD
            const formattedDate = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
            
            order.items.forEach(item => {
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                grandTotal += itemTotal;
                
                tableData.push([
                    item.name || 'Unknown',
                    `#${order.id}`,
                    `${(item.price || 0).toLocaleString('en-US')} won`,
                    item.quantity || 0,
                    `${itemTotal.toLocaleString('en-US')} won`,
                    formattedDate,
                    `****${order.cardNumber || ''}`
                ]);
            });
        });
        
        // Add table
        doc.autoTable({
            head: [['Product', 'Order #', 'Price', 'Qty', 'Total', 'Date', 'Card']],
            body: tableData,
            startY: 45,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [0, 0, 0] },
            margin: { top: 45 },
            didDrawPage: function (data) {
                // Add watermark on every page
                doc.setTextColor(200, 200, 200);
                doc.setFontSize(60);
                doc.setFont(undefined, 'bold');
                doc.text('Codelook', pageWidth / 2, pageHeight / 2, {
                    angle: 45,
                    align: 'center',
                    baseline: 'middle'
                });
                
                // Add red seal on every page
                doc.setTextColor(220, 53, 69);
                doc.setFontSize(24);
                doc.setFont(undefined, 'bold');
                doc.text('CONFIRMED PAYMENT', pageWidth - 20, 20, {
                    angle: 0,
                    align: 'right'
                });
                
                // Reset color
                doc.setTextColor(0, 0, 0);
            }
        });
        
        // Add summary (English format)
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Grand Total: ${grandTotal.toLocaleString('en-US')} won`, 14, finalY);
        doc.text(`Total Orders: ${orders.length}`, 14, finalY + 10);
        
        // Save PDF
        doc.save(`my-orders-${new Date().toISOString().split('T')[0]}.pdf`);
        alert('Orders downloaded as PDF file!');
    } catch (err) {
        console.error('Error downloading PDF:', err);
        alert('Error downloading PDF. Please try again.');
    }
}

// Download orders as Image file
function downloadOrdersAsImage(orders) {
    try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1200;
        canvas.height = 800;
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add Codelook watermark (diagonal, semi-transparent)
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#cccccc';
        ctx.font = 'bold 120px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 4); // 45 degrees
        ctx.fillText('Codelook', 0, 0);
        ctx.restore();
        
        // Add "Confirmed Payment" red seal (top right)
        ctx.save();
        ctx.fillStyle = '#dc3545'; // Red
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('CONFIRMED PAYMENT', canvas.width - 20, 20);
        ctx.restore();
        
        // Title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('My Orders', 20, 60);
        
        // Date (English format)
        ctx.font = '16px Arial';
        const genDate = new Date();
        const dateString = `${genDate.getFullYear()}-${String(genDate.getMonth() + 1).padStart(2, '0')}-${String(genDate.getDate()).padStart(2, '0')}`;
        ctx.fillText(`Generated: ${dateString}`, 20, 90);
        
        // Table header
        let yPos = 130;
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Product', 20, yPos);
        ctx.fillText('Order #', 300, yPos);
        ctx.fillText('Price', 450, yPos);
        ctx.fillText('Qty', 550, yPos);
        ctx.fillText('Total', 600, yPos);
        ctx.fillText('Date', 750, yPos);
        ctx.fillText('Card', 950, yPos);
        
        // Draw line under header
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, yPos + 10);
        ctx.lineTo(canvas.width - 20, yPos + 10);
        ctx.stroke();
        
        // Table rows
        yPos = 160;
        ctx.font = '12px Arial';
        let grandTotal = 0;
        
        orders.forEach(order => {
            if (!order || !order.items || !Array.isArray(order.items)) return;
            
            const orderDate = new Date(order.date);
            // English date format: YYYY-MM-DD
            const formattedDate = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
            
            order.items.forEach(item => {
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                grandTotal += itemTotal;
                
                ctx.fillText(item.name || 'Unknown', 20, yPos);
                ctx.fillText(`#${order.id}`, 300, yPos);
                ctx.fillText(`${(item.price || 0).toLocaleString('en-US')} won`, 450, yPos);
                ctx.fillText(item.quantity || 0, 550, yPos);
                ctx.fillText(`${itemTotal.toLocaleString('en-US')} won`, 600, yPos);
                ctx.fillText(formattedDate, 750, yPos);
                ctx.fillText(`****${order.cardNumber || ''}`, 950, yPos);
                
                yPos += 25;
                
                // Add page break if needed
                if (yPos > canvas.height - 100) {
                    // Could add pagination here if needed
                }
            });
        });
        
        // Summary (English format)
        yPos = canvas.height - 80;
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`Grand Total: ${grandTotal.toLocaleString('en-US')} won`, 20, yPos);
        ctx.fillText(`Total Orders: ${orders.length}`, 20, yPos + 30);
        
        // Convert canvas to image and download
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-orders-${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Orders downloaded as Image file!');
        }, 'image/png');
    } catch (err) {
        console.error('Error downloading Image:', err);
        alert('Error downloading Image. Please try again.');
    }
}


function addOrder(order) {
    const orders = getOrders();
    orders.unshift(order); // Add to beginning (newest first)
    saveOrders(orders); // Save immediately
}

// Delete selected orders
async function deleteSelectedOrders(orderIds) {
    if (!orderIds || orderIds.length === 0) {
        alert('Please select at least one order to delete.');
        return;
    }
    
    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete ${orderIds.length} order(s)?`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Get current orders
        let orders = getOrders();
        
        // Filter out selected orders
        const filteredOrders = orders.filter(order => !orderIds.includes(order.id));
        
        // Save updated orders
        await saveOrders(filteredOrders);
        
        // Sync to cloud storage
        if (USE_CLOUD_STORAGE && !USE_API) {
            const storageProducts = getProductsFromStorage();
            await syncToCloudStorage(storageProducts);
        }
        
        // Refresh the display
        await viewOrders();
        
        alert(`Successfully deleted ${orderIds.length} order(s).`);
    } catch (err) {
        console.error('Error deleting orders:', err);
        alert('Error deleting orders. Please try again.');
    }
}

// Coupon validation function
function validateCoupon(couponCode) {
    if (!couponCode) return { valid: false, discount: 0, name: '' };
    
    const normalizedCode = couponCode.trim();
    
    // Coupon codes: 1111 (20%), 2525 (35%), 2026 (50%)
    if (normalizedCode === '1111') {
        return { valid: true, discount: 0.20, name: 'New Membership (20% off)' };
    } else if (normalizedCode === '2525') {
        return { valid: true, discount: 0.35, name: 'Christmas (35% off)' };
    } else if (normalizedCode === '2026') {
        return { valid: true, discount: 0.50, name: 'New Year (50% off)' };
    }
    
    return { valid: false, discount: 0, name: '' };
}

// Calculate payment breakdown
function calculatePaymentBreakdown(subtotal, couponCode) {
    const coupon = validateCoupon(couponCode);
    const discountAmount = coupon.valid ? subtotal * coupon.discount : 0;
    const afterDiscount = subtotal - discountAmount;
    const taxRate = 0.01; // 1% tax
    const taxAmount = afterDiscount * taxRate;
    const finalTotal = afterDiscount + taxAmount;
    
    return {
        subtotal,
        couponCode: coupon.valid ? couponCode : null,
        couponName: coupon.name,
        discountAmount,
        afterDiscount,
        taxRate,
        taxAmount,
        finalTotal
    };
}

// Payment Modal and Processing
function showPaymentModal(totalPrice, cartItems) {
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalListContainer = document.getElementById('modal-list-container');
    const modalSummary = document.getElementById('modal-summary');
    
    if (!modal || !modalTitle || !modalListContainer || !modalSummary) {
        alert('Payment modal elements not found');
        return;
    }
    
    modalTitle.textContent = "Payment";
    
    // Initial calculation without coupon
    let currentBreakdown = calculatePaymentBreakdown(totalPrice, '');
    
    const updatePaymentSummary = () => {
        const couponCode = document.getElementById('coupon-code')?.value || '';
        currentBreakdown = calculatePaymentBreakdown(totalPrice, couponCode);
        
        const summaryDiv = document.getElementById('payment-summary-details');
        if (summaryDiv) {
            summaryDiv.innerHTML = `
                <h3 style="margin-top: 0; color: #333; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">Order Summary</h3>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span>Subtotal:</span>
                    <strong>${currentBreakdown.subtotal.toLocaleString('en-US')} won</strong>
                </div>
                ${currentBreakdown.couponCode ? `
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #28a745;">
                        <span>Coupon (${currentBreakdown.couponName}):</span>
                        <strong>-${currentBreakdown.discountAmount.toLocaleString('en-US')} won</strong>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                    <span>Tax (1%):</span>
                    <strong>${currentBreakdown.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} won</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 15px; border-top: 2px solid #333; font-size: 1.2em;">
                    <span><strong>Total:</strong></span>
                    <strong style="color: #A00000; font-size: 1.3em;">${currentBreakdown.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} won</strong>
                </div>
                <p style="margin-top: 10px; color: #666; font-size: 0.9em;">Items: ${cartItems.length}</p>
            `;
        }
    };
    
    modalListContainer.innerHTML = `
        <div class="payment-form">
            <div id="payment-summary-details" class="payment-summary">
                <!-- Will be populated by updatePaymentSummary -->
            </div>
            <div class="payment-inputs">
                <label for="coupon-code">Coupon Code (Optional):</label>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <input type="text" id="coupon-code" placeholder="Enter coupon code" style="flex: 1;">
                    <button id="apply-coupon-btn" class="btn-cancel" style="padding: 10px 20px;">Apply</button>
                </div>
                <div id="coupon-message" style="margin-bottom: 15px; min-height: 20px;"></div>
                <label for="card-number">Card Number:</label>
                <input type="text" id="card-number" placeholder="Enter any card number">
                <label for="card-password">Card Password:</label>
                <input type="password" id="card-password" placeholder="Enter any password">
            </div>
            <div class="payment-actions">
                <button id="confirm-payment-btn" class="btn-payment">Confirm Payment</button>
                <button id="cancel-payment-btn" class="btn-cancel">Cancel</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Initial summary update
    updatePaymentSummary();
    
    // Coupon code input handler
    const couponInput = document.getElementById('coupon-code');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponMessage = document.getElementById('coupon-message');
    
    const applyCoupon = () => {
        const couponCode = couponInput?.value || '';
        const coupon = validateCoupon(couponCode);
        
        if (couponCode && !coupon.valid) {
            couponMessage.innerHTML = `<span style="color: #dc3545;">Invalid coupon code. Valid codes: "1111" (20% off), "2525" (35% off), "2026" (50% off)</span>`;
        } else if (coupon.valid) {
            couponMessage.innerHTML = `<span style="color: #28a745; font-weight: bold;">✓ ${coupon.name} applied!</span>`;
            updatePaymentSummary();
        } else {
            couponMessage.innerHTML = '';
            updatePaymentSummary();
        }
    };
    
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', applyCoupon);
    }
    
    if (couponInput) {
        couponInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyCoupon();
            }
        });
        couponInput.addEventListener('input', () => {
            if (!couponInput.value) {
                couponMessage.innerHTML = '';
                updatePaymentSummary();
            }
        });
    }
    
    // Format card number with spaces
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' ');
                if (value.length > 19) value = value.substring(0, 19);
                e.target.value = value;
            }
        });
    }
    
    // Confirm payment button
    const confirmBtn = document.getElementById('confirm-payment-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '') || '';
            const cardPassword = document.getElementById('card-password')?.value || '';
            const couponCode = document.getElementById('coupon-code')?.value || '';
            
            // Accept any card number and password (no validation)
            if (!cardNumber || cardNumber.trim() === '') {
                alert('Please enter a card number');
                return;
            }
            
            if (!cardPassword || cardPassword.trim() === '') {
                alert('Please enter a card password');
                return;
            }
            
            // Recalculate breakdown with current coupon
            const finalBreakdown = calculatePaymentBreakdown(totalPrice, couponCode);
            
            // Process payment with coupon and tax
            await processPayment(cartItems, totalPrice, cardNumber, couponCode, finalBreakdown);
        });
    }
    
    // Cancel button
    const cancelBtn = document.getElementById('cancel-payment-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
}

async function processPayment(cartItems, totalPrice, cardNumber, couponCode = '', breakdown = null) {
    if (isOperationInProgress) {
        alert('Another operation is in progress. Please wait...');
        return;
    }
    
    isOperationInProgress = true;
    
    try {
        // IMPORTANT: Sync from cloud FIRST to get latest stock before processing payment
        if (USE_CLOUD_STORAGE && !USE_API) {
            await syncFromCloudStorage();
        }
        
        // Validate all items are still available and in stock
        const validItems = [];
        for (const item of cartItems) {
            const product = allProducts.find(p => {
                const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                return pId === item.id;
            });
            
            if (!product) {
                alert(`Product ID ${item.id} is no longer available. Please refresh your cart.`);
                isOperationInProgress = false;
                return;
            }
            
            if (product.stock < item.quantity) {
                alert(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
                isOperationInProgress = false;
                return;
            }
            
            validItems.push({
                id: item.id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                imageUrl: product.imageUrl
            });
        }
        
        if (validItems.length === 0) {
            alert('No valid items to purchase');
            isOperationInProgress = false;
            return;
        }
        
        // Calculate breakdown if not provided
        if (!breakdown) {
            breakdown = calculatePaymentBreakdown(totalPrice, couponCode);
        }
        
        // Create order with coupon and tax information
        const order = {
            id: Date.now(), // Simple ID based on timestamp
            date: new Date().toISOString(),
            items: validItems,
            subtotal: breakdown.subtotal,
            couponCode: breakdown.couponCode,
            couponName: breakdown.couponName,
            discountAmount: breakdown.discountAmount,
            taxAmount: breakdown.taxAmount,
            totalPrice: breakdown.finalTotal, // Final total including discount and tax
            cardNumber: cardNumber.length >= 4 ? cardNumber.substring(cardNumber.length - 4) : cardNumber // Store last 4 digits or full number if shorter
        };
        
        // Update stock for all items
        if (USE_API) {
            // Update via API
            for (const item of validItems) {
                const product = allProducts.find(p => {
                    const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return pId === item.id;
                });
                if (product) {
                    try {
                        await fetch(`${API_BASE_URL}/products/${item.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stock: product.stock - item.quantity })
                        });
                    } catch (err) {
                        console.error(`Failed to update stock for product ${item.id}:`, err);
                    }
                }
            }
            allProducts = await fetchProductsFromApi();
        } else {
            // Update in localStorage and cloud
            const fileProducts = await fetchProductsFromFile();
            let storageProducts = getProductsFromStorage();
            
            // Update stock for each item
            for (const item of validItems) {
                const normalizedId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
                
                // Check if product is from items.json or storage
                const fileProductIndex = fileProducts.findIndex(p => {
                    const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return pId === normalizedId;
                });
                
                if (fileProductIndex !== -1) {
                    // Product from items.json - update in storage (create a copy with updated stock)
                    fileProducts[fileProductIndex].stock = Math.max(0, fileProducts[fileProductIndex].stock - item.quantity);
                    // Add to storage products if not already there
                    const existingInStorage = storageProducts.findIndex(p => {
                        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                        return pId === normalizedId;
                    });
                    if (existingInStorage !== -1) {
                        storageProducts[existingInStorage].stock = Math.max(0, storageProducts[existingInStorage].stock - item.quantity);
                    } else {
                        // Create a copy with updated stock
                        storageProducts.push({ ...fileProducts[fileProductIndex], stock: Math.max(0, fileProducts[fileProductIndex].stock) });
                    }
                } else {
                    // Product from storage - update directly
                    const storageIndex = storageProducts.findIndex(p => {
                        const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                        return pId === normalizedId;
                    });
                    if (storageIndex !== -1) {
                        storageProducts[storageIndex].stock = Math.max(0, storageProducts[storageIndex].stock - item.quantity);
                    }
                }
                
                // Update in allProducts
                const allProductsIndex = allProducts.findIndex(p => {
                    const pId = typeof p.id === 'string' ? parseInt(p.id) : p.id;
                    return pId === normalizedId;
                });
                if (allProductsIndex !== -1) {
                    allProducts[allProductsIndex].stock = Math.max(0, allProducts[allProductsIndex].stock - item.quantity);
                }
            }
            
            // Save updated products
            saveProductsToStorage(storageProducts);
            
            // Sync to cloud storage (includes products, deletedProducts, and orders)
            if (USE_CLOUD_STORAGE) {
                const syncSuccess = await syncToCloudStorage(storageProducts);
                if (!syncSuccess) {
                    console.warn('⚠️ Stock updated locally but failed to sync to cloud.');
                    console.warn('⚠️ Other browsers may not see the stock change.');
                }
            }
        }
        
        // Add order (this will also sync orders to cloud via saveOrders)
        console.log('💳 Adding order to storage:', order);
        addOrder(order);
        
        // Wait a moment for localStorage write to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify order was saved
        let savedOrders = getOrders();
        console.log('✅ Order saved. Total orders now:', savedOrders.length);
        console.log('✅ Latest order:', savedOrders[0]);
        console.log('✅ All orders:', savedOrders);
        
        // Double-check: if order not found, save again
        const orderExists = savedOrders.some(o => o.id === order.id);
        if (!orderExists) {
            console.warn('⚠️ Order not found after save, retrying...');
            // Get current orders and add the new one
            const currentOrders = getOrders();
            currentOrders.unshift(order);
            await saveOrders(currentOrders);
            await new Promise(resolve => setTimeout(resolve, 200));
            savedOrders = getOrders();
            console.log('✅ After retry, total orders:', savedOrders.length);
            console.log('✅ Order exists now:', savedOrders.some(o => o.id === order.id));
        }
        
        // Clear cart
        localStorage.setItem(CART_KEY, JSON.stringify({}));
        updateCartCount(0);
        
        // Close modal and show success
        const modal = document.getElementById('app-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Build success message with breakdown
        let successMessage = `Payment successful! Order #${order.id}\n\n`;
        successMessage += `Subtotal: ${breakdown.subtotal.toLocaleString('en-US')} won\n`;
        if (breakdown.couponCode) {
            successMessage += `Coupon (${breakdown.couponName}): -${breakdown.discountAmount.toLocaleString('en-US')} won\n`;
        }
        successMessage += `Tax (1%): ${breakdown.taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} won\n`;
        successMessage += `Total: ${breakdown.finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} won\n\n`;
        successMessage += `You can view this order in "My Orders".`;
        
        alert(successMessage);
        
        // Reload products to show updated stock
        await loadEmbeddedProducts();
        
    } catch (err) {
        console.error('Error processing payment:', err);
        alert('Payment failed. Please try again.');
    } finally {
        isOperationInProgress = false;
    }
}

// View Orders Function
async function viewOrders() {
    console.log('🔍 viewOrders() called');
    try {
        // Get orders directly from localStorage (most reliable)
        let orders = getOrders();
        console.log('📦 Orders from localStorage:', orders.length);
        console.log('📦 Orders data:', JSON.stringify(orders, null, 2));
        
        // If no local orders, try syncing from cloud (might have orders from other browsers)
        if (orders.length === 0 && USE_CLOUD_STORAGE && !USE_API) {
            console.log('No local orders found, syncing from cloud...');
            try {
                await syncFromCloudStorage();
                orders = getOrders(); // Get merged orders after sync
                console.log('📦 Orders after cloud sync:', orders.length);
            } catch (err) {
                console.warn('Cloud sync failed, using local orders:', err);
            }
        } else if (USE_CLOUD_STORAGE && !USE_API) {
            // Background sync to get any new orders from other browsers (don't wait)
            syncFromCloudStorage().then(() => {
                // After sync completes, update display if we got more orders
                const updatedOrders = getOrders();
                if (updatedOrders.length > orders.length) {
                    console.log('📦 Found more orders after sync, updating display...');
                    // Re-render with updated orders
                    displayOrdersInModal(updatedOrders);
                }
            }).catch(err => {
                console.warn('Background sync failed:', err);
            });
        }
        
        console.log('📦 Final orders to display:', orders.length);
        console.log('📦 Final orders:', orders);
        
        // Display orders
        displayOrdersInModal(orders);
        
    } catch (err) {
        console.error('❌ Error viewing orders:', err);
        alert('Error loading orders: ' + err.message);
    }
}

// Helper function to display orders in modal
function displayOrdersInModal(orders) {
    console.log('🎨 displayOrdersInModal() called with orders:', orders);
    
    const modal = document.getElementById('app-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalListContainer = document.getElementById('modal-list-container');
    const modalSummary = document.getElementById('modal-summary');
    
    console.log('🔍 Modal elements check:');
    console.log('  - modal:', modal ? 'found' : 'NOT FOUND');
    console.log('  - modalTitle:', modalTitle ? 'found' : 'NOT FOUND');
    console.log('  - modalListContainer:', modalListContainer ? 'found' : 'NOT FOUND');
    console.log('  - modalSummary:', modalSummary ? 'found' : 'NOT FOUND');
    
    if (!modal || !modalTitle || !modalListContainer || !modalSummary) {
        console.error('❌ Modal elements not found');
        alert('Error: Modal elements not found. Please refresh the page.');
        return;
    }
    
    modalTitle.textContent = "My Orders";
    
    if (!orders || orders.length === 0) {
        modalListContainer.innerHTML = '<p class="p-4 text-center">You have no orders yet.</p>';
        modalSummary.innerHTML = '';
        modal.style.display = 'flex';
        return;
    }
    
    // Validate orders array
    if (!Array.isArray(orders)) {
        console.error('❌ Orders is not an array:', orders);
        modalListContainer.innerHTML = '<p class="p-4 text-center">Error: Invalid orders data.</p>';
        modalSummary.innerHTML = '';
        modal.style.display = 'flex';
        return;
    }
    
    // Create table format similar to cart with checkboxes
    let allItemsHtml = '';
    let grandTotal = 0;
    const uniqueOrderIds = new Set();
    
    orders.forEach(order => {
        if (!order || !order.items || !Array.isArray(order.items)) {
            console.warn('⚠️ Invalid order structure:', order);
            return;
        }
        
        uniqueOrderIds.add(order.id);
        const orderDate = new Date(order.date);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Use final total if available (includes discount and tax), otherwise calculate from items
        const orderTotal = order.totalPrice || order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
        grandTotal += orderTotal;
        
        // Each item gets its own checkbox
        let isFirstItem = true;
        order.items.forEach((item, itemIndex) => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            const uniqueItemId = `${order.id}-${itemIndex}`;
            
            allItemsHtml += `
                <tr>
                    <td style="vertical-align: middle; text-align: center;">
                        <input type="checkbox" class="order-checkbox" data-order-id="${order.id}" data-item-index="${itemIndex}" id="order-item-${uniqueItemId}" style="width: 20px; height: 20px; cursor: pointer;">
                    </td>
                    <td style="text-align: center;">
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                            <img src="${item.imageUrl || ''}" class="cart-img" alt="${item.name || 'Product'}">
                            <span style="display: block; max-width: 150px; overflow: hidden; text-overflow: ellipsis; font-weight: 600; color: var(--text-dark, #333);">${item.name || 'Unknown Product'}</span>
                        </div>
                    </td>
                    <td style="font-size: 0.8em;">Order #${order.id}${isFirstItem && order.couponCode ? `<br><small style="color: #28a745; font-size: 0.75em;">${order.couponName || order.couponCode}</small>` : ''}</td>
                    <td style="white-space: nowrap;">${(item.price || 0).toLocaleString('en-US')} won</td>
                    <td style="text-align: center;">${item.quantity || 0}</td>
                    <td style="white-space: nowrap;">${itemTotal.toLocaleString('en-US')} won</td>
                    <td style="font-size: 0.75em;">${formattedDate}</td>
                    <td style="font-size: 0.8em;">****${order.cardNumber || ''}</td>
                </tr>
            `;
            
            isFirstItem = false;
        });
    });
    
    modalListContainer.innerHTML = `
        <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="select-all-orders" style="cursor: pointer;">
                <strong>Select All</strong>
            </label>
            <button id="delete-selected-orders-btn-top" class="btn-cancel" style="background-color: #dc3545; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">Delete Selected</button>
        </div>
        <table class="cart-table">
            <thead>
                <tr>
                    <th style="width: 40px;">Select</th>
                    <th style="width: 25%;">Product</th>
                    <th style="width: 15%;">Order #</th>
                    <th style="width: 12%;">Price</th>
                    <th style="width: 8%;">Qty</th>
                    <th style="width: 12%;">Total</th>
                    <th style="width: 18%;">Date</th>
                    <th style="width: 10%;">Card</th>
                </tr>
            </thead>
            <tbody>
                ${allItemsHtml.length > 0 ? allItemsHtml : '<tr><td colspan="8" class="text-center">You have no orders yet.</td></tr>'}
            </tbody>
        </table>
    `;
    // Calculate totals with coupon and tax breakdown
    let totalSubtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    
    orders.forEach(order => {
        if (order.subtotal !== undefined) {
            totalSubtotal += order.subtotal;
            totalDiscount += (order.discountAmount || 0);
            totalTax += (order.taxAmount || 0);
        } else {
            // Fallback for old orders without breakdown
            const orderSubtotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
            totalSubtotal += orderSubtotal;
        }
    });
    
    modalSummary.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Subtotal:</span>
                <strong>${totalSubtotal.toLocaleString('en-US')} won</strong>
            </div>
            ${totalDiscount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #28a745;">
                    <span>Total Discount:</span>
                    <strong>-${totalDiscount.toLocaleString('en-US')} won</strong>
                </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                <span>Total Tax (1%):</span>
                <strong>${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} won</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin: 15px 0; padding-top: 15px; border-top: 2px solid #333; font-size: 1.2em;">
                <span><strong>Grand Total:</strong></span>
                <span class="total-price">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} won</span>
            </div>
        </div>
        <div>
            Total Orders: <strong>${orders.length}</strong>
        </div>
        <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button id="download-orders-pdf-btn" class="btn-payment">Download as PDF</button>
            <button id="download-orders-image-btn" class="btn-payment">Download as Image</button>
        </div>
    `;
    modal.style.display = 'flex';
    
    // Update select all checkbox state
    function updateSelectAllState() {
        const selectAllCheckbox = document.getElementById('select-all-orders');
        const checkboxes = document.querySelectorAll('.order-checkbox');
        const allChecked = checkboxes.length > 0 && Array.from(checkboxes).every(cb => cb.checked);
        const someChecked = Array.from(checkboxes).some(cb => cb.checked);
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = someChecked && !allChecked;
        }
    }
    
    // Update delete button state
    function updateDeleteButtonState() {
        const deleteBtn = document.getElementById('delete-selected-orders-btn-top');
        const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
        if (deleteBtn) {
            deleteBtn.disabled = checkedBoxes.length === 0;
            deleteBtn.style.opacity = checkedBoxes.length === 0 ? '0.5' : '1';
            deleteBtn.style.cursor = checkedBoxes.length === 0 ? 'not-allowed' : 'pointer';
        }
    }
    
    // Wait a moment for DOM to be ready, then attach event listeners
    setTimeout(() => {
        // Add select all functionality
        const selectAllCheckbox = document.getElementById('select-all-orders');
        if (selectAllCheckbox) {
            // Remove any existing listeners by cloning
            const newSelectAll = selectAllCheckbox.cloneNode(true);
            selectAllCheckbox.parentNode.replaceChild(newSelectAll, selectAllCheckbox);
            
            newSelectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.order-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
                updateDeleteButtonState();
            });
        }
        
        // Add individual checkbox change handlers
        const orderCheckboxes = document.querySelectorAll('.order-checkbox');
        orderCheckboxes.forEach(checkbox => {
            // Remove any existing listeners by cloning
            const newCheckbox = checkbox.cloneNode(true);
            checkbox.parentNode.replaceChild(newCheckbox, checkbox);
            
            newCheckbox.addEventListener('change', () => {
                updateSelectAllState();
                updateDeleteButtonState();
            });
            
            // Also make the entire row clickable
            const row = newCheckbox.closest('tr');
            if (row) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', (e) => {
                    // Don't toggle if clicking directly on checkbox
                    if (e.target !== newCheckbox && e.target.type !== 'checkbox') {
                        newCheckbox.checked = !newCheckbox.checked;
                        updateSelectAllState();
                        updateDeleteButtonState();
                    }
                });
            }
        });
        
        // Initialize states
        updateSelectAllState();
        updateDeleteButtonState();
    }, 100);
    
    // Add delete selected orders button functionality (top button)
    const deleteSelectedBtnTop = document.getElementById('delete-selected-orders-btn-top');
    if (deleteSelectedBtnTop) {
        deleteSelectedBtnTop.addEventListener('click', async () => {
            const checkedBoxes = document.querySelectorAll('.order-checkbox:checked');
            // Get unique order IDs from selected items
            const selectedOrderIds = new Set();
            checkedBoxes.forEach(cb => {
                selectedOrderIds.add(parseInt(cb.dataset.orderId));
            });
            
            // Delete all orders that have at least one selected item
            if (selectedOrderIds.size > 0) {
                await deleteSelectedOrders(Array.from(selectedOrderIds));
            }
        });
    }
    
    updateDeleteButtonState(); // Initialize button state
    
    // Add download PDF button functionality
    const downloadPdfBtn = document.getElementById('download-orders-pdf-btn');
    if (downloadPdfBtn) {
        const newPdfBtn = downloadPdfBtn.cloneNode(true);
        downloadPdfBtn.parentNode.replaceChild(newPdfBtn, downloadPdfBtn);
        newPdfBtn.addEventListener('click', () => {
            // Use the original orders that were displayed (not affected by deletions)
            downloadOrdersAsPDFEnglish(orders);
        });
    }
    
    // Add download Image button functionality
    const downloadImageBtn = document.getElementById('download-orders-image-btn');
    if (downloadImageBtn) {
        const newImageBtn = downloadImageBtn.cloneNode(true);
        downloadImageBtn.parentNode.replaceChild(newImageBtn, downloadImageBtn);
        newImageBtn.addEventListener('click', () => {
            // Use the original orders that were displayed (not affected by deletions)
            downloadOrdersAsImage(orders);
        });
    }
}
