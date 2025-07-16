# Web Crawler Backend

A Go-based web crawler API that analyzes websites and extracts key information including HTML version, heading counts, link analysis, and login form detection.

## Features

- **URL Management**: Add URLs for analysis with start/stop controls
- **Web Crawling**: Extracts HTML version, page title, heading counts, link analysis
- **Authentication**: JWT tokens and API key authentication
- **Real-time Status**: Track crawl progress (queued → running → completed/error)
- **Broken Link Detection**: Identifies and reports 4xx/5xx status links
- **Login Form Detection**: Detects presence of login forms
- **Bulk Operations**: Re-run or delete multiple crawl jobs
- **Pagination & Filtering**: Sortable, searchable results with pagination

## Tech Stack

- **Language**: Go 1.21
- **Framework**: Gin (HTTP web framework)
- **Database**: MySQL 8.0
- **ORM**: GORM
- **Authentication**: JWT tokens + API keys
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Go 1.21+
- MySQL 8.0+
- Docker & Docker Compose (optional)

### Option 1: Docker Setup (Recommended)

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start services:
   ```bash
   make docker-up
   ```
4. The API will be available at `http://localhost:8080`

### Option 2: Local Development

1. **Install Dependencies**
   ```bash
   go mod tidy
   ```

2. **Setup Database**
   ```bash
   # Create MySQL database
   mysql -u root -p -e "CREATE DATABASE webcrawler;"
   
   # Run initialization script
   mysql -u root -p webcrawler < init.sql
   ```

3. **Configure Environment**
   ```bash
   # Copy and edit .env file
   cp .env.example .env
   ```

4. **Run the Application**
   ```bash
   make run
   # or
   go run main.go
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=webcrawler

# Server Configuration
PORT=8080

# JWT Secret (change this in production!)
JWT_SECRET=a429e0d0d6574d4d47340de00918792c
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Crawl Jobs
- `POST /api/urls` - Add URL for crawling
- `GET /api/urls` - Get crawl jobs (with pagination/filtering)
- `GET /api/urls/{id}` - Get crawl job details
- `POST /api/urls/{id}/start` - Start crawl job
- `POST /api/urls/{id}/stop` - Stop crawl job
- `DELETE /api/urls` - Delete crawl jobs (bulk)
- `POST /api/urls/rerun` - Re-run crawl jobs (bulk)

### Health Check
- `GET /health` - Health check endpoint

## Authentication

The API supports two authentication methods:

1. **JWT Token**: Include `Authorization: Bearer <token>` header
2. **API Key**: Include `X-API-Key: <api_key>` header

Get tokens/keys from the login/register endpoints.

## Database Schema

### Users
- `id` - Primary key
- `username` - Unique username
- `password` - User password (hash in production!)
- `api_key` - Generated API key
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### Crawl Jobs
- `id` - Primary key
- `user_id` - Foreign key to users
- `url` - URL to crawl
- `status` - Job status (queued, running, completed, error, stopped)
- `html_version` - Detected HTML version
- `page_title` - Page title
- `h1_count` to `h6_count` - Heading tag counts
- `internal_links`, `external_links` - Link counts
- `broken_links` - Number of broken links
- `has_login_form` - Boolean for login form presence
- `error_message` - Error details if job fails
- `started_at`, `completed_at` - Job timing
- `created_at`, `updated_at`, `deleted_at` - Timestamps

### Broken Links
- `id` - Primary key
- `crawl_job_id` - Foreign key to crawl jobs
- `url` - Broken link URL
- `status_code` - HTTP status code
- `created_at`, `updated_at`, `deleted_at` - Timestamps

## Development Commands

```bash
# Build application
make build

# Run application
make run

# Run with Docker
make docker-up

# View logs
make logs

# Stop Docker services
make docker-down

# Run tests
make test

# Format code
make fmt

# Clean build artifacts
make clean
```

## Production Deployment

1. **Security Considerations**:
   - Change JWT secret in production
   - Implement password hashing (bcrypt)
   - Use HTTPS
   - Add rate limiting
   - Implement proper CORS settings

2. **Performance Optimizations**:
   - Add database indexes
   - Implement connection pooling
   - Add caching layer (Redis)
   - Use CDN for static assets

3. **Monitoring**:
   - Add structured logging
   - Implement health checks
   - Add metrics collection
   - Set up alerting

## Testing

Run tests with:
```bash
make test
```



### Key Components

1. **HTTP Server**: Gin framework handling REST API endpoints
2. **Authentication**: JWT tokens and API key validation
3. **Web Crawler**: HTML parsing and link analysis
4. **Database**: MySQL with GORM ORM
5. **Background Jobs**: Goroutines for async crawling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify credentials in .env
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in .env
   - Check for running processes: `lsof -i :8080`

3. **Dependencies Issues**
   - Run `go mod tidy`
   - Check Go version (requires 1.21+)

4. **Docker Issues**
   - Ensure Docker is running
   - Check Docker Compose version
   - Try `docker-compose down && docker-compose up --build`

### Logs

Check application logs:
```bash
# Docker
make logs

# Local
# Logs output to stdout
```

