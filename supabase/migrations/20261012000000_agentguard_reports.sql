CREATE TABLE IF NOT EXISTS agentguard_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pull_request_id UUID REFERENCES pull_requests(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  document JSONB NOT NULL DEFAULT '{}',
  version INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agentguard_reports_repository_kind_idx
  ON agentguard_reports (repository_id, kind);
