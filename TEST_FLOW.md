# Testing Full Flow - JT Group of Institution

## Pre-Testing Checklist
- [x] Server running on http://localhost:3000 (PID: 9292)
- [x] Razorpay test keys configured (rzp_test_SdoHI00hjGMUoA)
- [x] Database initialized with users and subscriptions tables
- [x] All course index files updated with professional design

---

## Test Flow 1: New User Signup & Payment

### Step 1: Open Landing Page
```
URL: http://localhost:3000
```
**Expected:**
- ✅ Logo (JT Logo) top left
- ✅ Navigation: Home | Dashboard
- ✅ Hero: "Learn IT Skills in Your Language"
- ✅ Language buttons: தமிழ் / हिंदी / বাংলা / മലയാളം
- ✅ Course cards: Web Development, Front End, Full Stack, Backend, Programming, Database
- ✅ Footer with Help Center: jassifteam@jtgroupofinstitution.com

### Step 2: Signup
```
1. Click "தமிழ்" (Tamil) or "Start Learning"
2. Should redirect to: http://localhost:3000/app/signup.html
3. Fill form:
   - Full Name: Test User
   - Email: testuser@gmail.com
   - Date of Birth: 1990-01-01
   - Password: Test@123
4. Click "Sign Up"
5. Should redirect to: http://localhost:3000/app/dashboard.html
```

**Expected:**
- ✅ Successful signup
- ✅ Auto-redirect to dashboard (NOT payment page)
- ✅ Dashboard shows:
  - Profile card with name "Test User"
  - Email: testuser@gmail.com
  - Status: "Inactive" (red badge)
  - "Subscribe Now - ₹29" button visible

### Step 3: Try Accessing Course Without Subscription
```
1. On dashboard, select "தமிழ்" language
2. Click on "Web Development" course card
3. OR directly visit: http://localhost:3000/courses/tamil/WEB_DEVELOPMENT/WEB_HTML/
```

**Expected:**
- ✅ Should redirect to login page OR show "Subscription Required"
- ✅ Access denied without subscription

### Step 4: Make Payment
```
1. On dashboard, click "Subscribe Now - ₹29" button
2. Should redirect to: http://localhost:3000/app/payment.html
3. Payment page shows:
   - User: Test User
   - Email: testuser@gmail.com
   - Plan: ₹29 for 30 days
   - Razorpay button: "Pay ₹29"
4. Click "Pay ₹29"
5. Razorpay popup appears
6. Use TEST CARD:
   - Card Number: 4111 1111 1111 1111
   - Expiry: Any future date (e.g., 12/30)
   - CVV: Any 3 digits (e.g., 123)
   - Name: Test User
7. Click "Pay Now"
```

**Expected:**
- ✅ Payment successful
- ✅ Redirect to dashboard with success message
- ✅ Profile card shows:
  - Status: "Active" (green badge)
  - Valid Until: [Date 30 days from now]
  - Button now says "Extend Subscription - ₹29"

### Step 5: Access Courses With Subscription
```
1. On dashboard, select "தமிழ்" language
2. Click on "Web Development" → "HTML"
3. Click "Start Learning" on HTML index page
4. Should open: HTML Tutorial.html
5. Try accessing directly:
   http://localhost:3000/courses/tamil/WEB_DEVELOPMENT/WEB_HTML/HTML Tutorial.html
```

**Expected:**
- ✅ Full access to ALL courses in ALL languages
- ✅ Can access HTML, CSS, JS, Python, etc.
- ✅ No redirect to login/payment

---

## Test Flow 2: Existing User (siva@gmail.com)

### Step 1: Login
```
URL: http://localhost:3000/app/login.html
Email: siva@gmail.com
Password: [Use password from signup]
```

**Expected:**
- ✅ Redirects to dashboard
- ✅ Profile shows active subscription (expires 2026-06-27)
- ✅ Access to all courses

---

## Test Flow 3: Payment Extension

### Step 1: Extend Subscription
```
1. Login with siva@gmail.com
2. On dashboard, click "Extend Subscription - ₹29"
3. Complete payment with test card
4. Subscription should extend by 30 more days
```

**Expected:**
- ✅ Valid until date extends (e.g., 2026-06-27 → 2026-07-27)
- ✅ Previous days don't get lost (extension, not reset)

---

## Test Flow 4: Access Control Verification

### Test 1: No Auth
```
1. Open incognito/private window
2. Try accessing: http://localhost:3000/courses/tamil/WEB_DEVELOPMENT/WEB_HTML/
```
**Expected:** Redirect to login page

### Test 2: Auth but No Subscription
```
1. Signup new user (no payment)
2. Try accessing course URL directly
```
**Expected:** Redirect to payment page or show "Subscription Required"

### Test 3: Valid Subscription
```
1. User with active subscription
2. Access any course in any language
```
**Expected:** Full access granted

---

## Test Flow 5: Course Pages Verification

### Check Professional Design
Visit these URLs and verify:
1. `http://localhost:3000/courses/tamil/` - Course categories
2. `http://localhost:3000/courses/tamil/programming-languages/` - All 11 courses showing
3. `http://localhost:3000/courses/tamil/database/` - Database courses (MySQL, SQL, MongoDB)
4. `http://localhost:3000/courses/tamil/programming-languages/HTML/` - HTML with Start Here + Certificate
5. `http://localhost:3000/courses/tamil/programming-languages/CSS/` - CSS with Start Here + Certificate
6. `http://localhost:3000/courses/tamil/programming-languages/JAVASCRIPT/` - JavaScript with 150+ topics
7. `http://localhost:3000/courses/tamil/programming-languages/ANGULAR/` - Angular (cleaned up)
8. `http://localhost:3000/courses/tamil/programming-languages/ANGULAR_JS/` - Angular JS (cleaned up)
9. `http://localhost:3000/courses/tamil/programming-languages/NODE_JS/` - Node.js (80+ topics)
10. `http://localhost:3000/courses/tamil/programming-languages/MONGO_DB/` - MongoDB (professional design)

**Expected:**
- ✅ Logo + Home + Dashboard buttons on all pages
- ✅ Hero section with proper gradient
- ✅ "Start Here" card as first topic
- ✅ "Course Completion Certificate" as last card
- ✅ Footer with Help Center email

---

## Razorpay Test Cards
- **Success:** 4111 1111 1111 1111
- **Failure:** 4111 1111 1111 1112
- **Any expiry date, any CVV, any name**

---

## Common Issues & Fixes

### Issue: Dashboard not showing "Database" course
**Fix:** Hard refresh browser (Ctrl+F5) or open in incognito

### Issue: Payment not working
**Check:**
1. Razorpay keys in .env file
2. Server console for errors
3. Test card details correct

### Issue: Courses not accessible after payment
**Check:**
1. Subscription status in dashboard
2. Database: `SELECT * FROM subscriptions WHERE user_id = X`
3. Server console for access control errors

---

## Ready for Deployment After Testing ✅

Once all tests pass:
1. Upload Hindi/Bengali/Malayalam course content
2. Follow DEPLOYMENT.md for VPS deployment
3. Configure SSL with `certbot --nginx`
4. Test live: https://www.jtgroupofinstitution.com/

---

**Current Server Status:** ✅ Running (PID: 9292)
**Database:** ✅ Connected (2 users, 4 subscriptions)
**All Course Pages:** ✅ Updated with professional design
