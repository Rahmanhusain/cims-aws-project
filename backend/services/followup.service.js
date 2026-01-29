import * as db from "../db/postgresql.js";
import * as emailService from "./email.service.js";

async function runDailyFollowUp() {
  try {
    const pending = await db.query(
      'SELECT id, name, email, message, intent, sentiment, urgency, priority, status, created_at FROM inquiries WHERE status = "OPEN" AND created_at < DATE_SUB(NOW(), INTERVAL 48 HOUR)',
    );

    for (const inquiry of pending) {
      await emailService.sendFollowUpReminder(inquiry);
      console.log(`Sent follow-up reminder for inquiry ${inquiry.id}`);
    }

    console.log(`Follow-up processing complete. Count: ${pending.length}`);
    return pending.length;
  } catch (error) {
    console.error("Follow-up service error", error);
    return 0;
  }
}

export { runDailyFollowUp };
