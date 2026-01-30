import express from "express";
import * as followupService from "../services/followup.service.js";

const router = express.Router();

// Middleware to verify cron job requests
function verifyCronToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  const cronToken = process.env.CRON_SECRET_TOKEN;

  if (!cronToken) {
    console.error("CRON_SECRET_TOKEN not configured in environment");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  if (!token || token !== cronToken) {
    console.warn("Unauthorized cron request attempt");
    return res.status(403).json({ error: "Forbidden - Invalid token" });
  }

  next();
}

// POST /api/cron/followup - Trigger follow-up reminders
router.post("/followup", verifyCronToken, async (req, res) => {
  try {
    console.log("Follow-up cron job triggered at:", new Date().toISOString());
    const count = await followupService.runDailyFollowUp();

    res.json({
      success: true,
      message: "Follow-up reminders processed",
      count: count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/cron/health - Health check for cron endpoint.
router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "cron-jobs",
    timestamp: new Date().toISOString(),
  });
});

export default router;
