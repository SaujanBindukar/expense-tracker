//express framework
const express = require("express");
const cors = require("cors");
const pool = require("./database");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/db-test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      connected: true,
      currentTime: result.rows[0].current_time,
    });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message,
    });
  }
});

pool
  .query("SELECT 1")
  .then(() => {
    console.log("Database connection established");
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
