package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/net/html"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// Models
type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	APIKey   string `gorm:"unique;not null" json:"api_key"`
	gorm.Model
}

type CrawlJob struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          uint       `gorm:"not null" json:"user_id"`
	URL             string     `gorm:"not null" json:"url"`
	Status          string     `gorm:"default:'queued'" json:"status"` // queued, running, completed, error, stopped
	HTMLVersion     string     `json:"html_version"`
	PageTitle       string     `json:"page_title"`
	H1Count         int        `json:"h1_count"`
	H2Count         int        `json:"h2_count"`
	H3Count         int        `json:"h3_count"`
	H4Count         int        `json:"h4_count"`
	H5Count         int        `json:"h5_count"`
	H6Count         int        `json:"h6_count"`
	InternalLinks   int        `json:"internal_links"`
	ExternalLinks   int        `json:"external_links"`
	BrokenLinks     int        `json:"broken_links"`
	HasLoginForm    bool       `json:"has_login_form"`
	ErrorMessage    string     `json:"error_message,omitempty"`
	StartedAt       *time.Time `json:"started_at"`
	CompletedAt     *time.Time `json:"completed_at"`
	gorm.Model
}

type BrokenLink struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	CrawlJobID uint   `gorm:"not null" json:"crawl_job_id"`
	URL        string `gorm:"not null" json:"url"`
	StatusCode int    `json:"status_code"`
	gorm.Model
}

// Database connection
var db *gorm.DB

// JWT secret key - should be loaded from environment
var jwtSecret []byte

// Job cancellation channels
var jobCancellations = make(map[uint]chan bool)

// Initialize database
func initDB() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load JWT secret from environment
	secret := getEnv("JWT_SECRET", "your-secret-key-change-in-production")
	jwtSecret = []byte(secret)

	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "webcrawler")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate the schema
	err = db.AutoMigrate(&User{}, &CrawlJob{}, &BrokenLink{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
}

func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:8080")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(204)
            return
        }

        c.Next()
    }
}
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Generate API key
func generateAPIKey() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		log.Fatal("Failed to generate API key:", err)
	}
	return hex.EncodeToString(bytes)
}

// Hash password
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// Check password
func checkPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// JWT Claims
type Claims struct {
	UserID uint   `json:"user_id"`
	APIKey string `json:"api_key"`
	jwt.RegisteredClaims
}

// Auth middleware
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check for API key in header
		apiKey := c.GetHeader("X-API-Key")
		if apiKey != "" {
			var user User
			if err := db.Where("api_key = ?", apiKey).First(&user).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
				c.Abort()
				return
			}
			c.Set("user_id", user.ID)
			c.Next()
			return
		}

		// Check for JWT token
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix if present
		if strings.HasPrefix(tokenString, "Bearer ") {
			tokenString = strings.TrimPrefix(tokenString, "Bearer ")
		}

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(*Claims); ok {
			c.Set("user_id", claims.UserID)
			c.Next()
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
		}
	}
}

// Auth handlers
func register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate password strength
	if len(req.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters long"})
		return
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := User{
		Username: req.Username,
		Password: hashedPassword,
		APIKey:   generateAPIKey(),
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"api_key": user.APIKey,
	})
}

func login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !checkPassword(req.Password, user.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Create JWT token
	claims := &Claims{
		UserID: user.ID,
		APIKey: user.APIKey,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":   tokenString,
		"api_key": user.APIKey,
	})
}

// Crawl job handlers
func addURL(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Add protocol if missing
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	// Validate URL
	if _, err := url.ParseRequestURI(req.URL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid URL format"})
		return
	}

	userID := c.GetUint("user_id")
	job := CrawlJob{
		UserID: userID,
		URL:    req.URL,
		Status: "queued",
	}

	if err := db.Create(&job).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create crawl job"})
		return
	}

	c.JSON(http.StatusCreated, job)
}

func startCrawl(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetUint("user_id")

	var job CrawlJob
	if err := db.Where("id = ? AND user_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	if job.Status != "queued" && job.Status != "error" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Job is not in queued or error state"})
		return
	}

	// Create cancellation channel
	cancelChan := make(chan bool, 1)
	jobCancellations[job.ID] = cancelChan

	// Start crawling in a goroutine
	go crawlURL(&job, cancelChan)

	c.JSON(http.StatusOK, gin.H{"message": "Crawl started"})
}

