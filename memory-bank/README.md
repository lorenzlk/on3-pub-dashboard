## Cline Memory Bank (authoritative repo context)

This repository uses the **Cline Memory Bank** pattern as its canonical knowledge base.

- **Primary rule**: If code/READMEs disagree with the Memory Bank → **the Memory Bank wins**
- **Entry point**: start with `activeContext.md`
- **Execution log** (append-only): `progress.jsonl`
- **Human summary** (derived): `progress.md` (regenerate from JSONL; do not append raw entries by hand)

### Required files

- `projectbrief.md` — purpose and scope
- `productContext.md` — users, semantics, constraints
- `systemPatterns.md` — architecture & workflows
- `techContext.md` — stack, commands, env
- `activeContext.md` — current focus (keep fresh)
- `progress.jsonl` — append-only ledger of meaningful changes/decisions/constraints
- `progress.md` — derived narrative summary

### Workflow (when making changes)

1. Read: `activeContext.md` → `projectbrief.md` → `systemPatterns.md` (and `techContext.md` when changing tooling/env)
2. Make small, reversible diffs
3. Append events to `progress.jsonl` (type must be one of: `change`, `decision`, `constraint`, `correction`)
4. Regenerate `progress.md` if needed
5. Update `activeContext.md` if the focus shifted

Reference docs: `https://docs.cline.bot/prompting/cline-memory-bank`

