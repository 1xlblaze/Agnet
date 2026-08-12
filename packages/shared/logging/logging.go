package logging

import (
	"encoding/json"
	"io"
	"os"
	"sync"
	"time"
)

type Logger struct {
	mu      sync.Mutex
	out     io.Writer
	service string
	level   string
}

func New(service, level string) *Logger {
	return &Logger{out: os.Stdout, service: service, level: level}
}

func (l *Logger) Info(event string, fields map[string]any)  { l.log("info", event, fields) }
func (l *Logger) Warn(event string, fields map[string]any)  { l.log("warn", event, fields) }
func (l *Logger) Error(event string, fields map[string]any) { l.log("error", event, fields) }

func (l *Logger) log(level, event string, fields map[string]any) {
	payload := map[string]any{
		"level":   level,
		"service": l.service,
		"event":   event,
		"ts":      time.Now().UTC().Format(time.RFC3339Nano),
	}
	for k, v := range fields {
		// never log secrets by key name heuristics
		switch k {
		case "password", "token", "api_key", "secret", "authorization":
			continue
		}
		payload[k] = v
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	_ = json.NewEncoder(l.out).Encode(payload)
}
