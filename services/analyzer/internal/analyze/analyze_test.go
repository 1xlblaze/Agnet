package analyze

import (
	"context"
	"testing"
)

func TestDefaultAnalyzer(t *testing.T) {
	a := DefaultAnalyzer{}
	g, err := a.Analyze(context.Background(), AnalyzeRequest{Service: "svc", Diff: "postgres gin"})
	if err != nil || g == nil || len(g.Nodes) == 0 {
		t.Fatal("analyze failed")
	}
}
