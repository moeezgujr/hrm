#!/bin/bash

# AWS Deployment Automation Script for Meeting Matters HRM
# This script automates the entire deployment process

set -e

echo "=========================================="
echo "Meeting Matters HRM - AWS Deployment"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first: https://www.docker.com/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Get user inputs
echo -e "${YELLOW}Please provide deployment configuration:${NC}"
echo ""

read -p "AWS Region (default: eu-west-2): " AWS_REGION
AWS_REGION=${AWS_REGION:-eu-west-2}

read -p "AWS Account ID: " AWS_ACCOUNT_ID

read -p "EC2 Instance Type (default: t3.medium): " INSTANCE_TYPE
INSTANCE_TYPE=${INSTANCE_TYPE:-t3.medium}

read -p "RDS Database Instance Type (default: db.t3.micro): " DB_INSTANCE_TYPE
DB_INSTANCE_TYPE=${DB_INSTANCE_TYPE:-db.t3.micro}

read -p "Database Password (min 8 chars): " -s DB_PASSWORD
echo ""

read -p "Gmail Email Address: " GMAIL_USER

read -p "Gmail App Password: " -s GMAIL_PASS
echo ""

read -p "Stripe Secret Key: " -s STRIPE_SECRET_KEY
echo ""

read -p "Domain name (optional, press Enter to skip): " DOMAIN_NAME

# Generate session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Application name
APP_NAME="meeting-matters-hrm"
STACK_NAME="${APP_NAME}-stack"

echo ""
echo -e "${YELLOW}Starting AWS deployment...${NC}"
echo ""

# Step 1: Create VPC and Security Groups
echo -e "${YELLOW}Step 1: Creating VPC and Security Groups...${NC}"

# Create security group for EC2
SG_NAME="${APP_NAME}-sg"
SG_OUTPUT=$(aws ec2 create-security-group \
    --group-name "$SG_NAME" \
    --description "Security group for Meeting Matters HRM" \
    --region "$AWS_REGION" 2>/dev/null || echo "exists")

if [ "$SG_OUTPUT" != "exists" ]; then
    SG_ID=$(echo "$SG_OUTPUT" | grep GroupId | awk '{print $2}' | tr -d '"')
    
    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    aws ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Security group created: $SG_ID${NC}"
else
    echo -e "${GREEN}✅ Security group already exists${NC}"
fi

# Step 2: Create RDS Database
echo ""
echo -e "${YELLOW}Step 2: Creating RDS PostgreSQL Database...${NC}"

RDS_INSTANCE="${APP_NAME}-db"

aws rds create-db-instance \
    --db-instance-identifier "$RDS_INSTANCE" \
    --db-instance-class "$DB_INSTANCE_TYPE" \
    --engine postgres \
    --engine-version 15.4 \
    --master-username postgres \
    --master-user-password "$DB_PASSWORD" \
    --allocated-storage 20 \
    --storage-type gp3 \
    --db-name hrm \
    --publicly-accessible false \
    --multi-az false \
    --region "$AWS_REGION" 2>/dev/null || echo "Database already exists or creation in progress"

echo -e "${YELLOW}⏳ Waiting for database to be available (this may take 5-10 minutes)...${NC}"

aws rds wait db-instance-available \
    --db-instance-identifier "$RDS_INSTANCE" \
    --region "$AWS_REGION"

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$RDS_INSTANCE" \
    --region "$AWS_REGION" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${DB_ENDPOINT}:5432/hrm"

echo -e "${GREEN}✅ Database created: $DB_ENDPOINT${NC}"

# Step 3: Create ECR Repository
echo ""
echo -e "${YELLOW}Step 3: Creating ECR Repository...${NC}"

ECR_REPO="${APP_NAME}"

aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --region "$AWS_REGION" 2>/dev/null || echo "Repository already exists"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo -e "${GREEN}✅ ECR Repository: $ECR_URI${NC}"

# Step 4: Build and Push Docker Image
echo ""
echo -e "${YELLOW}Step 4: Building and pushing Docker image...${NC}"

# Create Dockerfile if it doesn't exist
if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF
    echo "Dockerfile created"
fi

# Login to ECR
aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$ECR_URI"

# Build and push image
docker build -t "$ECR_REPO:latest" .
docker tag "$ECR_REPO:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"

echo -e "${GREEN}✅ Docker image pushed to ECR${NC}"

# Step 5: Create EC2 Instance
echo ""
echo -e "${YELLOW}Step 5: Creating EC2 Instance...${NC}"

# Get latest Ubuntu 22.04 LTS AMI
AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text \
    --region "$AWS_REGION")

# Create or get key pair
KEY_PAIR_NAME="${APP_NAME}-key"
if ! aws ec2 describe-key-pairs --key-names "$KEY_PAIR_NAME" --region "$AWS_REGION" 2>/dev/null; then
    aws ec2 create-key-pair \
        --key-name "$KEY_PAIR_NAME" \
        --region "$AWS_REGION" \
        --query 'KeyMaterial' \
        --output text > "${KEY_PAIR_NAME}.pem"
    chmod 400 "${KEY_PAIR_NAME}.pem"
    echo -e "${GREEN}✅ Key pair created: ${KEY_PAIR_NAME}.pem${NC}"
fi

# Create user data script
cat > user_data.sh << 'USERDATA'
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt-get install -y nginx

# Install Docker
apt-get install -y docker.io
usermod -aG docker ubuntu

# Install AWS CLI
apt-get install -y awscli

