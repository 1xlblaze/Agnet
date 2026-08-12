# 18 — Security Model

**Status:** MVP Specification v0.1  
**Parent:** [`AGENTGUARD.md`](../AGENTGUARD.md)  
**Related:** [13-sandbox.md](13-sandbox.md), [16-policy-engine.md](16-policy-engine.md)

---

## Principles

```text
least privilege
zero trust
short-lived credentials
encrypted secrets
sandbox execution
audit logging
```

Never store raw cloud credentials in the database. Use **AWS Secrets Manager**.

---

## Authentication & Authorization (MVP)

- Authn: GitHub OAuth
- Authz: Organization → Members → Projects → Repositories

---

## Control vs Execution Plane

Execution plane never gets unrestricted control-plane access. Sandboxes: no production credentials, no control-plane credentials, no long-lived GitHub tokens.

---

## LLM / Agent Restrictions

Must never directly:

```text
deploy production
delete resources
modify infrastructure
access production database
approve its own changes
```

---

## Secrets Hygiene

- Never hardcode secrets
- Never commit `.env` (only `.env.example`)
- Never log secrets
- CI secrets via GitHub Actions secrets / cloud secret stores

---

## Scanning

Integrate Semgrep, Trivy, gosec (and language-specific tools) as evidence producers — not as replacements for policy.

---

## Webhook Security

Validate `X-Hub-Signature-256`. Reject invalid signatures. Deduplicate by `github_delivery_id`.
