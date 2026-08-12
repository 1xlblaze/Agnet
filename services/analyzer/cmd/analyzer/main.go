package main

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agentguard/agentguard/packages/shared/blast"
	"github.com/agentguard/agentguard/packages/shared/config"
	"github.com/agentguard/agentguard/packages/shared/graph"
	"github.com/agentguard/agentguard/packages/shared/logging"
	"github.com/agentguard/agentguard/packages/shared/risk"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnalyzeRequest struct {
	Service string `json:"service"`
	Diff    string `json:"diff"`
}

func main() {
	cfg, err := config.Load("analyzer")
	if err != nil {
		panic(err)
	}
	if cfg.HTTPAddr == ":8080" {
		cfg.HTTPAddr = ":8082"
	}
	log := logging.New("analyzer", cfg.LogLevel)
	r := gin.New()
	r.Use(gin.Recovery())
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.GET("/ready", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ready"}) })
	r.POST("/analyze", func(c *gin.Context) {
		var req AnalyzeRequest
		if err := c.BindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		g := graph.BuildFromDiff(req.Service, req.Diff)
		br := blast.Calculate(g)
		eng := risk.Analyze(uuid.New(), req.Diff, g, br)
		c.JSON(200, gin.H{"graph": g, "blast_radius": br, "risk": eng.Assessment, "findings": eng.Findings})
	})

	srv := &http.Server{Addr: cfg.HTTPAddr, Handler: r}
	go func() {
		log.Info("analyzer_listening", map[string]any{"addr": cfg.HTTPAddr})
		_ = srv.ListenAndServe()
	}()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	_ = json.Marshal
}
