# AWS Deployment - Quick Reference

## Your Deployment is Ready! ✓

### Key Information

```
Elastic IP Address:  13.134.147.210
EC2 Instance ID:     i-093c65cdfe57d8617
Database Endpoint:   meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com
Region:              eu-west-2 (London)
```

## Commands to Run Next

### 1. Copy Deployment Script (from your local machine)
```powershell
scp -i meeting-matters-hrm-key.pem deployment-config.sh ubuntu@13.134.147.210:/home/ubuntu/
```

### 2. Connect to EC2 (from your local machine)
```bash
ssh -i meeting-matters-hrm-key.pem ubuntu@13.134.147.210
```

### 3. Run Deployment Script (on EC2)
```bash
bash /home/ubuntu/deployment-config.sh
```

### 4. Create Admin User (on EC2)
```bash
docker exec -it meeting-matters npx tsx create-admin.js
```

### 5. Test Application
- Open browser: http://13.134.147.210
- Login with admin credentials created in step 4

## Important Files in Your Project Directory

- `meeting-matters-hrm-key.pem` - SSH private key (KEEP SAFE!)
- `deployment-config.sh` - Deployment script for EC2
- `AWS_DEPLOYMENT_SUMMARY.md` - Full deployment details
- `Dockerfile` - Docker image configuration

## Dashboard & Monitoring

### AWS Console Links
- **EC2:** https://console.aws.amazon.com/ec2/v2/home?region=eu-west-2#Instances:instanceId=i-093c65cdfe57d8617
- **RDS:** https://console.aws.amazon.com/rds/home?region=eu-west-2
- **ECR:** https://console.aws.amazon.com/ecr/repositories/meeting-matters-hrm?region=eu-west-2

### Check Status on EC2
```bash
# Check Docker container
docker ps
docker logs -f meeting-matters

# Check Nginx
sudo systemctl status nginx

# Check database connection
psql -U postgres -h meeting-matters-hrm-db.c90weoswy5xq.eu-west-2.rds.amazonaws.com -d hrm
```

## Cost Estimate

- EC2 t3.medium: ~$30-35/month
- RDS db.t3.micro: ~$15-20/month
- Data Transfer: ~$5-10/month
- **Total: ~$50-65/month**

## Next: Set Up Custom Domain (Optional)

1. Update your domain's DNS A record to: `13.134.147.210`
2. Wait for DNS propagation
3. SSH to EC2 and setup SSL:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

**Ready to deploy? Follow the 5 commands above!**
