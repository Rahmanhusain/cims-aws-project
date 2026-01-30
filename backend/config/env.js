import dotenv from "dotenv";

dotenv.config();
// Validate required environment variables
const requiredVars = [
  "PORT",
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "AI_API_KEY",
  "SMTP_USER",
  "SMTP_PASS",
];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(", ")}`,
  );
}

const port = Number(process.env.PORT);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const config = {
  PORT: port,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  AI_API_KEY: process.env.AI_API_KEY,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SESSION_SECRET: process.env.SESSION_SECRET,
  CRON_SECRET_TOKEN: process.env.CRON_SECRET_TOKEN,
};

export default config;
