#!/usr/bin/env bash
set -euo pipefail
API="${API_URL:-http://127.0.0.1:8080}"
if [[ -n "${WEB_URL:-}" ]]; then
  API="$WEB_URL"
fi

echo "==> health"
curl -sf "$API/api/v1/health" || curl -sf "$API/health"
echo
curl -sf "$API/api/v1/ready" || curl -sf "$API/ready"
echo

python3 - "$API" <<'PY'
import json, sys, time, urllib.request

api = sys.argv[1].rstrip("/")

def req(method, path, body=None):
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(api + path, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(r) as resp:
        return json.load(resp)

print("==> generate project")
proj = req("POST", "/api/v1/projects/generate", {"name": "payments-api"})
print(json.dumps(proj, indent=2, default=str))
repo_id = proj["repository"]["id"]

print("==> analyze repository")
print(json.dumps(req("POST", f"/api/v1/repositories/{repo_id}/analyze"), indent=2, default=str))

diff = """diff --git a/payment/service.go b/payment/service.go
--- a/payment/service.go
+++ b/payment/service.go
@@
+func RetryPayment(id string) error {
+    // retry charge without idempotency
+    return charge(id)
+}
+// postgres insert into payments
+// kafka publish payment-events
"""

print("==> create PR")
pr = req("POST", "/api/v1/pull-requests", {
    "repository_id": repo_id,
    "github_pr_number": 188,
    "base_sha": "aaaaaaaa",
    "head_sha": "a93f21c",
    "title": "Add payment retry",
    "author": "codex",
    "status": "open",
    "diff": diff,
})
print(json.dumps(pr, indent=2, default=str))
pr_id = pr["id"]

print("==> analyze PR")
an = req("POST", f"/api/v1/pull-requests/{pr_id}/analyze")
print(json.dumps(an, indent=2, default=str))

analysis = an.get("analysis") or an
analysis_id = analysis["id"]
status = analysis.get("status")
if status not in ("COMPLETED", "FAILED"):
    for _ in range(60):
        detail = req("GET", f"/api/v1/analyses/{analysis_id}")
        status = detail["analysis"]["status"]
        print(f"status={status}")
        if status in ("COMPLETED", "FAILED"):
            an = detail
            break
        time.sleep(1)

print("==> dashboard")
print(json.dumps(req("GET", "/api/v1/dashboard"), indent=2, default=str))
print("==> deployments")
print(json.dumps(req("GET", "/api/v1/deployments"), indent=2, default=str))
decision = None
if isinstance(an.get("risk"), dict):
    decision = an["risk"].get("decision")
elif isinstance(an.get("decision"), dict):
    decision = an["decision"].get("decision")
elif isinstance(an.get("decision"), str):
    decision = an.get("decision")
print(f"E2E complete analysis={analysis_id} decision={decision}")
print("OK")
PY
