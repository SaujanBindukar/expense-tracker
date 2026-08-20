//express framework
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./database");
const requireAuth = require("./middleware/auth");
const authRouter = require("./routes/auth");
const expensesRouter = require("./routes/expenses");
const categoriesRouter = require("./routes/categories");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRouter);
app.use("/api/expenses", requireAuth, expensesRouter);
app.use("/api/categories", requireAuth, categoriesRouter);

app.get("/db-test", async (_req, res) => {
  try {
    // current_time is a reserved word in MySQL, so the alias needs backticks
    const [rows] = await pool.query("SELECT NOW() AS `current_time`");
    res.json({
      connected: true,
      currentTime: rows[0].current_time,
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
