# AWS Deployment Architecture & Complete Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Your Users                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ HTTP/HTTPS (80/443)
┌─────────────────────────────────────────────────────────────────┐
│                      Internet Gateway                            │
│                      13.134.147.210 (Elastic IP)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EC2 Instance (t3.medium)                    │
│                   i-093c65cdfe57d8617                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              Nginx (Reverse Proxy)                         ││
│  │              - Routes traffic to app                       ││
│  │              - Handles SSL/TLS                             ││
│  │              - Port 80/443 listening                       ││
│  └─────────────────────┬──────────────────────────────────────┘│
│                        │                                        │
│                        ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐│
│  │          Docker Container (Node.js App)                   ││
│  │          - Meeting Matters HRM                            ││
│  │          - Port 3000 (internal)                           ││
│  │          - Runtime: Node.js 20                            ││
│  │          - Image: ECR URI/meeting-matters-hrm:latest      ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Additional Services:                                           │
│  - PM2 (Process Manager) - NOT USED (Docker restart handles)  │
│  - Docker Daemon                                               │
│  - AWS CLI (for ECR access)                                    │
│  - Ubuntu 22.04 LTS OS                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Database Connection (TCP 5432)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RDS PostgreSQL Database                         │
│                  db.t3.micro                                    │
│                  meeting-matters-hrm-db.c90weoswy5xq.eu...     │
│                  Port: 5432                                     │
│                  Database: hrm                                  │
│                  User: postgres                                 │
└─────────────────────────────────────────────────────────────────┘

Security:
┌─────────────────────────────────────────────────────────────────┐
│                   Security Group (sg-04f87680ca7775b14)         │
│                                                                 │
│  Inbound Rules:                                                 │
│  - Port 22 (SSH) from 0.0.0.0/0 - RESTRICT THIS!             │
│  - Port 80 (HTTP) from 0.0.0.0/0                              │
│  - Port 443 (HTTPS) from 0.0.0.0/0                            │
│                                                                 │
│  Outbound Rules:                                                │
│  - All traffic allowed                                          │
└─────────────────────────────────────────────────────────────────┘

Docker Image:
┌─────────────────────────────────────────────────────────────────┐
│              ECR Repository (Elastic Container Registry)        │
│              893978477641.dkr.ecr.eu-west-2.amazonaws.com      │
│              /meeting-matters-hrm:latest                        │
└─────────────────────────────────────────────────────────────────┘
```

## Complete Deployment Workflow

### Phase 1: Infrastructure Setup ✓ COMPLETED

✓ AWS CLI configured  
✓ Security Group created (sg-04f87680ca7775b14)  
✓ EC2 Key Pair generated (meeting-matters-hrm-key.pem)  
✓ EC2 Instance launched (i-093c65cdfe57d8617)  
✓ Elastic IP allocated (13.134.147.210)  
✓ RDS Database created and available  
✓ ECR Repository created  
✓ Docker image built and pushed to ECR  

### Phase 2: Application Deployment (TODO)

Run these steps in order:

#### Step 2.1: Upload Deployment Script
```powershell
# On your local machine (Windows)
scp -i meeting-matters-hrm-key.pem deployment-config.sh ubuntu@13.134.147.210:/home/ubuntu/
```

#### Step 2.2: SSH into EC2
```bash
# On your local machine (Mac/Linux/WSL)
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210

# If using Windows PowerShell with OpenSSH:
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
```

#### Step 2.3: Run Deployment Configuration
```bash
# On EC2 instance
bash /home/ubuntu/deployment-config.sh
```

This script will:
1. ✓ Create /home/ubuntu/app directory
2. ✓ Create .env file with database credentials
3. ✓ Login to ECR (Elastic Container Registry)
4. ✓ Pull Docker image from ECR
5. ✓ Start Docker container with proper configuration
6. ✓ Configure Nginx as reverse proxy
7. ✓ Restart Nginx
8. ✓ Expose application on port 80

#### Step 2.4: Initialize Database
```bash
# On EC2 instance
docker exec meeting-matters npm run db:push
```

#### Step 2.5: Create Admin User
```bash
# On EC2 instance
docker exec -it meeting-matters npx tsx create-admin.js
```

Follow the prompts to create your admin account.

### Phase 3: Testing (TODO)

#### Step 3.1: Test Application Access
```bash
# In your browser, visit:
http://13.134.147.210
```

You should see the login page.

#### Step 3.2: Test Admin Login
- Use credentials created in Step 2.5
- Verify dashboard loads

#### Step 3.3: Check Logs
```bash
# On EC2 instance, check Docker logs
docker logs -f meeting-matters

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Phase 4: Security Hardening (Optional but Recommended)

#### 4.1: Restrict SSH Access
```bash
# In AWS Console:
1. Go to EC2 > Security Groups > sg-04f87680ca7775b14
2. Edit Inbound Rules
3. Change port 22 source from 0.0.0.0/0 to YOUR_IP/32
```

