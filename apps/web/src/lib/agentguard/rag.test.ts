import { describe, expect, it } from "vitest";
import { buildKnowledgeIndex, formatRagContext, retrieveContext } from "./rag";

describe("rag", () => {
  it("indexes knowledge chunks", () => {
    const chunks = buildKnowledgeIndex();
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("retrieves idempotency-related context for payment retry diffs", () => {
    const hits = retrieveContext("payment retry postgres insert without idempotency", 5);
    expect(hits.length).toBeGreaterThan(0);
    const text = formatRagContext(hits).toLowerCase();
    expect(text.includes("idempotency") || text.includes("policy") || text.includes("payment")).toBe(true);
  });
});
