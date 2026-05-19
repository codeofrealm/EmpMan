package main

import (
	"context"
	"crypto/md5"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"hash"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/lib/pq"
	"golang.org/x/crypto/pbkdf2"
	"golang.org/x/crypto/scrypt"
)

// ==========================================
// CONFIGURATION & TYPES
// ==========================================

type contextKey string

const adminIDKey contextKey = "admin_id"

type RegisterRequest struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	CompanyName string `json:"companyName"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserResponse struct {
	Username  string `json:"username"`
	CreatedBy string `json:"created_by"`
}

type LogResponse struct {
	Template  string    `json:"template"`
	Activity  string    `json:"activity"`
	Timestamp time.Time `json:"timestamp"`
}

func getDBConfig() string {
	host := os.Getenv("KIOSK_DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("KIOSK_DB_PORT")
	if port == "" {
		port = "5432"
	}
	user := os.Getenv("KIOSK_DB_USER")
	if user == "" {
		user = "postgres"
	}
	password := os.Getenv("KIOSK_DB_PASSWORD")
	if password == "" {
		password = "root@123"
	}
	dbname := os.Getenv("KIOSK_DB_NAME")
	if dbname == "" {
		dbname = "emp"
	}
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)
}

// ==========================================
// PASSWORD HASHING UTILS (WERKZEUG COMPATIBLE)
// ==========================================

func generateSalt(length int) (string, error) {
	bytes := make([]byte, length/2)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func generatePasswordHash(password string) (string, error) {
	salt, err := generateSalt(16)
	if err != nil {
		return "", err
	}

	N := 32768
	r := 8
	p := 1
	keyLen := 64

	hashBytes, err := scrypt.Key([]byte(password), []byte(salt), N, r, p, keyLen)
	if err != nil {
		return "", err
	}

	hashHex := hex.EncodeToString(hashBytes)
	return fmt.Sprintf("scrypt:%d:%d:%d$%s$%s", N, r, p, salt, hashHex), nil
}

func checkPasswordHash(password, storedHash string) (bool, error) {
	parts := strings.Split(storedHash, "$")
	if len(parts) != 3 {
		return false, errors.New("invalid hash format")
	}

	methodParams := parts[0]
	salt := parts[1]
	hashHex := parts[2]

	methodParts := strings.Split(methodParams, ":")
	if len(methodParts) < 1 {
		return false, errors.New("invalid method format")
	}

	algo := methodParts[0]
	var computedHashBytes []byte
	var err error

	storedHashBytes, err := hex.DecodeString(hashHex)
	if err != nil {
		return false, fmt.Errorf("invalid hash hex: %v", err)
	}

	switch algo {
	case "scrypt":
		if len(methodParts) != 4 {
			return false, errors.New("invalid scrypt parameters")
		}
		N, err := strconv.Atoi(methodParts[1])
		if err != nil {
			return false, err
		}
		r, err := strconv.Atoi(methodParts[2])
		if err != nil {
			return false, err
		}
		p, err := strconv.Atoi(methodParts[3])
		if err != nil {
			return false, err
		}

		computedHashBytes, err = scrypt.Key([]byte(password), []byte(salt), N, r, p, len(storedHashBytes))
		if err != nil {
			return false, err
		}
		return subtle.ConstantTimeCompare(storedHashBytes, computedHashBytes) == 1, nil

	case "pbkdf2":
		if len(methodParts) != 3 {
			return false, errors.New("invalid pbkdf2 parameters")
		}
		hashName := methodParts[1]
		iterations, err := strconv.Atoi(methodParts[2])
		if err != nil {
			return false, err
		}

		var hashFunc func() hash.Hash
		switch hashName {
		case "sha256":
			hashFunc = sha256.New
		case "sha512":
			hashFunc = sha512.New
		case "sha1":
			hashFunc = sha1.New
		case "md5":
			hashFunc = md5.New
		default:
			return false, fmt.Errorf("unsupported pbkdf2 hash function: %s", hashName)
		}

		computedHashBytes = pbkdf2.Key([]byte(password), []byte(salt), iterations, len(storedHashBytes), hashFunc)
		return subtle.ConstantTimeCompare(storedHashBytes, computedHashBytes) == 1, nil

	default:
		return false, fmt.Errorf("unsupported hashing algorithm: %s", algo)
	}
}

// ==========================================
// MIDDLEWARES
// ==========================================

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func authMiddleware(secretKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Token missing"})
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(secretKey), nil
			})

			if err != nil || !token.Valid {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Invalid token claims"})
				return
			}

			adminIDFloat, ok := claims["admin_id"].(float64)
			if !ok {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				json.NewEncoder(w).Encode(map[string]string{"error": "Invalid token payload"})
				return
			}

			ctx := context.WithValue(r.Context(), adminIDKey, int(adminIDFloat))
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// ==========================================
// REST HANDLERS
// ==========================================

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":    "healthy",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func handleRegister(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No data received"})
			return
		}

		username := strings.TrimSpace(req.Username)
		password := req.Password
		companyName := strings.TrimSpace(req.CompanyName)

		if username == "" || password == "" || companyName == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Username, password, and company name required"})
			return
		}

		passwordHash, err := generatePasswordHash(password)
		if err != nil {
			log.Printf("HASH ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}

		_, err = db.Exec("INSERT INTO admin (username, password_hash, company_name) VALUES ($1, $2, $3)", username, passwordHash, companyName)
		if err != nil {
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "Admin already exists"})
				return
			}
			log.Printf("INSERT ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "Admin registered"})
	}
}

func handleLogin(db *sql.DB, secretKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No data received"})
			return
		}

		username := strings.TrimSpace(req.Username)
		password := req.Password

		if username == "" || password == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Username and password required"})
			return
		}

		var adminID int
		var storedHash, companyName string
		err := db.QueryRow("SELECT admin_id, password_hash, company_name FROM admin WHERE username = $1", username).Scan(&adminID, &storedHash, &companyName)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
			return
		}

		ok, err := checkPasswordHash(password, storedHash)
		if err != nil || !ok {
			if err != nil {
				log.Printf("HASH CHECK ERROR: %v", err)
			}
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
			return
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"admin_id": adminID,
			"exp":      time.Now().Add(2 * time.Hour).Unix(),
		})

		tokenString, err := token.SignedString([]byte(secretKey))
		if err != nil {
			log.Printf("JWT SIGN ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"token":       tokenString,
			"admin":       username,
			"companyName": companyName,
		})
	}
}

func handleGetUsers(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		adminID, ok := r.Context().Value(adminIDKey).(int)
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
			return
		}

		rows, err := db.Query(`
			SELECT users.username, admin.username AS created_by
			FROM users
			JOIN admin ON users.create_admin_id = admin.admin_id
			WHERE users.create_admin_id = $1
			ORDER BY users.username
		`, adminID)

		if err != nil {
			log.Printf("QUERY USERS ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}
		defer rows.Close()

		users := []UserResponse{}
		for rows.Next() {
			var u UserResponse
			if err := rows.Scan(&u.Username, &u.CreatedBy); err != nil {
				log.Printf("SCAN USER ERROR: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
				return
			}
			users = append(users, u)
		}

		json.NewEncoder(w).Encode(users)
	}
}

func handleCreateUser(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		adminID, ok := r.Context().Value(adminIDKey).(int)
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
			return
		}

		var req CreateUserRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "No data received"})
			return
		}

		username := strings.TrimSpace(req.Username)
		password := req.Password

		if username == "" || password == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Username and password required"})
			return
		}

		passwordHash, err := generatePasswordHash(password)
		if err != nil {
			log.Printf("HASH ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}

		_, err = db.Exec("INSERT INTO users (username, password_hash, create_admin_id) VALUES ($1, $2, $3)", username, passwordHash, adminID)
		if err != nil {
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "User already exists"})
				return
			}
			log.Printf("INSERT USER ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"message": "User created"})
	}
}

func handleGetLogs(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		adminID, ok := r.Context().Value(adminIDKey).(int)
		if !ok {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
			return
		}

		username := r.PathValue("username")

		var userID int
		err := db.QueryRow("SELECT user_id FROM users WHERE username = $1 AND create_admin_id = $2", username, adminID).Scan(&userID)
		if err != nil {
			// User not found or doesn't belong to this admin -> return empty list
			json.NewEncoder(w).Encode([]LogResponse{})
			return
		}

		rows, err := db.Query("SELECT template, log AS activity, log_time AS timestamp FROM logs WHERE user_id = $1", userID)
		if err != nil {
			log.Printf("QUERY LOGS ERROR: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
			return
		}
		defer rows.Close()

		logsData := []LogResponse{}
		for rows.Next() {
			var l LogResponse
			if err := rows.Scan(&l.Template, &l.Activity, &l.Timestamp); err != nil {
				log.Printf("SCAN LOG ERROR: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{"error": "Server error"})
				return
			}
			logsData = append(logsData, l)
		}

		json.NewEncoder(w).Encode(logsData)
	}
}

// ==========================================
// DATABASE INITIALIZATION
// ==========================================

func initializeDB(db *sql.DB) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS admin (
			admin_id SERIAL PRIMARY KEY,
			username VARCHAR(100) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			company_name VARCHAR(150) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS users (
			user_id SERIAL PRIMARY KEY,
			username VARCHAR(100) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			create_admin_id INT NOT NULL REFERENCES admin(admin_id) ON DELETE CASCADE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS logs (
			log_id SERIAL PRIMARY KEY,
			template VARCHAR(255) NOT NULL,
			log TEXT NOT NULL,
			log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
		)`,
	}

	for _, query := range queries {
		_, err := db.Exec(query)
		if err != nil {
			return err
		}
	}
	return nil
}

