# EC2 Deployment Guide (Docker Hub Image)

This guide shows how to **build/push your Docker image to Docker Hub** and **pull/run it on an EC2 instance** using SSH with a PEM key.

---

## Prerequisites

- AWS account
- EC2 instance (Amazon Linux 2 or Ubuntu)
- PEM key file downloaded (for SSH)
- Docker Hub account
- Docker image pushed to Docker Hub (e.g., `rahmanhusain/cimsaw_docker_image:latest`)
- Security Group allows:
  - SSH (22) from your IP
  - HTTP (80) from anywhere (optional but recommended)
  - Custom TCP (3000) from anywhere (if you expose port 3000)

---

## 1) Build and Push Image to Docker Hub (Local)

```bash
# Build the image locally
docker build -t cimsaws_dockerimage .

# Tag for Docker Hub
docker tag cimsaws_dockerimage rahmanhusain/cimsaw_docker_image:latest

# Login to Docker Hub
docker login

# Push image
docker push rahmanhusain/cimsaw_docker_image:latest
```

---

## 2) SSH into EC2 (with PEM key)

```bash
# Fix key permissions
chmod 400 /path/to/your-key.pem

# SSH into EC2 (Amazon Linux 2)
ssh -i "/path/to/your-key.pem" ec2-user@YOUR_EC2_PUBLIC_DNS

# If Ubuntu, use:
# ssh -i "/path/to/your-key.pem" ubuntu@YOUR_EC2_PUBLIC_DNS
```

---

## 3) Install Docker on EC2

### Amazon Linux 2

```bash
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
newgrp docker
```

### Ubuntu

```bash
sudo apt update -y
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
newgrp docker
```

---

## 4) Run the App from Docker Hub on EC2

You can **run the provided script** or run the command manually.

### Option A: Use `run-from-dockerhub.sh`

1. Upload `run-from-dockerhub.sh` to EC2 (or create it there)
2. Make it executable
3. Run it

```bash
# If you copied this repo to EC2, it already exists
chmod +x run-from-dockerhub.sh
./run-from-dockerhub.sh
```

> ⚠️ The script contains environment variables. Update them before running.

### Option B: Manual `docker run`

```bash
docker pull rahmanhusain/cimsaw_docker_image:latest

docker run -d \
  --name cimsaws-app \
  -p 80:3000 \
  -e PORT=3000 \
  -e DB_HOST=YOUR_DB_HOST \
  -e DB_USER=YOUR_DB_USER \
  -e DB_PASSWORD=YOUR_DB_PASSWORD \
  -e DB_NAME=YOUR_DB_NAME \
  -e AI_API_URL=YOUR_AI_API_URL \
  -e AI_API_KEY=YOUR_AI_API_KEY \
  -e SMTP_USER=YOUR_SMTP_USER \
  -e SMTP_PASS=YOUR_SMTP_PASS \
  -e SESSION_SECRET=YOUR_SESSION_SECRET \
  -e CRON_SECRET_TOKEN=YOUR_CRON_SECRET_TOKEN \
  -e AWS_REGION=YOUR_AWS_REGION \
  --restart unless-stopped \
  rahmanhusain/cimsaw_docker_image:latest
```

> Use `-p 80:3000` if you want the app available on standard HTTP port.
> If you want port 3000, use `-p 3000:3000`.

---

## 5) Verify the App

```bash
# Check container
docker ps

# Health check
curl http://localhost:3000/health

# Public access
# http://YOUR_EC2_PUBLIC_DNS:3000/admin.html
```

If you mapped `-p 80:3000`, then use:

```
http://YOUR_EC2_PUBLIC_DNS/admin.html
```

---

## 6) Useful Docker Commands

```bash
# View logs
docker logs -f cimsaws-app

# Restart container
docker restart cimsaws-app

# Stop container
docker stop cimsaws-app

# Remove container
docker rm -f cimsaws-app
```

---

## Notes

- Ensure your **RDS security group** allows inbound from your EC2 security group.
- If SSH fails, check the **instance is running** and the **security group allows port 22**.
- Use the **correct username** (`ec2-user` for Amazon Linux, `ubuntu` for Ubuntu).
