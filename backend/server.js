import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express from "express";
import cors from "cors";
import session from "express-session";
import config from "./config/env.js";
import inquiryRoutes from "./routes/inquiry.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import cronRoutes from "./routes/cron.routes.js";
import { initializeAdminTable } from "./services/auth.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: config.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(express.static(join(__dirname, "../public")));

app.use(inquiryRoutes);
app.use(adminRoutes);
app.use("/api/cron", cronRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Initialize admin table and default user.
initializeAdminTable().catch(console.error);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
