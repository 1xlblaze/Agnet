package server

import (
	"github.com/agentguard/agentguard/packages/shared/logging"
	"github.com/agentguard/agentguard/packages/shared/store"
	"github.com/agentguard/agentguard/services/api/internal/handlers"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func New(st *store.Store, log *logging.Logger, webhookSecret string, env string) *gin.Engine {
	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(func(c *gin.Context) {
		rid := c.GetHeader("X-Request-ID")
		if rid == "" {
			rid = uuid.NewString()
		}
		c.Set("request_id", rid)
		c.Writer.Header().Set("X-Request-ID", rid)
		c.Next()
	})
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := &handlers.API{Store: st, Log: log, WebhookSecret: webhookSecret}
	r.GET("/health", api.Health)
	r.GET("/ready", api.Ready)

	v1 := r.Group("/api/v1")
	{
		v1.GET("/dashboard", api.Dashboard)
		v1.GET("/projects", api.ListProjects)
		v1.POST("/projects", api.CreateProject)
		v1.GET("/projects/:id", api.GetProject)
		v1.DELETE("/projects/:id", api.DeleteProject)
		v1.POST("/projects/generate", api.GenerateProject)

		v1.GET("/repositories", api.ListRepositories)
		v1.POST("/repositories", api.CreateRepository)
		v1.GET("/repositories/:id", api.GetRepository)
		v1.POST("/repositories/:id/analyze", api.AnalyzeRepository)

		v1.GET("/pull-requests", api.ListPullRequests)
		v1.POST("/pull-requests", api.CreatePullRequest)
		v1.GET("/pull-requests/:id", api.GetPullRequest)
		v1.POST("/pull-requests/:id/analyze", api.AnalyzePullRequest)

		v1.GET("/analyses/:id", api.GetAnalysis)
		v1.POST("/analyses", api.CreateAnalysis)
		v1.GET("/risk-assessments/:id", api.GetRisk)

		v1.GET("/deployments", api.ListDeployments)
		v1.GET("/deployments/:id", api.GetDeployment)
		v1.POST("/deployments/:id/rollback", api.RollbackDeployment)

		v1.GET("/certificates/:id", api.GetCertificate)
		v1.POST("/webhooks/github", api.GitHubWebhook)
	}
	return r
}
