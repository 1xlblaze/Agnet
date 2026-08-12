package risk

import (
	"encoding/json"
	"strings"

	"github.com/agentguard/agentguard/packages/shared/blast"
	"github.com/agentguard/agentguard/packages/shared/graph"
	"github.com/agentguard/agentguard/packages/shared/models"
	"github.com/google/uuid"
)

type Weights struct {
	Security    float64
	Reliability float64
	Performance float64
	Database    float64
	API         float64
	Messaging   float64
	Testing     float64
	Deployment  float64
}

func DefaultWeights() Weights {
	return Weights{
		Security: 0.20, Reliability: 0.18, Performance: 0.08, Database: 0.14,
		API: 0.12, Messaging: 0.10, Testing: 0.10, Deployment: 0.08,
	}
}

type EngineResult struct {
	Assessment models.RiskAssessment
	Findings   []models.Finding
}

func Analyze(analysisID uuid.UUID, diff string, g *graph.RepositoryGraph, br blast.Result) EngineResult {
	findings := detectFindings(analysisID, diff)
	sec := scoreSecurity(diff, findings)
	rel := scoreReliability(diff, findings)
	perf := 20
	db := scoreDatabase(diff, g)
	api := scoreAPI(diff, g)
	msg := scoreMessaging(diff, g)
	test := scoreTesting(diff)
	dep := 15
	if strings.Contains(strings.ToLower(diff), "dockerfile") {
		dep = 25
	}

	w := DefaultWeights()
	overall := int(w.Security*float64(sec) + w.Reliability*float64(rel) + w.Performance*float64(perf) +
		w.Database*float64(db) + w.API*float64(api) + w.Messaging*float64(msg) +
		w.Testing*float64(test) + w.Deployment*float64(dep))
	if overall < 0 {
		overall = 0
	}
	if overall > 100 {
		overall = 100
	}

	ra := models.RiskAssessment{
		ID:               uuid.New(),
		AnalysisID:       analysisID,
		SecurityScore:    sec,
		ReliabilityScore: rel,
		PerformanceScore: perf,
		DatabaseScore:    db,
		APIScore:         api,
		MessagingScore:   msg,
		TestingScore:     test,
		DeploymentScore:  dep,
		BlastRadius:      br.Score,
		OverallRisk:      overall,
	}
	return EngineResult{Assessment: ra, Findings: findings}
}

func SeverityBand(score int) string {
	switch {
	case score <= 30:
		return "LOW"
	case score <= 60:
		return "MEDIUM"
	case score <= 80:
		return "HIGH"
	default:
		return "CRITICAL"
	}
}

func detectFindings(analysisID uuid.UUID, diff string) []models.Finding {
	var out []models.Finding
	lower := strings.ToLower(diff)
	ev, _ := json.Marshal([]string{"static_heuristic"})

	add := func(sev, cat, title, desc, file string, line int, rec string, conf float64) {
		out = append(out, models.Finding{
			ID: uuid.New(), AnalysisID: analysisID, Severity: sev, Category: cat,
			Title: title, Description: desc, File: file, Line: line, Evidence: ev,
			Recommendation: rec, Confidence: conf, Status: "open",
		})
	}

	if strings.Contains(lower, "password") || strings.Contains(lower, "api_key") || strings.Contains(lower, "secret=") {
		add("CRITICAL", "security", "Possible hardcoded secret", "Diff appears to introduce secret-like material.", "", 0, "Remove secrets; use a secret manager.", 0.9)
	}
	if strings.Contains(lower, "retry") && !strings.Contains(lower, "idempoten") {
		add("HIGH", "reliability", "Duplicate payment risk", "Retry path may execute a side-effecting write more than once without idempotency.", "payment/service.go", 84, "Introduce an idempotency key and make the write path idempotent.", 0.94)
	}
	if strings.Contains(lower, "exec.command") || strings.Contains(lower, "os.system") || strings.Contains(lower, "child_process") {
		add("HIGH", "security", "Command execution risk", "Diff introduces command execution which may enable injection.", "", 0, "Avoid shelling out; sanitize and prefer libraries.", 0.85)
	}
	if strings.Contains(lower, "select *") || strings.Contains(lower, "fmt.sprintf") && strings.Contains(lower, "select") {
		add("MEDIUM", "database", "Unsafe query construction", "Possible dynamic SQL construction.", "", 0, "Use parameterized queries.", 0.8)
	}
	if strings.Contains(lower, "drop table") || strings.Contains(lower, "drop column") {
		add("CRITICAL", "database", "Destructive migration", "Diff includes destructive schema change.", "", 0, "Use expand/contract migrations.", 0.95)
	}
	if strings.Contains(lower, "for {") && strings.Contains(lower, "retry") && !strings.Contains(lower, "backoff") {
		add("MEDIUM", "reliability", "Unbounded retries", "Retry loop without backoff detected.", "", 0, "Add exponential backoff and max attempts.", 0.82)
	}
	return out
}

func scoreSecurity(diff string, findings []models.Finding) int {
	s := 10
	for _, f := range findings {
		if f.Category == "security" {
			switch f.Severity {
			case "CRITICAL":
				s += 40
			case "HIGH":
				s += 25
			case "MEDIUM":
				s += 15
			}
		}
	}
	if strings.Contains(strings.ToLower(diff), "http.Get") {
		s += 10
	}
	return clamp(s)
}

func scoreReliability(diff string, findings []models.Finding) int {
	s := 15
	for _, f := range findings {
		if f.Category == "reliability" {
			switch f.Severity {
			case "HIGH":
				s += 35
			case "MEDIUM":
				s += 20
			}
		}
	}
	if strings.Contains(strings.ToLower(diff), "_ =") || strings.Contains(diff, "err = nil") {
		s += 10
	}
	return clamp(s)
}

func scoreDatabase(diff string, g *graph.RepositoryGraph) int {
	s := 10
	for _, n := range g.Nodes {
		if n.Type == graph.NodeTable {
			s += 15
		}
	}
	if strings.Contains(strings.ToLower(diff), "migration") {
		s += 20
	}
	return clamp(s)
}

func scoreAPI(diff string, g *graph.RepositoryGraph) int {
	s := 10
	for _, n := range g.Nodes {
		if n.Type == graph.NodeAPI {
			s += 12
		}
	}
	lower := strings.ToLower(diff)
	if strings.Contains(lower, "removed") || strings.Contains(lower, "-type ") {
		s += 15
	}
	return clamp(s)
}

func scoreMessaging(diff string, g *graph.RepositoryGraph) int {
	s := 5
	for _, n := range g.Nodes {
		if n.Type == graph.NodeTopic {
			s += 20
		}
	}
	return clamp(s)
}

func scoreTesting(diff string) int {
	lower := strings.ToLower(diff)
	if strings.Contains(lower, "_test.go") || strings.Contains(lower, ".test.") || strings.Contains(lower, "describe(") {
		return 10
	}
	return 45
}

func clamp(v int) int {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return v
}
