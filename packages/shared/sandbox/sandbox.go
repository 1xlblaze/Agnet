package sandbox

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

type Limits struct {
	CPUPercent int
	MemoryMB   int
	Timeout    time.Duration
}

func DefaultLimits() Limits {
	return Limits{CPUPercent: 50, MemoryMB: 512, Timeout: 60 * time.Second}
}

type Result struct {
	ExitCode int
	Stdout   string
	Stderr   string
	Dir      string
	Duration time.Duration
}

// Run executes a command in an isolated temporary directory with a timeout.
// It never receives production credentials by design — callers must not pass them.
func Run(ctx context.Context, limits Limits, command string, args ...string) (*Result, error) {
	dir, err := os.MkdirTemp("", "agentguard-sandbox-*")
	if err != nil {
		return nil, err
	}
	start := time.Now()
	cctx, cancel := context.WithTimeout(ctx, limits.Timeout)
	defer cancel()
	cmd := exec.CommandContext(cctx, command, args...)
	cmd.Dir = dir
	cmd.Env = []string{
		"PATH=" + os.Getenv("PATH"),
		"HOME=" + dir,
		"TMPDIR=" + dir,
		// Explicitly exclude cloud/control-plane credentials
	}
	out, err := cmd.CombinedOutput()
	res := &Result{Dir: dir, Duration: time.Since(start), Stdout: string(out)}
	if err != nil {
		if ee, ok := err.(*exec.ExitError); ok {
			res.ExitCode = ee.ExitCode()
		} else {
			res.ExitCode = -1
			res.Stderr = err.Error()
		}
		// still return result for audit
		return res, fmt.Errorf("sandbox command failed: %w", err)
	}
	res.ExitCode = 0
	_ = filepath.Walk // keep import useful for future FS isolation hooks
	return res, nil
}

func Cleanup(dir string) {
	_ = os.RemoveAll(dir)
}
