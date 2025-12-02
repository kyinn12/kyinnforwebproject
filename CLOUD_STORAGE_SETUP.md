# How to Enable Cloud Storage (Share Data Across Browsers)

## Problem
By default, `localStorage` is browser-specific. Items added in one browser won't appear in another browser.

## Solution
Enable cloud storage to sync products across all browsers.

## Setup Instructions

### Option 1: Using JSONBin.io (Free, Simple)

1. **Create a free account:**
   - Go to https://jsonbin.io/
   - Sign up for a free account

2. **Create a new bin:**
   - Click "Create Bin"
   - Paste this JSON structure:
   ```json
   {
     "products": []
   }
   ```
   - Click "Save"

3. **Get your Bin ID:**
   - After saving, look at the URL: `https://jsonbin.io/your-bin-id`
   - Copy the `your-bin-id` part

4. **Update the code:**
   - Open `js/data.js`
   - Find these lines (around line 13-15):
   ```javascript
   const CLOUD_STORAGE_BIN_ID = null; // Set this to your bin ID
   const USE_CLOUD_STORAGE = false; // Set to true to enable
   ```
   - Change to:
   ```javascript
   const CLOUD_STORAGE_BIN_ID = 'your-bin-id-here';
   const USE_CLOUD_STORAGE = true;
   ```

5. **Get API Key (for write access):**
   - Go to https://jsonbin.io/app/account/api-keys
   - Copy your API key
   - Note: The free tier has rate limits, but it's enough for testing

6. **Update the sync function:**
   - In `js/data.js`, find `syncToCloudStorage` function
   - Add your API key to the headers:
   ```javascript
   headers: {
       'Content-Type': 'application/json',
       'X-Master-Key': 'your-api-key-here'
   }
   ```

### Option 2: Using Firebase (More Robust, Free)

1. **Create Firebase project:**
   - Go to https://console.firebase.google.com/
   - Create a new project

2. **Enable Firestore:**
   - Go to Firestore Database
   - Click "Create database"
   - Start in test mode (for development)

3. **Get Firebase config:**
   - Go to Project Settings > General
   - Scroll to "Your apps"
   - Copy the config object

4. **Update firebase-config.js:**
   - Open `js/firebase-config.js`
   - Replace the config values
   - Set `USE_FIREBASE = true`

5. **Add Firebase SDK to HTML:**
   - Add these scripts before your other scripts:
   ```html
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js"></script>
   ```

## Current Status

- **Cloud Storage:** Currently DISABLED (`USE_CLOUD_STORAGE = false`)
- **Default Behavior:** Each browser has its own `localStorage`
- **After Setup:** All browsers will share the same product data

## Testing

After enabling cloud storage:
1. Add a product in Browser A
2. Refresh Browser B
3. The new product should appear in Browser B

## Notes

- Cloud storage syncs products only (not wishlist/cart - those stay local)
- Changes sync when you add/edit/delete products
- Changes sync when you load the page
- Free tiers have rate limits, but sufficient for personal use

