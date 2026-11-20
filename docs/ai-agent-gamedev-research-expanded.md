# AI-Agent Game Development Research — Expanded Edition

## Overview

Comprehensive research on AI-agent driven game development, with emphasis on retro/ZX Spectrum-style deterministic engines like Zúbok a signálik. Compiled from GitHub repositories, Reddit (r/aigamedev, r/gamedev, r/zxspectrum, r/AI_Agents), Medium articles, DEV Community, and antirez.com across two research rounds.

**Date:** 2026-11-20
**Companion doc:** docs/ai-agent-gamedev-research.md (Round 1)
**Status:** Reference material for continuing development

---

## Part A: Multi-Agent Orchestration Patterns

### 1. The "One Day Game" Multi-Agent Pipeline

**Source:** https://dev.to/maxxmini/i-built-a-full-game-in-one-day-using-ai-agents-heres-what-happened-3c3o
**Relevance:** High — demonstrates a complete agent team shipping a Godot game in 24 hours.

#### Agent role roster

| Agent Role | Responsibility |
|------------|----------------|
| PM | Feature specs, task breakdown, priority ordering |
| Architect | System design, component interfaces, data flow |
| Lead Dev | Core implementation, code review, integration |
| Security | Input validation, save file integrity, exploit prevention |
| QA | Test writing, coverage tracking, regression checks |
| DevOps | Build pipeline, export configs, CI setup |

#### Key practice: TDD as the backbone

A strict rule: **tests first, implementation second, all tests green before moving on.**

Typical 30-minute cycle:
```
[00:00] PM assigns: "Implement fishing minigame"
[00:02] Architect delivers: component diagram + signal contracts
[00:05] QA writes: 47 test cases for fishing mechanics
[00:08] Lead Dev starts implementation
[00:20] Lead Dev: all 47 tests passing
[00:22] Security review: adds input bounds on reel tension
[00:25] QA: 3 additional edge case tests
[00:28] Lead Dev: all 50 tests green
[00:30] PM: "Moving to Dream Weaving system"
```

#### Lesson for our project
We already follow test-first (Gates 0–5 all added tests). We could formalize the role split: PM (spec → tasks), Architect (stage grid + types), Lead Dev (engine impl), QA (tests), Security (no Math.random, no DOM in engine).

---

### 2. Copilot Orchestration (.agent.md files)

**Source:** https://medium.com/simform-engineering/your-ai-agents-dont-need-more-power-they-need-orchestration-bb579a05affc

#### Pattern: Orchestrator + focused agents

```
You (the developer)
  └── Orchestrator 🎯
        ├── Planner       → Creates the implementation plan
        ├── Researcher    → Explores codebase, finds patterns
        ├── Coder         → Writes the actual code
        └── Reviewer      → Reviews for bugs & best practices
```

**Orchestrator agent file (markdown, lives in repo):**
```markdown
---
name: Orchestrator
description: Coordinates multi-agent workflows
tools: ['agent']  # ONLY delegation — no editing
agents: ['Planner', 'Researcher', 'Coder', 'Reviewer']
model: ['Claude Opus 4.5', 'GPT-5.2']
---

You are the orchestrator. For every task:
1. Planner → Create implementation plan
2. Researcher → Find existing patterns and relevant code
3. Coder → Implement changes based on plan + research
4. Reviewer → Validate the changes

Never write code yourself. Always delegate.
```

#### Model routing per agent
| Agent | Model | Rationale |
|-------|-------|-----------|
| Orchestrator | Strong reasoning (Opus) | Coordination |
| Researcher | Fast/cheap (Sonnet) | Codebase exploration |
| Coder | Strong coding (Codex) | Implementation |
| Reviewer | Reasoning-heavy (Opus) | Bug catching |

#### Key rules
- Restrict tools per agent — that's what keeps things clean
- Start with 3 agents, add more as needed
- Agent files live in `.github/agents/` or `.agents/` in the repo — shared by the whole team
- Separation of concerns: Planner doesn't code, Executor doesn't self-review, Reviewer doesn't plan

---

### 3. Agentic Game Builder — Two-Layer Validation

**Source:** https://github.com/Abbasam8910/Agentic-Game-Builder

