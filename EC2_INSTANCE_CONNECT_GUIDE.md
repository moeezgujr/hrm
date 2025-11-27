# 🚀 Deploy on EC2 Using Instance Connect

## Step 1: Access EC2 Instance (No SSH Key Needed!)

1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. Click **Instances** on the left
3. Select instance: **i-0aac976e7e644f8bb** (or the running instance)
4. Click blue **Connect** button at top
5. Select **EC2 Instance Connect** tab
6. Click **Connect** to open web terminal

You're now in the EC2 browser terminal! ✓

---

## Step 2: Copy & Paste This Script

In the **Instance Connect terminal**, paste this entire command:

```bash
cat > /home/ubuntu/deployment-config.sh << 'SCRIPT_EOF'
#!/bin/bash
set -e

echo "Starting Meeting Matters HRM deployment..."
mkdir -p /home/ubuntu/app

# Create .env file with production settings
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

# Wait for Docker daemon
sleep 10

# Configure ECR access
REGION=eu-west-2
AWS_ACCOUNT_ID=893978477641
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/meeting-matters-hrm"

echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

echo "Pulling Docker image..."
docker pull $ECR_URI:latest

# Stop any existing container
docker stop meeting-matters 2>/dev/null || true
docker rm meeting-matters 2>/dev/null || true

echo "Starting Docker container..."
docker run -d \
    --name meeting-matters \
    -p 3000:3000 \
    --env-file /home/ubuntu/app/.env \
    --restart unless-stopped \
    $ECR_URI:latest

echo "✓ Docker container started"
sleep 15

# Configure Nginx
echo "Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/meeting-matters > /dev/null << 'NGINXEOF'
server {
    listen 80 default_server;
    server_name _;
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
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/meeting-matters /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "✓ Nginx configured"
echo ""
echo "=========================================="
echo "✓ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo "Application: http://13.134.147.210"
echo ""
SCRIPT_EOF

chmod +x /home/ubuntu/deployment-config.sh
bash /home/ubuntu/deployment-config.sh
```

Just copy the entire block above and paste it into the Instance Connect terminal. It will:
- ✓ Create the `.env` file with your settings
- ✓ Pull the Docker image
- ✓ Start the container
- ✓ Configure Nginx

---

## Step 3: Initialize Database

After deployment completes, run:

```bash
docker exec meeting-matters npm run db:push
```

---

## Step 4: Create Admin User

```bash
docker exec -it meeting-matters npx tsx create-admin.js
```

Follow the prompts:
- Email: (your email)
- Password: (secure password)
- Name: (your name)

---

## Step 5: Test Application

Open browser and go to:
```
http://13.134.147.210
```

Login with admin credentials you created.

---

## ✓ You're Done!

Your application is now live on AWS EC2!

**Important URLs:**
- Application: http://13.134.147.210
- AWS Console: https://console.aws.amazon.com/ec2/

**To Check Status Later:**
```bash
# View running container
docker ps

# View logs
docker logs -f meeting-matters

# Restart if needed
docker restart meeting-matters
```

---

## 🆘 Troubleshooting

**Container won't start:**
```bash
docker logs meeting-matters
```

**Can't access application:**
```bash
# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check if port 3000 is listening
sudo lsof -i :3000
```

**Database connection error:**
```bash
# Check env file
cat /home/ubuntu/app/.env

# Test connection
docker exec meeting-matters psql -U postgres -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com -d hrm -c "SELECT version();"
```
