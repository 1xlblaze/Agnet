package blast

import (
	"testing"

	"github.com/agentguard/agentguard/packages/shared/graph"
)

func TestCalculate(t *testing.T) {
	g := graph.BuildFromDiff("payments-api", "POST /payments\npostgres\nkafka payment-events\n")
	r := Calculate(g)
	if r.Score <= 0 || r.Score > 100 {
		t.Fatalf("score=%d", r.Score)
	}
	if r.AffectedServices < 1 {
		t.Fatal("expected services")
	}
}
