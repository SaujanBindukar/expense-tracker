//categories (read-only for now)
const express = require("express");
const pool = require("../database");

const router = express.Router();

// GET /categories — the 8 seeded at signup, for the expense form's dropdown
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT category_id, name FROM categories WHERE user_id = ? ORDER BY name",
      [req.userId]
    );

    res.json({
      categories: rows.map((row) => ({
        categoryId: row.category_id,
        name: row.name,
      })),
    });
  } catch (error) {
    console.error("List categories failed:", error.message);
    res.status(500).json({ error: "Could not load categories" });
  }
});

module.exports = router;
