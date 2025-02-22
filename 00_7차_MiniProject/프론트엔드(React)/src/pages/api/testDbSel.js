import { openDb } from "../../../lib/testDb";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "GET") {
    try {
      const db = openDb();
      const rows = db.prepare("SELECT * FROM test").all(); // Ensure 'my_table' exists in your database
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