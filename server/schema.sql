-- phpMyAdmin SQL Dump (corrected)
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Server version: 8.0.45
--

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `expense-tracker`
--

CREATE DATABASE IF NOT EXISTS `expense-tracker`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `expense-tracker`;

--
-- Drop existing tables (child tables first, so foreign keys don't block)
--

DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `budgets`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

START TRANSACTION;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `created_at`) VALUES
(1, 'Saujan Bindukar', 'saujan@gmail.com', '$2b$10$4p69ITGQiGmVM5OaSz3unOFgPbeVINImAbuoz6e/h4LDtiYuks.nS', '2026-08-20 00:14:36'),
(2, 'Test User', 'testuser@example.com', '$2b$10$pTh.PgWDxC9LWXKXnnimXObk36Mr848wdgpb5pI.86PPdIjypCRxi', '2026-08-20 14:08:18');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `user_id` (`user_id`,`name`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`category_id`, `user_id`, `name`) VALUES
(3, 1, 'Bills'),
(7, 1, 'Education'),
(6, 1, 'Entertainment'),
(1, 1, 'Food'),
(5, 1, 'Health'),
(8, 1, 'Other'),
(4, 1, 'Shopping'),
(2, 1, 'Transport'),
(11, 2, 'Bills'),
(15, 2, 'Education'),
(14, 2, 'Entertainment'),
(9, 2, 'Food'),
(13, 2, 'Health'),
(16, 2, 'Other'),
(12, 2, 'Shopping'),
(10, 2, 'Transport');

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `budget_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `month` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`budget_id`),
  UNIQUE KEY `user_id` (`user_id`,`month`),
  CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`budget_id`, `user_id`, `month`, `amount`) VALUES
(1, 1, '2026-08-01', 1000.00);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `spent_on` date NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`expense_id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `user_id`, `category_id`, `amount`, `spent_on`, `note`, `created_at`) VALUES
(4, 1, 1, 111.00, '2026-07-01', '11', '2026-08-20 00:15:44'),
(11, 1, 1, 20.00, '2026-08-21', 'Lunch', '2026-08-20 14:35:44'),
(12, 1, 1, 4.50, '2026-08-17', 'Coffee', '2026-08-20 14:35:56'),
(14, 1, 1, 50.00, '2026-08-21', 'Grocery', '2026-08-20 14:37:14'),
(16, 1, 4, 100.00, '2026-08-21', 'Tshirt and Pants', '2026-08-20 14:37:51'),
(17, 1, 6, 100.00, '2026-08-24', '111', '2026-08-20 15:10:33'),
(18, 1, 6, 100.00, '2026-08-15', 'Movie', '2026-08-20 15:18:24'),
(19, 1, 6, 10.00, '2026-08-18', 'Lunch', '2026-08-20 15:20:26');

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;