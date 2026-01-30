# CIMS - Customer Inquiry Management System

A full-stack Node.js application for managing customer inquiries with AI-powered analysis, automated routing, persistent storage in PostgreSQL, and admin dashboard. Built with Express.js and Docker for seamless deployment to AWS EC2.

## 🌟 Key Features

- **Customer Inquiry Form**: Simple, responsive web form for customers to submit inquiries
- **AI-Powered Analysis**: Automatic classification of intent, sentiment, and urgency using Google Generative AI
- **Admin Dashboard**: Real-time dashboard to view, filter, and manage inquiries
- **Status Management**: Track inquiries through OPEN → IN_PROGRESS → CLOSED lifecycle
- **Priority Filtering**: Filter and sort by high/medium/low priority and status
- **Email Notifications**: Automated confirmations, admin alerts, and follow-up reminders
- **Automated Follow-ups**: AWS Lambda + EventBridge triggers daily follow-up reminders for open inquiries
- **Date Sorting**: Sort inquiries by creation date (newest first or oldest first)
- **Authentication**: Secure admin panel with password-based authentication
- **Docker Support**: Production-ready Docker image, tested locally and on EC2

---

## 📋 Tech Stack

| Layer                | Technology                             |
| -------------------- | -------------------------------------- |
| **Runtime**          | Node.js 20 (Alpine Linux)              |
| **Framework**        | Express.js 4.x                         |
| **Database**         | PostgreSQL (AWS RDS)                   |
| **Authentication**   | bcryptjs + express-session             |
| **Email**            | Nodemailer (Gmail SMTP)                |
| **AI**               | Google Generative AI (@google/genai)   |
| **Containerization** | Docker + Docker Compose                |
| **Deployment**       | AWS EC2 + Docker Hub                   |
| **Automation**       | AWS Lambda + EventBridge               |
| **Frontend**         | Vanilla HTML5, CSS3, JavaScript (ES6+) |

---

## 📁 Project Structure

