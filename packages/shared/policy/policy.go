package policy

import "github.com/agentguard/agentguard/packages/shared/models"

type DeploymentPolicy struct {
	MaxRiskScore       int  `json:"max_risk_score" yaml:"max_risk_score"`
	MaxBlastRadius     int  `json:"max_blast_radius" yaml:"max_blast_radius"`
	CriticalFindings   int  `json:"critical_findings" yaml:"critical_findings"`
	HighFindings       int  `json:"high_findings" yaml:"high_findings"`
	TestsRequired      bool `json:"tests_required" yaml:"tests_required"`
	PreviewRequired    bool `json:"preview_required" yaml:"preview_required"`
	SmokeTestsRequired bool `json:"smoke_tests_required" yaml:"smoke_tests_required"`
}

func Default() DeploymentPolicy {
	return DeploymentPolicy{
		MaxRiskScore: 30, MaxBlastRadius: 50,
		CriticalFindings: 0, HighFindings: 0,
		TestsRequired: true, PreviewRequired: true, SmokeTestsRequired: true,
	}
}

const (
	Allow         = "ALLOW"
	Block         = "BLOCK"
	HumanApproval = "HUMAN_APPROVAL"
)

type Input struct {
	Risk             models.RiskAssessment
	Findings         []models.Finding
	TestsPassed      bool
	PreviewPassed    bool
	SmokePassed      bool
	EvidenceComplete bool
}

type Result struct {
	Decision string   `json:"decision"`
	Reasons  []string `json:"reasons"`
}

func Evaluate(p DeploymentPolicy, in Input) Result {
	var reasons []string
	crit, high := 0, 0
	for _, f := range in.Findings {
		switch f.Severity {
		case "CRITICAL":
			crit++
		case "HIGH":
			high++
		}
	}
	if in.Risk.OverallRisk > p.MaxRiskScore {
		reasons = append(reasons, "overall risk exceeds threshold")
	}
	if in.Risk.BlastRadius > p.MaxBlastRadius {
		reasons = append(reasons, "blast radius exceeds threshold")
	}
	if crit > p.CriticalFindings {
		reasons = append(reasons, "critical findings present")
	}
	if high > p.HighFindings {
		reasons = append(reasons, "high findings present")
	}
	if p.TestsRequired && !in.TestsPassed {
		reasons = append(reasons, "tests required")
	}
	if p.PreviewRequired && !in.PreviewPassed {
		reasons = append(reasons, "preview required")
	}
	if p.SmokeTestsRequired && !in.SmokePassed {
		reasons = append(reasons, "smoke tests required")
	}
	if !in.EvidenceComplete {
		reasons = append(reasons, "mandatory evidence incomplete")
	}

	if len(reasons) == 0 {
		return Result{Decision: Allow, Reasons: []string{"all policy checks passed"}}
	}
	// Human approval when only medium issues / borderline; block on critical
	if crit > 0 {
		return Result{Decision: Block, Reasons: reasons}
	}
	if high > 0 || in.Risk.OverallRisk > p.MaxRiskScore+20 {
		return Result{Decision: Block, Reasons: reasons}
	}
	return Result{Decision: HumanApproval, Reasons: reasons}
}
