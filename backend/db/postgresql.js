import pg from "pg";
import { readFileSync } from "fs";
import config from "../config/env.js";

const { Pool } = pg;

const pool = new Pool({
  host: config.DB_HOST,
  port: 5432,
  database: config.DB_NAME,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true,
    ca: readFileSync("certs/global-bundle.pem"),
  },
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000,
  statement_timeout: 30000,
  query_timeout: 30000,
});

// Handle pool errors
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT VERSION()");
    console.log("PostgreSQL version:", result.rows[0].version);
    console.log("PostgreSQL connection pool established");
  } catch (error) {
    console.error("Failed to establish PostgreSQL connection pool", error);
  } finally {
    if (client) client.release();
  }
}

testConnection();

async function query(sql, params = []) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
}

export { query, pool };
