package blast

import "github.com/agentguard/agentguard/packages/shared/graph"

type Result struct {
	Score              int `json:"score"`
	AffectedServices   int `json:"affected_services"`
	AffectedAPIs       int `json:"affected_apis"`
	AffectedTables     int `json:"affected_tables"`
	AffectedTopics     int `json:"affected_topics"`
	DownstreamServices int `json:"downstream_services"`
}

func Calculate(g *graph.RepositoryGraph) Result {
	var services, apis, tables, topics, downstream int
	serviceIDs := map[string]bool{}
	for _, n := range g.Nodes {
		switch n.Type {
		case graph.NodeService:
			services++
			serviceIDs[n.ID] = true
		case graph.NodeAPI:
			apis++
		case graph.NodeTable:
			tables++
		case graph.NodeTopic:
			topics++
		}
	}
	for _, e := range g.Edges {
		if e.Type == graph.RelConsumes {
			if serviceIDs[e.To] {
				downstream++
			}
		}
	}
	// Weighted score capped at 100
	score := services*8 + apis*6 + tables*10 + topics*9 + downstream*7
	if score > 100 {
		score = 100
	}
	if score == 0 {
		score = 5
	}
	return Result{
		Score:              score,
		AffectedServices:   services,
		AffectedAPIs:       apis,
		AffectedTables:     tables,
		AffectedTopics:     topics,
		DownstreamServices: downstream,
	}
}
