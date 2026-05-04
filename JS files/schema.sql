CREATE DATABASE IF NOT EXISTS fridgetrack;
USE fridgetrack;

CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    category VARCHAR(20) NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1 AND quantity <= 100),
    unit VARCHAR(5) NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    mobile VARCHAR(10) NOT NULL,
    date_of_birth DATE NOT NULL,
    email VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    language VARCHAR(10) NOT NULL,
    inquiry_type VARCHAR(20) DEFAULT 'general',
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
