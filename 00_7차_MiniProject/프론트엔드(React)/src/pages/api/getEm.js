import { ConnectionPool } from 'mssql';

export default async function handler(req, res) {
  const pool = new ConnectionPool({
    user: 'root9',
    password: 'password9!',
    server: 'dbserver-aivle9.database.windows.net',
    database: 'db9',
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  });

  try {
    await pool.connect();
    const result = await pool.request().query('SELECT * FROM dbo.em');
    res.status(200).json(result.recordset);
  } catch (err) {
     res.status(500).json({ status:"error", error : err });
  } finally {
     if (pool.connected)
       await pool.close();
   }
}