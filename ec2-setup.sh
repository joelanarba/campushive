#!/bin/bash
set -e

DOMAIN="3.227.36.252.nip.io"
REPO_URL="https://github.com/joelanarba/campushive.git"
DB_URL="postgresql://campushive_admin:Pass66d6b02904154583@campushive-mvp-postgresdb-b5v7fyfivq3h.cenaaugcwf8v.us-east-1.rds.amazonaws.com:5432/campushive_db?schema=public"

# Clone repo
cd /home/ubuntu
if [ ! -d "campushive" ]; then
  git clone $REPO_URL
fi
cd campushive
git fetch origin main
git reset --hard origin/main

# Setup backend env
cd backend
cat <<EOT > .env
PORT=5001
NODE_ENV=production
DATABASE_URL="$DB_URL"
CLIENT_URL=https://d1y179kl1nfdle.cloudfront.net
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=900
JWT_ISSUER=campushive-api
JWT_AUDIENCE=campushive-client
REFRESH_TOKEN_TTL_SECONDS=604800
AUTH_COOKIE_SAME_SITE=none
EOT

# Install and build backend
npm install
npx prisma generate
npx prisma migrate deploy

# Start PM2
pm2 start src/index.js --name campushive-api || pm2 restart campushive-api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

# Setup Nginx
cat <<EOT > /etc/nginx/sites-available/campushive
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Forward real IP and HTTPS protocol for cookies
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOT

ln -sf /etc/nginx/sites-available/campushive /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Restart Nginx
systemctl restart nginx

# Run Certbot for SSL
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@campushive.com --redirect

echo "Setup Complete!"
