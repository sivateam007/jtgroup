# Deployment Checklist for Hostinger VPS

## Pre-Deployment Checklist:
- [ ] 1. Hostinger VPS purchased (Ubuntu/Debian recommended)
- [ ] 2. Domain `www.jtgroupofinstitution.com` pointing to VPS IP
- [ ] 3. Razorpay LIVE keys obtained from https://dashboard.razorpay.com
- [ ] 4. Local project ready at `C:\Users\siva\Desktop\jtgroupofinstitution\`

---

## Phase 1: VPS Initial Setup (Run on VPS)
```bash
ssh root@your-vps-ip

# Update & install base packages
apt update && apt upgrade -y
apt install nginx certbot python3-certbot-nginx -y
```

---

## Phase 2: Install Node.js & PM2 (Run on VPS)
```bash
# Install NVM & Node.js 18
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
node --version  # Should show v18.x.x

# Install PM2
npm install -g pm2
```

---

## Phase 3: Upload Project (Run from YOUR Windows machine)
```powershell
# Upload project to VPS
cd C:\Users\siva\Desktop
scp -r jtgroupofinstitution root@your-vps-ip:/var/www/
```

---

## Phase 4: Configure Environment (Run on VPS)
```bash
cd /var/www/jtgroupofinstitution

# Create .env with PRODUCTION values
nano .env
```

**Paste this and EDIT values:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production
APP_ORIGIN=https://www.jtgroupofinstitution.com

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your_very_long_random_secret_string_32plus_chars
JWT_COOKIE_NAME=jt_token

# Razorpay LIVE Keys (Get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_live_your_key_id_here
RAZORPAY_KEY_SECRET=your_live_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Pricing
PLAN_PRICE_INR=29
PLAN_VALID_DAYS=30
CERTIFICATE_PRICE_INR=79
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Install dependencies
npm install --production
```

---

## Phase 5: Start App with PM2 (Run on VPS)
```bash
cd /var/www/jtgroupofinstitution

# Start with PM2 using ecosystem file
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Enable auto-start on boot
pm2 startup  # Follow the instructions to enable auto-start

# Check status
pm2 status
```

---

## Phase 6: Configure Nginx (Run on VPS)
```bash
# Copy nginx config from project
cp /var/www/jtgroupofinstitution/nginx/jtgroupofinstitution.com /etc/nginx/sites-available/

# Enable the site
ln -s /etc/nginx/sites-available/jtgroupofinstitution.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Phase 7: Setup SSL with Let's Encrypt (Run on VPS)
```bash
certbot --nginx -d www.jtgroupofinstitution.com -d jtgroupofinstitution.com
```

**Choose options:**
- Enter your email
- Agree to terms (A)
- Choose whether to share email (N)
- Select option to redirect HTTP to HTTPS (2)

---

## Phase 8: Upload Course Files (Run from YOUR Windows machine)
```powershell
# Upload Tamil courses
scp -r "C:\Users\siva\Desktop\host2\TAMIL\*" root@your-vps-ip:/var/www/jtgroupofinstitution/public/courses/tamil/
```

---

## Phase 9: Configure Razorpay (Webhook - Optional)
1. Login to https://dashboard.razorpay.com
2. Go to **Settings → Webhooks**
3. Add endpoint: `https://www.jtgroupofinstitution.com/api/payment/webhook`
4. Select events: `payment.authorized`, `payment.failed`
5. Copy webhook secret to `.env` file on VPS

---

## Phase 10: Test Production
Visit: **https://www.jtgroupofinstitution.com**

### Test Flow:
1. Sign up with email
2. Pay ₹29 with Razorpay test card: `4111 1111 1111 1111`
3. Access Tamil courses
4. Test all 6 categories (Web Dev, Front End, Full Stack, Programming, Backend, Database)

---

## Maintenance Commands:

### View Logs
```bash
pm2 logs jtgroup
pm2 flush  # Clear logs
```

### Restart Application
```bash
pm2 restart jtgroup
```

### Update Code
```bash
cd /var/www/jtgroupofinstitution
git pull  # If using git
npm install  # If dependencies changed
pm2 restart jtgroup
```

### Backup Database
```bash
cp /var/www/jtgroupofinstitution/backend/data/app.db /var/www/jtgroupofinstitution/backend/data/app.db.backup
```

---

## Troubleshooting:

### Check if Node.js App is Running
```bash
pm2 status
curl http://localhost:3000/api/courses?language=tamil
```

### Check Nginx Status
```bash
systemctl status nginx
nginx -t
```

### Check SSL Certificate
```bash
certbot certificates
```

### View Error Logs
```bash
pm2 logs jtgroup --err
tail -f /var/log/nginx/error.log
```

---

## Next Steps After Deployment:

1. **Add Hindi, Bengali, Malayalam** courses
2. **Implement Certificate System** (₹79 per course - deferred)
3. **Monitor logs** for errors
4. **Setup monitoring** (optional: PM2 Plus, New Relic)

---

## Files Created for Deployment:

| File | Location | Purpose |
|------|----------|---------|
| `ecosystem.config.js` | Project root | PM2 process configuration |
| `.env` (updated) | Project root | Production environment variables |
| `nginx/jtgroupofinstitution.com` | nginx/ | Nginx server configuration |

---

**Ready to deploy! Follow the checklist above step by step.**