#### Multi-agent architecture
```
Master Orchestrator (while-loop, Pydantic V2 state)
  ├── Clarifier   (Flash Lite) — extracts requirements, minimal questions
  ├── Planner     (Flash)      — structured JSON game design doc
  ├── Executor    (Flash)      — complete playable code
  └── Validator   (Flash)      — two-layer validation + self-healing retry
```

#### Two-layer validation
1. **Deterministic regex/structural checks** — fast, objective
2. **LLM semantic review** — slower, subjective but catches logic issues

#### Self-healing via smart retry
Validator can reject output and send it back to Executor with feedback (max 3 retries).

#### Key architectural decisions
- **Custom sequential orchestrator** (while loop + Pydantic state) instead of heavy frameworks (AutoGen/CrewAI) — trades "autonomous creativity" for deterministic control, no infinite loops
- **Strict JSON output** for Planner instead of YAML — eliminates indentation hallucination class of errors entirely
- **FinOps pivot** — moved from Claude Opus ($1.50+/run) to Gemini 2.5 Flash for cost; model routing per agent capability

---

### 4. Six-Agent GitHub-Coordinated Pipeline

**Source:** https://dev.to/alprimak/building-an-ai-agent-orchestrator-how-6-specialized-agents-coordinate-through-github-55gk

#### Six agents
| Agent | Role | Primary Responsibility |
|-------|------|----------------------|
| PM | Orchestrator | Triages issues, coordinates workflow |
| Architect | Technical Advisor | Reviews feasibility, architecture |
| Engineer | Builder | Writes code, creates PRs |
| Tester | Validator | Tests changes, catches bugs, approves |
| Marketing | Growth | Content, SEO, launch |
| Community | Support | Discord/Twitter, user assistance |

#### Pipeline state machine
```
backlog --> needs-architecture --> ready-for-dev --> in-progress -->
needs-testing --> needs-review --> done
```

#### GitHub as coordination layer
- PM agent sees new issue → triages → adds `needs-architecture` label
- Architect picks up → adds technical guidance → changes to `ready-for-dev`
- Engineer picks up → creates branch, writes code, opens PR → `needs-testing`
- Tester validates → approves → `needs-review` → `done`

---

### 5. Game Dev Studio Multi-Agent Workspace

**Source:** https://medium.com/@luoxiaojun1992/i-want-to-share-something-ive-been-building-game-dev-studio-an-ai-powered-multi-agent-workspace-5301fa318260

#### Six agents
| Agent | Role |
|-------|------|
| Game Designer | Creates design proposal (structured questionnaire) |
| CEO | Reviews and approves design |
| Architect | Designs system architecture |
| Engineer | Builds the game (Blender, Draw.io, ImageMagick tools) |
| Biz Designer | Business/design |
| Team Builder | Team coordination |

#### Key architecture
- **MCP (Model Context Protocol) custom tools** — ~50+ tools form the complete API surface; agents never call REST directly, everything flows through typed tool schemas with Zod validation
- **Event-driven UI** — all state changes broadcast via SSE
- **QA-gated delivery** — SonarQube + 20 custom engineering rules lint pipeline before submission

---

### 6. AGENTS.md Template: Multi-Agent Delivery Orchestration

**Source:** https://suhasbhairav.com/ai-skills/agents-md-templates/multi-agent-delivery-orchestration-agents-md-template

#### Roster
- Planner: defines goals, strategy, plan
- Implementer: executes tasks from the plan
- Reviewer: reviews artifacts and outputs
- Tester: validates results against requirements
- Researcher: gathers data and signals for decisions
- Domain Specialist: provides context for specialized areas

#### Supervisor/Orchestrator
Coordinates agent interactions, enforces constraints, stores context in canonical memory, triggers handoffs based on signals.

#### Handoff rules
- Planner → Implementer: when feasible plan produced
- Implementer → Reviewer/Tester: upon module completion
- Researcher/Domain Specialist → Planner: when new signals require replanning
- Any agent can escalate to Supervisor if constraints violated

#### Context/memory rules
- All decisions and outputs recorded in `/data/workflow-trace`
- Canonical source of truth = shared memory store
- Immutable artifacts with versioned identifiers

---

## Part B: Deterministic Game Testing & Replay Systems

### 1. Roguelike Engine — Deterministic Rule Engine as SUT

**Source:** https://github.com/Ariless/roguelike-engine

#### Testing techniques catalog

