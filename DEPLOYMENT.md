# Deployment Guide - JT Group of Institution

## Production Deployment to Hostinger VPS

### Prerequisites
- Hostinger VPS with Ubuntu/Debian
- Domain: www.jtgroupofinstitution.com pointing to VPS IP
- Razorpay account (https://dashboard.razorpay.com)

---

## Step 1: Initial VPS Setup

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

Update and install dependencies:
```bash
apt update && apt upgrade -y
apt install nginx certbot python3-certbot-nginx -y
```

---

## Step 2: Install Node.js via NVM

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js 18 LTS
nvm install 18
nvm use 18
node --version  # Should show v18.x.x

# Install PM2 globally
npm install -g pm2
```

---

## Step 3: Upload Project to VPS

### Option A: Using Git
```bash
cd /var/www
git clone <your-repo-url> jtgroupofinstitution
cd jtgroupofinstitution
```

### Option B: Using SCP (from your local machine)
```powershell
# On your Windows machine
scp -r C:\Users\siva\Desktop\jtgroupofinstitution root@your-vps-ip:/var/www/
```

### Option C: Create fresh on VPS
```bash
mkdir -p /var/www/jtgroupofinstitution
cd /var/www/jtgroupofinstitution
```

---

## Step 4: Configure Environment

Create `.env` file in project root:
```bash
cd /var/www/jtgroupofinstitution
nano .env
```

Add your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=production
APP_ORIGIN=https://www.jtgroupofinstitution.com

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your_very_long_random_secret_string_here_32plus_chars
JWT_COOKIE_NAME=jt_token

# Razorpay Keys (Get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_live_your_key_id_here
RAZORPAY_KEY_SECRET=your_live_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Pricing
PLAN_PRICE_INR=29
PLAN_VALID_DAYS=30
```

Install dependencies:
```bash
npm install --production
```

---

## Step 5: Start Application with PM2

```bash
cd /var/www/jtgroupofinstitution
pm2 start backend/src/server.js --name jtgroup
pm2 save
pm2 startup  # Follow the instructions to enable auto-start
```

Check status:
```bash
pm2 status
pm2 logs jtgroup  # View logs
```

---

## Step 6: Configure Nginx

Create Nginx configuration:
```bash
nano /etc/nginx/sites-available/jtgroupofinstitution.com
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name www.jtgroupofinstitution.com jtgroupofinstitution.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.jtgroupofinstitution.com jtgroupofinstitution.com;
    
    # SSL (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/www.jtgroupofinstitution.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.jtgroupofinstitution.com/privkey.pem;
    
    # Landing page & auth pages (public)
    location /app/ {
        root /var/www/jtgroupofinstitution/public;
        try_files $uri $uri/ =404;
    }
    
    # Assets (CSS, images, JS)
    location /assets/ {
        root /var/www/jtgroupofinstitution/public;
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Course files (protected by backend access control)
    location /courses/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Landing page default
    location = / {
        root /var/www/jtgroupofinstitution/public/app;
        try_files /index.html =404;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/jtgroupofinstitution.com /etc/nginx/sites-enabled/
nginx -t  # Test configuration
systemctl reload nginx
```

---

## Step 7: Setup SSL with Let's Encrypt

```bash
certbot --nginx -d www.jtgroupofinstitution.com -d jtgroupofinstitution.com
```

Choose options:
- Enter your email
- Agree to terms (A)
- Choose whether to share email (N)
- Select option to redirect HTTP to HTTPS (2)

SSL certificates auto-renew every 90 days.

---

## Step 8: Upload Tamil Course Files

On your local machine, upload the Tamil courses:
```powershell
scp -r "C:\Users\siva\Desktop\host2\TAMIL\*" root@your-vps-ip:/var/www/jtgroupofinstitution/public/courses/tamil/
```

Or if courses are already on VPS:
```bash
cp -r /path/to/tamil-courses/* /var/www/jtgroupofinstitution/public/courses/tamil/
```

---

## Step 9: Razorpay Configuration

1. Login to https://dashboard.razorpay.com
2. Go to Settings → API Keys
3. Generate Key ID and Key Secret
4. Update your `.env` file with live keys
5. (Optional) Setup webhook:
   - Go to Settings → Webhooks
   - Add endpoint: `https://www.jtgroupofinstitution.com/api/payment/webhook`
   - Select events: `payment.authorized`, `payment.failed`
   - Copy webhook secret to `.env`

---

## Step 10: Test Production

Visit: https://www.jtgroupofinstitution.com

Test flow:
1. Sign up with email
2. Pay ₹29 with Razorpay test card: `4111 1111 1111 1111`
3. Access Tamil courses

---

## Maintenance Commands

### View logs
```bash
pm2 logs jtgroup
pm2 flush  # Clear logs
```

### Restart application
```bash
pm2 restart jtgroup
```

### Update code
```bash
cd /var/www/jtgroupofinstitution
git pull  # If using git
npm install  # If dependencies changed
pm2 restart jtgroup
```

### Backup database
```bash
cp /var/www/jtgroupofinstitution/backend/data/app.db /var/www/jtgroupofinstitution/backend/data/app.db.backup
```

---

## Troubleshooting

### Check if Node.js app is running
```bash
pm2 status
curl http://localhost:3000/api/courses?language=tamil
```

### Check Nginx status
```bash
systemctl status nginx
nginx -t
```

### Check SSL certificate
```bash
certbot certificates
```

### View error logs
```bash
pm2 logs jtgroup --err
tail -f /var/log/nginx/error.log
```

---

## Adding More Languages (Hindi, Bengali, Malayalam)

1. Upload course files:
```bash
scp -r /path/to/hindi root@vps:/var/www/jtgroupofinstitution/public/courses/
```

2. Update `backend/src/routes/courses.js` to include new languages

3. Update landing page (`public/app/index.html`) to show language options

4. Reload app:
```bash
pm2 restart jtgroup
```

---

## Support

For issues:
- Check PM2 logs: `pm2 logs jtgroup`
- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Razorpay issues: https://razorpay.com/support
