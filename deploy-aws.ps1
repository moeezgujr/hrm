# AWS Deployment PowerShell Script for Meeting Matters HRM
# Run this script with: powershell -ExecutionPolicy Bypass -File deploy-aws.ps1

param(
    [string]$AwsRegion = "eu-west-2",
    [string]$AwsAccountId,
    [string]$InstanceType = "t3.medium",
    [string]$DbInstanceType = "db.t3.micro",
    [string]$DbPassword,
    [string]$GmailUser,
    [string]$GmailPass,
    [string]$StripeSecretKey,
    [string]$DomainName = ""
)

$ErrorActionPreference = "Stop"

# Color functions
function Write-Status { Write-Host "[*] $args" -ForegroundColor Yellow }
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[✗] $args" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Meeting Matters HRM - AWS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Status "Checking prerequisites..."

# Check AWS CLI
try {
    $null = aws --version
    Write-Success "AWS CLI found"
} catch {
    Write-Error "AWS CLI not found. Please install it: https://aws.amazon.com/cli/"
    exit 1
}

# Check Docker
try {
    $null = docker --version
    Write-Success "Docker found"
} catch {
    Write-Error "Docker not found. Please install it: https://www.docker.com/"
    exit 1
}

Write-Host ""

# Get user inputs if not provided as parameters
if (-not $AwsAccountId) {
    Write-Status "Getting AWS Account ID..."
    try {
        $accountInfo = aws sts get-caller-identity | ConvertFrom-Json
        $AwsAccountId = $accountInfo.Account
        Write-Success "AWS Account ID: $AwsAccountId"
    } catch {
        Write-Error "Could not retrieve AWS Account ID. Please provide it as parameter: -AwsAccountId <id>"
        exit 1
    }
}

if (-not $DbPassword) {
    $DbPassword = Read-Host "Database Password (min 8 chars)" -AsSecureString
    $DbPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($DbPassword))
}

if (-not $GmailUser) {
    $GmailUser = Read-Host "Gmail Email Address"
}

if (-not $GmailPass) {
    $GmailPass = Read-Host "Gmail App Password" -AsSecureString
    $GmailPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($GmailPass))
}

if (-not $StripeSecretKey) {
    $StripeSecretKey = Read-Host "Stripe Secret Key" -AsSecureString
    $StripeSecretKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($StripeSecretKey))
}

if (-not $DomainName) {
    $DomainName = Read-Host "Domain name (optional, press Enter to skip)"
}

# Generate session secret
$SessionSecret = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Maximum 999999999).ToString())) + (Get-Random -Maximum 999999999).ToString()

# Application settings
$AppName = "meeting-matters-hrm"
$StackName = "$AppName-stack"

Write-Host ""
Write-Status "Starting AWS deployment..."
Write-Host ""

# Step 1: Create Security Group
Write-Status "Step 1: Creating Security Group..."

$SgName = "$AppName-sg"

try {
    $sgCheck = aws ec2 describe-security-groups `
        --filters "Name=group-name,Values=$SgName" `
        --region $AwsRegion `
        --query 'SecurityGroups[0].GroupId' `
        --output text 2>$null

    if ($sgCheck -and $sgCheck -ne "None" -and $sgCheck -ne "") {
        $SgId = $sgCheck
        Write-Success "Security group already exists: $SgId"
    } else {
        throw "Create new"
    }
} catch {
    $sgOutput = aws ec2 create-security-group `
        --group-name $SgName `
        --description "Security group for Meeting Matters HRM" `
        --region $AwsRegion | ConvertFrom-Json
    
    $SgId = $sgOutput.GroupId
    
    # Add inbound rules
    @(
        @{Protocol = "tcp"; Port = 22; Description = "SSH" },
        @{Protocol = "tcp"; Port = 80; Description = "HTTP" },
        @{Protocol = "tcp"; Port = 443; Description = "HTTPS" }
    ) | ForEach-Object {
        aws ec2 authorize-security-group-ingress `
            --group-id $SgId `
            --protocol $_.Protocol `
            --port $_.Port `
            --cidr 0.0.0.0/0 `
            --region $AwsRegion 2>$null | Out-Null
    }
    
    Write-Success "Security group created: $SgId"
}