| Technique | Concrete scenario | Why it matters |
|-----------|-------------------|----------------|
| Property-based testing | `forAll(seeds) → hp ∈ [0, maxHp]` | Generates thousands of inputs; shrinks to minimal failing case |
| Seeded deterministic RNG | Same seed → same encounter | Any failing run reproducible exactly by seed |
| State machine coverage | alive → death_door → dead | Tests transitions, not just happy paths |
| Fault injection | Plant bug → property test catches it | Proves the test infrastructure notices bugs |
| Replay system | `replayGame(log).success === true` | Byte-perfect verification via pre/post state hashes per event |
| Metamorphic testing | `damage(lowHp) ≥ damage(highHp)` | Relations between inputs, not exact outputs |
| `it.fails()` false invariant | Intentionally failing test as domain spec | Documents rule violations; fails if someone "fixes" the wrong thing |
| Mutation testing | Stryker 84.6% coverage | Scope of mutation run is itself unaudited |
| Monte Carlo simulation | winrate per class, Wilson intervals | Statistical stability |
| Sampling-bias detection | `seed % 4` → only 4 of 16 configs scanned | Biased samples return plausible numbers nobody rechecks |
| NIST SP 800-22 / Diehard | RNG statistical battery as p-values | Proves RNG quality |
| LLM oracle | Claude evaluates semantic rule correctness | Semantic vs computational correctness |
| Meta-oracle | Tests the AI judge with known-correct/incorrect states | "Testing the test infrastructure" |
| Trace-driven discovery | `npm run trace` → top status combos + suggested invariants | "What to test" from real data |

#### Test suite structure (512 Vitest tests)
- resolution, statuses, heroes (4), executor, executor-property, replay, property, invariants, pipeline, action-resolution, rng, rng-statistical, stats/distributions, necromancer, economy, decision-tables
- Cucumber BDD (12 scenarios): stun, bleed, Death's Door, Paladin charges, Berserker Rage, Werewolf transform, false invariant
- Playwright (25): debugger, game, visual-regression

---

### 2. Pac-Man Deterministic Engine with Agent Driver

**Source:** https://github.com/g-t-georgiev/pacman (PR #7)

#### Key features
- **Deterministic engine with saved state and state hashes** — rolling recording; replays record their rules and state versions
- **Agent driver** (`window.pacmanAgent`) — script and inspect the game frame by frame, in browser or headless
- **F1 debug overlay** — frame stepping, speed recorder, tick-rate and input-latency readouts
- **Golden coverage** — 9 golden replays covering fruit, level clears, levels 17/21+, Elroy with deaths; each lists what it covers; test checks the list
- **Regression suite** — core contracts plus one test per fixed bug, run on every commit
- **End-to-end tests** — headless Chromium (Vitest browser mode): keys, pausing, panels, game-over rewind, siren, options, replay links, manual
- **CI** — GitHub Actions runs every test, golden check, build
- **Versions and releases** — game 0.1.0 shown in footer + manual header; versions table generated and checked by test + pre-commit hook; `commit-msg` hook requires Conventional Commit types; merge into main tags release

---

### 3. Deterministic Simulation in the Browser (Gridline)

**Source:** https://github.com/artsaraiva/gridline/issues/3

#### Architecture
```
sim/            pure TS, no DOM, no Math.random/Date/perf.now/Math.sin…
  detmath.ts    sin/cos/atan2 from exact ops; seeded PRNG (xoshiro128**)
  world.ts      entity arrays in ID order; step(world, commandsForTick)
  hash.ts       FNV/xxhash over state buffers
sim.worker.ts   fixed-tick driver; receives {tick, cmd}; posts snapshot buffers
render/         three.js; interpolates prev/curr snapshot by alpha; cosmetic Math.random OK
```

#### Rules
- **Prove determinism from day one** — state hash every N ticks + replay test (same seed + same commands → same hash) across Chromium, Firefox, WebKit via Playwright
- **Library admission** — a library is allowed in the sim only if it (a) never calls Math.random/wall clocks/JS transcendentals on sim data, (b) is deterministic given insertion order, (c) passes cross-browser replay-hash test
- **Own trig module** — the sim has its own trig module, seeded 32-bit RNG, no Math.random or clocks

---

### 4. Determinism Replay Tool & Hash Test

**Source:** https://github.com/techafreshh/scrapline (PR #43)

