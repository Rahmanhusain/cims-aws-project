# Customer Inquiry Manager

A lightweight Node.js backend that triages customer inquiries with AI, persists them in MySQL, and notifies customers and admins via email. Includes a minimal customer form and an admin dashboard.

## Architecture

- **API layer**: Express routes for customer submissions and admin actions.
- **AI analysis**: External AI API classifies intent, sentiment, and urgency (default-safe fallbacks).
- **Data layer**: MySQL via mysql2 with pooled connections and prepared statements.
- **Email**: AWS SES for acknowledgements, admin alerts, and follow-up reminders.
- **Frontend**: Static HTML pages served from `/public` for customer form and admin view.
- **Automation**: Follow-up service scans for open inquiries older than 48 hours and emails reminders.

## Tech Stack

- Node.js, Express
- MySQL (mysql2)
- AWS SES (@aws-sdk/client-ses)
- Axios for outbound AI calls
- dotenv for configuration
- Frontend: vanilla HTML/CSS/JS

## AI Usage

Each inquiry message is sent to the configured AI endpoint with a deterministic prompt. The AI must return JSON containing `intent`, `sentiment` (POSITIVE | NEUTRAL | NEGATIVE), and `urgency` (LOW | MEDIUM | HIGH). If the API fails or returns invalid JSON, the service falls back to `intent: General`, `sentiment: NEUTRAL`, `urgency: MEDIUM` to keep processing predictable.

## Setup on EC2 (Ubuntu)

1. Install Node.js 18+ and MySQL client/server.
2. Clone this repo onto the instance.
3. Copy `.env.example` to `.env` and fill in values (see below). Ensure the MySQL user has rights to the target database.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create the `inquiries` table (minimal example):
   ```sql
   CREATE TABLE inquiries (
     id INT AUTO_INCREMENT PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     email VARCHAR(255) NOT NULL,
     message TEXT NOT NULL,
     intent VARCHAR(255) NOT NULL,
     sentiment VARCHAR(20) NOT NULL,
     urgency VARCHAR(20) NOT NULL,
     priority VARCHAR(20) NOT NULL,
     status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
6. Run the service:
   ```bash
   npm run start
   ```
7. (Optional) Use PM2 or a systemd service unit to keep the process alive.

## Environment Variables

See [.env.example](.env.example) for required values:

- `PORT`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `AI_API_URL`, `AI_API_KEY`
- `SES_SENDER_EMAIL`
- (Optional) `AWS_REGION` if not `us-east-1`

## Follow-up Automation

The follow-up service (`backend/services/followup.service.js`) queries for inquiries where `status = OPEN` and `created_at` is older than 48 hours, then sends reminder emails via SES. Wire this to a daily scheduler (e.g., CloudWatch Events or cron) that calls `runDailyFollowUp()`.

## Resume-friendly Summary

- Built a full-stack customer inquiry workflow with AI-driven triage, MySQL persistence, and SES notifications.
- Implemented defensive AI parsing with deterministic fallbacks to guarantee processing reliability.
- Added admin tooling for visibility and lifecycle management, plus automated follow-up reminders to reduce response lag.
