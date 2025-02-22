import path from "path";
import fs from "fs";
import betterSqlite3 from "better-sqlite3";

// Function to open the database
export function openDb() {
  // Specify the database file path relative to your project root
  const dbPath = path.join(process.cwd(), "em.db");
  // Set up the tmp path (this is where Vercel allows writing files)
  // const tmpDbPath = "/tmp";
  // // If the database doesn't exist in the tmp directory, copy it there
  // if (!fs.existsSync(tmpDbPath)) {
  //   fs.copyFileSync(dbPath, tmpDbPath);
  // }
  // Open the SQLite database from the tmp directory
  const db = betterSqlite3(dbPath);
  return db;
}

// Example handler function
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "GET") {
    try {
      const db = openDb();
      const rows = db.prepare("SELECT * FROM em").all(); // Ensure 'em' table exists
      res.status(200).json(rows);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Failed to fetch data", details: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
