package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
	ID           uuid.UUID `json:"id"`
	GitHubUserID int64     `json:"github_user_id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Project struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Repository struct {
	ID                 uuid.UUID `json:"id"`
	ProjectID          uuid.UUID `json:"project_id"`
	GitHubRepositoryID int64     `json:"github_repository_id"`
	Owner              string    `json:"owner"`
	Name               string    `json:"name"`
	DefaultBranch      string    `json:"default_branch"`
	InstallationID     int64     `json:"installation_id"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type PullRequest struct {
	ID             uuid.UUID `json:"id"`
	RepositoryID   uuid.UUID `json:"repository_id"`
	GitHubPRNumber int       `json:"github_pr_number"`
	BaseSHA        string    `json:"base_sha"`
	HeadSHA        string    `json:"head_sha"`
	Title          string    `json:"title"`
	Author         string    `json:"author"`
	Status         string    `json:"status"`
	Diff           string    `json:"diff,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type Analysis struct {
	ID            uuid.UUID  `json:"id"`
	PullRequestID uuid.UUID  `json:"pull_request_id"`
	Status        string     `json:"status"`
	StartedAt     *time.Time `json:"started_at,omitempty"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	Error         string     `json:"error,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

type Finding struct {
	ID             uuid.UUID       `json:"id"`
	AnalysisID     uuid.UUID       `json:"analysis_id"`
	Severity       string          `json:"severity"`
	Category       string          `json:"category"`
	Title          string          `json:"title"`
	Description    string          `json:"description"`
	File           string          `json:"file,omitempty"`
	Line           int             `json:"line,omitempty"`
	Evidence       json.RawMessage `json:"evidence"`
	Recommendation string          `json:"recommendation"`
	Confidence     float64         `json:"confidence"`
	Status         string          `json:"status"`
	CreatedAt      time.Time       `json:"created_at"`
}

type RiskAssessment struct {
	ID               uuid.UUID `json:"id"`
	AnalysisID       uuid.UUID `json:"analysis_id"`
	SecurityScore    int       `json:"security_score"`
	ReliabilityScore int       `json:"reliability_score"`
	PerformanceScore int       `json:"performance_score"`
	DatabaseScore    int       `json:"database_score"`
	APIScore         int       `json:"api_score"`
	MessagingScore   int       `json:"messaging_score"`
	TestingScore     int       `json:"testing_score"`
	DeploymentScore  int       `json:"deployment_score"`
	BlastRadius      int       `json:"blast_radius"`
	OverallRisk      int       `json:"overall_risk"`
	Decision         string    `json:"decision"`
	CreatedAt        time.Time `json:"created_at"`
}

type VerificationRun struct {
	ID           uuid.UUID       `json:"id"`
	AnalysisID   uuid.UUID       `json:"analysis_id"`
	Requirements json.RawMessage `json:"requirements"`
	Evidence     json.RawMessage `json:"evidence"`
	Status       string          `json:"status"`
	StartedAt    *time.Time      `json:"started_at,omitempty"`
	CompletedAt  *time.Time      `json:"completed_at,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
}

type AgentRun struct {
	ID           uuid.UUID  `json:"id"`
	AnalysisID   uuid.UUID  `json:"analysis_id"`
	Provider     string     `json:"provider"`
	Task         string     `json:"task"`
	Status       string     `json:"status"`
	Iteration    int        `json:"iteration"`
	StartedAt    *time.Time `json:"started_at,omitempty"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	InputTokens  int        `json:"input_tokens"`
	OutputTokens int        `json:"output_tokens"`
	Error        string     `json:"error,omitempty"`
}

type Deployment struct {
	ID            uuid.UUID  `json:"id"`
	ProjectID     uuid.UUID  `json:"project_id"`
	PullRequestID *uuid.UUID `json:"pull_request_id,omitempty"`
	Environment   string     `json:"environment"`
	Version       string     `json:"version"`
	Status        string     `json:"status"`
	URL           string     `json:"url,omitempty"`
	StartedAt     *time.Time `json:"started_at,omitempty"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	RollbackOf    *uuid.UUID `json:"rollback_of,omitempty"`
}

type Certificate struct {
	ID           uuid.UUID       `json:"id"`
	DeploymentID uuid.UUID       `json:"deployment_id"`
	RiskScore    int             `json:"risk_score"`
	BlastRadius  int             `json:"blast_radius"`
	Evidence     json.RawMessage `json:"evidence"`
	Decision     string          `json:"decision"`
	CommitSHA    string          `json:"commit_sha"`
	CreatedAt    time.Time       `json:"created_at"`
}

type DashboardStats struct {
	ProductionConfidence int             `json:"production_confidence"`
	Security             int             `json:"security"`
	Reliability          int             `json:"reliability"`
	Performance          int             `json:"performance"`
	Architecture         int             `json:"architecture"`
	Database             int             `json:"database"`
	LatestPR             *PullRequest    `json:"latest_pr,omitempty"`
	LatestRisk           *RiskAssessment `json:"latest_risk,omitempty"`
}