```
.
├── backend/
│   ├── config/
│   │   └── env.js                    # Environment variable loader
│   ├── db/
│   │   └── postgresql.js             # PostgreSQL connection pool
│   ├── routes/
│   │   ├── inquiry.routes.js         # Customer inquiry endpoints
│   │   └── admin.routes.js           # Admin panel endpoints
│   ├── services/
│   │   ├── ai.service.js             # AI analysis service
│   │   ├── auth.service.js           # Admin authentication
│   │   ├── email.service.js          # Email notifications
│   │   └── followup.service.js       # Automated follow-up reminders
│   └── server.js                     # Express server entry point
├── public/
│   ├── index.html                    # Customer inquiry form
│   ├── admin.html                    # Admin dashboard
│   ├── js/
│   │   ├── index.js                  # Form submission logic
│   │   └── admin.js                  # Admin dashboard logic
│   └── css/
│       ├── index.css                 # Form styling
│       └── admin.css                 # Admin dashboard styling
├── lambda/
│   └── followup-lambda.zip           # Lambda function for scheduled reminders
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # Local development stack
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── package.json                      # Node.js dependencies
├── README.md                         # This file
├── EC2_DEPLOYMENT_GUIDE.md          # Step-by-step EC2 deployment
└── AWS_FOLLOWUP_SETUP_GUIDE.md      # Lambda/EventBridge setup
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org))
- **PostgreSQL** 12+ (local or cloud)
- **Git** ([Download](https://git-scm.com))
- **Docker** (optional, for containerized development)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Rahmanhusain/cims-aws-project.git
   cd cimsaws
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values (see Configuration below)

4. **Create database tables** (PostgreSQL)

   ```sql
   CREATE TABLE admin_users (
     id SERIAL PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   CREATE SEQUENCE inquiries_seq
   START 1
   INCREMENT 1;


   CREATE TABLE inquiries (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL,
     message TEXT NOT NULL,
     intent VARCHAR(255),
     sentiment VARCHAR(50),
     urgency VARCHAR(50),
     priority VARCHAR(50) DEFAULT 'MEDIUM',
     status VARCHAR(50) DEFAULT 'OPEN',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );


   CREATE OR REPLACE FUNCTION generate_inquiry_id()
   RETURNS TRIGGER AS $$
   BEGIN
   NEW.id :=
    'INQ-' ||
    EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
    LPAD(nextval('inquiries_seq')::TEXT, 6, '0');
   RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;


   CREATE TRIGGER inquiries_id_trigger
   BEFORE INSERT ON inquiries
   FOR EACH ROW
   EXECUTE FUNCTION generate_inquiry_id();


   -- Insert default admin user (username: admin, password: admin123)
   INSERT INTO admin_users (username, password_hash)
   VALUES ('admin', '$2a$10$2jQ6Hfxw9Y9GJ9K9L9M9L.2jQ6Hfxw9Y9GJ9K9L9M9L');
   ```

5. **Start the server**

   ```bash
   npm start
   ```

   Server runs on `http://localhost:3000`

6. **Access the application**
   - **Customer Form**: http://localhost:3000/index.html
   - **Admin Dashboard**: http://localhost:3000/admin.html
   - **Default Credentials**: username: `admin` | password: `admin123`

---

## ⚙️ Configuration

Create a `.env` file in the project root with the following variables:

```dotenv
# Server Configuration
PORT=3000

# PostgreSQL Database (AWS RDS or local)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=adminrahman
DB_PASSWORD=your-secure-password
DB_NAME=cimsaws_Inquiry_DB

# Google Generative AI
AI_API_KEY=AIzaSyC...  # Get from Google Cloud Console

# Email Configuration (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use Gmail App Password (not regular password)

# Session & Security
SESSION_SECRET=your-very-long-random-string-here
CRON_SECRET_TOKEN=your-random-token-for-scheduled-tasks

# AWS Configuration
AWS_REGION=us-east-1
```

### Key Notes:

- **DB_HOST**: For AWS RDS, use the endpoint (e.g., `cimsaws.cuza462a0ubu.us-east-1.rds.amazonaws.com`)
- **AI_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com)
- **SMTP_PASS**: Generate a Google App Password (not your regular password)
- **SESSION_SECRET** & **CRON_SECRET_TOKEN**: Generate with `openssl rand -hex 32`

---

## 📱 API Endpoints

### Customer Endpoints

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| POST   | `/api/inquiry/submit` | Submit a new inquiry |
| GET    | `/health`             | Health check         |

### Admin Endpoints

| Method | Endpoint                          | Description                       |
| ------ | --------------------------------- | --------------------------------- |
| POST   | `/api/admin/login`                | Login to admin panel              |
| POST   | `/api/admin/logout`               | Logout from admin panel           |
| GET    | `/api/admin/check-session`        | Verify admin session              |
| GET    | `/api/admin/stats`                | Get dashboard statistics          |
| GET    | `/api/admin/inquiries`            | List all inquiries (with filters) |
| PATCH  | `/api/admin/inquiries/:id/status` | Update inquiry status             |
| POST   | `/api/admin/change-password`      | Change admin password             |

### Query Parameters for Inquiries

```
GET /api/admin/inquiries?priority=high&status=open&sort=asc&searchId=123
```

| Parameter  | Values                         | Description                 |
| ---------- | ------------------------------ | --------------------------- |
| `priority` | high, medium, low, all         | Filter by priority          |
| `status`   | open, in_progress, closed, all | Filter by status            |
| `searchId` | number                         | Search by inquiry ID        |
| `sort`     | asc, desc                      | Sort by date (newest first) |

---

## 🐳 Docker Deployment

### Local Testing with Docker

