package graph

import "testing"

func TestBuildFromDiff(t *testing.T) {
	g := BuildFromDiff("payments-api", "+++ b/payment/handler.go\n+ router.POST\n+ postgres insert\n+ kafka publish\n")
	if len(g.Nodes) == 0 {
		t.Fatal("no nodes")
	}
}
