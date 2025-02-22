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
    const id1 = req.body.id1 || 9999; // 안오면9999
    const id2 = req.body.id2 || 9999; // 안오면9999
    const id3 = req.body.id3 || 9999; // 안오면9999
    //a
    await pool
      .request()
      .query(
        `INSERT INTO patient (hospital_id) Values (${id1}) (${id2}) (${id3})`
      );
    res
      .status(200)
      .json({ status: "success", message: "Data inserted successfully" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err });
  } finally {
    if (pool.connected) await pool.close();
  }
}