#### Implementation
- `replay.ts` — pure shared helper: `scriptedInput(tick)` deterministic input script + `replayHash(seed, ticks)` that builds `new World({seed})`, steps `ticks` times, returns `hash()`
- `sim-replay.ts` — CLI: parse `--seed`/`--ticks`, call `replayHash`, print `seed=<n> ticks=<n> hash=<h>`
- `determinism.test.ts` — 3600-tick seed-42 equality + seed-43 inequality

#### Key insight
Shared pure replay helper used by both CLI and test **eliminates script-drift by construction**.

---

### 5. AgentReplay — Deterministic Record/Replay for LLM Agents

**Source:** https://github.com/hassanzafarr/AgentReplay

#### Architecture
Intercept the four sources of non-determinism (LLM responses, tool results, clock, randomness), save to trace file, feed back on replay. Agent becomes deterministic program.

#### Event types
- llm_call, tool_response, clock, rng

#### Matching
Hybrid: content hash first, ordered cursor second, miss = reported divergence. Hash survives reordered code paths; cursor disambiguates identical repeated prompts (retry loops).

#### Key innovation
- **Tripwire model** — raises if called; proves zero live API calls during replay ($0 cost in CI)
- **3-tier diff** — structural / tool-call / LLM divergence report
- **pytest plugin** — turns `*.trace.json` files into test items

---

### 6. State Hash & Cross-Runtime Determinism Suite

**Source:** https://github.com/nic0lasm/frontfall (Issue #12)

- **32-bit state hash** over tile owners and player table, computed on demand and every 50 ticks
- **Golden replays** in `packages/engine/test/replays/` (seed, config, turns, expected hashes)
- **CI job** running golden replays in Node.js and through Playwright in Chromium, Firefox, WebKit

---

## Part C: ZX Spectrum / Retro AI Development

### 1. Marcobros128 — Claude AI ZX Spectrum 128K Game

**Source:** https://www.reddit.com/r/zxspectrum/comments/1rtjhpd/update_i_am_creating_a_128k_game_using_claude_ai/

#### Workflow
- Claude writes Z80 assembly → human runs assembler → loads in FUSE emulator → human describes what they see → Claude reads profiler output → repeat
- **Every build went through the human.** Every error, crash, "please build and tell me what happened."
- 8 days, 40 bug fixes, 20 versions (v0.1.0 → v0.7.4)
- Human provided manuals on programming, memory maps, chip datasheets, opcodes, assemblers (sjasmplus), compression methods, ROM profiles, FUSE snapshot

#### Key lesson from defixiones
> "It's a good idea to get Claude to keep a **memory map** and keep an eye on the graphics budget, particularly if you're pre-shifting sprites."

#### Tools
- z88dk C cross-compiler for Z80 + assembly routines for tricky parts
- Claude wrote tools for converting ZXP and Tiled documents to binary formats

---

### 2. FUSE Emulator with Socket for ML

**Source:** https://www.reddit.com/r/zxspectrum/comments/1r4cezf/fuse_emulator_fork_now_accepting_inputs_and/

- FUSE ZX Spectrum emulator fork accepts inputs and provides responses through a socket
- Memory Browser is modeless — shows memory contents changing while emulator runs
- Allows ML environment setup using memory state to determine actions

---

### 3. ZX-REAPER (Round 1, recap)

**Source:** https://github.com/ruguevara/zx-reaper
- Reverse engineering first: one prompt turns a game file (TAP/TZX) into annotated sources that rebuild byte-for-byte
- Deterministic engine with replays from day one = free regression tests, performance proofs, bug forensics
- Cross-vendor review every milestone
- Cap PR size: one task, one PR
- Understanding check-ins: compare agent's understanding with your specs
- No magic numbers: `@label` not `@equ`
- Agent narrates its own process into code

---

### 4. antirez — Z80/ZX Spectrum Emulator with Claude Code (Round 1, recap)

**Source:** https://antirez.com/news/160
- Write spec markdown file first (English, high-level scope)
- Rules file: agent must follow rules (never stop for prompting, commit solid progress, test before committing)
- Agent writes its own documentation
- WIP log: what's done, what's missing — update and read often, especially after context compaction
- Read spec again after context compaction (agents forget)
- Test vectors: provide .z80 images so agent can test against real software
- Refactoring loops: targeted refactors when agent misses timing/abstraction

---

