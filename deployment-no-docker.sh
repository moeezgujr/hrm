#!/bin/bash
set -e

echo "Starting Meeting Matters HRM deployment (No Docker)..."

# Update system
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 20 if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
fi

# Create app directory
echo "Creating application directory..."
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Clone or download your application
# For now, we'll assume you have it uploaded
# If using git:
# git clone <your-repo-url> .

# Create .env file with your production settings
echo "Creating .env file..."
cat > /home/ubuntu/app/.env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:12345555@meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com:5432/hrm
PORT=3000
SESSION_SECRET=my_super_secret_key
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY
GMAIL_USER=moeezgujr@gmail.com
GMAIL_PASS=vfoo lcvw kwpb rpbp
VITE_STRIPE_PUBLIC_KEY=VITE_STRIPE_PUBLIC_KEY
HR_ADMIN_EMAIL=hr@themeetingmatters.com
REPLIT_URL=http://13.134.147.210
NODE_ENV=production
ENVEOF

echo "✓ .env file created"

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production=false

# Build the application
echo "Building application..."
npm run build

# Start with PM2
echo "Starting application with PM2..."
pm2 start npm --name "meeting-matters" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
sudo -u ubuntu pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Configure Nginx as reverse proxy
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/meeting-matters > /dev/null << 'NGINXEOF'
upstream meeting_matters {
    server localhost:3000;
}

server {
    listen 80 default_server;
    server_name _;
    
    client_max_body_size 100M;

    location / {
        proxy_pass http://meeting_matters;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

# Enable the Nginx site
sudo ln -sf /etc/nginx/sites-available/meeting-matters /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Wait a moment for PM2 to start
sleep 5

echo ""
echo "=========================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Application Status:"
pm2 status
echo ""
echo "Application URL: http://13.134.147.210"
echo ""
echo "Next steps:"
echo "1. Initialize database: npm run db:push"
echo "2. Create admin user: npx tsx create-admin.js"
echo ""
echo "Useful commands:"
echo "  - View logs: pm2 logs meeting-matters"
echo "  - Restart app: pm2 restart meeting-matters"
echo "  - Stop app: pm2 stop meeting-matters"
echo "  - Nginx status: sudo systemctl status nginx"
echo ""
