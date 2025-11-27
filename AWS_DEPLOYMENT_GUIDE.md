# AWS Deployment Guide for Meeting Matters HRM

## Prerequisites
- AWS Account
- AWS CLI installed and configured
- Node.js 18+ installed locally
- PostgreSQL database (AWS RDS or external)
- Domain name (optional, for custom domain)

---

## Option 1: Deploy on AWS EC2 (Recommended for Full Control)

### Step 1: Launch EC2 Instance

1. **Login to AWS Console** → EC2 → Launch Instance

2. **Configure Instance:**
   - **Name:** `meeting-matters-hrm`
   - **AMI:** Ubuntu Server 22.04 LTS
   - **Instance Type:** `t3.medium` or `t3.large` (minimum 2GB RAM)
   - **Key Pair:** Create new or use existing (for SSH access)
   - **Security Group:** Configure with these rules:
     - SSH (22) - Your IP
     - HTTP (80) - 0.0.0.0/0
     - HTTPS (443) - 0.0.0.0/0
     - Custom TCP (3000) - 0.0.0.0/0 (temporary, will use nginx later)

3. **Storage:** 20GB minimum

4. **Launch Instance**

### Step 2: Setup PostgreSQL Database (AWS RDS)

1. **Go to RDS** → Create Database

2. **Configuration:**
   - **Engine:** PostgreSQL 15.x
   - **Template:** Production or Dev/Test (based on needs)
   - **DB Instance:** db.t3.micro (for testing) or db.t3.medium (production)
   - **DB Name:** `hrm`
   - **Master Username:** `postgres`
   - **Master Password:** [strong password]
   - **Storage:** 20GB (enable auto-scaling if needed)
   - **VPC:** Same as EC2 instance
   - **Public Access:** No (access from EC2 only)
   - **Security Group:** Allow PostgreSQL (5432) from EC2 security group

3. **Note the endpoint:** `your-db-instance.xxxxx.region.rds.amazonaws.com`

### Step 3: Connect to EC2 Instance

```bash
# From your local machine
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 4: Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install nginx (reverse proxy)
sudo apt install -y nginx

# Install git
sudo apt install -y git
```

### Step 5: Clone and Setup Application

```bash
# Create application directory
cd /home/ubuntu
mkdir meeting-matters
cd meeting-matters

# Upload your code (Option A: Using git)
git clone your-repository-url .

# Or (Option B: Upload from local machine - run this on your local machine)
# scp -i your-key.pem -r ./WebsiteHosting-main ubuntu@your-ec2-ip:/home/ubuntu/meeting-matters

# Install dependencies
cd /home/ubuntu/meeting-matters/WebsiteHosting-main
npm install --production=false

# Build the application
npm run build
```

### Step 6: Configure Environment Variables

```bash
# Create production .env file
nano .env
```

Add the following (replace with your actual values):

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your-password@your-rds-endpoint.region.rds.amazonaws.com:5432/hrm

# Session Configuration
SESSION_SECRET=generate-strong-random-secret-here

# Email Configuration (Gmail)
GMAIL_USER=your-gmail@gmail.com
GMAIL_PASS=your-gmail-app-password

# HR Admin Email
HR_ADMIN_EMAIL=hr@themeetingmatters.com

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key

# Production settings
NODE_ENV=production
PORT=3000
REPLIT_URL=https://your-domain.com
```

Save and exit (Ctrl+X, Y, Enter)

### Step 7: Setup Database Schema

```bash
# Push database schema
npm run db:push

# Create admin user
npx tsx create-admin.js
```

### Step 8: Start Application with PM2

```bash
# Start the application
pm2 start npm --name "meeting-matters" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Run the command that PM2 outputs

# Check status
pm2 status
pm2 logs meeting-matters
```

### Step 9: Configure Nginx as Reverse Proxy

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/meeting-matters
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or EC2 IP

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and enable the configuration:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/meeting-matters /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 10: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow prompts and select redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 11: Point Domain to EC2 (If using custom domain)

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add/Update DNS records:
   - **A Record:** `@` → Your EC2 Elastic IP
   - **A Record:** `www` → Your EC2 Elastic IP
3. Wait for DNS propagation (5-30 minutes)

### Step 12: Security Hardening

```bash
# Setup UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Update security group to only allow SSH from your IP
# In AWS Console: EC2 → Security Groups → Edit inbound rules
```

---

## Option 2: Deploy on AWS Elastic Beanstalk (Easier but Less Control)

### Step 1: Prepare Application

```bash
# In your local project directory
cd WebsiteHosting-main

