# 🚀 Deploy Without Docker (Direct Node.js + PM2)

## Overview

Instead of Docker, this deploys your Node.js app directly on the EC2 instance using:
- **Node.js 20** - Runtime
- **PM2** - Process manager (keeps app running, auto-restart)
- **Nginx** - Reverse proxy
- **Your .env file** - Configuration

---

## Step 1: Access EC2 Instance (Browser Terminal)

1. Go to: https://console.aws.amazon.com/ec2/
2. Click **Instances**
3. Select instance: **i-0aac976e7e644f8bb**
4. Click blue **Connect** button
5. Select **EC2 Instance Connect** tab
6. Click **Connect** to open web terminal

---

## Step 2: Upload Your Application Code

**Option A: Using Git** (Recommended)

```bash
cd /home/ubuntu/app
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git .
```

Replace with your actual GitHub repo URL.

**Option B: Download from S3**

If you have code in S3:
```bash
aws s3 cp s3://your-bucket/your-app.tar.gz /tmp/app.tar.gz
cd /tmp && tar -xzf app.tar.gz
cp -r WebsiteHosting-main/* /home/ubuntu/app/
```

**Option C: Manual Upload from Local Machine**

```powershell
# From your local Windows PowerShell
# (Or use the "Upload" feature in Instance Connect if available)
scp -r C:\Users\TECHNIFI\Downloads\WebsiteHosting-main\WebsiteHosting-main/* ubuntu@13.134.147.210:/home/ubuntu/app/
```

---

## Step 3: Run Deployment Script

Once your application code is in `/home/ubuntu/app/`, run the deployment script:

```bash
cat > /home/ubuntu/deployment-no-docker.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

echo "Starting Meeting Matters HRM deployment (No Docker)..."

# Update system
echo "Updating system packages..."
sudo apt update
sudo apt upgrade -y

# Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Verify installation
node --version
npm --version

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
fi

# Create app directory
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Create .env file
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
echo "Installing Node.js dependencies (this may take 2-3 minutes)..."
npm install --production=false

# Build the application
echo "Building application..."
npm run build

# Stop existing PM2 app if running
pm2 delete meeting-matters 2>/dev/null || true

# Start with PM2
echo "Starting application with PM2..."
pm2 start npm --name "meeting-matters" -- start

# Show status
pm2 status

# Save PM2 configuration
pm2 save

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

echo ""
echo "=========================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "Application URL: http://13.134.147.210"
echo ""
echo "Next steps:"
echo "1. npm run db:push       (initialize database)"
echo "2. npx tsx create-admin.js   (create admin user)"
echo ""
DEPLOY_EOF

chmod +x /home/ubuntu/deployment-no-docker.sh
bash /home/ubuntu/deployment-no-docker.sh
```

Just copy and paste the entire block above into the Instance Connect terminal.

---

## Step 4: Initialize Database

After deployment completes:

```bash
cd /home/ubuntu/app
npm run db:push
```

---

## Step 5: Create Admin User

```bash
cd /home/ubuntu/app
npx tsx create-admin.js
```

Follow prompts to create admin account.

---

## Step 6: Test Application

Open browser:
```
http://13.134.147.210
```

Login with your admin credentials.

---

## ✓ Done!

Your application is now running with:
- **Node.js** - Application runtime
- **PM2** - Keeps app running 24/7, auto-restarts
- **Nginx** - Reverse proxy on port 80
- **Environment** - Using your project's .env settings

---

## 📊 Managing Your Application

### View Logs
```bash
pm2 logs meeting-matters
```

### Restart Application
```bash
pm2 restart meeting-matters
```

### Stop Application
```bash
pm2 stop meeting-matters
```

### Start Application
```bash
pm2 start meeting-matters
```

### View Status
```bash
pm2 status
```

### View Nginx Status
```bash
sudo systemctl status nginx
```

### View Nginx Error Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Rebuild and Restart
```bash
cd /home/ubuntu/app
npm run build
pm2 restart meeting-matters
```

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs meeting-matters

# Check if Node.js is installed
node --version

# Check if dependencies are installed
ls node_modules | head -20
```

### Can't access application
```bash
# Check if app is running on port 3000
sudo lsof -i :3000

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Database connection error
```bash
# Check .env file
cat /home/ubuntu/app/.env

# Test database connection
psql -U postgres -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com -d hrm -c "SELECT version();"
```

### Port 3000 already in use
```bash
# Kill process on port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Or restart with PM2
pm2 restart meeting-matters
```

---

## 📝 Key Differences vs Docker

| Feature | Docker | Direct |
|---------|--------|---------|
| Image Size | ~500MB | Smaller |
| Startup Time | ~10s | ~2s |
| Resource Usage | More | Less |
| Scaling | Multi-container | Single instance |
| Simplicity | Complex | Simple |
| **For Single Server** | ❌ | ✅ Better |

For a single EC2 instance, Direct deployment is simpler and more efficient!

---

## 💡 Next Steps

1. **Domain Setup** - Update DNS A record to 13.134.147.210
2. **SSL Certificate** - Install Let's Encrypt:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

3. **Monitoring** - Setup CloudWatch alarms
4. **Backups** - Enable RDS automated backups
5. **Security** - Update security group SSH rule to your IP only

You're all set! 🎉
