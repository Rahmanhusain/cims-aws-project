import bcrypt from "bcryptjs";
import * as db from "../db/postgresql.js";

/**
 * Initialize admin table if not exists and create default admin user
 */
export async function initializeAdminTable() {
  try {
    // Create admin_users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if default admin exists
    const existingAdmin = await db.query(
      "SELECT id FROM admin_users WHERE username = $1",
      ["admin"],
    );

    // Create default admin if doesn't exist (username: admin, password: admin123)
    if (existingAdmin.length === 0) {
      const defaultPassword = "admin123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await db.query(
        "INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)",
        ["admin", hashedPassword],
      );
      console.log(
        "Default admin user created (username: admin, password: admin123)",
      );
    }

    console.log("Admin authentication system initialized");
  } catch (error) {
    console.error("Failed to initialize admin table:", error);
    throw error;
  }
}

/**
 * Authenticate admin user
 */
export async function authenticateAdmin(username, password) {
  try {
    const users = await db.query(
      "SELECT id, username, password_hash FROM admin_users WHERE username = $1",
      [username],
    );

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
}

/**
 * Change admin password
 */
export async function changeAdminPassword(username, oldPassword, newPassword) {
  try {
    // First authenticate with old password
    const user = await authenticateAdmin(username, oldPassword);
    if (!user) {
      return { success: false, message: "Invalid current password" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      "UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE username = $2",
      [hashedPassword, username],
    );

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Password change error:", error);
    throw error;
  }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    const stats = {};

    // Total inquiries
    const totalResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries",
    );
    stats.total = parseInt(totalResult[0].count);

    // Open inquiries
    const openResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE status = $1",
      ["OPEN"],
    );
    stats.open = parseInt(openResult[0].count);

    // Closed inquiries
    const closedResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE status = $1",
      ["CLOSED"],
    );
    stats.closed = parseInt(closedResult[0].count);

    // Priority breakdown
    const highPriorityResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE priority = $1",
      ["HIGH"],
    );
    stats.highPriority = parseInt(highPriorityResult[0].count);

    const mediumPriorityResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE priority = $1",
      ["MEDIUM"],
    );
    stats.mediumPriority = parseInt(mediumPriorityResult[0].count);

    const lowPriorityResult = await db.query(
      "SELECT COUNT(*) as count FROM inquiries WHERE priority = $1",
      ["LOW"],
    );
    stats.lowPriority = parseInt(lowPriorityResult[0].count);

    return stats;
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    throw error;
  }
}
