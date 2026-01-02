-- Data Gatherer Database and Table Setup
-- Run this script in MySQL to create the database and submissions table

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS data_gatherer;

-- Switch to the database
USE data_gatherer;

-- Create submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    birthday DATE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(30),
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table structure
DESCRIBE submissions;

-- View existing submissions (initially empty)
SELECT * FROM submissions;