```bash
# Build the Docker image
docker build -t cimsaw-app .

# Run with environment variables
docker run -d \
  --name cimsaw-container \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DB_HOST=your-rds-endpoint \
  -e DB_USER=adminrahman \
  -e DB_PASSWORD=password \
  -e DB_NAME=cimsaws_Inquiry_DB \
  -e AI_API_KEY=your-key \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASS=your-app-password \
  -e SESSION_SECRET=your-secret \
  -e CRON_SECRET_TOKEN=your-token \
  cimsaw-app

# View logs
docker logs -f cimsaw-container

# Stop container
docker stop cimsaw-container
```

### Using Docker Hub Image

```bash
# Pull the pre-built image
docker pull rahmanhusain/cimsaw_docker_image:latest

# Run the container
docker run -d \
  --name cimsaws-app \
  -p 3000:3000 \
  -e DB_HOST=your-rds-endpoint \
  -e DB_USER=adminrahman \
  -e DB_PASSWORD=password \
  -e DB_NAME=cimsaws_Inquiry_DB \
  -e AI_API_KEY=your-key \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASS=your-app-password \
  -e SESSION_SECRET=your-secret \
  -e CRON_SECRET_TOKEN=your-token \
  rahmanhusain/cimsaw_docker_image:latest
```

---

## 🏗️ Deployment to AWS EC2

### Quick Deployment Steps

1. **Ensure Docker image is pushed to Docker Hub**

   ```bash
   docker build -t rahmanhusain/cimsaw_docker_image:latest .
   docker push rahmanhusain/cimsaw_docker_image:latest
   ```

2. **SSH into EC2 instance**

   ```bash
   ssh -i "your-key.pem" ec2-user@your-ec2-public-ip
   ```

3. **Install Docker** (if not already installed)

   ```bash
   # Amazon Linux 2
   sudo amazon-linux-extras install docker -y
   sudo systemctl start docker
   sudo usermod -a -G docker ec2-user
   ```

4. **Pull and run the image**

   ```bash
   docker pull rahmanhusain/cimsaw_docker_image:latest

   docker run -d \
     --name cimsaws-app \
     -p 80:3000 \
     -e PORT=3000 \
     -e DB_HOST=your-rds-endpoint \
     -e DB_USER=adminrahman \
     -e DB_PASSWORD=password \
     -e DB_NAME=cimsaws_Inquiry_DB \
     -e AI_API_KEY=your-key \
     -e SMTP_USER=your-email@gmail.com \
     -e SMTP_PASS=your-app-password \
     -e SESSION_SECRET=your-secret \
     -e CRON_SECRET_TOKEN=your-token \
     rahmanhusain/cimsaw_docker_image:latest
   ```

5. **Verify deployment**

   ```bash
   # Check if container is running
   docker ps | grep cimsaws-app

   # Test health endpoint
   curl http://localhost:3000/health
   ```

6. **Access the application**
   - Admin Dashboard: `http://your-ec2-public-ip/admin.html`
   - Customer Form: `http://your-ec2-public-ip/index.html`

### EC2 Security Group Requirements

- **Inbound Rule 1**: SSH (Port 22) from your IP
- **Inbound Rule 2**: HTTP (Port 80) from 0.0.0.0/0
- **Inbound Rule 3**: HTTPS (Port 443) from 0.0.0.0/0 (optional)

### RDS Security Group Requirements

- Allow inbound PostgreSQL (Port 5432) from EC2 security group

For detailed step-by-step instructions, see [EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md)

---

## 🔄 Automated Follow-up Reminders

### AWS Lambda + EventBridge Setup

The system includes automated follow-up reminders that run daily:

1. **EventBridge** (formerly CloudWatch Events) triggers a **Lambda function** daily
2. **Lambda function** calls the `/api/cron/followup` endpoint
3. **Follow-up service** finds inquiries older than 48 hours and sends reminder emails

For detailed setup instructions, see [AWS_FOLLOWUP_SETUP_GUIDE.md](AWS_FOLLOWUP_SETUP_GUIDE.md)

### Manual Trigger

```bash
curl -X POST http://your-app/api/cron/followup \
  -H "X-Cron-Secret: your-cron-secret-token"
```

---

## 📊 Database Schema

