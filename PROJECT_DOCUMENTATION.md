# Codélook E-Commerce Platform
## Project Documentation

**Author:** KYAW ZIN WIN (쪄진웬)  
**Student ID:** 24102630  
**Project Type:** Full-Stack Web Application  
**Technologies:** HTML5, CSS3, JavaScript (ES6+), LocalStorage, JSONBin.io Cloud Storage

---

## Introduction

Codélook is a modern, responsive e-commerce web application designed for fashion retail. The platform provides a complete shopping experience with separate interfaces for customers (buyers) and sellers (partners). The application features a clean, modern UI with glassmorphism design elements, smooth animations, and a comprehensive product management system.

The platform supports multiple user roles:
- **Public Users**: Browse the main page and view promotions
- **Buyers**: Shop, manage wishlists, cart, and place orders with coupon codes
- **Sellers/Partners**: Manage product inventory, add/edit/delete products

---

## Goal / Motivation

### Primary Goals:
1. **Create a functional e-commerce platform** that demonstrates full-stack web development skills
2. **Implement role-based access control** for different user types (buyers and sellers)
3. **Provide a seamless shopping experience** with features like wishlist, cart, and order management
4. **Enable sellers to efficiently manage** their product inventory through a dedicated dashboard
5. **Implement modern UI/UX design** with responsive layouts and smooth interactions

### Motivation:
- Learn and apply modern web development practices
- Understand client-side data management using LocalStorage and cloud storage
- Practice building user interfaces with HTML, CSS, and JavaScript
- Create a practical, real-world application that could be extended for commercial use
- Demonstrate proficiency in front-end development and user experience design

---

## Main Content

### Planning / Design

#### Architecture Overview:
```
┌─────────────────────────────────────────┐
│         Main Landing Page               │
│    (Public Access - No Login)           │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐         ┌──────▼──────┐
│ Buyer  │         │   Seller    │
│ Login  │         │   Login     │
└───┬────┘         └──────┬──────┘
    │                     │
┌───▼──────────┐   ┌──────▼──────────┐
│ User Page    │   │  Seller Page    │
│ - Shop       │   │  - Add Product  │
│ - Wishlist   │   │  - Edit Product │
│ - Cart       │   │  - Delete       │
│ - Orders     │   │  - View List    │
└──────────────┘   └─────────────────┘
```

#### Technology Stack:
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: 
  - LocalStorage (primary data persistence)
  - JSONBin.io (cloud storage for cross-browser sync)
- **Libraries**: 
  - jsPDF & jsPDF-AutoTable (for PDF export functionality)
- **Design**: Custom CSS with modern gradients, glassmorphism effects, and animations

#### File Structure:
```
WEB project/
├── index.html              # Homepage with project links
├── html/
│   ├── mainpage.html       # Public landing page
│   ├── login.html          # Buyer login page
│   ├── partner_login.html  # Seller login page
│   ├── user.html           # Buyer shopping interface
│   └── seller.html         # Seller dashboard
├── css/
│   ├── mainpage.css        # Landing page styles
│   ├── login.css           # Buyer login styles
│   ├── partner_login.css   # Seller login styles
│   └── user.css            # User interface styles
├── js/
│   ├── data.js             # Core data management & business logic
│   ├── auth.js             # Authentication system
│   ├── main.js             # Event handlers & page initialization
│   ├── firebase-config.js  # Firebase configuration (if used)
│   └── items.json          # Initial product data
└── WEB Summary/            # Chapter summaries (documentation)
```

---

### Screenshots

*Note: Screenshots would be added here showing:*
- Main landing page with banner slider
- User shopping interface with product cards
- Cart and wishlist modals
- Payment modal with coupon code input
- Order history with detailed breakdown
- Seller dashboard with product management
- Product registration form

---

### Menu / Feature Descriptions

#### 1. **Main Landing Page** (`mainpage.html`)
**Features:**
- **Navigation Bar**: Logo, Home, About Us, Partnership link, Login button
- **Hero Section**: Auto-rotating banner slider (5 images) with navigation arrows
- **About Section**: Expandable information blocks:
  - Promotions (discounts and offers)
  - Partnership Benefits
  - Other Advantages (shipping, rewards, exclusive access)
