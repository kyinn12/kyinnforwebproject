# What is an API Key?

## 🔑 Simple Explanation

An **API key** is like a password that proves you have permission to access and modify data on JSONBin.io.

Think of it like:
- 🔐 **Your house key** - proves you own the house (your bin)
- 🚪 **Without the key** - you can't get in (401 error)
- ✅ **With the key** - you can read and write data

## 📋 In Your Case (JSONBin.io)

You have **TWO types of keys** on JSONBin.io:

### 1. **X-MASTER-KEY** (Use This One!)
- **What it is:** Your main account key
- **Full access:** Can do everything (read, write, delete, create)
- **Where to find it:** On the API Keys page (top section)
- **Looks like:** `$2a$10$NuhW8DlovuYhDBgGTIGsJeR09351.7JzDzd8CkF0VVnYvgog3YZfG`
- **Use this in your code:** ✅ YES - This is what you need!

### 2. **X-ACCESS-KEY** (Optional)
- **What it is:** Limited access key with specific permissions
- **Limited access:** Only what you allow (read, write, etc.)
- **Where to find it:** Below X-MASTER-KEY section
- **Looks like:** `$2a$10$c3YL4GENx7ypJwFD.9XKvu5ECIvAeJTww63qEii8aoiP4GWMhFg0i`
- **Use this in your code:** ❌ NO - Not needed for your project

## 🎯 Which One Should You Use?

**Use the X-MASTER-KEY!**

Your code uses `X-Master-Key` header, so you need the **X-MASTER-KEY** value.

## 📝 How to Copy It

1. **Go to:** https://jsonbin.io/app/account/api-keys
2. **Find:** "X-MASTER-KEY" section (at the top)
3. **Copy:** Click the copy icon next to the long string
   - It starts with: `$2a$10$...`
   - It's very long (about 60 characters)
4. **Paste it** into your code

## 💻 How to Add It to Your Code

1. **Open:** `js/data.js`
2. **Find line 22:**
   ```javascript
   const JSONBIN_API_KEY = null;
   ```
3. **Replace with:**
   ```javascript
   const JSONBIN_API_KEY = '$2a$10$NuhW8DlovuYhDBgGTIGsJeR09351.7JzDzd8CkF0VVnYvgog3YZfG';
   ```
   - ⚠️ **Important:** Use YOUR X-MASTER-KEY (the one you copied)
   - ⚠️ **Important:** Keep the quotes `'...'`
   - ⚠️ **Important:** No spaces before or after

## 🔒 Security Note

**Keep your API key secret!**
- ✅ It's okay in your code (it's public on GitHub Pages anyway)
- ❌ Don't share it publicly
- ❌ Don't post it in forums or chat

If someone gets your key, they can modify your data!

## 🧪 How It Works

```
Your App → Sends API Key → JSONBin.io → Checks Key → Allows/Denies Access
```

1. **Your app** tries to save data
2. **Sends** the API key with the request
3. **JSONBin.io** checks if the key is valid
4. **If valid:** ✅ Allows the operation
5. **If invalid:** ❌ Returns 401 error

## ❓ Common Questions

**Q: Why do I need it?**
A: To prove you own the bin and can modify it.

**Q: What if I lose it?**
A: You can regenerate it (click the refresh icon), but you'll need to update your code.

**Q: Can I use the X-ACCESS-KEY instead?**
A: Yes, but X-MASTER-KEY is simpler and works for everything.

**Q: What if I don't use an API key?**
A: You'll get 401 errors when trying to write data. Reads might work if bin is public.

## ✅ Quick Checklist

- [ ] Go to: https://jsonbin.io/app/account/api-keys
- [ ] Find "X-MASTER-KEY" section
- [ ] Copy the entire key (click copy icon)
- [ ] Open `js/data.js`
- [ ] Paste it on line 22 (with quotes)
- [ ] Save and upload to GitHub

## 🎯 Your Current Keys

From the image, I can see:
- **X-MASTER-KEY:** `$2a$10$NuhW8DlovuYhDBgGTIGsJeR09351.7JzDzd8CkF0VVnYvgog3YZfG`
- **X-ACCESS-KEY (CÓDELOOK):** `$2a$10$c3YL4GENx7ypJwFD.9XKvu5ECIvAeJTww63qEii8aoiP4GWMhFg0i`

**Use the X-MASTER-KEY in your code!**