## Part D: Effective Prompts & Patterns (Expanded)

### Prompt: Multi-agent role assignment
> "You are the Orchestrator. For this task: (1) Planner creates the implementation plan with file-level detail, (2) Researcher finds existing patterns in src/game/engine.ts and src/game/levels.ts, (3) Coder implements following RULES.md (deterministic, no Math.random, zero DOM in engine), (4) Reviewer validates against the stepWorld contract. Never write code yourself — always delegate."

### Prompt: Deterministic test-first
> "Write the acceptance test BEFORE the code: fresh clone opens without errors, input works, three consecutive runs complete identically, restart under two seconds. Then implement the `{feature}` slice. Commit only after all tests pass. List exactly which files changed and how you verified determinism."

### Prompt: Frame-hash regression
> "Add a state-hash regression test for the `{mode}` play mode: run N frames with a scripted input, hash the full GameWorld state, compare against a recorded golden hash. Any divergence fails CI. Use FNV-1a over the state buffer."

### Prompt: Cross-vendor review
> "Review this code as an independent reviewer from a different vendor. Focus on: determinism violations (Math.random, Date, performance.now), attribute clash rule breaches, stepWorld contract drift, HUD snapshot consistency. Do not fix the 3 pre-existing App.tsx:576 errors — just note them."

### Prompt: Memory map discipline
> "Maintain a MEMORY_MAP.md documenting: sprite budget (8x8 tiles, 15-color ULA), attribute clash limits (max 2 colors per 8x8 block), particle pool (128) and afterimage pool (16) usage, and any pre-shifting of sprites. Update it when adding new visual effects."

---

## Part E: Missing / Underused Practices for Our Project

