//expenses CRUD
const express = require("express");
const pool = require("../database");

const router = express.Router();

const SELECT_EXPENSE = `
  SELECT e.expense_id, e.amount, DATE_FORMAT(e.spent_on, '%Y-%m-%d') AS spent_on,
         e.note, c.category_id, c.name AS category
    FROM expenses e
    JOIN categories c ON c.category_id = e.category_id`;

// amount comes back from mysql2 as a string, and spent_on is already text.
function toExpense(row) {
  return {
    expenseId: row.expense_id,
    amount: Number(row.amount),
    spentOn: row.spent_on,
    note: row.note,
    categoryId: row.category_id,
    category: row.category,
  };
}

// The category has to be one of yours, not just any category in the table.
async function ownsCategory(userId, categoryId) {
  const [rows] = await pool.query(
    "SELECT 1 FROM categories WHERE category_id = ? AND user_id = ?",
    [categoryId, userId]
  );
  return rows.length > 0;
}

async function findExpense(userId, expenseId) {
  const [rows] = await pool.query(
    `${SELECT_EXPENSE} WHERE e.expense_id = ? AND e.user_id = ?`,
    [expenseId, userId]
  );
  return rows[0] ? toExpense(rows[0]) : null;
}

// GET /expenses  ·  GET /expenses?month=2026-08
router.get("/", async (req, res) => {
  const { month } = req.query;

  try {
    const [rows] = await pool.query(
      `${SELECT_EXPENSE}
        WHERE e.user_id = ?
          ${month ? "AND e.spent_on >= ? AND e.spent_on < DATE_ADD(?, INTERVAL 1 MONTH)" : ""}
        ORDER BY e.spent_on DESC, e.expense_id DESC`,
      month ? [req.userId, `${month}-01`, `${month}-01`] : [req.userId]
    );

    const expenses = rows.map(toExpense);
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({ expenses, total });
  } catch (error) {
    console.error("List expenses failed:", error.message);
    res.status(500).json({ error: "Could not load expenses" });
  }
});

// GET /expenses/:expenseId
router.get("/:expenseId", async (req, res) => {
  try {
    const expense = await findExpense(req.userId, req.params.expenseId);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  } catch (error) {
    console.error("Get expense failed:", error.message);
    res.status(500).json({ error: "Could not load expense" });
  }
});

// POST /expenses
router.post("/", async (req, res) => {
  const { amount, spentOn, categoryId, note = null } = req.body || {};

  try {
    if (!(await ownsCategory(req.userId, categoryId))) {
      return res.status(400).json({ error: "That category does not exist" });
    }

    // MySQL has no RETURNING; the new id comes back as insertId.
    const [result] = await pool.query(
      `INSERT INTO expenses (user_id, category_id, amount, spent_on, note)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, categoryId, amount, spentOn, note]
    );

    res.status(201).json(await findExpense(req.userId, result.insertId));
  } catch (error) {
    console.error("Create expense failed:", error.message);
    res.status(500).json({ error: "Could not create expense" });
  }
});

// PUT /expenses/:expenseId — send all four fields
router.put("/:expenseId", async (req, res) => {
  const { amount, spentOn, categoryId, note = null } = req.body || {};

  try {
    if (!(await ownsCategory(req.userId, categoryId))) {
      return res.status(400).json({ error: "That category does not exist" });
    }

    const [result] = await pool.query(
      `UPDATE expenses SET amount = ?, spent_on = ?, category_id = ?, note = ?
        WHERE expense_id = ? AND user_id = ?`,
      [amount, spentOn, categoryId, note, req.params.expenseId, req.userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(await findExpense(req.userId, req.params.expenseId));
  } catch (error) {
    console.error("Update expense failed:", error.message);
    res.status(500).json({ error: "Could not update expense" });
  }
});

// DELETE /expenses/:expenseId
router.delete("/:expenseId", async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM expenses WHERE expense_id = ? AND user_id = ?",
      [req.params.expenseId, req.userId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Delete expense failed:", error.message);
    res.status(500).json({ error: "Could not delete expense" });
  }
});

module.exports = router;
