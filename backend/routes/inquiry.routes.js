import express from "express";
import * as db from "../db/postgresql.js";
import * as aiService from "../services/ai.service.js";
import * as emailService from "../services/email.service.js";

const router = express.Router();

function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

function derivePriority({ urgency, sentiment }) {
  if (urgency === "HIGH" || sentiment === "NEGATIVE") return "HIGH";
  if (urgency === "MEDIUM") return "MEDIUM";
  return "LOW";
}

router.post("/api/inquiry", async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "name, email, and message are required" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }
//getting user inquiry and analyzing it with ai service
  try {
    const analysis = await aiService.analyzeMessage(message);
    const priority = derivePriority({
      urgency: analysis.urgency,
      sentiment: analysis.sentiment,
    });

    const sql = `
      INSERT INTO inquiries (name, email, message, intent, sentiment, urgency, priority, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN', NOW())
      RETURNING id
    `;

    const params = [
      name,
      email,
      message,
      analysis.intent,
      analysis.sentiment,
      analysis.urgency,
      priority,
    ];

    const result = await db.query(sql, params);
    const insertedId = result[0].id;

    await emailService.sendCustomerAcknowledgement(email, name);

    if (priority === "HIGH") {
      await emailService.sendAdminAlert({
        id: insertedId,
        name,
        email,
        message,
        intent: analysis.intent,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
        priority,
      });
    }

    return res.status(201).json({
      id: insertedId,
      intent: analysis.intent,
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      priority,
      status: "OPEN",
    });
  } catch (error) {
    console.error("Failed to handle inquiry", error);
    return res.status(500).json({ error: "Failed to process inquiry" });
  }
});

export default router;
