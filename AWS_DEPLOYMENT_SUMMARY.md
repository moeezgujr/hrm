# AWS Deployment Summary - Meeting Matters HRM

## Deployment Complete! ✓

Your application infrastructure has been successfully created on AWS.

### Infrastructure Details

**Account ID:** 893978477641  
**Region:** eu-west-2 (London)

#### EC2 Instance
- **Instance ID:** i-093c65cdfe57d8617
- **Instance Type:** t3.medium
- **Public IP:** 35.178.225.116
- **Elastic IP:** 13.134.147.210
- **Status:** Running

#### RDS Database
- **Database Name:** meeting-matters-hrm-db
- **Engine:** PostgreSQL 15.4
- **Instance Type:** db.t3.micro
- **Endpoint:** meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com:5432
- **Database:** hrm
- **Username:** postgres
- **Status:** Available

#### ECR Repository
- **Repository:** meeting-matters-hrm
- **URI:** 893978477641.dkr.ecr.eu-west-2.amazonaws.com/meeting-matters-hrm
- **Image Tag:** latest
- **Status:** Docker image pushed

#### Security Group
- **Name:** meeting-matters-hrm-sg
- **ID:** sg-04f87680ca7775b14
- **Open Ports:** 22 (SSH), 80 (HTTP), 443 (HTTPS)

### Configuration

**Environment Variables:**
```
DATABASE_URL=postgresql://postgres:12345555@meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com:5432/hrm
GMAIL_USER=moeezgujr@gmail.com
STRIPE_SECRET_KEY=VITE_STRIPE_PUBLIC_KEY
NODE_ENV=production
PORT=3000
```

### Next Steps - Deploy Application

#### Step 1: Upload Deployment Script to EC2
Wait 1-2 minutes for EC2 initialization, then copy the deployment script:

```powershell
scp -i meeting-matters-hrm-key.pem deployment-config.sh ubuntu@13.134.147.210:/home/ubuntu/
```

**Note:** The SSH key file `meeting-matters-hrm-key.pem` was created in the deployment directory.

#### Step 2: SSH into EC2 and Deploy

```bash
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
```

Once connected, run the deployment script:

```bash
bash /home/ubuntu/deployment-config.sh
```

This will:
- Create the .env configuration file
- Pull the Docker image from ECR
- Start the Docker container
- Configure Nginx as a reverse proxy
- Restart Nginx

#### Step 3: Create Admin User

After deployment completes, create your admin user:

```bash
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
docker exec -it meeting-matters npx tsx create-admin.js
```

#### Step 4: Access Your Application

Open your browser and navigate to:
```
http://13.134.147.210
```

Or if you have a domain name, update DNS records to point to the Elastic IP and access via your domain.

### Setting Up Custom Domain (Optional)

1. **Update DNS Records**
   - Point your domain's A record to: `13.134.147.210`
   - Wait for DNS propagation (usually 5-30 minutes)

2. **Setup SSL Certificate with Let's Encrypt**
   
```bash
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

3. **Update Nginx Configuration**
   Update the Nginx config to use your domain name instead of `_`

### Important Files

- **SSH Key:** `meeting-matters-hrm-key.pem` - Keep this safe! You need it for SSH access.
- **Deployment Script:** `deployment-config.sh` - Upload this to your EC2 instance

### Security Notes

1. **SSH Access:** Update the security group to restrict SSH (port 22) to your IP only:
   - Go to AWS Console → EC2 → Security Groups → meeting-matters-hrm-sg
   - Edit inbound rules for port 22, change CIDR from 0.0.0.0/0 to your IP

2. **Database Password:** Change the database password after first setup:
   ```bash
   ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
   ```

3. **Admin Credentials:** Change admin password after first login

### Monitoring and Logs

**Check Docker Container Status:**
```bash
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
docker ps
docker logs meeting-matters
```

**Check Nginx:**
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
```

**Check Application Logs:**
```bash
docker logs -f meeting-matters
```

### Troubleshooting

**Can't connect to EC2:**
- Ensure security group allows SSH (port 22) from your IP
- Check that the key pair permissions are correct: `chmod 400 meeting-matters-hrm-key.pem`

**Docker container not running:**
```bash
docker ps -a
docker logs meeting-matters
docker start meeting-matters
```

**Database connection issues:**
- Verify DATABASE_URL in .env file is correct
- Check security group allows PostgreSQL (5432) from EC2
- Test connection: `psql -U postgres -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com -d hrm`

**Nginx issues:**
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Estimated Monthly Costs

- **EC2 t3.medium:** ~$30-35
- **RDS db.t3.micro:** ~$15-20
- **Data Transfer & Other:** ~$5-10
- **Total:** ~$50-65/month

### Backup Strategy

1. **Database Backups:** AWS RDS automatically creates backups. Enable automated backups in RDS console.
2. **Application Code:** Ensure code is in version control (GitHub, GitLab, etc.)
3. **User Data:** Consider setting up regular RDS snapshots

### Scaling

When ready to scale:
1. Upgrade EC2 instance type (t3.large, etc.)
2. Upgrade RDS instance type
3. Consider using CloudFront for static assets
4. Setup load balancing with Application Load Balancer

---

**Deployment Date:** 2025-11-28  
**Region:** eu-west-2 (London)  
**Application:** Meeting Matters HRM