# Create application directory
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app

# Pull and run Docker image (this will be configured after creation)
echo "EC2 instance ready for deployment"
USERDATA

# Launch EC2 instance
INSTANCE_OUTPUT=$(aws ec2 run-instances \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_PAIR_NAME" \
    --security-groups "$SG_NAME" \
    --user-data file://user_data.sh \
    --region "$AWS_REGION" \
    --query 'Instances[0].InstanceId' \
    --output text)

INSTANCE_ID="$INSTANCE_OUTPUT"

echo -e "${YELLOW}⏳ Waiting for EC2 instance to be running...${NC}"

aws ec2 wait instance-running \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION"

# Get public IP
EC2_PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${GREEN}✅ EC2 Instance created: $INSTANCE_ID${NC}"
echo -e "${GREEN}   Public IP: $EC2_PUBLIC_IP${NC}"

# Step 6: Allocate and Associate Elastic IP
echo ""
echo -e "${YELLOW}Step 6: Allocating Elastic IP...${NC}"

ALLOC_ID=$(aws ec2 allocate-address \
    --domain vpc \
    --region "$AWS_REGION" \
    --query 'AllocationId' \
    --output text)

# Give instance time to start
sleep 10

aws ec2 associate-address \
    --instance-id "$INSTANCE_ID" \
    --allocation-id "$ALLOC_ID" \
    --region "$AWS_REGION"

ELASTIC_IP=$(aws ec2 describe-addresses \
    --allocation-ids "$ALLOC_ID" \
    --region "$AWS_REGION" \
    --query 'Addresses[0].PublicIp' \
    --output text)

echo -e "${GREEN}✅ Elastic IP allocated: $ELASTIC_IP${NC}"

# Wait for EC2 to finish initializing
echo ""
echo -e "${YELLOW}⏳ Waiting for EC2 initialization (30 seconds)...${NC}"
sleep 30

# Step 7: Create deployment configuration file
echo ""
echo -e "${YELLOW}Step 7: Creating deployment configuration...${NC}"

cat > deployment-config.sh << EOF
#!/bin/bash
set -e

export AWS_REGION="${AWS_REGION}"
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"
export ECR_URI="${ECR_URI}"
export DATABASE_URL="${DATABASE_URL}"
export SESSION_SECRET="${SESSION_SECRET}"
export GMAIL_USER="${GMAIL_USER}"
export GMAIL_PASS="${GMAIL_PASS}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
export DOMAIN_NAME="${DOMAIN_NAME}"

# Create .env file
cat > /home/ubuntu/app/.env << 'ENVFILE'
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
GMAIL_USER=${GMAIL_USER}
GMAIL_PASS=${GMAIL_PASS}
HR_ADMIN_EMAIL=hr@themeetingmatters.com
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
NODE_ENV=production
PORT=3000
REPLIT_URL=https://${DOMAIN_NAME}
ENVFILE

# Pull Docker image
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_URI}

docker pull ${ECR_URI}:latest

# Run Docker container with PM2
docker run -d \
    --name meeting-matters \
    -p 3000:3000 \
    --env-file /home/ubuntu/app/.env \
    --restart unless-stopped \
    ${ECR_URI}:latest

# Configure Nginx as reverse proxy
sudo tee /etc/nginx/sites-available/meeting-matters > /dev/null << 'NGINX'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/meeting-matters /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Deployment complete!"
EOF

chmod +x deployment-config.sh

echo -e "${GREEN}✅ Configuration file created${NC}"

# Step 8: Summary and Next Steps
echo ""
echo "=========================================="
echo -e "${GREEN}AWS Deployment Created Successfully!${NC}"
echo "=========================================="
echo ""
echo "📋 Deployment Summary:"
echo "  Application Name: $APP_NAME"
echo "  Region: $AWS_REGION"
echo "  EC2 Instance ID: $INSTANCE_ID"
echo "  EC2 Public IP: $EC2_PUBLIC_IP"
echo "  Elastic IP: $ELASTIC_IP"
echo "  RDS Database: $RDS_INSTANCE"
echo "  Database Endpoint: $DB_ENDPOINT"
echo "  ECR Repository: $ECR_URI"
echo ""
echo "🔑 Important Files:"
echo "  SSH Key: ${KEY_PAIR_NAME}.pem"
echo "  Config: deployment-config.sh"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. SSH into EC2 instance:"
echo "   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP}"
echo ""
echo "2. Copy deployment config to EC2 and run:"
echo "   scp -i ${KEY_PAIR_NAME}.pem deployment-config.sh ubuntu@${ELASTIC_IP}:/home/ubuntu/"
echo "   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP} 'bash /home/ubuntu/deployment-config.sh'"
echo ""
echo "3. Create admin user:"
echo "   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP}"
echo "   cd /home/ubuntu/app && npx tsx create-admin.js"
echo ""
echo "4. Access application:"
echo "   http://${ELASTIC_IP}"
echo ""
if [ -n "$DOMAIN_NAME" ]; then
    echo "5. Point your domain ($DOMAIN_NAME) to: $ELASTIC_IP"
    echo ""
    echo "6. Setup SSL certificate:"
    echo "   ssh -i ${KEY_PAIR_NAME}.pem ubuntu@${ELASTIC_IP}"
    echo "   sudo apt install -y certbot python3-certbot-nginx"
    echo "   sudo certbot --nginx -d $DOMAIN_NAME"
fi
echo ""
echo "=========================================="
echo ""