- **Responsive Design**: Adapts to different screen sizes

**User Flow:**
1. Visitor lands on main page
2. Can browse promotions and partnership information
3. Can navigate to login pages (buyer or seller)

---

#### 2. **Buyer Interface** (`user.html`)
**Features:**

##### **Product Browsing:**
- **Category Filters**: All, Tops, Bottoms, Outerwear, Accessories
- **Sort Options**: Price (Low to High, High to Low), Name (A to Z)
- **Search Functionality**: Real-time product search by name
- **Product Cards**: Display image, name, price, category, tags, stock status
- **Responsive Grid Layout**: Automatically adjusts columns based on screen size

##### **Wishlist Management:**
- Add/remove products to wishlist
- View wishlist in modal
- Wishlist count displayed in navigation
- Persistent storage across sessions

##### **Shopping Cart:**
- Add products to cart with quantity selection
- Update quantities with +/- buttons
- Remove items from cart
- View cart total
- Cart count displayed in navigation
- Persistent storage across sessions

##### **Payment System:**
- **Coupon Codes**: 
  - `1111` - New Membership (20% off)
  - `2525` - Christmas (35% off)
  - `2026` - New Year (50% off)
- **Tax Calculation**: 1% tax on subtotal
- **Payment Breakdown**: Shows subtotal, discount, tax, and final total
- **Card Payment**: Secure payment processing (simulated)
- **Order Confirmation**: Detailed order receipt with all items

##### **Order Management:**
- View order history in modal
- Display order details: date, items, quantities, prices
- Show coupon and tax breakdown per order
- Select multiple orders for deletion
- "Select All" functionality
- Delete selected orders

**User Flow:**
1. Login as buyer
2. Browse products with filters/search
3. Add items to wishlist or cart
4. View cart and proceed to payment
5. Apply coupon code (optional)
6. Complete payment
7. View order history

---

#### 3. **Seller Dashboard** (`seller.html`)
**Features:**

##### **Product Registration:**
- Add new products with:
  - Name
  - Image URL
  - Price (KRW)
  - Category (dropdown)
  - Stock quantity
  - Tags (comma-separated)
- Form validation
- Auto-refresh product list after addition

##### **Product Management:**
- View all products in table format
- Edit existing products (inline editing)
- Delete products (with confirmation)
- Real-time updates across all browser tabs
- Cloud sync for multi-device access

##### **Product Table Columns:**
- ID
- Image (thumbnail)
- Name
- Category
- Price
- Stock
- Action buttons (Edit/Delete)

**User Flow:**
1. Login as seller/partner
2. Add new products via registration form
3. View product list
4. Edit products inline
5. Delete products as needed
6. Changes sync automatically

---

#### 4. **Authentication System**
**Features:**
- **Role-Based Access**: Separate login for buyers and sellers
- **Session Management**: Maintains login state
- **Auto-Redirect**: Redirects to appropriate page after login
- **Logout Functionality**: Clears session and redirects to main page
- **Security**: Password validation (basic implementation)

**Login Credentials:**
- **Buyer**: Username/Password authentication
- **Seller/Partner**: Username/Password authentication

---

### Code Explanation

#### **1. Data Management (`js/data.js`)**

##### **Storage System:**
```javascript
// LocalStorage Keys
const STORAGE_KEY = 'codedlookProducts';
const WISHLIST_KEY = 'codedlookWishlist';
const CART_KEY = 'codedlookCart';
const ORDERS_KEY = 'codedlookOrders';
```

**Purpose**: Manages all application data using LocalStorage for persistence and JSONBin.io for cloud synchronization.

##### **Key Functions:**

**`validateCoupon(couponCode)`**
```javascript
function validateCoupon(couponCode) {
    const coupons = {
        '1111': { discount: 0.20, name: 'New Membership' },
        '2525': { discount: 0.35, name: 'Christmas' },
        '2026': { discount: 0.50, name: 'New Year' }
    };
    return coupons[couponCode] || null;
}
```
- Validates coupon codes and returns discount percentage
- Returns null for invalid codes

