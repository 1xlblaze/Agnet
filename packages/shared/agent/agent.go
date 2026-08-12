package agent

import (
	"context"
	"fmt"
	"strings"
	"time"
)

type PatchRequest struct {
	FindingTitles []string
	FixSpec       string
	Diff          string
	Iteration     int
}

type PatchResult struct {
	Patch      string
	Summary    string
	Files      []string
	Remediated bool
}

type CodingAgent interface {
	CreatePatch(ctx context.Context, request PatchRequest) (*PatchResult, error)
}

type CodexStub struct{}

func (c CodexStub) CreatePatch(ctx context.Context, request PatchRequest) (*PatchResult, error) {
	_ = ctx
	if request.Iteration > 3 {
		return nil, fmt.Errorf("max iterations exceeded")
	}
	// Simulate creating an idempotency-key patch for payment retry findings.
	needsIdem := false
	for _, t := range request.FindingTitles {
		if strings.Contains(strings.ToLower(t), "duplicate") || strings.Contains(strings.ToLower(t), "idempoten") {
			needsIdem = true
		}
	}
	if strings.Contains(strings.ToLower(request.Diff), "retry") {
		needsIdem = true
	}
	if !needsIdem {
		return &PatchResult{Patch: "", Summary: "no patch required", Remediated: true}, nil
	}
	patch := `diff --git a/payment/service.go b/payment/service.go
--- a/payment/service.go
+++ b/payment/service.go
@@
-func RetryPayment(id string) error {
-    return charge(id)
-}
+func RetryPayment(id string, idempotencyKey string) error {
+    if idempotencyKey == "" {
+        return fmt.Errorf("idempotency key required")
+    }
+    return chargeOnce(id, idempotencyKey)
+}
`
	time.Sleep(10 * time.Millisecond)
	return &PatchResult{
		Patch:      patch,
		Summary:    "Introduce idempotency key for payment retry",
		Files:      []string{"payment/service.go"},
		Remediated: true,
	}, nil
}
