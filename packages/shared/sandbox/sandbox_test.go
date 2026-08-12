package sandbox

import (
	"context"
	"testing"
	"time"
)

func TestRunEcho(t *testing.T) {
	res, err := Run(context.Background(), Limits{Timeout: 5 * time.Second}, "echo", "ok")
	if err != nil {
		t.Fatal(err)
	}
	if res.ExitCode != 0 {
		t.Fatalf("exit=%d", res.ExitCode)
	}
	Cleanup(res.Dir)
}
