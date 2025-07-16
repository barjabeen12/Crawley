package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"golang.org/x/net/html"
	"gorm.io/gorm"
)

// CrawlerService handles web crawling operations
type CrawlerService struct {
	db     *gorm.DB
	client *http.Client
	mutex  sync.RWMutex
}

// CrawlResult represents the result of a crawl operation
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
	BrokenLinks   []BrokenLinkInfo
	HasLoginForm  bool
}

// BrokenLinkInfo contains information about broken links
type BrokenLinkInfo struct {
	URL        string
	StatusCode int
	Error      string
}

// LinkInfo contains information about a link
type LinkInfo struct {
	URL        string
	IsInternal bool
	IsValid    bool
	StatusCode int
	Error      string
}

// NewCrawlerService creates a new crawler service
func NewCrawlerService(db *gorm.DB) *CrawlerService {
	return &CrawlerService{
		db: db,
		client: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

// CrawlURL performs the main crawling operation
func (cs *CrawlerService) CrawlURL(job *CrawlJob, cancelChan <-chan bool) {
	defer func() {
		// Clean up cancellation channel
		delete(jobCancellations, job.ID)
	}()

	// Update job status to running
	now := time.Now()
	cs.db.Model(job).Updates(CrawlJob{
		Status:    "running",
		StartedAt: &now,
	})

	log.Printf("Starting crawl for URL: %s (Job ID: %d)", job.URL, job.ID)

	// Perform the actual crawling
	result, err := cs.performCrawl(job.URL, cancelChan)
	if err != nil {
		// Check if it was cancelled
		completed := time.Now()
		status := "error"
		
		select {
		case <-cancelChan:
			status = "stopped"
			log.Printf("Crawl cancelled for URL: %s (Job ID: %d)", job.URL, job.ID)
		default:
			log.Printf("Crawl failed for URL: %s (Job ID: %d) - Error: %v", job.URL, job.ID, err)
		}

		cs.db.Model(job).Updates(CrawlJob{
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
		cs.db.Model(job).Updates(CrawlJob{
			Status:      "stopped",
			CompletedAt: &completed,
		})
		log.Printf("Crawl cancelled before saving results for URL: %s (Job ID: %d)", job.URL, job.ID)
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

	cs.db.Model(job).Updates(updates)

	// Store broken links
	for _, link := range result.BrokenLinks {
		brokenLink := BrokenLink{
			CrawlJobID: job.ID,
			URL:        link.URL,
			StatusCode: link.StatusCode,
		}
		cs.db.Create(&brokenLink)
	}

	log.Printf("Crawl completed for URL: %s (Job ID: %d) - Title: %s, Internal: %d, External: %d, Broken: %d", 
		job.URL, job.ID, result.PageTitle, result.InternalLinks, result.ExternalLinks, len(result.BrokenLinks))
}

// performCrawl performs the actual crawling operation
func (cs *CrawlerService) performCrawl(targetURL string, cancelChan <-chan bool) (*CrawlResult, error) {
	// Check for cancellation
	select {
	case <-cancelChan:
		return nil, fmt.Errorf("crawl cancelled")
	default:
	}

	// Parse target URL
	baseURL, err := url.Parse(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse URL: %v", err)
	}

	// Fetch the page
	resp, err := cs.client.Get(targetURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch URL: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Parse HTML
	doc, err := html.Parse(strings.NewReader(string(body)))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	result := &CrawlResult{}

	// Extract basic information
	cs.extractBasicInfo(doc, result, string(body))

	// Extract links and analyze them
	links := cs.extractLinks(doc, baseURL)
	cs.analyzeLinks(links, result, cancelChan)

	// Check for login form
	result.HasLoginForm = cs.hasLoginForm(doc)

	return result, nil
}

// extractBasicInfo extracts basic information from HTML document
func (cs *CrawlerService) extractBasicInfo(doc *html.Node, result *CrawlResult, htmlContent string) {
	// Detect HTML version
	result.HTMLVersion = cs.detectHTMLVersion(htmlContent)

	// Extract page title and heading counts
	cs.extractTitleAndHeadings(doc, result)
}

// detectHTMLVersion detects the HTML version from the document
func (cs *CrawlerService) detectHTMLVersion(htmlContent string) string {
	htmlContent = strings.ToLower(htmlContent)
	
	// Check for HTML5 doctype
	if strings.Contains(htmlContent, "<!doctype html>") {
		return "HTML5"
	}

	// Check for XHTML doctypes
	if strings.Contains(htmlContent, "xhtml") {
		if strings.Contains(htmlContent, "1.1") {
			return "XHTML 1.1"
		} else if strings.Contains(htmlContent, "1.0") {
			if strings.Contains(htmlContent, "strict") {
				return "XHTML 1.0 Strict"
			} else if strings.Contains(htmlContent, "transitional") {
				return "XHTML 1.0 Transitional"
			} else if strings.Contains(htmlContent, "frameset") {
				return "XHTML 1.0 Frameset"
			}
			return "XHTML 1.0"
		}
		return "XHTML"
	}

	// Check for HTML 4.01 doctypes
	if strings.Contains(htmlContent, "html 4.01") {
		if strings.Contains(htmlContent, "strict") {
			return "HTML 4.01 Strict"
		} else if strings.Contains(htmlContent, "transitional") {
			return "HTML 4.01 Transitional"
		} else if strings.Contains(htmlContent, "frameset") {
			return "HTML 4.01 Frameset"
		}
		return "HTML 4.01"
	}

	// Check for older HTML versions
	if strings.Contains(htmlContent, "html 3.2") {
		return "HTML 3.2"
	}
	if strings.Contains(htmlContent, "html 2.0") {
		return "HTML 2.0"
	}

	// Default to HTML5 if no specific DOCTYPE found
	return "HTML5"
}

// extractTitleAndHeadings extracts page title and counts heading elements
func (cs *CrawlerService) extractTitleAndHeadings(doc *html.Node, result *CrawlResult) {
	cs.traverseNode(doc, func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "title":
				if n.FirstChild != nil && n.FirstChild.Type == html.TextNode {
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
			}
		}
	})
}

// extractLinks extracts all links from the document
func (cs *CrawlerService) extractLinks(doc *html.Node, baseURL *url.URL) []LinkInfo {
	var links []LinkInfo
	
	cs.traverseNode(doc, func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, attr := range n.Attr {
				if attr.Key == "href" {
					if href := strings.TrimSpace(attr.Val); href != "" {
						link := cs.processLink(href, baseURL)
						if link.URL != "" {
							links = append(links, link)
						}
					}
					break
				}
			}
		}
	})
	
	return links
}

// processLink processes a single link and determines if it's internal or external
func (cs *CrawlerService) processLink(href string, baseURL *url.URL) LinkInfo {
	link := LinkInfo{
		URL: href,
	}

	// Skip javascript, mailto, tel, and other non-http links
	if strings.HasPrefix(href, "javascript:") ||
		strings.HasPrefix(href, "mailto:") ||
		strings.HasPrefix(href, "tel:") ||
		strings.HasPrefix(href, "#") {
		return LinkInfo{} // Return empty link to skip
	}

	// Parse the link URL
	linkURL, err := url.Parse(href)
	if err != nil {
		return LinkInfo{} // Return empty link to skip
	}

	// Resolve relative URLs
	if !linkURL.IsAbs() {
		linkURL = baseURL.ResolveReference(linkURL)
	}

	link.URL = linkURL.String()

	// Determine if link is internal or external
	link.IsInternal = linkURL.Host == baseURL.Host

	return link
}

// analyzeLinks analyzes all links to check for broken links
func (cs *CrawlerService) analyzeLinks(links []LinkInfo, result *CrawlResult, cancelChan <-chan bool) {
	internalCount := 0
	externalCount := 0
	var brokenLinks []BrokenLinkInfo

	// Use a semaphore to limit concurrent requests
	semaphore := make(chan struct{}, 10)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, link := range links {
		// Check for cancellation
		select {
		case <-cancelChan:
			return
		default:
		}

		if link.IsInternal {
			internalCount++
		} else {
			externalCount++
		}

		// Check link status in goroutine
		wg.Add(1)
		go func(l LinkInfo) {
			defer wg.Done()
			
			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Check for cancellation
			select {
			case <-cancelChan:
				return
			default:
			}

			statusCode, err := cs.checkLinkStatus(l.URL)
			
			mu.Lock()
			defer mu.Unlock()
			
			if err != nil || statusCode >= 400 {
				errorMsg := ""
				if err != nil {
					errorMsg = err.Error()
				}
				brokenLinks = append(brokenLinks, BrokenLinkInfo{
					URL:        l.URL,
					StatusCode: statusCode,
					Error:      errorMsg,
				})
			}
		}(link)
	}

	wg.Wait()

	result.InternalLinks = internalCount
	result.ExternalLinks = externalCount
	result.BrokenLinks = brokenLinks
}

// checkLinkStatus checks the HTTP status of a link
func (cs *CrawlerService) checkLinkStatus(url string) (int, error) {
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {
		return 0, err
	}

	// Set a reasonable timeout for link checking
	client := &http.Client{
		Timeout: 10 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        10,
			MaxIdleConnsPerHost: 2,
			IdleConnTimeout:     30 * time.Second,
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		// If HEAD fails, try GET
		req, err = http.NewRequest("GET", url, nil)
		if err != nil {
			return 0, err
		}
		resp, err = client.Do(req)
		if err != nil {
			return 0, err
		}
	}
	defer resp.Body.Close()

	return resp.StatusCode, nil
}

// hasLoginForm checks if the page contains a login form
func (cs *CrawlerService) hasLoginForm(doc *html.Node) bool {
	hasPasswordField := false
	hasSubmitButton := false
	
	cs.traverseNode(doc, func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "input":
				for _, attr := range n.Attr {
					if attr.Key == "type" {
						if attr.Val == "password" {
							hasPasswordField = true
						} else if attr.Val == "submit" {
							hasSubmitButton = true
						}
					}
				}
			case "button":
				for _, attr := range n.Attr {
					if attr.Key == "type" && attr.Val == "submit" {
						hasSubmitButton = true
					}
				}
				// Also check button text content for login-related keywords
				if n.FirstChild != nil && n.FirstChild.Type == html.TextNode {
					text := strings.ToLower(strings.TrimSpace(n.FirstChild.Data))
					if strings.Contains(text, "login") || 
						strings.Contains(text, "sign in") || 
						strings.Contains(text, "log in") ||
						strings.Contains(text, "submit") {
						hasSubmitButton = true
					}
				}
			}
		}
	})

	// Also check for common login form patterns
	if !hasPasswordField {
		cs.traverseNode(doc, func(n *html.Node) {
			if n.Type == html.ElementNode && n.Data == "form" {
				// Check if form has login-related fields
				cs.traverseNode(n, func(child *html.Node) {
					if child.Type == html.ElementNode && child.Data == "input" {
						for _, attr := range child.Attr {
							if attr.Key == "name" || attr.Key == "id" {
								name := strings.ToLower(attr.Val)
								if strings.Contains(name, "password") ||
									strings.Contains(name, "passwd") ||
									strings.Contains(name, "pwd") {
									hasPasswordField = true
								}
							}
						}
					}
				})
			}
		})
	}

	return hasPasswordField && hasSubmitButton
}

// traverseNode recursively traverses HTML nodes
func (cs *CrawlerService) traverseNode(n *html.Node, fn func(*html.Node)) {
	fn(n)
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		cs.traverseNode(c, fn)
	}
}