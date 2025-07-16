-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS webcrawler;

USE webcrawler;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Crawl jobs table
CREATE TABLE IF NOT EXISTS crawl_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url TEXT NOT NULL,
    status ENUM('queued', 'running', 'completed', 'error', 'stopped') DEFAULT 'queued',
    html_version VARCHAR(50) DEFAULT '',
    page_title TEXT DEFAULT '',
    h1_count INT DEFAULT 0,
    h2_count INT DEFAULT 0,
    h3_count INT DEFAULT 0,
    h4_count INT DEFAULT 0,
    h5_count INT DEFAULT 0,
    h6_count INT DEFAULT 0,
    internal_links INT DEFAULT 0,
    external_links INT DEFAULT 0,
    broken_links INT DEFAULT 0,
    has_login_form BOOLEAN DEFAULT FALSE,
    error_message TEXT DEFAULT '',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Broken links table
CREATE TABLE IF NOT EXISTS broken_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    crawl_job_id INT NOT NULL,
    url TEXT NOT NULL,
    status_code INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (crawl_job_id) REFERENCES crawl_jobs(id) ON DELETE CASCADE,
    INDEX idx_crawl_job_id (crawl_job_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_crawl_jobs_user_status ON crawl_jobs(user_id, status);
CREATE INDEX idx_broken_links_job_id ON broken_links(crawl_job_id);

-- Insert sample user for testing (optional)
INSERT INTO users (username, password, api_key) 
VALUES ('testuser', 'testpass', 'test-api-key-12345') 
ON DUPLICATE KEY UPDATE username = username;