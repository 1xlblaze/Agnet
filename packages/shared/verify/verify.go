package verify

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/agentguard/agentguard/packages/shared/models"
	"github.com/google/uuid"
)

type Requirement struct {
	ID           string `json:"id"`
	FindingID    string `json:"finding_id"`
	Title        string `json:"title"`
	Required     bool   `json:"required"`
	EvidenceType string `json:"evidence_type"`
	Status       string `json:"status"`
}

type EvidenceItem struct {
	Type      string    `json:"type"`
	Passed    bool      `json:"passed"`
	Detail    string    `json:"detail"`
	CreatedAt time.Time `json:"created_at"`
}

func PlanFromFindings(findings []models.Finding) []Requirement {
	var reqs []Requirement
	for _, f := range findings {
		base := []string{}
		switch f.Category {
		case "reliability":
			base = []string{"duplicate request test", "idempotency test", "transaction test", "retry test"}
		case "security":
			base = []string{"static scan", "dependency scan", "secret scan"}
		case "database":
			base = []string{"migration check", "query verification"}
		case "api":
			base = []string{"api contract check"}
		case "messaging":
			base = []string{"messaging compatibility check"}
		default:
			base = []string{"regression test"}
		}
		for i, title := range base {
			reqs = append(reqs, Requirement{
				ID: uuid.NewString(), FindingID: f.ID.String(), Title: title, Required: true,
				EvidenceType: mapEvidence(title), Status: "pending",
			})
			_ = i
		}
	}
	if len(reqs) == 0 {
		reqs = append(reqs, Requirement{ID: uuid.NewString(), Title: "unit tests", Required: true, EvidenceType: "TEST_RESULT", Status: "pending"})
		reqs = append(reqs, Requirement{ID: uuid.NewString(), Title: "static scan", Required: true, EvidenceType: "STATIC_SCAN", Status: "pending"})
	}
	// Always require preview + smoke for production path
	reqs = append(reqs,
		Requirement{ID: uuid.NewString(), Title: "preview deployment", Required: true, EvidenceType: "PREVIEW_RESULT", Status: "pending"},
		Requirement{ID: uuid.NewString(), Title: "smoke tests", Required: true, EvidenceType: "SMOKE_TEST", Status: "pending"},
		Requirement{ID: uuid.NewString(), Title: "docker build", Required: true, EvidenceType: "BUILD_RESULT", Status: "pending"},
	)
	return reqs
}

func mapEvidence(title string) string {
	t := strings.ToLower(title)
	switch {
	case strings.Contains(t, "scan"):
		return "STATIC_SCAN"
	case strings.Contains(t, "dependency"):
		return "DEPENDENCY_SCAN"
	case strings.Contains(t, "preview"):
		return "PREVIEW_RESULT"
	case strings.Contains(t, "smoke"):
		return "SMOKE_TEST"
	case strings.Contains(t, "contract"):
		return "API_CONTRACT"
	case strings.Contains(t, "migration") || strings.Contains(t, "query"):
		return "DATABASE_CHECK"
	case strings.Contains(t, "messaging"):
		return "MESSAGING_CHECK"
	case strings.Contains(t, "build"):
		return "BUILD_RESULT"
	default:
		return "TEST_RESULT"
	}
}

// ExecuteSimulated runs verification heuristics. If remediationsApplied, high reliability findings are treated as fixed.
func ExecuteSimulated(reqs []Requirement, remediationsApplied bool) ([]Requirement, []EvidenceItem, bool) {
	now := time.Now().UTC()
	var evidence []EvidenceItem
	allPass := true
	for i := range reqs {
		pass := true
		detail := "passed"
		if strings.Contains(strings.ToLower(reqs[i].Title), "idempotency") && !remediationsApplied {
			pass = false
			detail = "idempotency not verified"
			allPass = false
		}
		if strings.Contains(strings.ToLower(reqs[i].Title), "duplicate") && !remediationsApplied {
			pass = false
			detail = "duplicate request path still unsafe"
			allPass = false
		}
		if pass {
			reqs[i].Status = "passed"
		} else {
			reqs[i].Status = "failed"
		}
		evidence = append(evidence, EvidenceItem{Type: reqs[i].EvidenceType, Passed: pass, Detail: detail, CreatedAt: now})
	}
	return reqs, evidence, allPass
}

func MustJSON(v any) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}
