# How to Fix the 404 Error - Setup JSONBin.io

## 🔴 Problem
Console shows: `404 - resource not found` for JSONBin.io

This means the bin ID doesn't exist. You need to create a new bin.

## ✅ Solution: Create a New Bin

### Step 1: Create Account (if needed)
1. Go to: https://jsonbin.io/
2. Click "Sign Up" (free account)
3. Sign in

### Step 2: Create a New Bin
1. Go to: https://jsonbin.io/app/bins
2. Click "Create Bin" or "+ New Bin"
3. In the JSON editor, paste this:
   ```json
   {
     "products": []
   }
   ```
4. Click "Save" or "Create"
5. **IMPORTANT:** Copy the Bin ID from the URL or bin details
   - It looks like: `674e5297654a7b423561451f`
   - You'll see it in the URL: `https://jsonbin.io/app/bins/674e5297654a7b423561451f`

### Step 3: Get Your API Key
1. Go to: https://jsonbin.io/app/account/api-keys
2. Click "Create API Key"
3. Copy the key (looks like: `$2b$10$...`)

### Step 4: Make Bin Public (Optional but Recommended)
1. Go back to your bin: https://jsonbin.io/app/bins/YOUR_BIN_ID
2. Click on bin settings/privacy
3. Make it "Public" (so it works without API key for reads)

### Step 5: Update Your Code
1. Open `js/data.js`
2. Find line 17: `const CLOUD_STORAGE_BIN_ID = '674e5297654a7b423561451f';`
3. Replace with your NEW bin ID:
   ```javascript
   const CLOUD_STORAGE_BIN_ID = 'YOUR_NEW_BIN_ID_HERE';
   ```

4. Find line 22: `const JSONBIN_API_KEY = null;`
5. Add your API key:
   ```javascript
   const JSONBIN_API_KEY = 'your-api-key-here';
   ```

### Step 6: Upload to GitHub
```bash
git add js/data.js
git commit -m "Update JSONBin bin ID and API key"
git push origin main
```

## 🧪 Test It
1. Wait 1-2 minutes for GitHub Pages to update
2. Open browser console (F12)
3. Refresh the page
4. You should see: `✅ Synced from cloud storage: X products`
5. No more 404 errors!

## 📝 Quick Reference
- Bin ID: Found in URL after creating bin
- API Key: Found in account settings
- Bin must have structure: `{ "products": [] }`

