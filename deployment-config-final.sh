#!/bin/bash
set -e

echo "Starting deployment on EC2 instance..."
mkdir -p /home/ubuntu/app

# Create .env file with your project environment variables
cat > /home/ubuntu/app/.env << 'ENVEOF'
DATABASE_URL=postgresql://postgres:12345555@meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com:5432/hrm
PORT=3000
SESSION_SECRET=my_super_secret_key
STRIPE_SECRET_KEY=STRIPE_SECRET_KEY

# Email Configuration (Gmail)
GMAIL_USER=moeezgujr@gmail.com
GMAIL_PASS=vfoo lcvw kwpb rpbp
VITE_STRIPE_PUBLIC_KEY=VITE_STRIPE_PUBLIC_KEY

# HR Admin Email
HR_ADMIN_EMAIL=hr@themeetingmatters.com

# Application URL (will be your EC2 IP or domain)
REPLIT_URL=http://13.134.147.210
NODE_ENV=production
ENVEOF

echo ".env file created"

# Wait for Docker daemon to be ready
sleep 10

# Get region and account
REGION=eu-west-2
AWS_ACCOUNT_ID=893978477641
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/meeting-matters-hrm"

# Configure AWS credentials for current user
echo "Configuring AWS credentials..."
sudo -u ubuntu aws configure set region $REGION

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Pull Docker image
echo "Pulling Docker image from ECR..."
docker pull $ECR_URI:latest

# Stop any existing container
docker stop meeting-matters 2>/dev/null || true
docker rm meeting-matters 2>/dev/null || true

# Run Docker container
echo "Starting Docker container..."
docker run -d \
    --name meeting-matters \
    -p 3000:3000 \
    --env-file /home/ubuntu/app/.env \
    --restart unless-stopped \
    $ECR_URI:latest

echo "Docker container started"

# Wait for application to be ready
echo "Waiting for application to start..."
sleep 15

# Check if container is still running
if ! docker ps | grep -q meeting-matters; then
    echo "ERROR: Container failed to start. Check logs:"
    docker logs meeting-matters
    exit 1
fi

echo "Container is running. Checking application health..."

# Configure Nginx as reverse proxy
echo "Configuring Nginx..."
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINXEOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/meeting-matters /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo "==========================================="
echo "✓ Deployment complete!"
echo "==========================================="
echo ""
echo "Application is running at:"
echo "  http://13.134.147.210"
echo ""
echo "Next steps:"
echo "1. Check container logs: docker logs -f meeting-matters"
echo "2. Initialize database: docker exec meeting-matters npm run db:push"
echo "3. Create admin user: docker exec -it meeting-matters npx tsx create-admin.js"
echo ""
