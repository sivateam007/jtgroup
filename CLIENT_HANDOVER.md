# JT Group of Institution - Client Handover Document

## Project Overview
**Project:** Online Learning Platform with Razorpay Payment Integration  
**Repository:** https://github.com/sivateam007/jtgroup  
**Live Demo:** https://jt-6wv5.onrender.com  
**Tech Stack:** Node.js, Express.js, SQLite, HTML/CSS/JS, Razorpay  

---

## ✅ Project Status: READY FOR PRODUCTION

All features implemented, tested, and secured.

---

## Features Delivered

### 1. User Authentication ✅
- Signup with name, email, DOB, password
- Login with email/password
- Forgot password (email + DOB verification)
- JWT-based authentication (7-day expiry)
- HttpOnly cookies with SameSite protection

### 2. Razorpay Payment Integration ✅
- ₹29 for 30 days full access
- **MAXIMUM SECURITY:** Razorpay Key ID never exposed to frontend
- Uses Razorpay Payment Links API (server-to-server)
- User redirected to `rzp.io` for payment
- Webhook verification for payment confirmation
- Subscription auto-extends on re-payment

### 3. Course Content (Tamil) ✅
- **50+ courses** across multiple categories:
  - Front End Development (HTML, CSS, JavaScript)
  - Full Stack Development (Angular, Node.js, MongoDB)
  - Programming Languages (Python, SQL, Git, etc.)
  - Web Development
  - Backend Development
  - Database Management (MySQL, MongoDB)

### 4. Access Control ✅
- Free users: Can browse course listings
- Paid users: Full access to all course content
- Middleware protects `/courses/*` routes

### 5. Progress Tracking ✅
- Track completed topics per course
- Dashboard shows progress percentage
- Resume learning from last topic

### 6. Security Hardened ✅
- Helmet.js security headers
- Rate limiting (auth: 10/15min, payment: 5/hour)
- Input validation (email, name, date format)
- CSRF protection via SameSite cookies
- Directory traversal protection
- Webhook signature verification
- Strong JWT secret (64-char hex)

---

## Environment Variables for Production

Create `.env` file in project root with:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
APP_ORIGIN=https://www.jtgroupofinstitution.com

# JWT Configuration (ALREADY SET - DO NOT CHANGE)
JWT_SECRET=578c0f4ccc529ec6b1cf5788f7307fbb6175f2312175a42ea07a32155c1bffdb1e2cd37039720ea9f5726d30329d200a454c6f9dd8a7af65b1b1ac8acb7aeba0
JWT_COOKIE_NAME=jt_token

# Razorpay Keys (CLIENT MUST PROVIDE LIVE KEYS)
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# Pricing
PLAN_PRICE_INR=29
PLAN_VALID_DAYS=30
```

**Client Action Required:**
1. Create Razorpay live account at https://dashboard.razorpay.com
2. Generate live API keys (Settings → API Keys)
3. Setup webhook (Settings → Webhooks):
   - URL: `https://www.jtgroupofinstitution.com/api/payment/webhook`
   - Events: Select `payment_link.paid`
   - Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

---

## Deployment Instructions

### Option A: Hostinger VPS (Recommended)
Refer to `DEPLOYMENT.md` for detailed VPS setup:
- Install Node.js, Nginx, PM2
- Clone repo: `git clone https://github.com/sivateam007/jtgroup`
- Configure `.env` with live Razorpay keys
- Start with PM2: `pm2 start backend/src/server.js --name jtgroup`
- Configure Nginx reverse proxy + SSL

### Option B: Render.com (Current Demo)
- Connect GitHub repo to Render
- Add environment variables in Render dashboard
- Auto-deploys on every git push

---

## Testing Credentials

### Test User
- Email: `test7@example.com`
- Password: (Stored in database - reset if needed)

### Razorpay Test Payment
- Card: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/30)
- CVV: Any 3 digits (e.g., 123)

---

## File Structure

```
jtgroupofinstitution/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server (Express.js)
│   │   ├── routes/            # API routes (auth, payment, courses)
│   │   ├── middleware/        # Auth & access control
│   │   └── db/               # SQLite database
│   └── .env                  # Environment variables (NOT in repo)
├── public/
│   ├── app/                   # Frontend pages (login, signup, dashboard)
│   ├── assets/                # CSS, images, JS
│   └── courses/tamil/        # Tamil course content (50+ courses)
├── nginx/                     # Nginx config for production
├── DEPLOYMENT.md              # VPS deployment guide
├── README.md                  # Project documentation
└── package.json               # Node.js dependencies
```

---

## Security Audit Results

| Security Feature | Status |
|------------------|--------|
| Helmet.js headers | ✅ Implemented |
| Rate limiting | ✅ Auth (10/15min), Payment (5/hour) |
| Input validation | ✅ Email, name, date format |
| CSRF protection | ✅ SameSite=strict cookies |
| JWT security | ✅ 64-char secret, HttpOnly |
| Razorpay Key ID exposure | ✅ ELIMINATED (server-only) |
| Webhook verification | ✅ HMAC-SHA256 signature check |
| Directory traversal | ✅ Protected |
| SQL injection | ✅ Parameterized queries |

---

## Support & Contact

**Developer:** Siva Team  
**GitHub:** https://github.com/sivateam007/jtgroup  
**Email:** (Client to provide support email)

**Common Issues:**
1. **Payment not working?** Check Razorpay keys in `.env`
2. **Courses not loading?** Check `public/courses/` folder structure
3. **Login issues?** Check database file permissions (`backend/data/app.db`)

---

## Next Steps for Client

1. ✅ Review this handover document
2. ✅ Get live Razorpay keys from https://dashboard.razorpay.com
3. ✅ Deploy to production (VPS or Render)
4. ✅ Add domain `www.jtgroupofinstitution.com`
5. ✅ Setup SSL certificate (Let's Encrypt or Hostinger)
6. ✅ Test payment flow with ₹1 (change `PLAN_PRICE_INR=1` temporarily)
7. ✅ Go live! 🚀

---

**Project Complete Date:** April 30, 2026  
**Version:** 1.0.0  
**Status:** ✅ READY FOR PRODUCTION
