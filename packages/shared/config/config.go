package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	ServiceName string
	HTTPAddr    string
	DatabaseURL string
	RedisURL    string
	LogLevel    string
	Environment string

	GitHubAppID         string
	GitHubPrivateKey    string
	GitHubWebhookSecret string
	OpenAIAPIKey        string

	AWSRegion     string
	AWSRoleARN    string
	AWSAccountID  string
	S3Bucket      string
	ECRRepository string

	ReadyTimeout time.Duration
}

func Load(serviceName string) (*Config, error) {
	_ = godotenv.Load()
	cfg := &Config{
		ServiceName:         serviceName,
		HTTPAddr:            getenv("HTTP_ADDR", ":8080"),
		DatabaseURL:         getenv("DATABASE_URL", "postgres://agentguard:agentguard@127.0.0.1:5432/agentguard?sslmode=disable"),
		RedisURL:            getenv("REDIS_URL", "redis://127.0.0.1:6379/0"),
		LogLevel:            getenv("LOG_LEVEL", "info"),
		Environment:         getenv("ENVIRONMENT", "development"),
		GitHubAppID:         os.Getenv("GITHUB_APP_ID"),
		GitHubPrivateKey:    os.Getenv("GITHUB_PRIVATE_KEY"),
		GitHubWebhookSecret: os.Getenv("GITHUB_WEBHOOK_SECRET"),
		OpenAIAPIKey:        os.Getenv("OPENAI_API_KEY"),
		AWSRegion:           getenv("AWS_REGION", "us-east-1"),
		AWSRoleARN:          os.Getenv("AWS_ROLE_ARN"),
		AWSAccountID:        os.Getenv("AWS_ACCOUNT_ID"),
		S3Bucket:            os.Getenv("S3_BUCKET"),
		ECRRepository:       os.Getenv("ECR_REPOSITORY"),
		ReadyTimeout:        time.Duration(getenvInt("READY_TIMEOUT_MS", 2000)) * time.Millisecond,
	}
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	return cfg, nil
}

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getenvInt(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}
