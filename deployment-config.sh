#!/bin/bash
set -e

echo "Starting deployment on EC2 instance..."
mkdir -p /home/ubuntu/app

# Create .env file
cat > /home/ubuntu/app/.env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:12345555@meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com:5432/hrm
SESSION_SECRET=session_secret_key_placeholder
GMAIL_USER=moeezgujr@gmail.com
GMAIL_PASS=Kallar97
HR_ADMIN_EMAIL=hr@themeetingmatters.com
STRIPE_SECRET_KEY=VITE_STRIPE_PUBLIC_KEY
NODE_ENV=production
PORT=3000
REPLIT_URL=https://yourdomain.com
ENVEOF

echo ".env file created"

# Wait for Docker daemon
sleep 10

# Get region and account from metadata
REGION=eu-west-2
AWS_ACCOUNT_ID=893978477641
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/meeting-matters-hrm"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Pull Docker image
docker pull $ECR_URI:latest

# Run Docker container
docker run -d \
    --name meeting-matters \
    -p 3000:3000 \
    --env-file /home/ubuntu/app/.env \
    --restart unless-stopped \
    $ECR_URI:latest

echo "Docker container started"

# Wait for application to be ready
sleep 10

# Configure Nginx as reverse proxy
sudo tee /etc/nginx/sites-available/meeting-matters > /dev/null << 'NGINXEOF'
server {
    listen 80;
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

echo "Nginx configured and restarted"
echo "Deployment complete!"
