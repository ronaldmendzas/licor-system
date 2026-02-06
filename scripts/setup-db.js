const fs = require("fs");
const { Client } = require("pg");

async function ejecutarSQL() {
  const sql = fs.readFileSync("supabase/schema.sql", "utf8");

  const client = new Client({
    connectionString: "postgresql://postgres:Martingarrix123%23@db.ycqvfvhuaapjtuzbjuzp.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Conectado a Supabase PostgreSQL");
    await client.query(sql);
    console.log("Schema ejecutado exitosamente");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

ejecutarSQL();
