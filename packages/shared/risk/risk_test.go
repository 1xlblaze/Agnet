package risk

import (
	"testing"

	"github.com/agentguard/agentguard/packages/shared/blast"
	"github.com/agentguard/agentguard/packages/shared/graph"
	"github.com/google/uuid"
)

func TestAnalyzeDetectsDuplicatePaymentRisk(t *testing.T) {
	diff := "func RetryPayment(id string) error {\n  return charge(id)\n}\n"
	g := graph.BuildFromDiff("payments-api", diff)
	br := blast.Calculate(g)
	res := Analyze(uuid.New(), diff, g, br)
	if len(res.Findings) == 0 {
		t.Fatal("expected findings")
	}
	found := false
	for _, f := range res.Findings {
		if f.Title == "Duplicate payment risk" {
			found = true
			if f.Severity != "HIGH" {
				t.Fatalf("severity=%s", f.Severity)
			}
		}
	}
	if !found {
		t.Fatal("missing duplicate payment finding")
	}
	if res.Assessment.OverallRisk < 0 || res.Assessment.OverallRisk > 100 {
		t.Fatalf("bad overall risk %d", res.Assessment.OverallRisk)
	}
}

func TestSeverityBand(t *testing.T) {
	if SeverityBand(10) != "LOW" || SeverityBand(50) != "MEDIUM" || SeverityBand(70) != "HIGH" || SeverityBand(90) != "CRITICAL" {
		t.Fatal("bands incorrect")
	}
}