Comparing our current implementation (Gates 0–5 complete + PR #2 merged) against all research:

| # | Practice | Source | Value for Zúbok a signálik | Adoption |
|---|----------|--------|---------------------------|----------|
| 1 | **Multi-agent role roster** (PM/Architect/Lead/QA/Security/DevOps) | dev.to maxxmini | Formalize gate ownership; QA writes tests before Lead Dev implements | ⭐ High |
| 2 | **Copilot .agent.md orchestration files** | Simform/Medium | Planner/Researcher/Coder/Reviewer agent files in repo; model routing per agent | ⭐ High |
| 3 | **Two-layer validation** (deterministic + LLM semantic) | Agentic Game Builder | Validate engine changes with regex + LLM review; self-healing retry | ⭐ Medium |
| 4 | **Agent WIP log** | antirez | Track what agent did per session; read after context compaction | ⭐ Medium |
| 5 | **Rules file re-read after compaction** | antirez | Re-anchor agent to RULES.md after long sessions | ⭐ Medium |
| 6 | **Test scenes + debug overlay** | r/aigamedev | Headless tests exist but no visual debug overlay for agent to "see" results | ⭐ Medium |
| 7 | **Frame-hash regression tests** | zx-reaper, roguelike-engine, Pac-Man, Gridline | Per-frame state hashing against golden runs; catches subtle wave/relay regressions | ⭐ High |
| 8 | **Property-based testing** | roguelike-engine | `forAll(seeds)` invariants for wave spawning, charge thresholds | ⭐ Medium |
| 9 | **Fault injection** | roguelike-engine | Plant bugs (e.g., wrong charge threshold) to prove tests catch them | ⭐ Medium |
| 10 | **LLM oracle + meta-oracle** | roguelike-engine | Claude evaluates semantic rule correctness; test the AI judge | ⭐ Low |
| 11 | **GitHub-issue state machine pipeline** | dev.to alprimak | backlog → needs-architecture → ready-for-dev → in-progress → needs-testing → needs-review → done | ⭐ Medium |
| 12 | **Memory map discipline** | r/zxspectrum | Sprite/attribute budget tracker as we add particles/afterimages | ⭐ Medium |
| 13 | **Builder + critic /loop** | r/aigamedev | Harsh-critic sub-agent for balance tuning (charge 0.5, hubHp 3) | ⭐ Medium |
| 14 | **Named RNG streams** | valorant-sim | Forked RNG streams from scenario seed for procedural wave variation | ⭐ Low |
| 15 | **Deterministic record/replay for agent sessions** | AgentReplay | Record LLM calls + tool results + clock/RNG for offline replay of agent work | ⭐ Low |
| 16 | **Cross-browser replay-hash test** | Gridline, frontfall | Run determinism tests in Chromium/Firefox/WebKit via Playwright | ⭐ Low |

---

## Part F: Recommended Next Steps for Zúbok a signálik

### Immediate (this session)
1. **Add .agent.md orchestration files** — Planner, Researcher, Coder, Reviewer in `.agents/` directory
2. **Add frame-hash regression test** — `scripts/determinism-check.mjs` pattern (already validated: 3x identical runs → victory, score 225)
3. **Create MEMORY_MAP.md** — sprite budget, attribute clash limits, particle/afterimage pool usage

### Short-term (next 1-2 gates)
4. **Property-based tests for wave_defense** — `fast-check` style `forAll(seeds)` invariants
5. **Fault injection tests** — plant a wrong charge threshold (0.3 instead of 0.5), prove tests catch it
6. **Builder + critic loop for balance** — harsh-critic sub-agent reviews wave compositions before committing

### Medium-term
7. **Cross-vendor review** — independent agent reviews every milestone PR
8. **Agent WIP log** — `docs/agent-wip.log` updated each session, read after context compaction
9. **Deterministic agent session replay** — AgentReplay-style trace of LLM calls + tool results for offline debugging

---

## Part G: Source Index

| # | Source | URL | Key Takeaway |
|---|--------|-----|-------------|
| 1 | dev.to maxxmini | https://dev.to/maxxmini/i-built-a-full-game-in-one-day-using-ai-agents-heres-what-happened-3c3o | Multi-agent TDD pipeline, 30-min cycles |
| 2 | Simform Medium | https://medium.com/simform-engineering/your-ai-agents-dont-need-more-power-they-need-orchestration | .agent.md orchestration, model routing |
| 3 | Agentic Game Builder | https://github.com/Abbasam8910/Agentic-Game-Builder | Two-layer validation, self-healing retry, JSON planner |
| 4 | dev.to alprimak | https://dev.to/alprimak/building-an-ai-agent-orchestrator-how-6-specialized-agents-coordinate-through-github-55gk | GitHub issue state machine pipeline |
| 5 | Medium luoxiaojun | https://medium.com/@luoxiaojun1992/i-want-to-share-something-ive-been-building-game-dev-studio-an-ai-powered-multi-agent-workspace-5301fa318260 | MCP tools, QA-gated delivery, 6-agent studio |
| 6 | suhasbhairav | https://suhasbhairav.com/ai-skills/agents-md-templates/multi-agent-delivery-orchestration-agents-md-template | AGENTS.md roster, supervisor, handoff rules |
| 7 | Ariless/roguelike-engine | https://github.com/Ariless/roguelike-engine | Property tests, fault injection, LLM oracle, meta-oracle |
| 8 | g-t-georgiev/pacman | https://github.com/g-t-georgiev/pacman (PR #7) | Golden replays, agent driver, versions, conventional commits |
| 9 | artsaraiva/gridline | https://github.com/artsaraiva/gridline (Issue #3) | Pure TS sim, no Math.random, own trig module |
| 10 | techafreshh/scrapline | https://github.com/techafreshh/scrapline (PR #43) | Shared replay helper eliminates script drift |
| 11 | hassanzafarr/AgentReplay | https://github.com/hassanzafarr/AgentReplay | Deterministic record/replay, tripwire model, 3-tier diff |
| 12 | nic0lasm/frontfall | https://github.com/nic0lasm/frontfall (Issue #12) | 32-bit state hash every 50 ticks, golden replays |
| 13 | r/zxspectrum Marcobros128 | https://www.reddit.com/r/zxspectrum/comments/1rtjhpd | Memory map discipline, human-in-the-loop build |
| 14 | r/zxspectrum FUSE socket | https://www.reddit.com/r/zxspectrum/comments/1r4cezf | Emulator as ML environment via socket |
| 15 | ruguevara/zx-reaper | https://github.com/ruguevara/zx-reaper | Reverse engineering first, deterministic replays |
| 16 | antirez.com/news/160 | https://antirez.com/news/160 | Spec markdown, rules file, WIP log, test vectors |
| 17 | r/aigamedev | Multiple threads | Acceptance tests first, builder+critic, design doc first |

---

*End of expanded research. This document should be revisited before each development gate to keep agent understanding aligned with the spec and prevent drift.*
