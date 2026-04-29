# JT Group of Institution - Online Learning Platform

## Description
Fullstack online learning platform for JT Group of Institution. Provides programming courses in Tamil with subscription-based access (₹29 for 30 days).

## Features
- User authentication (signup/login)
- Razorpay payment integration (₹29 for 30 days access)
- Tamil course content (4 categories, 30+ lessons)
- Progress tracking per course
- Responsive design with modern UI

## Course Categories (Tamil)
1. **Front End Development** - CSS, HTML, JavaScript
2. **Full Stack Development** - Angular, Node.js, MongoDB, MySQL
3. **Programming Languages** - Python, SQL, Git, and more
4. **Web Development** - Complete web development tutorials

## Tech Stack
- **Backend**: Node.js, Express.js, SQLite (better-sqlite3)
- **Frontend**: HTML, CSS, JavaScript (with Font Awesome icons)
- **Payment**: Razorpay
- **Auth**: JWT (JSON Web Tokens)
- **Production**: Nginx, PM2, Let's Encrypt SSL

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your Razorpay keys and JWT secret
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Access Application
- Landing page: http://localhost:3000
- Login: http://localhost:3000/app/login.html
- Signup: http://localhost:3000/app/signup.html

## Project Structure
```
jtgroupofinstitution/
├── backend/
│   ├── src/
│   │   ├── server.js          # Main server
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Auth & access control
│   │   └── db/               # Database setup
│   └── .env                  # Environment variables
├── public/
│   ├── assets/               # CSS, images, JS
│   ├── app/                  # Frontend HTML pages
│   └── courses/tamil/        # Tamil course content
├── nginx/                     # Nginx config for production
└── package.json
```

## Deployment to Hostinger VPS

### 1. Initial VPS Setup
```bash
ssh root@your-vps-ip
apt update && apt upgrade -y
apt install nginx certbot python3-certbot-nginx -y

# Install Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
npm install -g pm2
```

### 2. Upload Project
```bash
# On VPS
mkdir -p /var/www/jtgroupofinstitution
cd /var/www/jtgroupofinstitution

# Clone or upload project files
# Copy Tamil courses to public/courses/tamil/
```

### 3. Start Application
```bash
npm install
pm2 start backend/src/server.js --name jtgroup
pm2 save
pm2 startup
```

### 4. Configure Nginx
```bash
sudo cp nginx/jtgroupofinstitution.com /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/jtgroupofinstitution.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL
```bash
sudo certbot --nginx -d www.jtgroupofinstitution.com -d jtgroupofinstitution.com
```

## Razorpay Setup
1. Create account at https://dashboard.razorpay.com
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret to backend/.env
4. Test with Razorpay test cards first

## Adding More Languages
To add Hindi, Bengali, Malayalam courses:
1. Upload course files to `public/courses/hindi/` etc.
2. Update `backend/src/routes/courses.js` to include new languages
3. Update landing page with language selector

## License
ISC

## Contact
JT Group of Institution
Website: https://www.jtgroupofinstitution.com