// ==========================================
// ENTRY POINT
// ==========================================

func main() {
	secretKey := os.Getenv("KIOSK_API_SECRET_KEY")
	if secretKey == "" {
		secretKey = "supersecretkey"
	}

	port := os.Getenv("KIOSK_API_PORT")
	if port == "" {
		port = "5000"
	}

	dsn := getDBConfig()
	log.Printf("Connecting to database...")

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("DATABASE CONNECTION ERROR: %v", err)
	}
	defer db.Close()

	// Wait/ping to ensure DB connection is ready
	err = db.Ping()
	if err != nil {
		log.Printf("WARNING: DB ping failed, will attempt to initialize anyway: %v", err)
	}

	log.Printf("Initializing database schema...")
	if err := initializeDB(db); err != nil {
		log.Fatalf("DATABASE SCHEMA INITIALIZATION ERROR: %v", err)
	}

	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("POST /api/admin/register", handleRegister(db))
	mux.HandleFunc("POST /api/admin/login", handleLogin(db, secretKey))
	mux.HandleFunc("GET /api/health", handleHealth)

	// Protected routes
	authHandler := authMiddleware(secretKey)
	mux.Handle("GET /api/admin/users", authHandler(http.HandlerFunc(handleGetUsers(db))))
	mux.Handle("POST /api/admin/users", authHandler(http.HandlerFunc(handleCreateUser(db))))
	mux.Handle("GET /api/admin/users/{username}/logs", authHandler(http.HandlerFunc(handleGetLogs(db))))

	log.Printf("Server listening on port %s...", port)
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		log.Fatalf("SERVER EXITED: %v", err)
	}
}
