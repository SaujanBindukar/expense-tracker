//express framework
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./database");
const requireAuth = require("./middleware/auth");
const authRouter = require("./routes/auth");
const dashboardRouter = require("./routes/dashboard");
const expensesRouter = require("./routes/expenses");
const categoriesRouter = require("./routes/categories");

const app = express();

app.use(express.json());
app.use(cors());

function currentMonthISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function normalizeMonth(value) {
  return /^\d{4}-\d{2}$/.test(value) ? value : currentMonthISO();
}

function toMonthStart(month) {
  return `${month}-01`;
}

function daysInMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function buildDashboardPayload({
  totalsRow,
  categories,
  daily,
  budgetAmount,
  month,
}) {
  const spent = Number(totalsRow?.totalSpent || 0);
  const expenseCount = Number(totalsRow?.expenseCount || 0);
  const remaining =
    budgetAmount == null ? null : Number((budgetAmount - spent).toFixed(2));
  const usagePercent =
    budgetAmount && budgetAmount > 0
      ? Number(Math.min(100, (spent / budgetAmount) * 100).toFixed(1))
      : null;

  let alertLevel = "none";
  if (budgetAmount != null) {
    if (spent >= budgetAmount) alertLevel = "danger";
    else if (spent >= budgetAmount * 0.9) alertLevel = "warning";
    else if (spent >= budgetAmount * 0.75) alertLevel = "notice";
    else alertLevel = "ok";
  }

  const activeDays = daily.filter((day) => day.amount > 0).length;
  const averagePerActiveDay =
    activeDays > 0 ? Number((spent / activeDays).toFixed(2)) : 0;
  const topCategory =
    categories.find((category) => category.amount > 0) || null;

  return {
    month,
    budget: budgetAmount == null ? null : { amount: Number(budgetAmount) },
    summary: {
      spent,
      expenseCount,
      remaining,
      usagePercent,
      alertLevel,
      activeDays,
      averagePerActiveDay,
      topCategory,
    },
    categories,
    daily,
    daysInMonth: daysInMonth(month),
  };
}

app.use("/api/auth", authRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/expenses", requireAuth, expensesRouter);
app.use("/api/categories", requireAuth, categoriesRouter);

app.get("/api/dashboard", requireAuth, async (req, res) => {
  const month = normalizeMonth(req.query.month);
  const monthStart = toMonthStart(month);

  try {
    const [[budgetRow]] = await pool.query(
      "SELECT amount FROM budgets WHERE user_id = ? AND month = ?",
      [req.userId, monthStart],
    );

    const [[totalsRow]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS totalSpent,
              COUNT(*) AS expenseCount
         FROM expenses
        WHERE user_id = ?
          AND spent_on >= ?
          AND spent_on < DATE_ADD(?, INTERVAL 1 MONTH)`,
      [req.userId, monthStart, monthStart],
    );

    const [categoryRows] = await pool.query(
      `SELECT c.category_id,
              c.name AS category,
              COALESCE(SUM(e.amount), 0) AS amount
         FROM categories c
         LEFT JOIN expenses e
           ON e.category_id = c.category_id
          AND e.user_id = ?
          AND e.spent_on >= ?
          AND e.spent_on < DATE_ADD(?, INTERVAL 1 MONTH)
        WHERE c.user_id = ?
        GROUP BY c.category_id, c.name
        ORDER BY amount DESC, c.name ASC`,
      [req.userId, monthStart, monthStart, req.userId],
    );

    const [dailyRows] = await pool.query(
      `SELECT DAY(spent_on) AS day,
              COALESCE(SUM(amount), 0) AS amount
         FROM expenses
        WHERE user_id = ?
          AND spent_on >= ?
          AND spent_on < DATE_ADD(?, INTERVAL 1 MONTH)
        GROUP BY DAY(spent_on)
        ORDER BY day`,
      [req.userId, monthStart, monthStart],
    );

    const categories = categoryRows.map((row) => ({
      categoryId: row.category_id,
      category: row.category,
      amount: Number(row.amount),
    }));

    const daily = Array.from({ length: daysInMonth(month) }, (_, index) => {
      const day = index + 1;
      const match = dailyRows.find((row) => Number(row.day) === day);
      return { day, amount: Number(match?.amount || 0) };
    });

    res.json(
      buildDashboardPayload({
        totalsRow,
        categories,
        daily,
        budgetAmount: budgetRow ? Number(budgetRow.amount) : null,
        month,
      }),
    );
  } catch (error) {
    console.error("Load dashboard failed:", error.message);
    res.status(500).json({ error: "Could not load dashboard data" });
  }
});

app.put("/api/dashboard/budget", requireAuth, async (req, res) => {
  const month = normalizeMonth(req.body?.month);
  const amount = Number(req.body?.amount);

  if (!(amount > 0)) {
    return res
      .status(400)
      .json({ error: "Enter a budget amount greater than zero" });
  }

  try {
    await pool.query(
      `INSERT INTO budgets (user_id, month, amount)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE amount = VALUES(amount)`,
      [req.userId, toMonthStart(month), amount],
    );

    const [[budgetRow]] = await pool.query(
      "SELECT amount FROM budgets WHERE user_id = ? AND month = ?",
      [req.userId, toMonthStart(month)],
    );

    res.json({
      month,
      budget: budgetRow ? { amount: Number(budgetRow.amount) } : null,
    });
  } catch (error) {
    console.error("Save budget failed:", error.message);
    res.status(500).json({ error: "Could not save budget" });
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
