# How to Fix 401 Unauthorized Error

## 🔴 The Problem

Console shows:
```
401 - Invalid X-Master-Key provided or the bin does not belong to your account
```

This means:
- ❌ The API key is incorrect, OR
- ❌ The API key belongs to a different account than the bin, OR
- ❌ The bin belongs to a different account

## ✅ Solution: Verify API Key and Bin Match

### Step 1: Check Your JSONBin.io Account

1. **Make sure you're logged into the correct account:**
   - Go to: https://jsonbin.io/app/bins
   - Check if you can see your bin: `692e8f8ad0ea881f400d3e91`
   - If you can't see it, you're in the wrong account

### Step 2: Verify the Bin Belongs to Your Account

1. **Go to your bins:**
   - https://jsonbin.io/app/bins
   - Find bin ID: `692e8f8ad0ea881f400d3e91`
   - If it's not there, create a new bin in the correct account

### Step 3: Get a Fresh API Key from the Same Account

1. **Go to API Keys:**
   - https://jsonbin.io/app/account/api-keys
   - Make sure you're logged into the SAME account that owns the bin

2. **Create a NEW API key:**
   - Click "Create API Key"
   - **Copy the ENTIRE key** (it starts with `$2a$10$...`)
   - Make sure you copy it completely - don't miss any characters

3. **Important:** The API key must be from the SAME account that owns the bin!

### Step 4: Make Bin Public (Recommended)

1. **Go to your bin:**
   - https://jsonbin.io/app/bins/692e8f8ad0ea881f400d3e91
   - Click on "Private" or the lock icon
   - Change to "Public"
   - This allows reads without API key

### Step 5: Update Your Code

1. **Open `js/data.js`**

2. **Update the API key on line 22:**
   ```javascript
   const JSONBIN_API_KEY = 'YOUR_NEW_API_KEY_HERE';
   ```
   - Make sure it's in quotes: `'...'`
   - Copy the ENTIRE key, no spaces

3. **Verify the bin ID on line 17:**
   ```javascript
   const CLOUD_STORAGE_BIN_ID = '692e8f8ad0ea881f400d3e91';
   ```

### Step 6: Upload to GitHub

```bash
git add js/data.js
git commit -m "Fix: Update API key for correct account"
git push origin main
```

## 🔍 Common Mistakes

1. **API key from wrong account:**
   - You have multiple JSONBin.io accounts
   - The API key is from Account A, but bin is in Account B
   - **Fix:** Use API key from the account that owns the bin

2. **Incomplete API key:**
   - You didn't copy the entire key
   - Missing characters at the end
   - **Fix:** Copy the complete key from JSONBin.io

3. **API key with extra spaces:**
   - Accidentally added spaces when copying
   - **Fix:** Make sure no spaces before/after the key

4. **Wrong bin ID:**
   - Using a bin from a different account
   - **Fix:** Create a new bin in your current account

## 🧪 Test After Fixing

1. Wait 1-2 minutes for GitHub Pages to update
2. Open your site
3. Open console (F12)
4. You should see:
   - ✅ `Synced from cloud storage: X products`
   - ❌ NO 401 errors

## 💡 Alternative: Use Public Bin (No API Key for Reads)

If you make the bin public:
- ✅ Reads work without API key
- ✅ Still need API key for writes (add/edit/delete)
- ✅ Less likely to get 401 errors on reads

## 📋 Quick Checklist

- [ ] Logged into correct JSONBin.io account
- [ ] Bin `692e8f8ad0ea881f400d3e91` visible in your bins
- [ ] Created NEW API key from SAME account
- [ ] Copied ENTIRE API key (no missing characters)
- [ ] API key has quotes in code: `'$2a$10$...'`
- [ ] Bin set to Public (optional but recommended)
- [ ] Updated `js/data.js` with new API key
- [ ] Committed and pushed to GitHub
- [ ] Tested - no more 401 errors

