# AWS Deployment PowerShell Script for Meeting Matters HRM
# Run this script with: powershell -ExecutionPolicy Bypass -File deploy-aws-fixed.ps1

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
function Write-Success { Write-Host "[TICK] $args" -ForegroundColor Green }
function Write-ErrorMsg { Write-Host "[X] $args" -ForegroundColor Red }

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
    Write-ErrorMsg "AWS CLI not found. Please install it from: https://aws.amazon.com/cli/"
    exit 1
}

# Check Docker
try {
    $null = docker --version
    Write-Success "Docker found"
} catch {
    Write-ErrorMsg "Docker not found. Please install it from: https://www.docker.com/"
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
        Write-ErrorMsg "Could not retrieve AWS Account ID. Please provide it as parameter: -AwsAccountId `<id`>"
        exit 1
    }
}

if (-not $DbPassword) {
    $DbPassword = Read-Host "Enter Database Password (minimum 8 chars)"
}

if (-not $GmailUser) {
    $GmailUser = Read-Host "Enter Gmail Email Address"
}

if (-not $GmailPass) {
    $GmailPass = Read-Host "Enter Gmail App Password"
}

if (-not $StripeSecretKey) {
    $StripeSecretKey = Read-Host "Enter Stripe Secret Key"
}

if (-not $DomainName) {
    $DomainName = Read-Host "Enter Domain name (optional, press Enter to skip)"
}

# Generate session secret
$SessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

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
        --publicly-accessible false `
        --region $AwsRegion | Out-Null
}

Write-Status "Waiting for database to be available (this may take 5-10 minutes)..."

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

# Step 4: Create Dockerfile
Write-Status "Step 4: Creating Dockerfile..."

$dockerfileContent = @"
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
"@

if (-not (Test-Path "Dockerfile")) {
    $dockerfileContent | Out-File -FilePath "Dockerfile" -Encoding UTF8
    Write-Success "Dockerfile created"
} else {
    Write-Status "Dockerfile already exists"
}

Write-Host ""

# Step 5: Build and Push Docker Image
Write-Status "Step 5: Building and pushing Docker image..."

Write-Status "Logging in to ECR..."
$ecrPassword = aws ecr get-login-password --region $AwsRegion
$ecrPassword | docker login --username AWS --password-stdin $EcrUri

Write-Status "Building Docker image (this may take 2-3 minutes)..."
docker build -t "$AppName`:latest" .

Write-Status "Tagging image..."
docker tag "$AppName`:latest" "$EcrUri`:latest"

Write-Status "Pushing image to ECR (this may take 1-2 minutes)..."
docker push "$EcrUri`:latest"

Write-Success "Docker image pushed to ECR"

Write-Host ""

# Step 6: Create EC2 Key Pair
Write-Status "Step 6: Creating EC2 Key Pair..."

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

# Step 7: Launch EC2 Instance
Write-Status "Step 7: Launching EC2 Instance..."

$userDataScript = @"
#!/bin/bash
set -e
apt-get update
apt-get upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
npm install -g pm2
apt-get install -y nginx
apt-get install -y docker.io
usermod -aG docker ubuntu
apt-get install -y awscli
mkdir -p /home/ubuntu/app
cd /home/ubuntu/app
echo "EC2 instance ready for deployment"
"@

$userDataPath = "user_data.sh"
$userDataScript | Out-File -FilePath $userDataPath -Encoding UTF8

