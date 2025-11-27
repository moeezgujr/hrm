# Step-by-Step Deployment Commands

## ✓ Phase 1: Infrastructure Setup COMPLETED

All AWS infrastructure has been created and configured.

---

## 📋 Phase 2: Application Deployment

### Command 1: Copy Deployment Script to EC2

**On your local machine (Windows PowerShell):**

```powershell
# Navigate to project directory
cd C:\Users\TECHNIFI\Downloads\WebsiteHosting-main\WebsiteHosting-main

# Copy deployment script to EC2 (wait 1-2 min for EC2 full startup first!)
scp -i meeting-matters-hrm-key.pem deployment-config.sh ubuntu@13.134.147.210:/home/ubuntu/
```

**On your local machine (Mac/Linux/WSL Bash):**

```bash
# Navigate to project directory
cd /path/to/WebsiteHosting-main

# Copy deployment script to EC2
scp -i meeting-matters-hrm-key.pem deployment-config.sh ubuntu@13.134.147.210:/home/ubuntu/
```

**Expected output:**
```
deployment-config.sh                          100% 2547     45.2KB/s   00:00
```

---

### Command 2: Connect to EC2 Instance

**From Windows PowerShell or Cmd:**

```powershell
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
```

**From Mac/Linux/WSL:**

```bash
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
```

**If you get permission denied, fix key permissions:**
```bash
# On Mac/Linux/WSL
chmod 400 meeting-matters-hrm-key.pem

# Then retry connection
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
```

**Expected output:**
```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1234-aws x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Thu Nov 28 12:00:00 UTC 2025

  System load:  0.25              Users logged in:       0
  Usage of /:   12% of 20GB       IPv4 address:          10.0.1.100
  Memory usage: 15%               IPv6 address:          fe80::1111:2222:3333:4444

ubuntu@ip-10-0-1-100:~$
```

---

### Command 3: Run Deployment Configuration Script

**On EC2 instance (after SSH connection):**

```bash
bash /home/ubuntu/deployment-config.sh
```

**This script will execute the following steps:**
1. Create /home/ubuntu/app directory
2. Generate .env file with database credentials
3. Login to AWS ECR (Elastic Container Registry)
4. Pull Docker image
5. Start Docker container
6. Configure and restart Nginx
7. Configure reverse proxy

**Expected output:**
```
Starting deployment on EC2 instance...
.env file created
Docker login successful
Docker image pulled
Docker container started
Nginx configured and restarted
Deployment complete!
```

**Time to complete:** 2-5 minutes

---

### Command 4: Initialize Database (Optional - if not auto-migrated)

**On EC2 instance:**

```bash
docker exec meeting-matters npm run db:push
```

**Expected output:**
```
Pushing database schema...
✓ Database schema pushed successfully
```

---

### Command 5: Create Admin User

**On EC2 instance:**

```bash
docker exec -it meeting-matters npx tsx create-admin.js
```

**You'll be prompted to enter:**
```
Enter admin email: admin@example.com
Enter admin password: (your_secure_password)
Enter admin name: Admin User
Confirm password: (repeat_password)

✓ Admin user created successfully!
Admin email: admin@example.com
```

---

## 🧪 Phase 3: Testing & Verification

### Test 1: Check Application is Running

**On EC2 instance:**

```bash
# View running containers
docker ps

# Expected output:
CONTAINER ID   IMAGE                                                       NAMES
abc12def34gh   893978477641.dkr.ecr.eu-west-2.amazonaws.com/...          meeting-matters
```

### Test 2: Check Container Logs

**On EC2 instance:**

```bash
# View recent logs
docker logs meeting-matters

# View continuous logs (Ctrl+C to exit)
docker logs -f meeting-matters
```

**Expected output:**
```
[2025-11-28 12:00:00] Server starting...
[2025-11-28 12:00:01] Connected to database
[2025-11-28 12:00:02] Express server listening on port 3000
[2025-11-28 12:00:03] Ready to accept requests
```

### Test 3: Access Application in Browser

**On your local machine browser:**

```
http://13.134.147.210
```

You should see the login page.

**Try to login with:**
```
Email: (email from Command 5)
Password: (password from Command 5)
```

---

## 🔍 Monitoring Commands

### View Application Status

