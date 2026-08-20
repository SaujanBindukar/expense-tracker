
CREATE DATABASE IF NOT EXISTS `expense-tracker`;
USE `expense-tracker`;

-- Drop in dependency order (children first).
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id    INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Each user gets their own copy of the 8 defaults when they sign up.
CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  name        VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  UNIQUE (user_id, name)
);

CREATE TABLE expenses (
  expense_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  category_id INT NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  spent_on    DATE NOT NULL,
  note        VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories (category_id)
);

-- One overall spending limit per user per month. month is always the 1st.
CREATE TABLE budgets (
  budget_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  month     DATE NOT NULL,
  amount    DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  UNIQUE (user_id, month)
);