### `admin_users` Table

```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `inquiries` Table

```sql
CREATE TABLE inquiries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  intent VARCHAR(255),
  sentiment VARCHAR(50),          -- POSITIVE, NEUTRAL, NEGATIVE
  urgency VARCHAR(50),            -- LOW, MEDIUM, HIGH
  priority VARCHAR(50),           -- LOW, MEDIUM, HIGH
  status VARCHAR(50) DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, CLOSED
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_status ON inquiries(status);
CREATE INDEX idx_priority ON inquiries(priority);
CREATE INDEX idx_created_at ON inquiries(created_at);
```

---

## 🔒 Security Features

- **Password Hashing**: Admin passwords hashed with bcryptjs (10 salt rounds)
- **Session Management**: Express-session with secure cookies
- **CORS Protection**: Configured for same-origin requests with credentials
- **Environment Variables**: Secrets stored in `.env` (not in code)
- **SQL Injection Prevention**: Parameterized queries in PostgreSQL
- **CRON Security**: Secret token required for automated tasks

---

## 📝 Admin Dashboard Features

### Statistics Dashboard

- Total inquiries count
- Open inquiries
- In Progress inquiries
- Closed inquiries
- High/Medium/Low priority breakdown

### Filtering & Search

- **Priority Filter**: High, Medium, Low
- **Status Filter**: Open, In Progress, Closed
- **Search by ID**: Find specific inquiry by ID
- **Date Sorting**: Newest first or oldest first

### Actions

- **Status Dropdown**: Change inquiry status with single click
- **Inquiries Table**: View all inquiry details with priority badges

### Admin Features

- Change password
- Logout
- Session persistence

---

## 🐛 Troubleshooting

### Container fails to start

```bash
# Check logs
docker logs cimsaws-app

# Common issues:
# - Database connection: Verify RDS endpoint and security groups
# - Environment variables: All required vars must be set
# - Port already in use: Change -p 3000:3000 to -p 3001:3000
```

### Database connection errors

```bash
# Verify PostgreSQL is accessible
psql -h your-rds-endpoint -U adminrahman -d cimsaws_Inquiry_DB

# Check RDS security group allows traffic from EC2
# Check EC2 security group allows outbound traffic
```

### Emails not sending

- Verify SMTP credentials (Gmail requires App Passwords)
- Check email address is correct
- Verify sender email is authorized in Gmail

### AI analysis failing

- Verify API key is correct
- Check Google Generative AI is enabled in Cloud Console
- Review AI service logs for error details

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Docker Documentation](https://docs.docker.com)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2)
- [Google Generative AI Documentation](https://ai.google.dev)

---

## 📄 License

MIT License - feel free to use this project for your own purposes.

---

## 👤 Author

**Rahman Husain**  
Project: Customer Inquiry Management System (CIMS)  
Last Updated: January 2026

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Update all environment variables in `.env`
- [ ] Test locally with `npm start`
- [ ] Run database migrations / create tables
- [ ] Build Docker image: `docker build -t cimsaw-app .`
- [ ] Test Docker image locally
- [ ] Push to Docker Hub: `docker push rahmanhusain/cimsaw_docker_image:latest`
- [ ] Launch EC2 instance with proper security groups
- [ ] SSH into EC2 and install Docker
- [ ] Pull and run Docker image on EC2
- [ ] Verify RDS security group allows EC2 connection
- [ ] Test health endpoint: `curl http://your-ec2-ip/health`
- [ ] Test customer form and admin dashboard
- [ ] Set up AWS Lambda + EventBridge for follow-ups
- [ ] Configure SSL/TLS certificate (optional but recommended)
- [ ] Set up monitoring and logging

---

**Questions or issues?** Check [EC2_DEPLOYMENT_GUIDE.md](EC2_DEPLOYMENT_GUIDE.md) or [AWS_FOLLOWUP_SETUP_GUIDE.md](AWS_FOLLOWUP_SETUP_GUIDE.md).
