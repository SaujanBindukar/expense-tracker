//setup a postgres database connection
const pg = require("pg");

const pool = new pg.Pool({
  user: process.env.PGUSER || "saujanbindukar",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "expense-tracker",
  password: process.env.PGPASSWORD || "",
  port: Number(process.env.PGPORT || 5432),
});

module.exports = pool;
