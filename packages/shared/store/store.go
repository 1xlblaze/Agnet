package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/agentguard/agentguard/packages/shared/models"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func (s *Store) Ping(ctx context.Context) error { return s.pool.Ping(ctx) }

func (s *Store) Migrate(ctx context.Context, sql string) error {
	_, err := s.pool.Exec(ctx, sql)
	return err
}

func (s *Store) CreateOrganization(ctx context.Context, name string) (*models.Organization, error) {
	o := &models.Organization{ID: uuid.New(), Name: name, CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
	_, err := s.pool.Exec(ctx, `INSERT INTO organizations (id,name,created_at,updated_at) VALUES ($1,$2,$3,$4)`, o.ID, o.Name, o.CreatedAt, o.UpdatedAt)
	return o, err
}

func (s *Store) CreateProject(ctx context.Context, orgID uuid.UUID, name, desc string) (*models.Project, error) {
	p := &models.Project{ID: uuid.New(), OrganizationID: orgID, Name: name, Description: desc, Status: "CREATED", CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
	_, err := s.pool.Exec(ctx, `INSERT INTO projects (id,organization_id,name,description,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		p.ID, p.OrganizationID, p.Name, p.Description, p.Status, p.CreatedAt, p.UpdatedAt)
	return p, err
}

func (s *Store) ListProjects(ctx context.Context) ([]models.Project, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,organization_id,name,description,status,created_at,updated_at FROM projects ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Project
	for rows.Next() {
		var p models.Project
		if err := rows.Scan(&p.ID, &p.OrganizationID, &p.Name, &p.Description, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) GetProject(ctx context.Context, id uuid.UUID) (*models.Project, error) {
	var p models.Project
	err := s.pool.QueryRow(ctx, `SELECT id,organization_id,name,description,status,created_at,updated_at FROM projects WHERE id=$1`, id).
		Scan(&p.ID, &p.OrganizationID, &p.Name, &p.Description, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) DeleteProject(ctx context.Context, id uuid.UUID) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM projects WHERE id=$1`, id)
	return err
}

func (s *Store) UpdateProjectStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := s.pool.Exec(ctx, `UPDATE projects SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	return err
}

func (s *Store) CreateRepository(ctx context.Context, projectID uuid.UUID, owner, name, branch string, ghID, installID int64) (*models.Repository, error) {
	r := &models.Repository{ID: uuid.New(), ProjectID: projectID, GitHubRepositoryID: ghID, Owner: owner, Name: name, DefaultBranch: branch, InstallationID: installID, Status: "READY", CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC()}
	_, err := s.pool.Exec(ctx, `INSERT INTO repositories (id,project_id,github_repository_id,owner,name,default_branch,installation_id,status,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		r.ID, r.ProjectID, r.GitHubRepositoryID, r.Owner, r.Name, r.DefaultBranch, r.InstallationID, r.Status, r.CreatedAt, r.UpdatedAt)
	return r, err
}

func (s *Store) ListRepositories(ctx context.Context) ([]models.Repository, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,project_id,github_repository_id,owner,name,default_branch,installation_id,status,created_at,updated_at FROM repositories ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Repository
	for rows.Next() {
		var r models.Repository
		if err := rows.Scan(&r.ID, &r.ProjectID, &r.GitHubRepositoryID, &r.Owner, &r.Name, &r.DefaultBranch, &r.InstallationID, &r.Status, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

func (s *Store) GetRepository(ctx context.Context, id uuid.UUID) (*models.Repository, error) {
	var r models.Repository
	err := s.pool.QueryRow(ctx, `SELECT id,project_id,github_repository_id,owner,name,default_branch,installation_id,status,created_at,updated_at FROM repositories WHERE id=$1`, id).
		Scan(&r.ID, &r.ProjectID, &r.GitHubRepositoryID, &r.Owner, &r.Name, &r.DefaultBranch, &r.InstallationID, &r.Status, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *Store) CreatePullRequest(ctx context.Context, pr *models.PullRequest) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	now := time.Now().UTC()
	pr.CreatedAt, pr.UpdatedAt = now, now
	var existing uuid.UUID
	err := s.pool.QueryRow(ctx, `SELECT id FROM pull_requests WHERE repository_id=$1 AND github_pr_number=$2`, pr.RepositoryID, pr.GitHubPRNumber).Scan(&existing)
	if err == nil {
		pr.ID = existing
		_, err = s.pool.Exec(ctx, `UPDATE pull_requests SET base_sha=$2, head_sha=$3, title=$4, author=$5, status=$6, diff=$7, updated_at=$8 WHERE id=$1`,
			pr.ID, pr.BaseSHA, pr.HeadSHA, pr.Title, pr.Author, pr.Status, pr.Diff, pr.UpdatedAt)
		return err
	}
	_, err = s.pool.Exec(ctx, `INSERT INTO pull_requests (id,repository_id,github_pr_number,base_sha,head_sha,title,author,status,diff,created_at,updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, pr.ID, pr.RepositoryID, pr.GitHubPRNumber, pr.BaseSHA, pr.HeadSHA, pr.Title, pr.Author, pr.Status, pr.Diff, pr.CreatedAt, pr.UpdatedAt)
	return err
}

func (s *Store) ListPullRequests(ctx context.Context) ([]models.PullRequest, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,repository_id,github_pr_number,base_sha,head_sha,title,author,status,diff,created_at,updated_at FROM pull_requests ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.PullRequest
	for rows.Next() {
		var p models.PullRequest
		if err := rows.Scan(&p.ID, &p.RepositoryID, &p.GitHubPRNumber, &p.BaseSHA, &p.HeadSHA, &p.Title, &p.Author, &p.Status, &p.Diff, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) GetPullRequest(ctx context.Context, id uuid.UUID) (*models.PullRequest, error) {
	var p models.PullRequest
	err := s.pool.QueryRow(ctx, `SELECT id,repository_id,github_pr_number,base_sha,head_sha,title,author,status,diff,created_at,updated_at FROM pull_requests WHERE id=$1`, id).
		Scan(&p.ID, &p.RepositoryID, &p.GitHubPRNumber, &p.BaseSHA, &p.HeadSHA, &p.Title, &p.Author, &p.Status, &p.Diff, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (s *Store) CreateAnalysis(ctx context.Context, prID uuid.UUID) (*models.Analysis, error) {
	a := &models.Analysis{ID: uuid.New(), PullRequestID: prID, Status: "QUEUED", CreatedAt: time.Now().UTC()}
	_, err := s.pool.Exec(ctx, `INSERT INTO analyses (id,pull_request_id,status,created_at) VALUES ($1,$2,$3,$4)`, a.ID, a.PullRequestID, a.Status, a.CreatedAt)
	return a, err
}

func (s *Store) UpdateAnalysisStatus(ctx context.Context, id uuid.UUID, status, errMsg string) error {
	now := time.Now().UTC()
	if status == "COMPLETED" || status == "FAILED" {
		_, err := s.pool.Exec(ctx, `UPDATE analyses SET status=$2, error=$3, completed_at=$4 WHERE id=$1`, id, status, errMsg, now)
		return err
	}
	if status == "CLONING" || status == "ANALYZING" {
		_, err := s.pool.Exec(ctx, `UPDATE analyses SET status=$2, started_at=COALESCE(started_at,$3) WHERE id=$1`, id, status, now)
		return err
	}
	_, err := s.pool.Exec(ctx, `UPDATE analyses SET status=$2 WHERE id=$1`, id, status)
	return err
}

func (s *Store) GetAnalysis(ctx context.Context, id uuid.UUID) (*models.Analysis, error) {
	var a models.Analysis
	err := s.pool.QueryRow(ctx, `SELECT id,pull_request_id,status,started_at,completed_at,COALESCE(error,''),created_at FROM analyses WHERE id=$1`, id).
		Scan(&a.ID, &a.PullRequestID, &a.Status, &a.StartedAt, &a.CompletedAt, &a.Error, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *Store) SaveFindings(ctx context.Context, findings []models.Finding) error {
	for _, f := range findings {
		if f.ID == uuid.Nil {
			f.ID = uuid.New()
		}
		if f.CreatedAt.IsZero() {
			f.CreatedAt = time.Now().UTC()
		}
		if len(f.Evidence) == 0 {
			f.Evidence = json.RawMessage("[]")
		}
		_, err := s.pool.Exec(ctx, `INSERT INTO findings (id,analysis_id,severity,category,title,description,file,line,evidence,recommendation,confidence,status,created_at)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
			f.ID, f.AnalysisID, f.Severity, f.Category, f.Title, f.Description, f.File, f.Line, f.Evidence, f.Recommendation, f.Confidence, f.Status, f.CreatedAt)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) ListFindings(ctx context.Context, analysisID uuid.UUID) ([]models.Finding, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,analysis_id,severity,category,title,description,COALESCE(file,''),COALESCE(line,0),evidence,recommendation,confidence,status,created_at FROM findings WHERE analysis_id=$1`, analysisID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Finding
	for rows.Next() {
		var f models.Finding
		if err := rows.Scan(&f.ID, &f.AnalysisID, &f.Severity, &f.Category, &f.Title, &f.Description, &f.File, &f.Line, &f.Evidence, &f.Recommendation, &f.Confidence, &f.Status, &f.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (s *Store) SaveRisk(ctx context.Context, r models.RiskAssessment) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	if r.CreatedAt.IsZero() {
		r.CreatedAt = time.Now().UTC()
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO risk_assessments (id,analysis_id,security_score,reliability_score,performance_score,database_score,api_score,messaging_score,testing_score,deployment_score,blast_radius,overall_risk,decision,created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		ON CONFLICT (analysis_id) DO UPDATE SET security_score=EXCLUDED.security_score, reliability_score=EXCLUDED.reliability_score, performance_score=EXCLUDED.performance_score, database_score=EXCLUDED.database_score, api_score=EXCLUDED.api_score, messaging_score=EXCLUDED.messaging_score, testing_score=EXCLUDED.testing_score, deployment_score=EXCLUDED.deployment_score, blast_radius=EXCLUDED.blast_radius, overall_risk=EXCLUDED.overall_risk, decision=EXCLUDED.decision`,
		r.ID, r.AnalysisID, r.SecurityScore, r.ReliabilityScore, r.PerformanceScore, r.DatabaseScore, r.APIScore, r.MessagingScore, r.TestingScore, r.DeploymentScore, r.BlastRadius, r.OverallRisk, r.Decision, r.CreatedAt)
	return err
}

func (s *Store) GetRisk(ctx context.Context, id uuid.UUID) (*models.RiskAssessment, error) {
	var r models.RiskAssessment
	err := s.pool.QueryRow(ctx, `SELECT id,analysis_id,security_score,reliability_score,performance_score,database_score,api_score,messaging_score,testing_score,deployment_score,blast_radius,overall_risk,decision,created_at FROM risk_assessments WHERE id=$1 OR analysis_id=$1`, id).
		Scan(&r.ID, &r.AnalysisID, &r.SecurityScore, &r.ReliabilityScore, &r.PerformanceScore, &r.DatabaseScore, &r.APIScore, &r.MessagingScore, &r.TestingScore, &r.DeploymentScore, &r.BlastRadius, &r.OverallRisk, &r.Decision, &r.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &r, nil
}

func (s *Store) SaveVerification(ctx context.Context, v models.VerificationRun) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	if v.CreatedAt.IsZero() {
		v.CreatedAt = time.Now().UTC()
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO verification_runs (id,analysis_id,requirements,evidence,status,started_at,completed_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		v.ID, v.AnalysisID, v.Requirements, v.Evidence, v.Status, v.StartedAt, v.CompletedAt, v.CreatedAt)
	return err
}

func (s *Store) SaveAgentRun(ctx context.Context, a models.AgentRun) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO agent_runs (id,analysis_id,provider,task,status,iteration,started_at,completed_at,input_tokens,output_tokens,error) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		a.ID, a.AnalysisID, a.Provider, a.Task, a.Status, a.Iteration, a.StartedAt, a.CompletedAt, a.InputTokens, a.OutputTokens, a.Error)
	return err
}

func (s *Store) CreateDeployment(ctx context.Context, d *models.Deployment) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO deployments (id,project_id,pull_request_id,environment,version,status,url,started_at,completed_at,rollback_of) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		d.ID, d.ProjectID, d.PullRequestID, d.Environment, d.Version, d.Status, d.URL, d.StartedAt, d.CompletedAt, d.RollbackOf)
	return err
}

func (s *Store) UpdateDeployment(ctx context.Context, d *models.Deployment) error {
	_, err := s.pool.Exec(ctx, `UPDATE deployments SET status=$2, url=$3, completed_at=$4 WHERE id=$1`, d.ID, d.Status, d.URL, d.CompletedAt)
	return err
}

func (s *Store) GetDeployment(ctx context.Context, id uuid.UUID) (*models.Deployment, error) {
	var d models.Deployment
	err := s.pool.QueryRow(ctx, `SELECT id,project_id,pull_request_id,environment,version,status,COALESCE(url,''),started_at,completed_at,rollback_of FROM deployments WHERE id=$1`, id).
		Scan(&d.ID, &d.ProjectID, &d.PullRequestID, &d.Environment, &d.Version, &d.Status, &d.URL, &d.StartedAt, &d.CompletedAt, &d.RollbackOf)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (s *Store) ListDeployments(ctx context.Context) ([]models.Deployment, error) {
	rows, err := s.pool.Query(ctx, `SELECT id,project_id,pull_request_id,environment,version,status,COALESCE(url,''),started_at,completed_at,rollback_of FROM deployments ORDER BY started_at DESC NULLS LAST`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []models.Deployment
	for rows.Next() {
		var d models.Deployment
		if err := rows.Scan(&d.ID, &d.ProjectID, &d.PullRequestID, &d.Environment, &d.Version, &d.Status, &d.URL, &d.StartedAt, &d.CompletedAt, &d.RollbackOf); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

func (s *Store) AddDeploymentEvent(ctx context.Context, deploymentID uuid.UUID, eventType string, payload any) error {
	b, _ := json.Marshal(payload)
	_, err := s.pool.Exec(ctx, `INSERT INTO deployment_events (deployment_id,event_type,payload) VALUES ($1,$2,$3)`, deploymentID, eventType, b)
	return err
}

func (s *Store) CreateCertificate(ctx context.Context, c *models.Certificate) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.CreatedAt.IsZero() {
		c.CreatedAt = time.Now().UTC()
	}
	_, err := s.pool.Exec(ctx, `INSERT INTO certificates (id,deployment_id,risk_score,blast_radius,evidence,decision,commit_sha,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		c.ID, c.DeploymentID, c.RiskScore, c.BlastRadius, c.Evidence, c.Decision, c.CommitSHA, c.CreatedAt)
	return err
}

func (s *Store) GetCertificate(ctx context.Context, id uuid.UUID) (*models.Certificate, error) {
	var c models.Certificate
	err := s.pool.QueryRow(ctx, `SELECT id,deployment_id,risk_score,blast_radius,evidence,decision,commit_sha,created_at FROM certificates WHERE id=$1`, id).
		Scan(&c.ID, &c.DeploymentID, &c.RiskScore, &c.BlastRadius, &c.Evidence, &c.Decision, &c.CommitSHA, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) GetCertificateByDeployment(ctx context.Context, deploymentID uuid.UUID) (*models.Certificate, error) {
	var c models.Certificate
	err := s.pool.QueryRow(ctx, `SELECT id,deployment_id,risk_score,blast_radius,evidence,decision,commit_sha,created_at FROM certificates WHERE deployment_id=$1`, deploymentID).
		Scan(&c.ID, &c.DeploymentID, &c.RiskScore, &c.BlastRadius, &c.Evidence, &c.Decision, &c.CommitSHA, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *Store) SaveWebhookDelivery(ctx context.Context, deliveryID, eventType string, payload []byte) (bool, error) {
	tag, err := s.pool.Exec(ctx, `INSERT INTO webhook_deliveries (github_delivery_id,event_type,payload) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, deliveryID, eventType, payload)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) EnqueueJob(ctx context.Context, jobType string, payload any) (uuid.UUID, error) {
	id := uuid.New()
	b, _ := json.Marshal(payload)
	_, err := s.pool.Exec(ctx, `INSERT INTO jobs (id,type,payload,status) VALUES ($1,$2,$3,'queued')`, id, jobType, b)
	return id, err
}

func (s *Store) ClaimJob(ctx context.Context) (uuid.UUID, string, json.RawMessage, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, "", nil, err
	}
	defer tx.Rollback(ctx)
	var id uuid.UUID
	var typ string
	var payload json.RawMessage
	err = tx.QueryRow(ctx, `SELECT id,type,payload FROM jobs WHERE status='queued' ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1`).Scan(&id, &typ, &payload)
	if err != nil {
		return uuid.Nil, "", nil, err
	}
	if _, err := tx.Exec(ctx, `UPDATE jobs SET status='running', updated_at=now() WHERE id=$1`, id); err != nil {
		return uuid.Nil, "", nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, "", nil, err
	}
	return id, typ, payload, nil
}

func (s *Store) CompleteJob(ctx context.Context, id uuid.UUID, status string) error {
	_, err := s.pool.Exec(ctx, `UPDATE jobs SET status=$2, updated_at=now() WHERE id=$1`, id, status)
	return err
}

func (s *Store) SaveScan(ctx context.Context, repoID uuid.UUID, baseline, g any, sha string) error {
	b, _ := json.Marshal(baseline)
	gj, _ := json.Marshal(g)
	now := time.Now().UTC()
	_, err := s.pool.Exec(ctx, `INSERT INTO repository_scans (repository_id,status,baseline,graph,commit_sha,started_at,completed_at) VALUES ($1,'COMPLETED',$2,$3,$4,$5,$5)`,
		repoID, b, gj, sha, now)
	return err
}

func (s *Store) Dashboard(ctx context.Context) (*models.DashboardStats, error) {
	stats := &models.DashboardStats{ProductionConfidence: 96, Security: 98, Reliability: 94, Performance: 92, Architecture: 95, Database: 97}
	prs, err := s.ListPullRequests(ctx)
	if err != nil {
		return nil, err
	}
	if len(prs) > 0 {
		stats.LatestPR = &prs[0]
		// find latest risk for latest analysis of this PR
		var analysisID uuid.UUID
		qerr := s.pool.QueryRow(ctx, `SELECT id FROM analyses WHERE pull_request_id=$1 ORDER BY created_at DESC LIMIT 1`, prs[0].ID).Scan(&analysisID)
		if qerr == nil {
			if r, rerr := s.GetRisk(ctx, analysisID); rerr == nil {
				stats.LatestRisk = r
				// invert risk into confidence-ish display
				stats.ProductionConfidence = 100 - r.OverallRisk
				if stats.ProductionConfidence < 0 {
					stats.ProductionConfidence = 0
				}
				stats.Security = 100 - r.SecurityScore
				stats.Reliability = 100 - r.ReliabilityScore
				stats.Database = 100 - r.DatabaseScore
			}
		}
	}
	return stats, nil
}

func (s *Store) EnsureDemoOrg(ctx context.Context) (uuid.UUID, error) {
	var id uuid.UUID
	err := s.pool.QueryRow(ctx, `SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1`).Scan(&id)
	if err == nil {
		return id, nil
	}
	o, err := s.CreateOrganization(ctx, "AgentGuard Demo")
	if err != nil {
		return uuid.Nil, err
	}
	return o.ID, nil
}

func ErrNotFound(err error) error {
	return fmt.Errorf("not found: %w", err)
}
