package policy

import (
	"testing"

	"github.com/agentguard/agentguard/packages/shared/models"
	"github.com/google/uuid"
)

func TestEvaluateAllow(t *testing.T) {
	p := Default()
	in := Input{
		Risk:        models.RiskAssessment{ID: uuid.New(), OverallRisk: 18, BlastRadius: 21},
		TestsPassed: true, PreviewPassed: true, SmokePassed: true, EvidenceComplete: true,
	}
	res := Evaluate(p, in)
	if res.Decision != Allow {
		t.Fatalf("got %s reasons=%v", res.Decision, res.Reasons)
	}
}

func TestEvaluateBlockCritical(t *testing.T) {
	p := Default()
	in := Input{
		Risk:        models.RiskAssessment{OverallRisk: 10, BlastRadius: 10},
		Findings:    []models.Finding{{Severity: "CRITICAL", Status: "open"}},
		TestsPassed: true, PreviewPassed: true, SmokePassed: true, EvidenceComplete: true,
	}
	res := Evaluate(p, in)
	if res.Decision != Block {
		t.Fatalf("got %s", res.Decision)
	}
}
