#!/usr/bin/env bash
set -euo pipefail
API="${API_URL:-http://127.0.0.1:8080}"

echo "==> health"
curl -sf "$API/health"
echo
curl -sf "$API/ready"
echo

echo "==> generate project"
PROJ=$(curl -sf -X POST "$API/api/v1/projects/generate" -H 'Content-Type: application/json' -d '{"name":"payments-api"}')
echo "$PROJ"
PROJECT_ID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["project"]["id"])' <<<"$PROJ")
REPO_ID=$(python3 -c 'import json,sys; print(json.load(sys.stdin)["repository"]["id"])' <<<"$PROJ")

echo "==> analyze repository"
curl -sf -X POST "$API/api/v1/repositories/$REPO_ID/analyze"
echo

python3 - "$API" "$REPO_ID" <<'PY'
import json, os, sys, time, urllib.request

api, repo_id = sys.argv[1], sys.argv[2]
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

def req(method, path, body=None):
    data = None if body is None else json.dumps(body).encode()
    r = urllib.request.Request(api + path, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(r) as resp:
        return json.load(resp)

print("==> create PR")
pr = req("POST", "/api/v1/pull-requests", {
    "repository_id": repo_id,
    "github_pr_number": 187,
    "base_sha": "aaaaaaaa",
    "head_sha": "a93f21c",
    "title": "Add payment retry",
    "author": "codex",
    "status": "open",
    "diff": diff,
})
print(json.dumps(pr, indent=2))
pr_id = pr["id"]

print("==> analyze PR")
an = req("POST", f"/api/v1/pull-requests/{pr_id}/analyze")
print(json.dumps(an, indent=2))
analysis_id = an["analysis"]["id"]

print("==> wait for analysis")
detail = None
for _ in range(60):
    detail = req("GET", f"/api/v1/analyses/{analysis_id}")
    status = detail["analysis"]["status"]
    print(f"status={status}")
    if status in ("COMPLETED", "FAILED"):
        break
    time.sleep(1)

print(json.dumps(detail, indent=2))
print("==> dashboard")
print(json.dumps(req("GET", "/api/v1/dashboard"), indent=2))
print("==> deployments")
deps = req("GET", "/api/v1/deployments")
print(json.dumps(deps, indent=2))
risk = (detail or {}).get("risk") or {}
decision = risk.get("decision")
print(f"E2E complete analysis={analysis_id} decision={decision}")
if detail["analysis"]["status"] != "COMPLETED":
    raise SystemExit("analysis did not complete")
PY
