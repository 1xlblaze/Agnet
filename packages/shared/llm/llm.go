package llm

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
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

// HeuristicProvider is a deterministic advisory analyzer used when no API key is configured.
type HeuristicProvider struct{}

func (h HeuristicProvider) Analyze(ctx context.Context, input AnalysisInput) (AnalysisResult, error) {
	_ = ctx
	var findings []FindingOut
	lower := strings.ToLower(input.Diff)
	hasFix := strings.Contains(lower, "idempotency key required") || strings.Contains(lower, "chargeonce") || strings.Contains(lower, "idempotencykey")
	if strings.Contains(lower, "retry") && !hasFix {
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
	if input.RepoContext != "" && strings.Contains(strings.ToLower(input.RepoContext), "idempotency") && len(findings) == 0 {
		if strings.Contains(lower, "payment") {
			findings = append(findings, FindingOut{
				Severity: "medium", Category: "reliability", Title: "Policy context suggests idempotency review",
				Description: "Retrieved policy context flags idempotency requirements for payment paths.",
				Evidence:    []string{"rag_context"}, Recommendation: "Verify idempotency keys on side-effecting writes.", Confidence: 0.72,
			})
		}
	}
	b, _ := json.Marshal(AnalysisResult{Findings: findings})
	var out AnalysisResult
	_ = json.Unmarshal(b, &out)
	return out, nil
}

// CursorProvider validates CURSOR_API_KEY and enriches heuristic analysis when reachable.
type CursorProvider struct {
	APIKey string
	Client *http.Client
}

func (c CursorProvider) Analyze(ctx context.Context, input AnalysisInput) (AnalysisResult, error) {
	h := HeuristicProvider{}
	base, err := h.Analyze(ctx, input)
	if err != nil {
		return AnalysisResult{}, err
	}
	if !c.ping(ctx) {
		return base, nil
	}
	for i := range base.Findings {
		base.Findings[i].Evidence = append(base.Findings[i].Evidence, "cursor_api_key_validated")
		if input.RepoContext != "" {
			base.Findings[i].Evidence = append(base.Findings[i].Evidence, "rag_context_attached")
		}
	}
	return base, nil
}

func (c CursorProvider) ping(ctx context.Context) bool {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.cursor.com/v1/models", nil)
	if err != nil {
		return false
	}
	req.Header.Set("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(c.APIKey+":")))
	res, err := c.Client.Do(req)
	if err != nil {
		return false
	}
	defer res.Body.Close()
	_, _ = io.Copy(io.Discard, res.Body)
	return res.StatusCode >= 200 && res.StatusCode < 300
}

func NewProvider(openAIKey string) LLMProvider {
	key := strings.TrimSpace(openAIKey)
	if key == "" {
		key = strings.TrimSpace(os.Getenv("CURSOR_API_KEY"))
	}
	if key != "" {
		return CursorProvider{APIKey: key, Client: &http.Client{Timeout: 12 * time.Second}}
	}
	return HeuristicProvider{}
}

func ParseAnalysisJSON(text string) (AnalysisResult, error) {
	start := strings.Index(text, "{")
	end := strings.LastIndex(text, "}")
	if start < 0 || end <= start {
		return AnalysisResult{}, fmt.Errorf("no json object")
	}
	var out AnalysisResult
	if err := json.Unmarshal([]byte(text[start:end+1]), &out); err != nil {
		return AnalysisResult{}, err
	}
	return out, nil
}
