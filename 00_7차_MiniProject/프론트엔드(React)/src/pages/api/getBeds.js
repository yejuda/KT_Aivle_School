import { ConnectionPool } from "mssql";

export default async function handler(req, res) {
  const pool = new ConnectionPool({
    user: "root9",
    password: "password9!",
    server: "dbserver-aivle9.database.windows.net",
    database: "db9",
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  });

  try {
    await pool.connect();
    const id1 = req.body.id1 || 35; // 안오면9999
    const id2 = req.body.id2 || 35; // 안오면9999
    const id3 = req.body.id3 || 35; // 안오면9999

    const result = await pool
      .request()
      .query(
        `SELECT capacity FROM emergency_room WHERE ID IN (${id1}, ${id2}, ${id3})`
      );
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ status: "error", error: err });
  } finally {
    if (pool.connected) await pool.close();
  }
}
