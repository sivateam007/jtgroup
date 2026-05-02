# Testing Checklist - JT Group of Institution

## Pre-Testing Setup
- [x] Server running on http://localhost:3000
- [x] Database initialized with tables
- [x] Razorpay test keys configured
- [x] All course pages created

## Test Flow 1: New User Signup & Payment

### Step 1: Landing Page
- [ ] Open http://localhost:3000
- [ ] Verify header with logo, Home, Dashboard buttons
- [ ] Verify hero section: "Learn IT Skills in Your Language"
- [ ] Verify language buttons: தமிழ் / हिंदी / বাংলা / മലയാളം
- [ ] Verify course cards: Web Development, Front End, Full Stack, Backend, Programming
- [ ] Verify testimonials section
- [ ] Verify partner logos: IBM, Google, Meta, Netflix, Amazon
- [ ] Verify footer with Help Center email

### Step 2: Signup
- [ ] Click "தமிழ்" or "Start Learning"
- [ ] Should redirect to signup page
- [ ] Verify signup page has: logo, Home button, Dashboard button, footer
- [ ] Fill form: Name, Email, Date of Birth, Password
- [ ] Click Sign Up
- [ ] Should redirect to dashboard (NOT payment page)

### Step 3: Dashboard (Without Subscription)
- [ ] Verify dashboard loads with user info (name, email)
- [ ] Verify 4 language buttons: தமிழ் / हिंदी / বাংলা / മലയാളം
- [ ] Select "தமிழ்" language
- [ ] Verify course cards appear: Web Development, Front End, Full Stack, Backend Development, Programming Languages
- [ ] Click on any course card
- [ ] Should redirect to login or show access denied (no subscription)

### Step 4: Payment
- [ ] Click "Subscribe Now" or go to /app/payment.html
- [ ] Verify payment page shows: user info, plan details (₹29 for 30 days)
- [ ] Click "Pay ₹29" button
- [ ] Razorpay popup should appear
- [ ] Use test card: 4111 1111 1111 1111, any expiry, any CVV
- [ ] Payment should succeed
- [ ] Should redirect to dashboard with success message

### Step 5: Access Courses (With Subscription)
- [ ] Dashboard should show "Subscribed" status
- [ ] Click on "Web Development" → Should open course page
- [ ] Click on "HTML" topic → Should open HTML index page
- [ ] Verify header with logo, Home, Dashboard buttons
- [ ] Click "Start Learning" → Should open HTML Tutorial.html
- [ ] Try accessing directly: http://localhost:3000/courses/tamil/WEB_DEVELOPMENT/WEB_HTML/HTML Tutorial.html
- [ ] Should load without redirect (has valid subscription)

## Test Flow 2: Existing User (siva@gmail.com)

### Step 1: Login
- [ ] Go to http://localhost:3000/app/login.html
- [ ] Login with: siva@gmail.com / (password used during signup)
- [ ] Should redirect to dashboard
- [ ] Verify subscription is active (expires 2026-06-27)

### Step 2: Access Backend Development
- [ ] Click on "Backend Development" course
- [ ] Verify Python and Node.js cards are visible
- [ ] Click "Python" → Should open Python index
- [ ] Click "Node.js" → Should open Node.js index

## Test Flow 3: Access Control

### Step 1: Without Login
- [ ] Open incognito/private window
- [ ] Try accessing: http://localhost:3000/courses/tamil/WEB_DEVELOPMENT/WEB_HTML/
- [ ] Should redirect to login page

### Step 2: With Login but No Subscription
- [ ] Login with a new user (no payment)
- [ ] Try accessing same course URL
- [ ] Should show "Subscription required" or redirect to payment

## Test Flow 4: Forgot Password
- [ ] Go to login page
- [ ] Click "Forgot Password?"
- [ ] Enter email and date of birth
- [ ] Should allow resetting password
- [ ] Login with new password

## Razorpay Test Cards
- **Success**: 4111 1111 1111 1111
- **Failure**: 4111 1111 1111 1112
- **Any expiry date, any CVV, any name**

## Expected Behavior Summary
✅ Signup → Dashboard (not payment)
✅ Login → Dashboard
✅ No subscription → Cannot access courses
✅ Valid subscription → Can access ALL courses in ALL languages
✅ Direct link access blocked without auth + subscription
✅ Payment extends subscription (not reset)
✅ ₹29 = 30 days access

## After Testing Complete
1. Fix any issues found
2. Proceed to Step 2: Upload Hindi/Bengali/Malayalam courses
3. Deploy to Hostinger VPS
