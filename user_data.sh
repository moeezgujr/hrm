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