func stopCrawl(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetUint("user_id")

	var job CrawlJob
	if err := db.Where("id = ? AND user_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	if job.Status != "running" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Job is not running"})
		return
	}

	// Send cancellation signal
	if cancelChan, exists := jobCancellations[job.ID]; exists {
		select {
		case cancelChan <- true:
		default:
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Crawl stop requested"})
}

func getCrawlJobs(c *gin.Context) {
	userID := c.GetUint("user_id")
	
	// Parse query parameters
	page := 1
	limit := 10
	sortBy := "created_at"
	sortOrder := "desc"
	search := ""

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	if s := c.Query("sort_by"); s != "" {
		// Validate sort field
		validSortFields := []string{"created_at", "url", "status", "page_title", "started_at", "completed_at"}
		for _, field := range validSortFields {
			if s == field {
				sortBy = s
				break
			}
		}
	}

	if o := c.Query("sort_order"); o == "asc" || o == "desc" {
		sortOrder = o
	}

	if s := c.Query("search"); s != "" {
		search = s
	}

	query := db.Where("user_id = ?", userID)
	
	// Apply search filter
	if search != "" {
		query = query.Where("url LIKE ? OR page_title LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Apply status filter
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Count total records
	var total int64
	query.Model(&CrawlJob{}).Count(&total)

	// Apply pagination and sorting
	var jobs []CrawlJob
	offset := (page - 1) * limit
	query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder)).
		Limit(limit).
		Offset(offset).
		Find(&jobs)

	c.JSON(http.StatusOK, gin.H{
		"jobs":  jobs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func getCrawlJobDetails(c *gin.Context) {
	jobID := c.Param("id")
	userID := c.GetUint("user_id")

	var job CrawlJob
	if err := db.Where("id = ? AND user_id = ?", jobID, userID).First(&job).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	// Get broken links
	var brokenLinks []BrokenLink
	db.Where("crawl_job_id = ?", job.ID).Find(&brokenLinks)

	c.JSON(http.StatusOK, gin.H{
		"job":          job,
		"broken_links": brokenLinks,
	})
}

func deleteCrawlJobs(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	// Delete broken links first
	db.Where("crawl_job_id IN (SELECT id FROM crawl_jobs WHERE id IN ? AND user_id = ?)", req.IDs, userID).Delete(&BrokenLink{})
	
	// Delete crawl jobs
	result := db.Where("id IN ? AND user_id = ?", req.IDs, userID).Delete(&CrawlJob{})

	// Clean up cancellation channels
	for _, id := range req.IDs {
		delete(jobCancellations, id)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Jobs deleted successfully",
		"deleted": result.RowsAffected,
	})
}

func rerunCrawlJobs(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	var jobs []CrawlJob
	if err := db.Where("id IN ? AND user_id = ?", req.IDs, userID).Find(&jobs).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Jobs not found"})
		return
	}

	// Reset jobs to queued state
	for _, job := range jobs {
		// Stop any running job first
		if cancelChan, exists := jobCancellations[job.ID]; exists {
			select {
			case cancelChan <- true:
			default:
			}
		}

		db.Model(&job).Updates(CrawlJob{
			Status:        "queued",
			ErrorMessage:  "",
			StartedAt:     nil,
			CompletedAt:   nil,
			HTMLVersion:   "",
			PageTitle:     "",
			H1Count:       0,
			H2Count:       0,
			H3Count:       0,
			H4Count:       0,
			H5Count:       0,
			H6Count:       0,
			InternalLinks: 0,
			ExternalLinks: 0,
			BrokenLinks:   0,
			HasLoginForm:  false,
		})

		// Delete old broken links
		db.Where("crawl_job_id = ?", job.ID).Delete(&BrokenLink{})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Jobs queued for re-run",
		"count":   len(jobs),
	})
}

// Web crawling logic
func crawlURL(job *CrawlJob, cancelChan <-chan bool) {
	defer func() {
		// Clean up cancellation channel
		delete(jobCancellations, job.ID)
	}()

	// Update job status to running
	now := time.Now()
	db.Model(job).Updates(CrawlJob{
		Status:    "running",
		StartedAt: &now,
	})

	// Perform the actual crawling
	result, err := performCrawl(job.URL, cancelChan)
	if err != nil {
		// Check if it was cancelled
		completed := time.Now()
		status := "error"
		
		select {
		case <-cancelChan:
			status = "stopped"
		default:
		}

		db.Model(job).Updates(CrawlJob{
			Status:       status,
			ErrorMessage: err.Error(),
			CompletedAt:  &completed,
		})
		return
	}

	// Check if cancelled before updating results
	select {
	case <-cancelChan:
		completed := time.Now()
		db.Model(job).Updates(CrawlJob{
			Status:      "stopped",
			CompletedAt: &completed,
		})
		return
	default:
	}

	// Update job with results
	completed := time.Now()
	updates := CrawlJob{
		Status:        "completed",
		CompletedAt:   &completed,
		HTMLVersion:   result.HTMLVersion,
		PageTitle:     result.PageTitle,
		H1Count:       result.H1Count,
		H2Count:       result.H2Count,
		H3Count:       result.H3Count,
		H4Count:       result.H4Count,
		H5Count:       result.H5Count,
		H6Count:       result.H6Count,
		InternalLinks: result.InternalLinks,
		ExternalLinks: result.ExternalLinks,
		BrokenLinks:   len(result.BrokenLinks),
		HasLoginForm:  result.HasLoginForm,
	}

	db.Model(job).Updates(updates)

	// Store broken links
	for _, link := range result.BrokenLinks {
		brokenLink := BrokenLink{
			CrawlJobID: job.ID,
			URL:        link.URL,
			StatusCode: link.StatusCode,
		}
		db.Create(&brokenLink)
	}
}

type CrawlResult struct {
	HTMLVersion   string
	PageTitle     string
	H1Count       int
	H2Count       int
	H3Count       int
	H4Count       int
	H5Count       int
	H6Count       int
	InternalLinks int
	ExternalLinks int
	BrokenLinks   []struct {
		URL        string
		StatusCode int
	}
	HasLoginForm bool
}

func performCrawl(targetURL string, cancelChan <-chan bool) (*CrawlResult, error) {
	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Check for cancellation
	select {
	case <-cancelChan:
		return nil, fmt.Errorf("crawl cancelled")
	default:
	}

	// Fetch the page
	resp, err := client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	// Parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	result := &CrawlResult{}

	// Extract information with cancellation support
	if err := extractInfo(doc, result, targetURL, cancelChan); err != nil {
		return nil, err
	}

	return result, nil
}

func extractInfo(n *html.Node, result *CrawlResult, baseURL string, cancelChan <-chan bool) error {
	// Check for cancellation periodically
	select {
	case <-cancelChan:
		return fmt.Errorf("crawl cancelled")
	default:
	}

	if n.Type == html.ElementNode {
		switch n.Data {
		case "html":
			// Extract HTML version from DOCTYPE or attributes
			for _, attr := range n.Attr {
				if attr.Key == "version" {
					result.HTMLVersion = attr.Val
				}
			}
			if result.HTMLVersion == "" {
				result.HTMLVersion = "HTML5" // Default assumption
			}
		case "title":
			if n.FirstChild != nil {
				result.PageTitle = strings.TrimSpace(n.FirstChild.Data)
			}
		case "h1":
			result.H1Count++
		case "h2":
			result.H2Count++
		case "h3":
			result.H3Count++
		case "h4":
			result.H4Count++
		case "h5":
			result.H5Count++
		case "h6":
			result.H6Count++
		case "a":
			// Process links
			for _, attr := range n.Attr {
				if attr.Key == "href" {
					processLink(attr.Val, baseURL, result)
				}
			}
		case "form":
			// Check for login form
			if hasLoginForm(n) {
				result.HasLoginForm = true
			}
		}
	}

	// Recursively process child nodes
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if err := extractInfo(c, result, baseURL, cancelChan); err != nil {
			return err
		}
	}

	return nil
}

