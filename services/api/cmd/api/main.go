package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agentguard/agentguard/packages/shared/config"
	"github.com/agentguard/agentguard/packages/shared/logging"
	"github.com/agentguard/agentguard/packages/shared/store"
	"github.com/agentguard/agentguard/services/api/internal/server"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg, err := config.Load("api")
	if err != nil {
		panic(err)
	}
	log := logging.New("api", cfg.LogLevel)
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("db_connect_failed", map[string]any{"error": err.Error()})
		os.Exit(1)
	}
	defer pool.Close()

	st := store.New(pool)
	sqlBytes, err := os.ReadFile("migrations/001_init.sql")
	if err != nil {
		// try from module root relative when running in docker
		sqlBytes, err = os.ReadFile("/app/migrations/001_init.sql")
	}
	if err == nil {
		if err := st.Migrate(ctx, string(sqlBytes)); err != nil {
			log.Error("migrate_failed", map[string]any{"error": err.Error()})
			os.Exit(1)
		}
		log.Info("migrate_ok", nil)
	} else {
		log.Warn("migrate_skip", map[string]any{"error": err.Error()})
	}

	engine := server.New(st, log, cfg.GitHubWebhookSecret, cfg.Environment)
	srv := &http.Server{Addr: cfg.HTTPAddr, Handler: engine}

	go func() {
		log.Info("api_listening", map[string]any{"addr": cfg.HTTPAddr})
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("api_failed", map[string]any{"error": err.Error()})
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(shutdownCtx)
	log.Info("api_shutdown", nil)
}