**`calculatePaymentBreakdown(subtotal, couponCode)`**
```javascript
function calculatePaymentBreakdown(subtotal, couponCode = '') {
    const coupon = validateCoupon(couponCode);
    const discount = coupon ? subtotal * coupon.discount : 0;
    const taxRate = 0.01; // 1%
    const tax = (subtotal - discount) * taxRate;
    const total = subtotal - discount + tax;
    
    return {
        subtotal,
        discount,
        discountPercent: coupon ? coupon.discount * 100 : 0,
        couponName: coupon ? coupon.name : '',
        tax,
        taxRate: taxRate * 100,
        total
    };
}
```
- Calculates payment breakdown including discount and tax
- Returns detailed financial summary

**`processPayment(cartItems, totalPrice, cardNumber, couponCode, breakdown)`**
- Processes payment and creates order
- Stores order with detailed breakdown (subtotal, discount, tax, total)
- Clears cart after successful payment
- Updates order history

**`displayOrdersInModal(orders)`**
- Displays order history in modal
- Shows order date, items, quantities, prices
- Displays coupon and tax breakdown
- Implements checkbox selection for bulk deletion
- "Select All" functionality

**`viewCart()`**
- Displays cart items in modal
- Shows product details, quantities, prices
- Quantity adjustment buttons (+/-)
- Remove item functionality
- Proceeds to payment modal

**Product Management Functions:**
- `addProduct()`: Adds new product to inventory
- `updateProduct()`: Updates existing product
- `deleteProduct()`: Removes product from inventory
- `loadProducts()`: Loads products from storage/API
- `displayProducts()`: Renders products in grid layout

**Cloud Sync Functions:**
- `syncToCloud()`: Syncs data to JSONBin.io
- `syncFromCloud()`: Retrieves data from cloud
- Handles race conditions with operation locks

---

#### **2. Authentication (`js/auth.js`)**

**`authenticateAndRedirect(role, username, password, redirectPage)`**
```javascript
function authenticateAndRedirect(role, username, password, redirectPage) {
    // Validates credentials
    // Sets session storage
    // Redirects to appropriate page
}
```
- Validates user credentials based on role
- Stores authentication state in sessionStorage
- Redirects to buyer or seller page

**`handleRoleSwitch()`**
- Manages switching between buyer and seller roles
- Clears previous session data

---

#### **3. Main Event Handlers (`js/main.js`)**

**Page Initialization:**
- `DOMContentLoaded` event listeners
- Initializes data loading
- Sets up event handlers for buttons and forms
- Handles dynamic DOM elements with MutationObserver

**Event Handlers:**
- Filter button clicks
- Sort option changes
- Search input changes
- Wishlist/Cart/Orders button clicks
- Modal close buttons
- Logout functionality

**Special Handling:**
- Multiple fallback mechanisms for login button (setTimeout, MutationObserver, inline script)
- Ensures buttons are always clickable even with dynamic DOM loading

---

#### **4. Styling (`css/` files)**

##### **Modern Design Elements:**

**Glassmorphism Effect:**
```css
.modal-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

**Gradient Backgrounds:**
```css
body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**Smooth Animations:**
```css
.product-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
```

**Responsive Design:**
- Media queries for mobile, tablet, desktop
- Flexible grid layouts
- Adaptive font sizes and spacing

**Key Style Features:**
- Wide borders (4-6px) for modern look
- Increased padding for spacious layout
- Custom scrollbars
- Smooth transitions and hover effects
- Color-coded categories and status indicators

---

#### **5. HTML Structure**

