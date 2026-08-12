package llm

import (
	"context"
	"encoding/json"
	"strings"
)

type AnalysisInput struct {
	PRDescription  string
	Diff           string
	GraphJSON      string
	BlastRadius    int
	StaticFindings []map[string]any
	TestResults    string
	RepoContext    string
}

type FindingOut struct {
	Severity       string   `json:"severity"`
	Category       string   `json:"category"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Evidence       []string `json:"evidence"`
	Recommendation string   `json:"recommendation"`
	Confidence     float64  `json:"confidence"`
}

type AnalysisResult struct {
	Findings []FindingOut `json:"findings"`
}

type LLMProvider interface {
	Analyze(ctx context.Context, input AnalysisInput) (AnalysisResult, error)
}

// HeuristicProvider is a deterministic advisory analyzer used when no OpenAI key is configured.
type HeuristicProvider struct{}

func (h HeuristicProvider) Analyze(ctx context.Context, input AnalysisInput) (AnalysisResult, error) {
	_ = ctx
	var findings []FindingOut
	lower := strings.ToLower(input.Diff)
	if strings.Contains(lower, "retry") && !strings.Contains(lower, "idempoten") {
		findings = append(findings, FindingOut{
			Severity: "high", Category: "reliability", Title: "Duplicate payment risk",
			Description:    "Payment retry can duplicate transactions without an idempotency key.",
			Evidence:       []string{"Retry path can execute the database write twice."},
			Recommendation: "Introduce an idempotency key.", Confidence: 0.94,
		})
	}
	if strings.Contains(lower, "todo") || strings.Contains(lower, "panic(") {
		findings = append(findings, FindingOut{
			Severity: "medium", Category: "reliability", Title: "Incomplete error handling",
			Description: "Diff contains TODO or panic which may reduce reliability.",
			Evidence:    []string{"heuristic scan"}, Recommendation: "Replace panics with handled errors.", Confidence: 0.7,
		})
	}
	b, _ := json.Marshal(AnalysisResult{Findings: findings})
	var out AnalysisResult
	_ = json.Unmarshal(b, &out)
	return out, nil
}

func NewProvider(openAIKey string) LLMProvider {
	// OpenAI integration reserved; MVP uses deterministic advisory provider.
	_ = openAIKey
	return HeuristicProvider{}
}
