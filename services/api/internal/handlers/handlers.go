package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/agentguard/agentguard/packages/shared/logging"
	"github.com/agentguard/agentguard/packages/shared/models"
	"github.com/agentguard/agentguard/packages/shared/store"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type API struct {
	Store         *store.Store
	Log           *logging.Logger
	WebhookSecret string
}

func (a *API) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (a *API) Ready(c *gin.Context) {
	ctx := c.Request.Context()
	if err := a.Store.Ping(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"status": "not_ready", "error": "database"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ready"})
}

func (a *API) Dashboard(c *gin.Context) {
	stats, err := a.Store.Dashboard(c.Request.Context())
	if err != nil {
		a.fail(c, http.StatusInternalServerError, "dashboard_failed", err)
		return
	}
	c.JSON(http.StatusOK, stats)
}

func (a *API) ListProjects(c *gin.Context) {
	items, err := a.Store.ListProjects(c.Request.Context())
	if err != nil {
		a.fail(c, 500, "list_projects_failed", err)
		return
	}
	c.JSON(200, gin.H{"items": items})
}

func (a *API) CreateProject(c *gin.Context) {
	var body struct {
		Name           string `json:"name"`
		Description    string `json:"description"`
		OrganizationID string `json:"organization_id"`
	}
	if err := c.BindJSON(&body); err != nil || body.Name == "" {
		a.fail(c, 400, "invalid_body", err)
		return
	}
	ctx := c.Request.Context()
	orgID := uuid.Nil
	if body.OrganizationID != "" {
		id, err := uuid.Parse(body.OrganizationID)
		if err != nil {
			a.fail(c, 400, "invalid_org", err)
			return
		}
		orgID = id
	} else {
		id, err := a.Store.EnsureDemoOrg(ctx)
		if err != nil {
			a.fail(c, 500, "org_failed", err)
			return
		}
		orgID = id
	}
	p, err := a.Store.CreateProject(ctx, orgID, body.Name, body.Description)
	if err != nil {
		a.fail(c, 500, "create_project_failed", err)
		return
	}
	_ = a.Store.UpdateProjectStatus(ctx, p.ID, "READY")
	p.Status = "READY"
	c.JSON(201, p)
}

func (a *API) GetProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	p, err := a.Store.GetProject(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	c.JSON(200, p)
}

func (a *API) DeleteProject(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	if err := a.Store.DeleteProject(c.Request.Context(), id); err != nil {
		a.fail(c, 500, "delete_failed", err)
		return
	}
	c.Status(204)
}

func (a *API) ListRepositories(c *gin.Context) {
	items, err := a.Store.ListRepositories(c.Request.Context())
	if err != nil {
		a.fail(c, 500, "list_repos_failed", err)
		return
	}
	c.JSON(200, gin.H{"items": items})
}

func (a *API) CreateRepository(c *gin.Context) {
	var body struct {
		ProjectID          string `json:"project_id"`
		Owner              string `json:"owner"`
		Name               string `json:"name"`
		DefaultBranch      string `json:"default_branch"`
		GitHubRepositoryID int64  `json:"github_repository_id"`
		InstallationID     int64  `json:"installation_id"`
	}
	if err := c.BindJSON(&body); err != nil || body.ProjectID == "" || body.Owner == "" || body.Name == "" {
		a.fail(c, 400, "invalid_body", err)
		return
	}
	pid, err := uuid.Parse(body.ProjectID)
	if err != nil {
		a.fail(c, 400, "invalid_project", err)
		return
	}
	branch := body.DefaultBranch
	if branch == "" {
		branch = "main"
	}
	r, err := a.Store.CreateRepository(c.Request.Context(), pid, body.Owner, body.Name, branch, body.GitHubRepositoryID, body.InstallationID)
	if err != nil {
		a.fail(c, 500, "create_repo_failed", err)
		return
	}
	c.JSON(201, r)
}

func (a *API) GetRepository(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	r, err := a.Store.GetRepository(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	c.JSON(200, r)
}

func (a *API) AnalyzeRepository(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	jobID, err := a.Store.EnqueueJob(c.Request.Context(), "repository_analyze", gin.H{"repository_id": id.String()})
	if err != nil {
		a.fail(c, 500, "enqueue_failed", err)
		return
	}
	c.JSON(202, gin.H{"job_id": jobID, "status": "queued"})
}

func (a *API) ListPullRequests(c *gin.Context) {
	items, err := a.Store.ListPullRequests(c.Request.Context())
	if err != nil {
		a.fail(c, 500, "list_prs_failed", err)
		return
	}
	c.JSON(200, gin.H{"items": items})
}

func (a *API) CreatePullRequest(c *gin.Context) {
	var body models.PullRequest
	if err := c.BindJSON(&body); err != nil || body.RepositoryID == uuid.Nil || body.Title == "" {
		a.fail(c, 400, "invalid_body", err)
		return
	}
	if body.Status == "" {
		body.Status = "open"
	}
	if body.BaseSHA == "" {
		body.BaseSHA = "base"
	}
	if body.HeadSHA == "" {
		body.HeadSHA = "head"
	}
	if body.Author == "" {
		body.Author = "codex"
	}
	if body.GitHubPRNumber == 0 {
		body.GitHubPRNumber = int(time.Now().Unix() % 100000)
	}
	if err := a.Store.CreatePullRequest(c.Request.Context(), &body); err != nil {
		a.fail(c, 500, "create_pr_failed", err)
		return
	}
	c.JSON(201, body)
}

func (a *API) GetPullRequest(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	pr, err := a.Store.GetPullRequest(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	c.JSON(200, pr)
}

func (a *API) AnalyzePullRequest(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	ctx := c.Request.Context()
	if _, err := a.Store.GetPullRequest(ctx, id); err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	analysis, err := a.Store.CreateAnalysis(ctx, id)
	if err != nil {
		a.fail(c, 500, "create_analysis_failed", err)
		return
	}
	jobID, err := a.Store.EnqueueJob(ctx, "pr_analyze", gin.H{"analysis_id": analysis.ID.String(), "pull_request_id": id.String()})
	if err != nil {
		a.fail(c, 500, "enqueue_failed", err)
		return
	}
	c.JSON(202, gin.H{"analysis": analysis, "job_id": jobID})
}

func (a *API) GetAnalysis(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	an, err := a.Store.GetAnalysis(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	findings, _ := a.Store.ListFindings(c.Request.Context(), id)
	risk, _ := a.Store.GetRisk(c.Request.Context(), id)
	c.JSON(200, gin.H{"analysis": an, "findings": findings, "risk": risk})
}

func (a *API) CreateAnalysis(c *gin.Context) {
	var body struct {
		PullRequestID string `json:"pull_request_id"`
	}
	if err := c.BindJSON(&body); err != nil {
		a.fail(c, 400, "invalid_body", err)
		return
	}
	prID, err := uuid.Parse(body.PullRequestID)
	if err != nil {
		a.fail(c, 400, "invalid_pr", err)
		return
	}
	an, err := a.Store.CreateAnalysis(c.Request.Context(), prID)
	if err != nil {
		a.fail(c, 500, "create_failed", err)
		return
	}
	jobID, _ := a.Store.EnqueueJob(c.Request.Context(), "pr_analyze", gin.H{"analysis_id": an.ID.String(), "pull_request_id": prID.String()})
	c.JSON(201, gin.H{"analysis": an, "job_id": jobID})
}

func (a *API) GetRisk(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	r, err := a.Store.GetRisk(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	c.JSON(200, r)
}

func (a *API) ListDeployments(c *gin.Context) {
	items, err := a.Store.ListDeployments(c.Request.Context())
	if err != nil {
		a.fail(c, 500, "list_failed", err)
		return
	}
	c.JSON(200, gin.H{"items": items})
}

func (a *API) GetDeployment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	d, err := a.Store.GetDeployment(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	c.JSON(200, d)
}

func (a *API) RollbackDeployment(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	ctx := c.Request.Context()
	current, err := a.Store.GetDeployment(ctx, id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	now := time.Now().UTC()
	rb := &models.Deployment{
		ProjectID: current.ProjectID, PullRequestID: current.PullRequestID,
		Environment: current.Environment, Version: current.Version + "-rollback",
		Status: "ROLLBACK", StartedAt: &now, CompletedAt: &now, RollbackOf: &current.ID,
		URL: current.URL,
	}
	if err := a.Store.CreateDeployment(ctx, rb); err != nil {
		a.fail(c, 500, "rollback_failed", err)
		return
	}
	_ = a.Store.AddDeploymentEvent(ctx, rb.ID, "rollback_triggered", gin.H{"from": current.ID, "reason": "manual"})
	current.Status = "FAILED"
	_ = a.Store.UpdateDeployment(ctx, current)
	c.JSON(200, rb)
}

func (a *API) GetCertificate(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		a.fail(c, 400, "invalid_id", err)
		return
	}
	cert, err := a.Store.GetCertificate(c.Request.Context(), id)
	if err != nil {
		a.fail(c, 404, "not_found", err)
		return
	}
	c.JSON(200, cert)
}

func (a *API) GenerateProject(c *gin.Context) {
	var body struct {
		Name string `json:"name"`
	}
	if err := c.BindJSON(&body); err != nil || body.Name == "" {
		a.fail(c, 400, "invalid_body", err)
		return
	}
	ctx := c.Request.Context()
	orgID, err := a.Store.EnsureDemoOrg(ctx)
	if err != nil {
		a.fail(c, 500, "org_failed", err)
		return
	}
	p, err := a.Store.CreateProject(ctx, orgID, body.Name, "Auto-generated Go/Gin/PostgreSQL project")
	if err != nil {
		a.fail(c, 500, "create_failed", err)
		return
	}
	_ = a.Store.UpdateProjectStatus(ctx, p.ID, "INITIALIZING")
	repo, err := a.Store.CreateRepository(ctx, p.ID, "agentguard-demo", body.Name, "main", time.Now().Unix(), 1)
	if err != nil {
		a.fail(c, 500, "repo_failed", err)
		return
	}
	jobID, _ := a.Store.EnqueueJob(ctx, "project_generate", gin.H{"project_id": p.ID.String(), "repository_id": repo.ID.String(), "name": body.Name})
	_ = a.Store.UpdateProjectStatus(ctx, p.ID, "READY")
	p.Status = "READY"
	c.JSON(201, gin.H{"project": p, "repository": repo, "job_id": jobID, "template": "go-gin-postgres"})
}

func (a *API) GitHubWebhook(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		a.fail(c, 400, "read_failed", err)
		return
	}
	deliveryID := c.GetHeader("X-GitHub-Delivery")
	event := c.GetHeader("X-GitHub-Event")
	sig := c.GetHeader("X-Hub-Signature-256")
	if a.WebhookSecret != "" {
		if !validSignature(a.WebhookSecret, body, sig) {
			a.fail(c, 401, "invalid_signature", nil)
			return
		}
	}
	if deliveryID == "" {
		deliveryID = uuid.NewString()
	}
	inserted, err := a.Store.SaveWebhookDelivery(c.Request.Context(), deliveryID, event, body)
	if err != nil {
		a.fail(c, 500, "webhook_store_failed", err)
		return
	}
	if !inserted {
		c.JSON(200, gin.H{"status": "duplicate", "delivery_id": deliveryID})
		return
	}
	// Minimal PR sync for pull_request events
	if event == "pull_request" {
		var payload struct {
			Action string `json:"action"`
			Number int    `json:"number"`
			PR     struct {
				Title string `json:"title"`
				User  struct {
					Login string `json:"login"`
				} `json:"user"`
				Base struct {
					SHA string `json:"sha"`
				} `json:"base"`
				Head struct {
					SHA string `json:"sha"`
				} `json:"head"`
			} `json:"pull_request"`
			Repo struct {
				ID       int64  `json:"id"`
				Name     string `json:"name"`
				FullName string `json:"full_name"`
			} `json:"repository"`
		}
		_ = json.Unmarshal(body, &payload)
		a.Log.Info("webhook_pull_request", map[string]any{"action": payload.Action, "number": payload.Number, "delivery_id": deliveryID})
	}
	c.JSON(200, gin.H{"status": "accepted", "delivery_id": deliveryID})
}

func validSignature(secret string, body []byte, header string) bool {
	if !strings.HasPrefix(header, "sha256=") {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(header))
}

func (a *API) fail(c *gin.Context, status int, code string, err error) {
	reqID := c.GetString("request_id")
	msg := code
	if err != nil {
		msg = err.Error()
	}
	a.Log.Error("api_error", map[string]any{"code": code, "error": msg, "request_id": reqID})
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": msg, "request_id": reqID}})
}
