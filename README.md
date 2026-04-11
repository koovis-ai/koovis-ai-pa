# Koovis

Personal AI assistant by Koovis AI LLC. The intelligence layer that sits above all Koovis AI systems — managing tasks, documents, finances, learning, and security through specialized modules with multi-model orchestration.

## Status

**Planning phase.** No code yet. Design starts Month 4-5 (June 2026).

This repo currently contains:
- `archive/` — Original infrastructure blueprints (historical, "Jarvis" era)
- `docs/` — Design phase documents (to be created Month 4-5)
- `src/` — Source code (to be created Month 5-6)

## Relationship to koovis-hq

Koovis is a separate system with its own release cycle. It integrates WITH koovis-hq services but is not part of koovis-hq. Strategy docs, architecture blueprints, and project tracking live in koovis-hq.

See `CLAUDE.md` for pointers to canonical documents.

## Architecture (Planned)

Multi-model orchestration: route to best model per task. Claude Max for complex reasoning, Ollama local models for privacy-sensitive and offline tasks. Central context store (koovis-hq) shared across all modules.

---

*Koovis AI LLC — Koovis*