```bash
# Full container details
docker inspect meeting-matters

# Container statistics (CPU, Memory, Network)
docker stats meeting-matters

# List all containers
docker ps -a
```

### View Database Connection

```bash
# Test database connection
docker exec meeting-matters psql -U postgres \
  -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com \
  -d hrm -c "SELECT version();"
```

### View Nginx Status

```bash
# Check Nginx is running
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Check System Resources

```bash
# CPU and memory usage
top

# Disk space usage
df -h

# Check EC2 instance details
lsb_release -a
uname -a
```

---

## 🔧 Troubleshooting Commands

### If Docker Container Won't Start

```bash
# Check why container exited
docker logs meeting-matters

# Restart container
docker restart meeting-matters

# If still not working, stop and remove
docker stop meeting-matters
docker rm meeting-matters

# Manually pull and run (debug)
docker pull 893978477641.dkr.ecr.eu-west-2.amazonaws.com/meeting-matters-hrm:latest
docker run -it --env-file /home/ubuntu/app/.env meeting-matters-hrm:latest
```

### If Can't Connect to Database

```bash
# Test database endpoint
psql -U postgres \
  -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com \
  -d hrm

# View .env file
cat /home/ubuntu/app/.env

# Check docker env variables
docker inspect meeting-matters | grep -A 20 '"Env"'
```

### If Nginx Won't Start

```bash
# Check Nginx syntax
sudo nginx -t

# View Nginx error log
sudo journalctl -u nginx

# Restart Nginx
sudo systemctl restart nginx

# Check if port 80 is in use
sudo lsof -i :80
```

### If Running Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker images and containers
docker system prune -a

# Check what's using space
du -sh /home/ubuntu/*
```

---

## 📊 View Application Metrics

### Check Container Memory/CPU Usage

```bash
docker stats meeting-matters --no-stream
```

**Example output:**
```
CONTAINER ID   NAME                CPU %     MEM USAGE / LIMIT
abc12def34gh   meeting-matters     2.50%     234.5MiB / 1.96GiB
```

### Check Nginx Performance

```bash
# Connection count
netstat -an | grep ESTABLISHED | wc -l

# Check for slow requests
sudo grep "request_time" /var/log/nginx/access.log | \
  awk '{print $NF}' | sort -rn | head -10
```

---

## 🔐 Security & Maintenance

### Update Security Group to Restrict SSH

**On your local machine (AWS CLI):**

```bash
# Replace YOUR_IP_ADDRESS with your actual IP (e.g., 203.0.113.45)
aws ec2 authorize-security-group-ingress \
  --group-id sg-04f87680ca7775b14 \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP_ADDRESS/32 \
  --region eu-west-2

# Revoke the old open SSH rule
aws ec2 revoke-security-group-ingress \
  --group-id sg-04f87680ca7775b14 \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0 \
  --region eu-west-2
```

### Setup SSL Certificate (Optional)

**On EC2 instance:**

```bash
# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain pointing to IP)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo systemctl status certbot.timer
```

### Backup Database

**On EC2 instance:**

```bash
# Create backup file
docker exec meeting-matters pg_dump -U postgres -d hrm > ~/backup.sql

# Download backup to local machine
# (from local machine)
scp -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210:~/backup.sql ./backup.sql
```

---

## 🚀 Post-Deployment Checklist

- [ ] Deployment script executed successfully
- [ ] Admin user created
- [ ] Application accessible via browser
- [ ] Can login with admin credentials
- [ ] Check Docker container is running (docker ps)
- [ ] Check logs for errors (docker logs meeting-matters)
- [ ] Test database connection
- [ ] Verify Nginx is routing traffic correctly
- [ ] Restrict SSH access to security group
- [ ] Test basic application functionality
- [ ] Verify email sending (if applicable)
- [ ] Test file uploads (if applicable)
- [ ] Check all features work as expected

---

## 📞 Quick Command Reference

```bash
# SSH to EC2
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210

# View logs
docker logs -f meeting-matters

# Restart application
docker restart meeting-matters

# Check status
docker ps

# Stop application
docker stop meeting-matters

# Start application
docker start meeting-matters

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx status
sudo systemctl status nginx

# Exit SSH session
exit
```

---

**Ready? Start with Command 1 above!**