# Create .ebignore file
echo "node_modules/
.env
*.txt
*.md
migrations/
test*
*_cookies*
*_session*
admin_*
employee_*" > .ebignore

# Ensure package.json has proper scripts
# Should have: "start": "cross-env NODE_ENV=production node dist/index.js"
```

### Step 2: Install EB CLI

```bash
# Install EB CLI
pip install awsebcli --upgrade
```

### Step 3: Initialize Elastic Beanstalk

```bash
# Initialize EB
eb init

# Follow prompts:
# - Select region
# - Create new application: meeting-matters-hrm
# - Platform: Node.js
# - Setup SSH: Yes
```

### Step 4: Create Environment

```bash
# Create environment
eb create meeting-matters-prod --instance-type t3.medium

# This will take several minutes
```

### Step 5: Set Environment Variables

```bash
eb setenv DATABASE_URL="postgresql://user:pass@endpoint:5432/hrm" \
  SESSION_SECRET="your-secret" \
  GMAIL_USER="your-email@gmail.com" \
  GMAIL_PASS="your-app-password" \
  NODE_ENV="production" \
  STRIPE_SECRET_KEY="your-stripe-key"
```

### Step 6: Deploy

```bash
# Deploy application
eb deploy

# Open in browser
eb open
```

---

## Option 3: Deploy on AWS App Runner (Fully Managed)

### Prerequisites
- Docker installed locally
- Application containerized

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository --repository-name meeting-matters-hrm

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.region.amazonaws.com

# Build and push image
docker build -t meeting-matters-hrm .
docker tag meeting-matters-hrm:latest your-account-id.dkr.ecr.region.amazonaws.com/meeting-matters-hrm:latest
docker push your-account-id.dkr.ecr.region.amazonaws.com/meeting-matters-hrm:latest
```

### Step 3: Create App Runner Service

1. Go to AWS App Runner → Create Service
2. Source: ECR
3. Select your image
4. Configure environment variables
5. Deploy

---

## Post-Deployment Steps (All Options)

### 1. Create Admin User

```bash
# SSH into server and run:
cd /home/ubuntu/meeting-matters/WebsiteHosting-main
npx tsx create-admin.js
```

### 2. Test Application

- Visit: `http://your-domain.com` or `http://your-ec2-ip`
- Login with admin credentials
- Test all features

### 3. Monitor Application

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs meeting-matters

# Restart if needed
pm2 restart meeting-matters
```

### 4. Setup Backups

```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database (if using RDS, use AWS snapshots instead)
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

---

## Maintenance Commands

```bash
# View application logs
pm2 logs meeting-matters

# Restart application
pm2 restart meeting-matters

# Update application
cd /home/ubuntu/meeting-matters/WebsiteHosting-main
git pull
npm install
npm run build
pm2 restart meeting-matters

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
free -h
```

---

## Estimated AWS Costs (Monthly)

**Basic Setup:**
- EC2 t3.medium: ~$30
- RDS db.t3.micro: ~$15
- Elastic IP: Free (when attached)
- Data Transfer: ~$5-10
- **Total: ~$50-55/month**

**Production Setup:**
- EC2 t3.large: ~$60
- RDS db.t3.medium: ~$60
- Load Balancer (optional): ~$16
- **Total: ~$136-150/month**

---

## Troubleshooting

**Application won't start:**
```bash
pm2 logs meeting-matters --err
# Check for database connection or env variable issues
```

**Database connection failed:**
```bash
# Check RDS security group allows EC2 access
# Verify DATABASE_URL is correct
# Test connection: psql $DATABASE_URL
```

**Nginx 502 Bad Gateway:**
```bash
# Check if app is running: pm2 status
# Check nginx logs: sudo tail -f /var/log/nginx/error.log
```

**Out of memory:**
```bash
# Increase EC2 instance size or add swap:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```
