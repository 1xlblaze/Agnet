package verify

import (
	"testing"

	"github.com/agentguard/agentguard/packages/shared/models"
	"github.com/google/uuid"
)

func TestPlanAndExecute(t *testing.T) {
	findings := []models.Finding{{ID: uuid.New(), Category: "reliability", Title: "Duplicate payment risk"}}
	reqs := PlanFromFindings(findings)
	if len(reqs) < 3 {
		t.Fatal("expected requirements")
	}
	_, _, ok := ExecuteSimulated(reqs, false)
	if ok {
		t.Fatal("expected failure without remediation")
	}
	reqs = PlanFromFindings(findings)
	_, _, ok = ExecuteSimulated(reqs, true)
	if !ok {
		t.Fatal("expected pass with remediation")
	}
}
