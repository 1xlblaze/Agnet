package graph

import "strings"

type NodeType string

const (
	NodeService         NodeType = "Service"
	NodeAPI             NodeType = "API"
	NodeDatabase        NodeType = "Database"
	NodeTable           NodeType = "Table"
	NodeTopic           NodeType = "Topic"
	NodeCache           NodeType = "Cache"
	NodeExternalService NodeType = "ExternalService"
	NodeDependency      NodeType = "Dependency"
	NodeConfiguration   NodeType = "Configuration"
)

type RelType string

const (
	RelCalls     RelType = "CALLS"
	RelReads     RelType = "READS"
	RelWrites    RelType = "WRITES"
	RelPublishes RelType = "PUBLISHES"
	RelConsumes  RelType = "CONSUMES"
	RelDependsOn RelType = "DEPENDS_ON"
	RelExposes   RelType = "EXPOSES"
)

type Node struct {
	ID   string            `json:"id"`
	Type NodeType          `json:"type"`
	Name string            `json:"name"`
	Meta map[string]string `json:"meta,omitempty"`
}

type Edge struct {
	From string  `json:"from"`
	To   string  `json:"to"`
	Type RelType `json:"type"`
}

type RepositoryGraph struct {
	Nodes []Node `json:"nodes"`
	Edges []Edge `json:"edges"`
}

func (g *RepositoryGraph) AddNode(n Node) {
	for _, existing := range g.Nodes {
		if existing.ID == n.ID {
			return
		}
	}
	g.Nodes = append(g.Nodes, n)
}

func (g *RepositoryGraph) AddEdge(e Edge) {
	g.Edges = append(g.Edges, e)
}

// BuildFromDiff creates a heuristic architecture graph from changed paths and diff text.
func BuildFromDiff(serviceHint, diff string) *RepositoryGraph {
	g := &RepositoryGraph{}
	svc := serviceHint
	if svc == "" {
		svc = "app-service"
	}
	g.AddNode(Node{ID: "svc:" + svc, Type: NodeService, Name: svc})

	lower := strings.ToLower(diff)
	paths := extractPaths(diff)

	hasAPI := strings.Contains(lower, "http.") || strings.Contains(lower, "gin.") || strings.Contains(lower, "router") || strings.Contains(lower, "@app.") || strings.Contains(lower, "express")
	hasDB := strings.Contains(lower, "postgres") || strings.Contains(lower, "sql.") || strings.Contains(lower, "gorm") || strings.Contains(lower, "select ") || strings.Contains(lower, "insert ")
	hasRedis := strings.Contains(lower, "redis")
	hasKafka := strings.Contains(lower, "kafka") || strings.Contains(lower, "sarama")
	hasSQS := strings.Contains(lower, "sqs")
	hasRabbit := strings.Contains(lower, "rabbitmq") || strings.Contains(lower, "amqp")

	if hasAPI || looksLikeHandler(paths) {
		apiID := "api:POST /payments"
		if strings.Contains(lower, "retry") {
			apiID = "api:POST /payments/retry"
		}
		g.AddNode(Node{ID: apiID, Type: NodeAPI, Name: strings.TrimPrefix(apiID, "api:")})
		g.AddEdge(Edge{From: "svc:" + svc, To: apiID, Type: RelExposes})
	}
	if hasDB {
		g.AddNode(Node{ID: "db:postgres", Type: NodeDatabase, Name: "PostgreSQL"})
		g.AddNode(Node{ID: "table:payments", Type: NodeTable, Name: "payments"})
		g.AddEdge(Edge{From: "svc:" + svc, To: "db:postgres", Type: RelWrites})
		g.AddEdge(Edge{From: "db:postgres", To: "table:payments", Type: RelDependsOn})
	}
	if hasRedis {
		g.AddNode(Node{ID: "cache:redis", Type: NodeCache, Name: "Redis"})
		g.AddEdge(Edge{From: "svc:" + svc, To: "cache:redis", Type: RelReads})
	}
	if hasKafka {
		g.AddNode(Node{ID: "topic:payment-events", Type: NodeTopic, Name: "payment-events"})
		g.AddEdge(Edge{From: "svc:" + svc, To: "topic:payment-events", Type: RelPublishes})
		g.AddNode(Node{ID: "svc:settlement-service", Type: NodeService, Name: "settlement-service"})
		g.AddEdge(Edge{From: "topic:payment-events", To: "svc:settlement-service", Type: RelConsumes})
	}
	if hasSQS {
		g.AddNode(Node{ID: "topic:sqs-queue", Type: NodeTopic, Name: "sqs-queue"})
		g.AddEdge(Edge{From: "svc:" + svc, To: "topic:sqs-queue", Type: RelPublishes})
	}
	if hasRabbit {
		g.AddNode(Node{ID: "topic:rabbit", Type: NodeTopic, Name: "rabbitmq"})
		g.AddEdge(Edge{From: "svc:" + svc, To: "topic:rabbit", Type: RelPublishes})
	}

	for _, p := range paths {
		if strings.Contains(p, "Dockerfile") || strings.HasSuffix(p, ".tf") || strings.Contains(p, ".github/workflows") {
			g.AddNode(Node{ID: "cfg:" + p, Type: NodeConfiguration, Name: p})
			g.AddEdge(Edge{From: "svc:" + svc, To: "cfg:" + p, Type: RelDependsOn})
		}
	}
	return g
}

func extractPaths(diff string) []string {
	var out []string
	for _, line := range strings.Split(diff, "\n") {
		if strings.HasPrefix(line, "+++ b/") {
			out = append(out, strings.TrimPrefix(line, "+++ b/"))
		} else if strings.HasPrefix(line, "diff --git") {
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				out = append(out, strings.TrimPrefix(parts[3], "b/"))
			}
		}
	}
	return out
}

func looksLikeHandler(paths []string) bool {
	for _, p := range paths {
		lp := strings.ToLower(p)
		if strings.Contains(lp, "handler") || strings.Contains(lp, "controller") || strings.Contains(lp, "route") || strings.Contains(lp, "api/") {
			return true
		}
	}
	return false
}
