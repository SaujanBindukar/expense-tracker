//signup and login routes
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./database");

const router = express.Router();

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
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING user_id, name, email`,
      [name, email.toLowerCase(), hashed]
    );

    const user = result.rows[0];
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === "23505") {
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
    const result = await pool.query(
      "SELECT user_id, name, email, password FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    const user = result.rows[0];

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