func processLink(href, baseURL string, result *CrawlResult) {
	// Skip empty hrefs and javascript/mailto links
	if href == "" || strings.HasPrefix(href, "javascript:") || strings.HasPrefix(href, "mailto:") {
		return
	}

	// Parse base URL
	base, err := url.Parse(baseURL)
	if err != nil {
		return
	}

	// Parse href
	link, err := url.Parse(href)
	if err != nil {
		return
	}

	// Resolve relative URLs
	resolved := base.ResolveReference(link)

	// Check if internal or external
	if resolved.Host == base.Host {
		result.InternalLinks++
	} else {
		result.ExternalLinks++
	}

	// Check if link is broken (simplified check)
	if isLinkBroken(resolved.String()) {
		result.BrokenLinks = append(result.BrokenLinks, struct {
			URL        string
			StatusCode int
		}{
			URL:        resolved.String(),
			StatusCode: 404, // Simplified - in real implementation, get actual status
		})
	}
}

func isLinkBroken(linkURL string) bool {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	resp, err := client.Head(linkURL)
	if err != nil {
		return true
	}
	defer resp.Body.Close()

	return resp.StatusCode >= 400
}

func hasLoginForm(n *html.Node) bool {
	// Look for password input fields
	return containsPasswordInput(n)
}

func containsPasswordInput(n *html.Node) bool {
	if n.Type == html.ElementNode && n.Data == "input" {
		for _, attr := range n.Attr {
			if attr.Key == "type" && attr.Val == "password" {
				return true
			}
		}
	}

	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if containsPasswordInput(c) {
			return true
		}
	}

	return false
}

func LoggerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        log.Printf("Request: %s %s", c.Request.Method, c.Request.URL.Path)
        c.Next()
        log.Printf("Response: %d", c.Writer.Status())
    }
}

func main() {
	// Initialize database
	initDB()
	 
	// Create Gin router
	r := gin.Default()

	// Add logging middleware first
	r.Use(LoggerMiddleware())

	// CORS middleware - Use ONLY ONE of these approaches
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "https://localhost:8080"}, // React dev server
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-API-Key"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Public routes
	r.POST("/api/auth/register", register)
	r.POST("/api/auth/login", login)

	// Protected routes
	api := r.Group("/api")
	api.Use(authMiddleware())
	{
		api.POST("/urls", addURL)
		api.GET("/urls", getCrawlJobs)
		api.GET("/urls/:id", getCrawlJobDetails)
		api.POST("/urls/:id/start", startCrawl)
		api.POST("/urls/:id/stop", stopCrawl)
		api.DELETE("/urls", deleteCrawlJobs)
		api.POST("/urls/rerun", rerunCrawlJobs)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	port := getEnv("PORT", "8081")
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}