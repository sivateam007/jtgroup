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
