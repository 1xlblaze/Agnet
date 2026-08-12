package analyze

import (
	"context"

	"github.com/agentguard/agentguard/packages/shared/blast"
	"github.com/agentguard/agentguard/packages/shared/graph"
	"github.com/agentguard/agentguard/packages/shared/risk"
	"github.com/google/uuid"
)

type AnalyzeRequest struct {
	Service string
	Diff    string
}

type RepositoryAnalyzer interface {
	Analyze(ctx context.Context, request AnalyzeRequest) (*graph.RepositoryGraph, error)
}

type DefaultAnalyzer struct{}

func (d DefaultAnalyzer) Analyze(ctx context.Context, request AnalyzeRequest) (*graph.RepositoryGraph, error) {
	_ = ctx
	return graph.BuildFromDiff(request.Service, request.Diff), nil
}

func Full(diff, service string) (g *graph.RepositoryGraph, br blast.Result, eng risk.EngineResult) {
	g = graph.BuildFromDiff(service, diff)
	br = blast.Calculate(g)
	eng = risk.Analyze(uuid.New(), diff, g, br)
	return
}
