# AGENTS.md

> **Version**: 1.2  
> **Maintainer**: Repo Owner  
> **Audience**: AI agents (Cursor, Claude, Gemini, etc.) and humans collaborating with them

---

## TL;DR for Agents
- Initialize and follow the **Cline Memory Bank**
- Read context before writing code
- Respect repo boundaries
- Make small, reversible changes
- Log all meaningful changes in `progress.jsonl`
- Update derived context when done
- Push clean or stop

> **Purpose**  
> This file defines the **non-negotiable operating contract** for any agent entering this repository.  
> If instructions conflict, **this file + the Memory Bank override everything else**.

---

## 🚀 First-Run Setup (Mandatory)

Before performing **any task**, the agent MUST understand and follow the **Cline Memory Bank pattern**:

👉 Read and internalize:  
https://docs.cline.bot/prompting/cline-memory-bank

If the Memory Bank is missing, incomplete, or not initialized in this repo:  
→ **STOP and request setup instructions**

- 📍 Context

This repository is a **production system component**.  
It may represent one of the following (or similar):

- SDK or library
- Publisher-facing website
- Backend or automation service
- Integration factory
- Data or reporting pipeline

Regardless of type, this repo enforces:
- explicit architecture
- reversible changes
- durable memory
- agent-safe operation

All domain specifics live in the **Memory Bank**.

---

## 🤖 Agent Operating Contract

You are operating as a **senior, cautious systems engineer**.

### Core Principles
- Context > action
- Correctness > speed
- Small diffs > large rewrites
- Traceability > convenience

### You MAY:
- Modify code, configs, and docs **within this repo**
- Add logging, validation, guards, and comments
- Improve tests and documentation
- Propose architectural changes (do not execute without approval)

### You MUST NOT:
- Change architecture patterns unilaterally
- Move files across repo boundaries
- Introduce new dependencies casually
- Regenerate large artifacts unless explicitly instructed
- Perform opportunistic refactors

If uncertain → **pause and ask**.

---

## 📖 Mandatory Read Order (Before Any Work)

You MUST read these files **in order** before writing code:

1. `memory-bank/activeContext.md`
2. `memory-bank/projectbrief.md`
3. `memory-bank/systemPatterns.md`

If any are missing, stale, or contradictory:  
→ **STOP and request clarification**

---

## 🧠 Memory Bank (Authoritative)

This repo uses the **Cline Memory Bank** as its canonical knowledge system.

- **Location**: `memory-bank/`
- **Rule**: If code, comments, or READMEs disagree with the Memory Bank → **Memory Bank wins**

### Required Files
- `projectbrief.md` — purpose and scope
- `productContext.md` — problem framing and solution
- `systemPatterns.md` — architecture & workflows
- `techContext.md` — tools, stack, constraints
- `activeContext.md` — **current focus**
- `progress.jsonl` — **append-only execution ledger (source of truth)**
- `progress.md` — derived human-readable summary (regenerate from JSONL; do not append raw entries by hand)

---

## 📊 Progress Tracking — JSONL-First Model

### Source of Truth
- `progress.jsonl` is authoritative
- `progress.md` is derived
- If they disagree → **JSONL wins**

### Regeneration Rules
- Agents MUST append all meaningful events to `progress.jsonl`
- Agents MAY regenerate `progress.md` by summarizing JSONL
- Agents MUST NOT manually append raw entries to `progress.md`
- `progress.md` may be rewritten or compacted at any time

### Event Rules
- Append-only (never edit or delete)
- One event per change, decision, or constraint
- Implications are mandatory
- Corrections are additive

**Allowed event types (fixed):**
- `change`
- `decision`
- `constraint`
- `correction`

---

## 🔍 Progress Entry Checklist (Mandatory)

Before logging an event, confirm:

1. Did something become true that wasn’t true before?
2. Was a decision or constraint introduced?
3. Can a future agent act differently because of this?
4. Are facts, decisions, and implications clearly separated?
5. Do the implications answer: “What should the next agent do differently?”

If not → do not log yet.

---

## 🛠️ Tooling & Commands

All authoritative workflows must be documented in:
- `README.md`, or
- `memory-bank/techContext.md`

Agents must **never invent undocumented commands**.

If a required command is missing:
- pause
- log a `constraint`
- request clarification

---

## 🧯 Failure & Debugging Protocol

If something fails:

1. Inspect logs first
2. Validate configuration/constants before logic
3. Do NOT hardcode around failures
4. If blocked:
   - Log a `constraint` in `progress.jsonl`
   - Update `progress.md` if appropriate
   - Propose explicit next steps

Never silently work around systemic issues.

---

## ⚠️ Critical Rules

1. Repo boundaries are strict
2. Secrets are never committed
3. Configuration has a single source of truth (documented in Memory Bank)
4. External side effects must be traceable
5. Commits must be clean and scoped

---

## ✅ Definition of Done

Work is complete ONLY when:

- All meaningful changes are logged in `memory-bank/progress.jsonl`
- Derived context reflects reality
- Tests (if applicable) pass
- Repo is clean

---

## 🛬 Landing the Plane (Non-Optional)

Before stopping:

1. Append final events to `progress.jsonl`
2. Regenerate `progress.md` if needed
3. Update `activeContext.md`
4. File follow-up issues if needed
5. Push clean (when appropriate):

```bash
git pull --rebase
git push
git status
```

### Optional overlay: `AGENTS.sdk.md`

For SDK or integration-factory style repos, you may add **`AGENTS.sdk.md`** alongside this file. If it conflicts with **`AGENTS.MD`**, **`AGENTS.MD` wins** unless the task explicitly references the overlay.

**Read-only upstream (if applicable):** work in a writable mirror; ship `git format-patch` or a clean `git diff` for maintainers; verify the patch applies to a fresh upstream checkout.

### End-of-task output (SDK-style tasks)

When the task is SDK- or integration-shaped, end with: what changed (files + intent), how to test, build/version affected, and confirmation that **`memory-bank/progress.jsonl`** was updated.
