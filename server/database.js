//setup a mysql database connection
const mysql = require("mysql2");

const pool = mysql
  .createPool({
    user: process.env.MYSQL_USER || "root",
    host: process.env.MYSQL_HOST || "localhost",
    database: process.env.MYSQL_DATABASE || "expense-tracker",
    password: process.env.MYSQL_PASSWORD || "",
    port: Number(process.env.MYSQL_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: false,
  })
  .promise();

module.exports = pool;
