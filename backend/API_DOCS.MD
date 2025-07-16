# Web Crawler API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

The API supports two authentication methods:

### 1. JWT Token Authentication
- Include in header: `Authorization: Bearer <token>`
- Get token from `/api/auth/login` endpoint

### 2. API Key Authentication
- Include in header: `X-API-Key: <api_key>`
- Get API key from registration or login response

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "api_key": "generated-api-key-here"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "api_key": "user-api-key-here"
}
```

## Crawl Job Endpoints

### Add URL for Crawling
```http
POST /api/urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "url": "https://example.com",
  "status": "queued",
  "created_at": "2024-01-01T12:00:00Z"
}
```

### Get Crawl Jobs (with pagination, sorting, filtering)
```http
GET /api/urls?page=1&limit=10&sort_by=created_at&sort_order=desc&search=example&status=completed
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 10, max: 100)
- `sort_by` (string): Sort field (default: created_at)
- `sort_order` (string): asc or desc (default: desc)
- `search` (string): Search in URL or page title
- `status` (string): Filter by status (queued, running, completed, error, stopped)

**Response:**
```json
{
  "jobs": [
    {
      "id": 1,
      "user_id": 1,
      "url": "https://example.com",
      "status": "completed",
      "html_version": "HTML5",
      "page_title": "Example Domain",
      "h1_count": 1,
      "h2_count": 0,
      "h3_count": 0,
      "h4_count": 0,
      "h5_count": 0,
      "h6_count": 0,
      "internal_links": 0,
      "external_links": 1,
      "broken_links": 0,
      "has_login_form": false,
      "started_at": "2024-01-01T12:00:00Z",
      "completed_at": "2024-01-01T12:00:05Z",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get Crawl Job Details
```http
GET /api/urls/{id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "job": {
    "id": 1,
    "user_id": 1,
    "url": "https://example.com",
    "status": "completed",
    "html_version": "HTML5",
    "page_title": "Example Domain",
    "h1_count": 1,
    "h2_count": 0,
    "internal_links": 0,
    "external_links": 1,
    "broken_links": 0,
    "has_login_form": false,
    "started_at": "2024-01-01T12:00:00Z",
    "completed_at": "2024-01-01T12:00:05Z"
  },
  "broken_links": [
    {
      "id": 1,
      "crawl_job_id": 1,
      "url": "https://broken-link.com",
      "status_code": 404,
      "created_at": "2024-01-01T12:00:05Z"
    }
  ]
}
```

### Start Crawl Job
```http
POST /api/urls/{id}/start
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Crawl started"
}
```

### Stop Crawl Job
```http
POST /api/urls/{id}/stop
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Crawl stopped"
}
```

### Delete Crawl Jobs (Bulk)
```http
DELETE /api/urls
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "message": "Jobs deleted successfully",
  "deleted": 3
}
```

### Re-run Crawl Jobs (Bulk)
```http
POST /api/urls/rerun
Authorization: Bearer <token>
Content-Type: application/json

{
  "ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "message": "Jobs queued for re-run",
  "count": 3
}
```

## Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Data Models

### CrawlJob
```json
{
  "id": 1,
  "user_id": 1,
  "url": "https://example.com",
  "status": "completed",
  "html_version": "HTML5",
  "page_title": "Example Domain",
  "h1_count": 1,
  "h2_count": 0,
  "h3_count": 0,
  "h4_count": 0,
  "h5_count": 0,
  "h6_count": 0,
  "internal_links": 0,
  "external_links": 1,
  "broken_links": 0,
  "has_login_form": false,
  "error_message": "",
  "started_at": "2024-01-01T12:00:00Z",
  "completed_at": "2024-01-01T12:00:05Z",
  "created_at": "2024-01-01T12:00:00Z"
}
```

### BrokenLink
```json
{
  "id": 1,
  "crawl_job_id": 1,
  "url": "https://broken-link.com",
  "status_code": 404,
  "created_at": "2024-01-01T12:00:05Z"
}
```

## Job Status Values
- `queued` - Job is waiting to be processed
- `running` - Job is currently being processed
- `completed` - Job completed successfully
- `error` - Job failed with an error
- `stopped` - Job was manually stopped

## Rate Limiting
- The API implements a 30-second timeout for web crawling requests
- Broken link checks have a 10-second timeout
- No explicit rate limiting is implemented, but consider implementing it for production use

## Example Usage with curl

### Register and get API key
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'
```

### Add URL for crawling
```bash
curl -X POST http://localhost:8080/api/urls \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{"url": "https://example.com"}'
```

### Start crawling
```bash
curl -X POST http://localhost:8080/api/urls/1/start \
  -H "X-API-Key: your-api-key-here"
```

### Get results
```bash
curl -X GET http://localhost:8080/api/urls/1 \
  -H "X-API-Key: your-api-key-here"
```