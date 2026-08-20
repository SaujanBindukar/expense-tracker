//signup and login routes
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../database");

const router = express.Router();

const DEFAULT_CATEGORIES = [
  "Food", "Transport", "Bills", "Shopping",
  "Health", "Entertainment", "Education", "Other",
];

function createToken(user) {
  return jwt.sign({ sub: user.user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    // The account and its categories go in together, or not at all.
    const connection = await pool.getConnection();
    let userId;
    try {
      await connection.beginTransaction();

      // MySQL has no RETURNING; the new id comes back as insertId.
      const [result] = await connection.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email.toLowerCase(), hashed]
      );
      userId = result.insertId;

      await connection.query("INSERT INTO categories (user_id, name) VALUES ?", [
        DEFAULT_CATEGORIES.map((category) => [userId, category]),
      ]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const user = { user_id: userId, name, email: email.toLowerCase() };
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "That email is already registered" });
    }
    console.error("Signup failed:", error.message);
    res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, email, password FROM users WHERE email = ?",
      [email.toLowerCase()]
    );
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    delete user.password;
    res.json({ user, token: createToken(user) });
  } catch (error) {
    console.error("Login failed:", error.message);
    res.status(500).json({ error: "Could not log in" });
  }
});

module.exports = router;
