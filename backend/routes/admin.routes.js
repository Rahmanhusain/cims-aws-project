import express from "express";
import * as db from "../db/postgresql.js";
import {
  authenticateAdmin,
  changeAdminPassword,
  getDashboardStats,
} from "../services/auth.service.js";

const router = express.Router();

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
}

// Login endpoint
router.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await authenticateAdmin(username, password);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.adminId = user.id;
    req.session.username = user.username;

    return res.json({
      success: true,
      username: user.username,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

// Logout endpoint
router.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true });
  });
});

// Check session endpoint
router.get("/api/admin/check-session", (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({
      authenticated: true,
      username: req.session.username,
    });
  }
  return res.json({ authenticated: false });
});

// Change password endpoint
router.post("/api/admin/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    const result = await changeAdminPassword(
      req.session.username,
      currentPassword,
      newPassword,
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.json({ success: true, message: result.message });
  } catch (error) {
    console.error("Password change error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
});

// Dashboard statistics endpoint
router.get("/api/admin/stats", requireAuth, async (req, res) => {
  try {
    const stats = await getDashboardStats();
    return res.json(stats);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get all inquiries with filters
router.get("/api/admin/inquiries", requireAuth, async (req, res) => {
  try {
    const { priority, status, searchId, sort } = req.query;

    let query =
      "SELECT id, name, email, message, intent, sentiment, urgency, priority, status, created_at FROM inquiries WHERE 1=1";
    const params = [];
    let paramCount = 1;

    // Filter by inquiry ID
    if (searchId) {
      query += ` AND id = $${paramCount}`;
      params.push(searchId);
      paramCount++;
    }

    // Filter by priority
    if (priority && priority !== "all") {
      query += ` AND priority = $${paramCount}`;
      params.push(priority.toUpperCase());
      paramCount++;
    }

    // Filter by status
    if (status && status !== "all") {
      const statusValue =
        status === "in_progress" ? "IN_PROGRESS" : status.toUpperCase();
      query += ` AND status = $${paramCount}`;
      params.push(statusValue);
      paramCount++;
    }

    const sortDirection = String(sort).toLowerCase() === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY created_at ${sortDirection}`;

    const rows = await db.query(query, params);
    return res.json(rows);
  } catch (error) {
    console.error("Failed to fetch inquiries", error);
    return res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// Update inquiry status
router.patch(
  "/api/admin/inquiries/:id/status",
  requireAuth,
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["OPEN", "IN_PROGRESS", "CLOSED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      const result = await db.query(
        "UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING id",
        [status.toUpperCase(), id],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      return res.json({ id: Number(id), status: status.toUpperCase() });
    } catch (error) {
      console.error("Failed to update inquiry", error);
      return res.status(500).json({ error: "Failed to update inquiry" });
    }
  },
);

// Legacy close endpoint (backwards compatibility)
router.patch(
  "/api/admin/inquiries/:id/close",
  requireAuth,
  async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(
        "UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING id",
        ["CLOSED", id],
      );

      if (result.length === 0) {
        return res.status(404).json({ error: "Inquiry not found" });
      }

      return res.json({ id: Number(id), status: "CLOSED" });
    } catch (error) {
      console.error("Failed to update inquiry", error);
      return res.status(500).json({ error: "Failed to update inquiry" });
    }
  },
);

export default router;
