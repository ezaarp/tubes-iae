package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var (
	ctx          = context.Background()
	redisClient  *redis.Client
	jwtSecret    string
	orderService string
)

type Delivery struct {
	OrderID       string `json:"orderId"`
	DriverName    string `json:"driverName"`
	Status        string `json:"status"`
	EstimatedTime string `json:"estimatedTime"`
}

type AssignRequest struct {
	OrderID string `json:"orderId" binding:"required"`
}

func init() {
	// Load .env file
	godotenv.Load()

	// Initialize Redis
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		log.Fatal("❌ Missing REDIS_URL environment variable")
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("❌ Failed to parse Redis URL: %v", err)
	}

	redisClient = redis.NewClient(opt)

	// Test connection
	_, err = redisClient.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	log.Println("✅ Connected to Redis")

	jwtSecret = os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "a8f5e2d9c4b7a1e6f3d8c2b5a9e7f4d1c8b6a3e9f2d7c5b8a4e1f6d3c9b7a2e5"
	}

	orderService = os.Getenv("ORDER_SERVICE_URL")
	if orderService == "" {
		orderService = "http://localhost:5002"
	}
}

// JWT Middleware
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			c.Set("user", claims)
		}

		c.Next()
	}
}

func main() {
	router := gin.Default()

	// CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"service":   "delivery-service",
			"framework": "Gin",
			"language":  "Go",
			"database":  "Redis",
		})
	})

	// Assign driver
	router.POST("/delivery/assign", func(c *gin.Context) {
		var req AssignRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "orderId required"})
			return
		}

		// Random driver assignment
		drivers := []string{
			"Andi (Motor 1)",
			"Budi (Motor 2)",
			"Citra (Motor 3)",
		}
		rand.Seed(time.Now().UnixNano())
		driverName := drivers[rand.Intn(len(drivers))]

		delivery := Delivery{
			OrderID:       req.OrderID,
			DriverName:    driverName,
			Status:        "ON_THE_WAY",
			EstimatedTime: "15 mins",
		}

		// Store in Redis with 24h expiry
		key := fmt.Sprintf("delivery:%s", req.OrderID)
		err := redisClient.HSet(ctx, key,
			"orderId", delivery.OrderID,
			"driverName", delivery.DriverName,
			"status", delivery.Status,
			"estimatedTime", delivery.EstimatedTime,
		).Err()

		if err != nil {
			log.Printf("❌ Redis error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign driver"})
			return
		}

		// Set expiry
		redisClient.Expire(ctx, key, 24*time.Hour)

		// Auto-complete delivery after 5 seconds
		go func(orderID string) {
			time.Sleep(5 * time.Second)
			log.Printf("🚚 Auto-completing delivery for order %s...", orderID)

			// Update order status to DELIVERED
			client := &http.Client{Timeout: 10 * time.Second}
			body := bytes.NewBufferString(`{"status":"DELIVERED"}`)
			
			req, err := http.NewRequest("PUT",
				fmt.Sprintf("%s/orders/%s/status", orderService, orderID),
				body)
			
			if err != nil {
				log.Printf("❌ Failed to create request: %v", err)
				return
			}
			
			req.Header.Set("Content-Type", "application/json")

			resp, err := client.Do(req)
			if err != nil {
				log.Printf("❌ Failed to auto-complete order %s: %v", orderID, err)
				return
			}
			defer resp.Body.Close()

			log.Printf("✅ Order %s marked as DELIVERED", orderID)
		}(req.OrderID)

		c.JSON(http.StatusOK, delivery)
	})

	// Get delivery info
	router.GET("/delivery/:orderId", func(c *gin.Context) {
		orderID := c.Param("orderId")
		key := fmt.Sprintf("delivery:%s", orderID)

		result, err := redisClient.HGetAll(ctx, key).Result()
		if err != nil || len(result) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"status": "SEARCHING_DRIVER"})
			return
		}

		delivery := Delivery{
			OrderID:       result["orderId"],
			DriverName:    result["driverName"],
			Status:        result["status"],
			EstimatedTime: result["estimatedTime"],
		}

		c.JSON(http.StatusOK, delivery)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5003"
	}

	log.Printf("🚀 Delivery Service (Go/Gin) running on port %s", port)
	router.Run(":" + port)
}