Write-Host ""

# Step 2: Create RDS Database
Write-Status "Step 2: Creating RDS PostgreSQL Database..."

$RdsInstance = "$AppName-db"

try {
    $dbCheck = aws rds describe-db-instances `
        --db-instance-identifier $RdsInstance `
        --region $AwsRegion `
        --query 'DBInstances[0].DBInstanceIdentifier' `
        --output text 2>$null

    if ($dbCheck -and $dbCheck -ne "None") {
        Write-Status "Database already exists or is being created: $RdsInstance"
    } else {
        throw "Create new"
    }
} catch {
    Write-Status "Creating new database instance..."
    aws rds create-db-instance `
        --db-instance-identifier $RdsInstance `
        --db-instance-class $DbInstanceType `
        --engine postgres `
        --engine-version 15.4 `
        --master-username postgres `
        --master-user-password $DbPassword `
        --allocated-storage 20 `
        --storage-type gp3 `
        --db-name hrm `
        --publicly-accessible $false `
        --region $AwsRegion | Out-Null
}

Write-Status "Waiting for database to be available (this may take 5-10 minutes)..."
Write-Status "This may take some time. Please be patient..."

$dbWaitCounter = 0
while ($dbWaitCounter -lt 120) {
    try {
        $dbStatus = aws rds describe-db-instances `
            --db-instance-identifier $RdsInstance `
            --region $AwsRegion `
            --query 'DBInstances[0].DBInstanceStatus' `
            --output text 2>$null

        if ($dbStatus -eq "available") {
            break
        }
    } catch {
        # Still waiting
    }
    
    Start-Sleep -Seconds 5
    $dbWaitCounter++
    Write-Host "." -NoNewline -ForegroundColor Yellow
}

Write-Host ""

$dbInfo = aws rds describe-db-instances `
    --db-instance-identifier $RdsInstance `
    --region $AwsRegion | ConvertFrom-Json

$DbEndpoint = $dbInfo.DBInstances[0].Endpoint.Address
$DatabaseUrl = "postgresql://postgres:$DbPassword@$DbEndpoint`:5432/hrm"

Write-Success "Database created: $DbEndpoint"

Write-Host ""

# Step 3: Create ECR Repository
Write-Status "Step 3: Creating ECR Repository..."

$EcrRepo = $AppName

try {
    aws ecr describe-repositories `
        --repository-names $EcrRepo `
        --region $AwsRegion | Out-Null
    Write-Status "Repository already exists"
} catch {
    aws ecr create-repository `
        --repository-name $EcrRepo `
        --region $AwsRegion | Out-Null
    Write-Success "ECR Repository created"
}

$EcrUri = "$AwsAccountId.dkr.ecr.$AwsRegion.amazonaws.com/$EcrRepo"
Write-Success "ECR Repository URI: $EcrUri"

Write-Host ""

# Step 4: Build and Push Docker Image
Write-Status "Step 4: Building and pushing Docker image..."

# Create Dockerfile if it doesn't exist
if (-not (Test-Path "Dockerfile")) {
    Write-Status "Creating Dockerfile..."
    $dockerfile = @"
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
"@
    $dockerfile | Out-File -FilePath "Dockerfile" -Encoding UTF8
}

# Login to ECR
Write-Status "Logging in to ECR..."
$ecrPassword = aws ecr get-login-password --region $AwsRegion
$ecrPassword | docker login --username AWS --password-stdin $EcrUri

# Build image
Write-Status "Building Docker image (this may take 2-3 minutes)..."
docker build -t "$AppName`:latest" .

# Tag image
docker tag "$AppName`:latest" "$EcrUri`:latest"

# Push image
Write-Status "Pushing image to ECR (this may take 1-2 minutes)..."
docker push "$EcrUri`:latest"

Write-Success "Docker image pushed to ECR"

Write-Host ""

# Step 5: Create EC2 Key Pair
Write-Status "Step 5: Creating EC2 Key Pair..."

$KeyPairName = "$AppName-key"

try {
    aws ec2 describe-key-pairs `
        --key-names $KeyPairName `
        --region $AwsRegion | Out-Null
    Write-Status "Key pair already exists"
} catch {
    $keyPair = aws ec2 create-key-pair `
        --key-name $KeyPairName `
        --region $AwsRegion | ConvertFrom-Json
    
    $keyPair.KeyMaterial | Out-File -FilePath "$KeyPairName.pem" -Encoding UTF8
    Write-Success "Key pair created: $KeyPairName.pem"
}

Write-Host ""

# Step 6: Launch EC2 Instance
Write-Status "Step 6: Launching EC2 Instance..."

$UserDataScript = @"
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

echo "EC2 instance ready for deployment"
"@

$UserDataPath = "user_data.sh"
$UserDataScript | Out-File -FilePath $UserDataPath -Encoding UTF8

# Get latest Ubuntu 22.04 LTS AMI
Write-Status "Fetching latest Ubuntu 22.04 LTS AMI..."
$amiInfo = aws ec2 describe-images `
    --owners 099720109477 `
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" `
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' `
    --output text `
    --region $AwsRegion

# Launch instance
$instanceInfo = aws ec2 run-instances `
    --image-id $amiInfo `
    --instance-type $InstanceType `
    --key-name $KeyPairName `
    --security-groups $SgName `
    --user-data "file://$UserDataPath" `
    --region $AwsRegion | ConvertFrom-Json

$InstanceId = $instanceInfo.Instances[0].InstanceId

Write-Status "Waiting for EC2 instance to be running..."
aws ec2 wait instance-running `
    --instance-ids $InstanceId `
    --region $AwsRegion

Write-Success "EC2 Instance created: $InstanceId"

Write-Host ""

# Step 7: Wait for public IP
Write-Status "Step 7: Waiting for public IP assignment..."
Start-Sleep -Seconds 10

$instanceDetails = aws ec2 describe-instances `
    --instance-ids $InstanceId `
    --region $AwsRegion | ConvertFrom-Json

$Ec2PublicIp = $instanceDetails.Reservations[0].Instances[0].PublicIpAddress

Write-Success "EC2 Public IP: $Ec2PublicIp"

Write-Host ""

# Step 8: Allocate and Associate Elastic IP
Write-Status "Step 8: Allocating Elastic IP..."

$allocInfo = aws ec2 allocate-address `
    --domain vpc `
    --region $AwsRegion | ConvertFrom-Json

$AllocId = $allocInfo.AllocationId

Start-Sleep -Seconds 5

aws ec2 associate-address `
    --instance-id $InstanceId `
    --allocation-id $AllocId `
    --region $AwsRegion | Out-Null

$elasticIpInfo = aws ec2 describe-addresses `
    --allocation-ids $AllocId `
    --region $AwsRegion | ConvertFrom-Json

$ElasticIp = $elasticIpInfo.Addresses[0].PublicIp

Write-Success "Elastic IP allocated: $ElasticIp"

Write-Host ""

# Step 9: Create Deployment Configuration Script
Write-Status "Step 9: Creating deployment configuration script..."

$deploymentConfig = @"
#!/bin/bash
set -e

echo "Starting deployment on EC2 instance..."

# Create .env file
cat > /home/ubuntu/app/.env << 'ENVFILE'
DATABASE_URL=$DatabaseUrl
SESSION_SECRET=$SessionSecret
GMAIL_USER=$GmailUser
GMAIL_PASS=$GmailPass
HR_ADMIN_EMAIL=hr@themeetingmatters.com
STRIPE_SECRET_KEY=$StripeSecretKey
NODE_ENV=production
PORT=3000
REPLIT_URL=https://$DomainName
ENVFILE

echo ".env file created"

# Wait for Docker daemon
sleep 10

# Login to ECR
aws ecr get-login-password --region $AwsRegion | \
    docker login --username AWS --password-stdin $EcrUri

# Pull Docker image
docker pull $EcrUri`:latest

# Run Docker container
docker run -d \
    --name meeting-matters \
    -p 3000:3000 \
    --env-file /home/ubuntu/app/.env \
    --restart unless-stopped \
    $EcrUri`:latest

echo "Docker container started"

# Wait for application to be ready
sleep 10

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

echo "Nginx configured and restarted"
echo "Deployment complete!"
"@

$deploymentConfig | Out-File -FilePath "deployment-config.sh" -Encoding UTF8

Write-Success "Deployment configuration script created"

Write-Host ""

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AWS Deployment Created Successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Deployment Summary:" -ForegroundColor White
Write-Host "  Application Name: $AppName" -ForegroundColor Gray
Write-Host "  Region: $AwsRegion" -ForegroundColor Gray
Write-Host "  EC2 Instance ID: $InstanceId" -ForegroundColor Gray
Write-Host "  EC2 Public IP: $Ec2PublicIp" -ForegroundColor Gray
Write-Host "  Elastic IP: $ElasticIp" -ForegroundColor Gray
Write-Host "  RDS Database: $RdsInstance" -ForegroundColor Gray
Write-Host "  Database Endpoint: $DbEndpoint" -ForegroundColor Gray
Write-Host "  ECR Repository: $EcrUri" -ForegroundColor Gray
Write-Host ""

Write-Host "🔑 Important Files:" -ForegroundColor White
Write-Host "  SSH Key: $KeyPairName.pem" -ForegroundColor Gray
Write-Host "  Deployment Config: deployment-config.sh" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor White
Write-Host ""

Write-Host "1️⃣  Wait 1-2 minutes for EC2 initialization, then copy deployment script to server:" -ForegroundColor Cyan
Write-Host "    scp -i $KeyPairName.pem deployment-config.sh ubuntu@$ElasticIp`:/home/ubuntu/" -ForegroundColor Yellow
Write-Host ""

Write-Host "2️⃣  SSH into EC2 and run deployment:" -ForegroundColor Cyan
Write-Host "    ssh -i $KeyPairName.pem ubuntu@$ElasticIp" -ForegroundColor Yellow
Write-Host "    bash /home/ubuntu/deployment-config.sh" -ForegroundColor Yellow
Write-Host ""

Write-Host "3️⃣  Create admin user:" -ForegroundColor Cyan
Write-Host "    ssh -i $KeyPairName.pem ubuntu@$ElasticIp" -ForegroundColor Yellow
Write-Host "    docker exec -it meeting-matters npx tsx create-admin.js" -ForegroundColor Yellow
Write-Host ""

Write-Host "4️⃣  Access your application:" -ForegroundColor Cyan
Write-Host "    http://$ElasticIp" -ForegroundColor Yellow
Write-Host ""

if ($DomainName) {
    Write-Host "5️⃣  Point your domain ($DomainName) to: $ElasticIp" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "6️⃣  Setup SSL certificate:" -ForegroundColor Cyan
    Write-Host "    ssh -i $KeyPairName.pem ubuntu@$ElasticIp" -ForegroundColor Yellow
    Write-Host "    sudo apt install -y certbot python3-certbot-nginx" -ForegroundColor Yellow
    Write-Host "    sudo certbot --nginx -d $DomainName" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "⚠️  Important Security Notes:" -ForegroundColor White
Write-Host "  - Keep $KeyPairName.pem file safe - you'll need it for SSH access" -ForegroundColor Yellow
Write-Host "  - Change admin password after first login" -ForegroundColor Yellow
Write-Host "  - Update security group to restrict SSH access to your IP only" -ForegroundColor Yellow
Write-Host ""

Write-Host "💰 Estimated Monthly Costs:" -ForegroundColor White
Write-Host "  - EC2 $InstanceType`: ~$30" -ForegroundColor Gray
Write-Host "  - RDS db.t3.micro: ~$15" -ForegroundColor Gray
Write-Host "  - Data Transfer: ~$5-10" -ForegroundColor Gray
Write-Host "  - Total: ~$50-55/month" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
