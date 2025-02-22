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

    const result = await pool.request().query(
      `SELECT
er.hospital,
er.ID,
ISNULL(pc.recent_patient_count, 0) AS recent_patient_count
FROM
emergency_room er
LEFT JOIN (
SELECT
hospital_id,
COUNT(*) AS recent_patient_count
FROM
patient
WHERE
call_time >= DATEADD(hour, -1, GETDATE()) -- adjust for server time difference
GROUP BY
hospital_id
) pc
ON er.ID = pc.hospital_id
WHERE er.ID IN (${id1}, ${id2}, ${id3})  -- Query for specific hospital ids 
ORDER BY 
CASE er.ID
    WHEN ${id1} THEN 1
    WHEN ${id2} THEN 2
    WHEN ${id3} THEN 3
END;
`
    );
    res.status(200).json(result.recordset);
  } catch (err) {
    res.status(500).json({ status: "error", error: err });
  } finally {
    if (pool.connected) await pool.close();
  }
}