Write-Status "Fetching latest Ubuntu 22.04 LTS AMI..."
$amiInfo = aws ec2 describe-images `
    --owners 099720109477 `
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" `
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' `
    --output text `
    --region $AwsRegion

Write-Status "Launching EC2 instance..."
$instanceInfo = aws ec2 run-instances `
    --image-id $amiInfo `
    --instance-type $InstanceType `
    --key-name $KeyPairName `
    --security-groups $SgName `
    --user-data "file://$userDataPath" `
    --region $AwsRegion | ConvertFrom-Json

$InstanceId = $instanceInfo.Instances[0].InstanceId

Write-Status "Waiting for EC2 instance to be running..."
aws ec2 wait instance-running `
    --instance-ids $InstanceId `
    --region $AwsRegion

Write-Success "EC2 Instance created: $InstanceId"

Write-Host ""

# Step 8: Wait for public IP
Write-Status "Step 8: Waiting for public IP assignment..."
Start-Sleep -Seconds 10

$instanceDetails = aws ec2 describe-instances `
    --instance-ids $InstanceId `
    --region $AwsRegion | ConvertFrom-Json

$Ec2PublicIp = $instanceDetails.Reservations[0].Instances[0].PublicIpAddress

Write-Success "EC2 Public IP: $Ec2PublicIp"

Write-Host ""

# Step 9: Allocate and Associate Elastic IP
Write-Status "Step 9: Allocating Elastic IP..."

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

# Step 10: Create deployment configuration script
Write-Status "Step 10: Creating deployment configuration script..."

$deploymentConfigPath = "deployment-config.sh"

$deploymentConfigContent = @"
#!/bin/bash
set -e

echo "Starting deployment on EC2 instance..."
mkdir -p /home/ubuntu/app

# Create .env file
cat > /home/ubuntu/app/.env << 'ENVEOF'
DATABASE_URL=$DatabaseUrl
SESSION_SECRET=$SessionSecret
GMAIL_USER=$GmailUser
GMAIL_PASS=$GmailPass
HR_ADMIN_EMAIL=hr@themeetingmatters.com
STRIPE_SECRET_KEY=$StripeSecretKey
NODE_ENV=production
PORT=3000
REPLIT_URL=https://$DomainName
ENVEOF

echo ".env file created"

# Wait for Docker daemon
sleep 10

# Login to ECR
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $EcrUri

# Pull Docker image
docker pull $EcrUri`:latest

# Run Docker container
docker run -d `
    --name meeting-matters `
    -p 3000:3000 `
    --env-file /home/ubuntu/app/.env `
    --restart unless-stopped `
    $EcrUri`:latest

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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/meeting-matters /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Nginx configured and restarted"
echo "Deployment complete!"
"@

$deploymentConfigContent | Out-File -FilePath $deploymentConfigPath -Encoding UTF8

Write-Success "Deployment configuration script created"

Write-Host ""
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AWS Deployment Infrastructure Created!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Deployment Summary:" -ForegroundColor White
Write-Host "  Application: $AppName" -ForegroundColor Gray
Write-Host "  Region: $AwsRegion" -ForegroundColor Gray
Write-Host "  EC2 Instance ID: $InstanceId" -ForegroundColor Gray
Write-Host "  Elastic IP: $ElasticIp" -ForegroundColor Gray
Write-Host "  RDS Database: $RdsInstance" -ForegroundColor Gray
Write-Host "  Database Endpoint: $DbEndpoint" -ForegroundColor Gray
Write-Host "  ECR Repository: $EcrUri" -ForegroundColor Gray
Write-Host ""

Write-Host "Important Files:" -ForegroundColor White
Write-Host "  SSH Key: $KeyPairName.pem" -ForegroundColor Gray
Write-Host "  Deployment Config: $deploymentConfigPath" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copy deployment script to EC2 (wait 1-2 min for EC2 to fully initialize):"
Write-Host "   scp -i $KeyPairName.pem $deploymentConfigPath ubuntu@$ElasticIp`:/home/ubuntu/" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. SSH into EC2 and run deployment:"
Write-Host "   ssh -i $KeyPairName.pem ubuntu@$ElasticIp" -ForegroundColor Cyan
Write-Host "   bash /home/ubuntu/$deploymentConfigPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Access your application:"
Write-Host "   http://$ElasticIp" -ForegroundColor Cyan
Write-Host ""

if ($DomainName) {
    Write-Host "4. Point your domain ($DomainName) to: $ElasticIp" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Setup SSL certificate (run on EC2):"
    Write-Host "   sudo apt install -y certbot python3-certbot-nginx" -ForegroundColor Cyan
    Write-Host "   sudo certbot --nginx -d $DomainName" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