**Semantic HTML5:**
- Proper use of `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Accessible form elements with labels
- ARIA attributes where appropriate

**Modal System:**
- Reusable modal component
- Dynamic content injection
- Backdrop overlay for focus

**Product Cards:**
- Image, name, price, category, tags
- Action buttons (Add to Cart, Add to Wishlist)
- Stock status indicator

---

## Conclusion

### Project Summary

Codélook successfully implements a complete e-commerce platform with:
- ✅ **Dual User Roles**: Separate interfaces for buyers and sellers
- ✅ **Product Management**: Full CRUD operations for products
- ✅ **Shopping Features**: Wishlist, cart, and order management
- ✅ **Payment System**: Coupon codes, tax calculation, and order processing
- ✅ **Modern UI/UX**: Responsive design with glassmorphism and animations
- ✅ **Data Persistence**: LocalStorage with cloud sync capability
- ✅ **User Experience**: Smooth interactions, real-time updates, intuitive navigation

### Technical Achievements

1. **Robust Data Management**: Implemented race condition prevention, operation locks, and cloud synchronization
2. **Dynamic UI Updates**: Real-time product list updates, cart/wishlist counters, and modal management
3. **Payment Processing**: Complete payment flow with coupon validation and tax calculation
4. **Responsive Design**: Works seamlessly across different screen sizes
5. **Code Organization**: Modular structure with separation of concerns (data, auth, UI)

### Challenges Overcome

1. **Type Mismatch Issues**: Fixed product ID normalization between string and integer types
2. **Event Listener Attachment**: Implemented multiple fallback mechanisms for dynamic DOM elements
3. **Race Conditions**: Added operation locks to prevent concurrent data modifications
4. **Cross-Browser Sync**: Integrated JSONBin.io for cloud storage
5. **UI/UX Iterations**: Continuously refined design based on user feedback

---

## Future Improvements

### Short-Term Enhancements:

1. **Backend Integration**
   - Replace LocalStorage with proper backend API (Node.js/Express, Python/Flask, etc.)
   - Implement database (MongoDB, PostgreSQL, MySQL)
   - Add user registration and authentication with JWT tokens

2. **Enhanced Security**
   - Implement proper password hashing (bcrypt)
   - Add CSRF protection
   - Secure API endpoints
   - Input validation and sanitization

3. **Payment Gateway Integration**
   - Integrate real payment processors (Stripe, PayPal, etc.)
   - Add multiple payment methods (credit card, bank transfer, etc.)
   - Implement payment verification and receipts

4. **Image Upload System**
   - Replace image URLs with file upload functionality
   - Image compression and optimization
   - Cloud storage integration (AWS S3, Cloudinary, etc.)

### Medium-Term Features:

5. **User Profiles**
   - User account management
   - Shipping address management
   - Order tracking
   - Review and rating system

6. **Advanced Search & Filtering**
   - Price range slider
   - Multiple category selection
   - Tag-based filtering
   - Saved search preferences

7. **Inventory Management**
   - Low stock alerts
   - Automatic reorder points
   - Product variants (size, color)
   - Bulk import/export

8. **Analytics Dashboard**
   - Sales reports for sellers
   - Popular products tracking
   - Revenue analytics
   - Customer behavior insights

### Long-Term Vision:

9. **Mobile Application**
   - React Native or Flutter mobile app
   - Push notifications
   - Mobile-optimized checkout

10. **Multi-Vendor Support**
    - Multiple sellers on one platform
    - Commission system
    - Seller ratings and reviews

11. **Advanced Features**
    - AI-powered product recommendations
    - Chatbot customer support
    - Social media integration
    - Email marketing campaigns
    - Loyalty program with points system

12. **Internationalization**
    - Multi-language support
    - Currency conversion
    - Regional shipping options
    - Tax calculation by region

13. **Performance Optimization**
    - Code splitting and lazy loading
    - Image lazy loading
    - Service workers for offline functionality
    - CDN integration for static assets

14. **Testing & Quality Assurance**
    - Unit tests (Jest, Mocha)
    - Integration tests
    - End-to-end tests (Cypress, Selenium)
    - Performance testing

15. **DevOps & Deployment**
    - CI/CD pipeline (GitHub Actions, Jenkins)
    - Docker containerization
    - Cloud deployment (AWS, Azure, GCP)
    - Monitoring and logging (Sentry, LogRocket)

---

## Technical Specifications

### Browser Compatibility:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance:
- Fast page load times
- Smooth animations (60fps)
- Efficient data operations
- Optimized image loading

### Accessibility:
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility (basic)
- Color contrast compliance

---

## Acknowledgments

- **Design Inspiration**: Modern e-commerce platforms and glassmorphism design trends
- **Libraries Used**: jsPDF, jsPDF-AutoTable
- **Cloud Storage**: JSONBin.io for cross-browser synchronization
- **Development Tools**: VS Code, Git, GitHub

---

## Contact & Repository

**Developer:** KYAW ZIN WIN (쪄진웬)  
**Student ID:** 24102630  
**Repository:** [GitHub Repository Link]  
**Project Type:** Academic Web Development Project

---

*Last Updated: January 2025*