#### 4.2: Setup SSL Certificate (If Using Domain)
```bash
# On EC2 instance
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 4.3: Enable Auto-Renewal for SSL
```bash
# Verify certbot timer is running
sudo systemctl status certbot.timer
```

### Phase 5: Custom Domain Setup (Optional)

#### 5.1: Update DNS Records
- Go to your domain registrar (GoDaddy, Namecheap, etc.)
- Create/Update A record pointing to: 13.134.147.210
- Name: @ or your subdomain
- Wait for DNS propagation (5-30 minutes)

#### 5.2: Test Domain Access
```bash
# In browser after DNS propagates
http://yourdomain.com
```

## File Structure After Deployment

```
Local Machine (c:\Users\TECHNIFI\Downloads\WebsiteHosting-main\WebsiteHosting-main\):
├── meeting-matters-hrm-key.pem        # SSH Private Key (KEEP SAFE!)
├── deployment-config.sh                # Deployment Script
├── Dockerfile                          # Docker image definition
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
├── AWS_DEPLOYMENT_SUMMARY.md           # Full deployment info
├── QUICK_START.md                      # Quick reference
├── AWS_DEPLOYMENT_GUIDE.md             # Original guide
├── deploy-aws.ps1                      # Original PS script
├── deploy-aws-fixed.ps1                # Fixed PS script
└── ... other application files

EC2 Instance (/home/ubuntu/):
├── app/
│   ├── .env                            # Environment variables
│   ├── node_modules/
│   ├── dist/
│   └── ... application code
├── meeting-matters-hrm-key.pem         # SSH key
├── .ssh/
│   └── authorized_keys                 # Your public key
└── ... other system files

Database (AWS RDS):
└── PostgreSQL: hrm database
    ├── Tables (created by Drizzle migrations)
    ├── Users table
    ├── Roles table
    └── ... other tables
```

## Environment Configuration

The `.env` file created on EC2 contains:

```env
DATABASE_URL=postgresql://postgres:12345555@meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com:5432/hrm
SESSION_SECRET=<randomly generated>
GMAIL_USER=moeezgujr@gmail.com
GMAIL_PASS=Kallar97
HR_ADMIN_EMAIL=hr@themeetingmatters.com
STRIPE_SECRET_KEY=VITE_STRIPE_PUBLIC_KEY
NODE_ENV=production
PORT=3000
REPLIT_URL=https://yourdomain.com
```

**Never commit .env file to git!**

## Monitoring & Troubleshooting

### Check Application Status
```bash
# SSH to EC2
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210

# Check Docker container
docker ps
docker inspect meeting-matters

# View logs
docker logs -f meeting-matters
docker logs --tail 100 meeting-matters
```

### Restart Application
```bash
# Restart Docker container
docker restart meeting-matters

# Start if stopped
docker start meeting-matters

# Stop container
docker stop meeting-matters
```

### Database Troubleshooting
```bash
# Check database connection
docker exec meeting-matters psql -U postgres -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com -d hrm -c "SELECT version();"

# Run database migrations if needed
docker exec meeting-matters npm run db:push
```

### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Disk Space Issues
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Check container size
docker ps -s
```

## Scaling & Performance

### For Production Scale-Up:

1. **Upgrade EC2 Instance**
   - Stop current instance
   - Create AMI (Amazon Machine Image)
   - Launch new larger instance (t3.large, t3.xlarge)
   - Restore from AMI

2. **Upgrade RDS Database**
   - AWS Console > RDS > Modify
   - Change instance type to db.t3.medium or db.t3.large
   - Enable Multi-AZ for HA

3. **Add Load Balancing**
   - Create Application Load Balancer
   - Launch multiple EC2 instances
   - Use Auto Scaling Group

4. **Setup CDN**
   - Use CloudFront for static assets
   - Configure cache behaviors

## Cost Optimization

- **Reserved Instances:** Save up to 40% with 1-year commitment
- **Spot Instances:** For non-critical workloads (up to 90% savings)
- **Data Transfer:** Minimize inter-region transfers
- **Database:** Consider Aurora Serverless for variable workloads
- **Backups:** Optimize RDS backup retention

## Backup & Disaster Recovery

### Enable RDS Backups
```
AWS Console > RDS > Databases > meeting-matters-hrm-db
> Modify > Backup retention period: 30 days
```

### Create EBS Snapshot (for EC2)
```bash
# AWS CLI
aws ec2 create-snapshot --volume-id <volume-id> --region eu-west-2
```

### Database Export
```bash
# Create export on EC2
docker exec meeting-matters pg_dump -U postgres -d hrm > backup.sql
```

## Estimated Monthly Costs

| Service | Type | Estimated Cost |
|---------|------|-----------------|
| EC2 | t3.medium (730 hrs) | $30.00 |
| RDS | db.t3.micro (730 hrs) | $15.00 |
| Data Transfer | Outbound ~100GB | $10.00 |
| EBS Storage | 20GB gp3 | $2.00 |
| Elastic IP | 1 address | $3.65 |
| **Total** | | **~$60.65** |

*Prices in USD for eu-west-2 region*

---

## Support Resources

- **AWS Documentation:** https://docs.aws.amazon.com/
- **Docker Documentation:** https://docs.docker.com/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Node.js Documentation:** https://nodejs.org/docs/
- **Drizzle ORM:** https://orm.drizzle.team/

---

**Your application is infrastructure is ready! Follow Phase 2 steps to deploy the application.**
