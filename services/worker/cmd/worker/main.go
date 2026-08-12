package main

import (
	"context"
	"errors"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/agentguard/agentguard/packages/shared/agent"
	"github.com/agentguard/agentguard/packages/shared/config"
	"github.com/agentguard/agentguard/packages/shared/llm"
	"github.com/agentguard/agentguard/packages/shared/logging"
	"github.com/agentguard/agentguard/packages/shared/store"
	"github.com/agentguard/agentguard/services/worker/internal/pipeline"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg, err := config.Load("worker")
	if err != nil {
		panic(err)
	}
	log := logging.New("worker", cfg.LogLevel)
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Error("db_connect_failed", map[string]any{"error": err.Error()})
		os.Exit(1)
	}
	defer pool.Close()

	rdb := redis.NewClient(&redis.Options{Addr: "127.0.0.1:6379"})
	if opt, err := redis.ParseURL(cfg.RedisURL); err == nil {
		rdb = redis.NewClient(opt)
	}
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Warn("redis_unavailable", map[string]any{"error": err.Error()})
	} else {
		log.Info("redis_ok", nil)
	}
	defer rdb.Close()

	st := store.New(pool)
	pipe := &pipeline.Pipeline{Store: st, Log: log, LLM: llm.NewProvider(cfg.OpenAIAPIKey), Agent: agent.CodexStub{}}
	log.Info("worker_started", nil)

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			log.Info("worker_shutdown", nil)
			return
		case <-ticker.C:
			jobID, typ, payload, err := st.ClaimJob(ctx)
			if err != nil {
				if !errors.Is(err, pgx.ErrNoRows) {
					// ignore no rows
				}
				continue
			}
			log.Info("job_claimed", map[string]any{"job_id": jobID.String(), "type": typ})
			if err := pipe.Handle(ctx, typ, payload); err != nil {
				log.Error("job_failed", map[string]any{"job_id": jobID.String(), "error": err.Error()})
				_ = st.CompleteJob(ctx, jobID, "failed")
				continue
			}
			_ = st.CompleteJob(ctx, jobID, "completed")
			_ = rdb.Incr(ctx, "agentguard:jobs_completed")
		}
	}
}
