# AI-Agent Game Development Research — Final Edition

## Overview

Comprehensive research on AI-agent driven game development for retro/ZX Spectrum-style deterministic engines. Synthesized from **three research rounds** across GitHub, Reddit (r/aigamedev, r/gamedev, r/zxspectrum, r/codex, r/AI_Agents), Medium, DEV Community, Tessl registry, and antirez.com.

**Date:** 2026-11-20
**Companion docs:** docs/ai-agent-gamedev-research.md (Round 1), docs/ai-agent-gamedev-research-expanded.md (Round 2)
**Status:** Reference material for continuing development on Zúbok a signálik

---

## Part A: The Agent Game-Master Split (Highest Value Idea)

**Source:** https://forum.achivx.com/threads/the-agent-game-master-split-a-deterministic-rules-engine-the-model-must

### Core concept

Split the system into two layers with a **hard structural boundary**, not a prompt instruction:

| Layer | Responsibility | Can it mutate state? |
|-------|---------------|---------------------|
| **Deterministic Rules Engine** | Validates and commits proposals against adjacency graph, resource constraints, action whitelist | YES (sole authority) |
| **Narrative Layer** (the AI agent) | Proposes actions, describes state deltas, improvises flavor text | NO — read-only view |

### Tool-call contract

The engine exposes exactly ONE tool to the agent: `validate_and_commit(proposal)`. It returns:
- `committed: bool` — did the proposal pass validation?
- `reason: str` — machine-readable rejection cause
- `state_delta: dict` — **what changed, never full state** (prevents agent hallucinating unseen state)
- `state_hash: str` — tamper-evidence chain (`sha256(json(state))[:16]`)

### Measured results (10 adversarial proposals)

| Proposal Category | Rejected | Rate |
|-------------------|----------|------|
| Valid moves (adjacent) | 1/3 | 33% (position-dependent) |
| Invalid moves (non-adjacent/nonexistent) | 3/3 | 100% |
| Direct state mutations (override_hp) | 4/4 | 100% |
| Unknown actions (teleport, resurrect, duplicate_gold, modify_rules) | 4/4 | 100% |

### Why this matters for Zúbok a signálik

Our `stepWorld(world, dtSec, input)` is already the deterministic rules engine. The agent should never directly mutate `world` fields — it should only propose inputs through the `stepWorld` contract. We should formalize this:

1. **Agent proposes input** (via `InputState`), engine commits via `stepWorld`
2. **Agent receives only `HudSnapshot`** (a read-only projection), never direct `GameWorld` access
3. **State hash chain** after each step — `sha256(canonical(world))` returned alongside hud, enabling tamper detection if the agent tries out-of-band mutation

### Implementation sketch

```ts
// The agent's only window into the world
interface AgentView {
  hud: HudSnapshot;           // read-only projection
  stateHash: string;          // tamper-evidence chain
  stepResult: StepResult;     // committed: bool, reason, delta, hash
}

// Agent proposes; engine validates and commits
function agentStep(world: GameWorld, proposal: InputState): AgentView {
  const before = canonicalHash(world);
  stepWorld(world, dtSec, proposal);
  const after = canonicalHash(world);
  return {
    hud: getHudSnapshot(world),
    stateHash: after,
    stepResult: { committed: true, reason: 'ok', delta: {}, hash: after },
  };
}
```

---

## Part B: Deterministic Replay & Golden Master Testing

### 1. Gameplay Recording/Replay (testland)

**Source:** https://tessl.io/registry/testland/gameplay-recording-replay

| Practice | Detail |
|----------|--------|
| Record input-only, not full state | Smaller files, true determinism test |
| Seed RNG and put seed in replay header | Prevents divergence by frame ~30 |
| Embed `replay_format` + `build_hash` in header | Distinguishes real regressions from stale replays |
| Assert at coarse checkpoints (every N seconds), not per-frame | Avoids float-precision false positives |
| Commit replay + baseline.hash as a pair | Asserts something meaningful |
| Split long replays into checkpointed mini-replays | Keeps CI time bounded |
| Anti-pattern: per-frame state comparison | False positives from float drift |

### 2. Golden Replays with State Hash (Bastion Heroes / Red Frontier)

**Sources:** 
- https://github.com/FatlindAzemi/bastion-heroes (Issue #23)
- https://github.com/iant89/red-frontier (PR #41)

| Practice | Detail |
|----------|--------|
| 3 golden replays per level (idle, economy, result/won) | Covers different play paths |
| `src/sim/hash.ts` computes stable hash of SimState | FNV-1a 32-bit, canonical field-by-field snapshot |
| Hash every 300th tick + final frozen tick | Periodic divergence detection |
| Hash includes RNG state, ids, entity/timers, wave/traps/status | Complete state capture |
| Hash excludes only `rng.next` (unobservable) and presentation wording | Reword-proof |
| Entity arrays sorted by id, canonical JSON with sorted keys | Deterministic serialization |
| Tests run each golden twice; compare hashes | Proves determinism |
| Regenerate goldens only with stated reason in PR | Prevents silent hash drift |
| `StateHash.ts` hashes **live state**, not `snapshot()` | Persistence bugs can't hide |

### 3. Time-Travel Debugging for AI Agents

**Source:** https://dev.to/bennialencar/time-travel-debugging-for-ai-agents-deterministic-trajectory-replay-and-counterfactual-forking-at-347k

| Practice | Detail |
|----------|--------|
| Content-addressed trajectory frames with SHA-256 chain hash | Each frame links to parent hash |
| Frame = {step, kind, input_payload, output_payload, parent_hash, frame_hash} | Immutable, verifiable |
| **Zero-token replay** — replay traces offline at <2ms per trajectory | CI regression without API cost |
| **Counterfactual forking** — rewind to step k, mutate one variable, resume from k+1 | Test "what if" scenarios cheaply |
| Export trace diffs as deterministic pytest fixtures | Exact failure modes never regress |
| Tripwire model — proves zero live API calls during replay | $0 cost in CI |

### 4. State Hash & Cross-Runtime Determinism (frontfall)

**Source:** https://github.com/nic0lasm/frontfall (Issue #12)

- 32-bit state hash over tile owners and player table, computed on demand and every 50 ticks
- Golden replays in `packages/engine/test/replays/` (seed, config, turns, expected hashes)
- CI runs golden replays in Node.js AND through Playwright in Chromium, Firefox, WebKit

### Recommended for our project

Add to `src/game/`:
1. `src/game/hash.ts` — `canonicalHash(world: GameWorld): string` (FNV-1a over sorted canonical JSON)
2. `src/game/replay.ts` — record scripted input traces, replay + hash compare
3. `src/game/modes/*/replays/` — 3 golden replays per mode (deploy_select, timed_arena, relay_repair, wave_defense)
4. CI check: run each golden replay twice, assert identical hashes

---

## Part C: Strict Simulation / Input / Presentation Separation

**Source:** https://github.com/Coarisfinia/khovax (Issue #26)

### Target model

| Layer | Responsibility | Constraints |
|-------|---------------|-------------|
| **Simulation** (`sim/`) | `step(state, commands) -> state` at fixed tick rate | Plain classes, no nodes, integers only, one seeded RNG inside state, no Input/Time/Engine/frame delta/global randf, state hashable |
| **Commands** | Only thing crossing into simulation | Small integer values per player per tick; recording commands + seed = a replay |
| **Input layer** (`input/`) | Turns devices into commands | Direction vectors, stick input, controller mapping — out of simulation |

### CI enforcement

- `sim/` scripts don't extend nodes, don't touch Input/Time/Engine/OS/randf/randi/frame delta
- Don't use floats for game logic (grid coordinates, durations in ticks as integers)
- E2E replay check: same seed + commands → same state hash, run twice

### Why this matters for us

Our `engine.ts` already separates simulation from renderer (`renderer.ts`), but the boundary isn't formally enforced. We should:

1. Add a CI check that `engine.ts` has no DOM dependencies (already true, but worth automating)
2. Ensure all game logic uses integers where possible (tile coordinates, frame counts)
3. Document that `stepWorld` is the sole state transition function — nothing else mutates `GameWorld`

---

## Part D: AGENTS.md & Rules Infrastructure (Round 3 findings)

### 1. open-realm AGENTS.md (corepunch)

**Source:** https://github.com/corepunch/open-realm/blob/main/AGENTS.md

| Rule | Detail |
|------|--------|
| One representation for one concept | No parallel arrays/fallback modes |
| Memory-mapped/file-shaped structs for trusted binary data | Read blob, point consumers at struct |
| DDX-style schema tables for keyed/columnar/tagged data | XML, FDF, catalogs, DBC, CSV |
| Verify with automated tests, not launching the game | Headless test runner, production entry points |
| Never use `#ifdef SC2/WOW/WC3` in shared engine files | Game-specific code in `games/<game>/` via vtable boundary |
| Game logic stays in game module | Never evaluate game behavior in client/ |
| Client mirrors accept multiple chunks per frame | No later chunk overwrites earlier dirty range |
| AGENTS.md = concise index; detailed docs in `docs/` | `docs/architecture/`, `docs/games/<game>/` |

### 2. WebGameTemplateForAgents (ludenio)

**Source:** https://github.com/ludenio/WebGameTemplateForAgents

**File structure:**
```
├── AGENTS.md                # Coding agent rules: workflow, guard behavior, coding standards
├── AGENTS_WORKSHOP_GUIDE.md # Beginner-friendly workshop guide
├── ARCHITECTURE.md          # Code architecture: store API, patterns, file structure
├── DESIGN_RULES.md          # Game design principles: balance, UX, progression
├── FIRST_PROMPT.md          # Template: first message to the agent (new game)
├── NEXT_ITERATION_PROMPT.md # Template: subsequent messages (changes, new features)
└── src/
    ├── index.html       # Entry point (works via file:///)
    ├── main.js          # Game loop skeleton
    └── store/
        └── store.js     # State management engine
```

**Key constraints:**
- No server required (file:/// works)
- No ES modules (IIFEs + window globals)
- **Deterministic replay**: all randomness through seeded PRNG (`store.prng.next()`), `Math.random()` forbidden
- Game sessions can be saved and replayed identically
- Mutable UDF + Deterministic Lockstep: one mutable state object, dispatched events logged for replay

### 3. Agent.md (Aaditya1273)

**Source:** https://github.com/Aaditya1273/Agent.md

Security layer for agent instruction files (AGENTS.md, CLAUDE.md, etc.):

| Feature | Detail |
|---------|--------|
| 26 deterministic checks on every file an agent reads | Leaked keys, prompt injection, invisible Unicode, hidden HTML comments, look-alike packages, untrusted install sources, unpinned MCP servers, shell-wide permission grants, contradictions, file-vs-code drift, duplicate skills, bloat, dead references, stale pins |
| SessionStart hook re-injects hard rules after every `/compact` | Rules survive context compaction |
| Enforce "never" lines as real `permissions.deny` rules | Not just prose |
| Runtime guard before every tool call | Irreversible actions pause for a person; refusals are signed |
| Pre-install gate for pip/npm/uv | Typosquats, separator confusion, untrusted indexes, known-vulnerable pins |
| Learn from session logs | Proposes repeated corrections as rules |
| Short-lived narrowed credentials | AWS session policy, one-repo GitHub App token |
| Signed context bundles (Ed25519) | CI fails on any change to approved instruction files |
| Context bill of materials (CycloneDX 1.6) | Every instruction file, rule, skill, script, subagent, hook, MCP server, permission grant |

### 4. agent-workflow (PrjctUp)

**Source:** https://github.com/PrjctUp/agent-workflow

**Repository gets:**
```
AGENTS.md                         managed block + Project section (map, checks, protected areas, invariants, git policy)
.agent-workflow/WORKFLOW.md       how agents work (orient, reuse, place, scope, verify, git, edge cases)
.agent-workflow/CODE_QUALITY.md   what clean code looks like, for any language
.agent-workflow/commands/*.md     do · integrate · clean-code · review · dupes · map · install · update
.github/pull_request_template.md  the final report as PR template
```

**Commands:**
| Command | What it does |
|---------|-------------|
| `do <anything>` | Picks and runs the right sub-commands |
| `integrate <task>` | Orient, plan, reuse, place, check, self-review, report |
| `map` | Build/refresh repository project map in AGENTS.md |
| `clean-code [target]` | Bring code up to CODE_QUALITY.md without changing behavior |
| `review [range]` | Three-pass review: integration, simplicity, correctness |
| `dupes [area]` | Find functionality that exists more than once (report only) |

**Agent behavior:**
1. Read AGENTS.md and rules
2. Search code for what already exists
3. Stop and report if feature already exists
4. Write short plan: where it goes, what it reuses, which files change
5. Ask first if new folder/dependency/protected area needed
6. Implement in right place, in style of surrounding code
7. Run project checks, clean up, self-review

### 5. Agentic OS (KbWen)

**Source:** https://github.com/KbWen/agentic-os

Five-step workflow where **no step counts as done without evidence**:
1. Plan → 2. Build → 3. Review → 4. Test → 5. Ship
- Phase sequencing, evidence requirements, scope discipline
- Single source of truth that remembers decisions across sessions
- Model-agnostic Markdown (CLAUDE.md, AGENTS.md, GEMINI.md)
- What's enforced (fails commit/CI): leaked secrets, missing tests
- What's guidance: phase sequencing, scope discipline

### 6. Agentic Coding Flywheel

**Source:** https://agent-flywheel.com/complete-guide

**AGENTS.md core rules:**
1. Rule 0: Human override prerogative
2. Rule 1: No file deletion without permission
3. No destructive git commands (`git reset --hard`, `git clean -fd`, `rm -rf`)
4. Branch policy: all work on main
5. No script-based code changes (make changes manually)
6. No file proliferation (no `mainV2.rs` or `main_improved.rs`)
7. Compiler checks after changes
8. Multi-agent awareness: never stash/revert/overwrite other agents' changes

**Layered context:**
- Markdown plan: whole-system intent and reasoning
- Beads: executable task structure + embedded local context
- AGENTS.md: operating rules + tool knowledge (survives compaction)
- Codebase: implementation (too large to be primary planning medium)

**Review answers four questions** after each bead/completion.

---

## Part E: Reddit r/aigamedev — Proven Workflows (Round 3)

### 1. "I own the direction and architecture" (CalebKious, FateMMO)

| Practice | Detail |
|----------|--------|
| Human owns direction and architecture before implementation | AI can challenge/improve but doesn't set vision |
| Work inside existing project, not disposable prototypes | Features must integrate with existing systems |
| Bounded problems with concrete acceptance criteria | "Inspect existing architecture, implement X, preserve Y invariants, handle edge cases, add tests, build, investigate regressions" |
| **Screenshot feedback + specific criticism** | "This panel is too tall," "This spacing doesn't match," "Keep this part but move interaction here" |
| Periodic cross-system audits | "Compare current implementation against documented architecture. Identify contradictions, duplicated concepts, stale documentation, violated ownership boundaries." |
| **Actually play the game. A lot.** | Don't build 30 pieces then assemble — build one game, establish architecture, make every task prove it belongs |

### 2. "Make a system, not a game" (Bratchan)

> "Instead of asking the AI to make a weapon, ask yourself 'what is a weapon in my game, what variables does it use, how do we get it, what does it look like?' So that you can create and tweak whatever weapon you want."

### 3. Spec-driven development (armouredspy)

- Planning AI model produces: **Design Document** (all systems + how they work together) + **Roadmap** (phases/subphases ordered by dependency)
- Subphases sized to finish in **one session**
- After each subphase: run game, play around, look for obvious bugs
- **Checkpoints between subphases** — good places for human to jump in and check work

### 4. "The secret prompt" patterns (r/aigamedev)

| Pattern | Prompt approach |
|---------|----------------|
| Use references | "Use the project at projects/old-project as an example for spritesheet animation" |
| Multiple small focused prototypes | Instead of "build Diablo 2": build isometric character sprite → controls → hp/mana system → attack button → enemy → combine |
| GDD first, then plan | "Read the GDD and create a multi-phased plan. After each Phase, I want to have a deliverable I can test and validate." |
| Brutal critic sub-agent | "Iterate with a brutal AAA art critic sub agent, 8 rounds or 9/10 score whichever comes first" |
| Plan → Document → Build | Complete project plan with skills, MCPs, integrations; player testing throughout |
| GDD is Law | All development adheres strictly to GDD architecture and specs |
| Project kick-off prompt | Defines roles, workflow loop, single focused task at a time |
| Session handoff prompt | For continuity across chat sessions |
| System not game | Build the engine/system around variables and features, then create content |

### 5. "I dont even understand how people use AI to code" (r/gamedev)

| Anti-pattern | Correct approach |
|-------------|------------------|
| "Build me a game" (offload architecture to AI) | Human designs architecture, breaks into features/tasks, directs AI to implement |
| AI makes perfect UI then lore then gameplay | Create a fun loop first; build per feature |
| Agent makes architectural decisions | Human decides first, includes decision in prompt; agent boxes into context |
| Broad scope for code you don't care about | Small targeted work items within context window |

---

## Part F: Effective Prompts for Our Project (Synthesized)

### Prompt 1: Project Kick-off (from r/aigamedev)

```
Hello. You are my expert senior game developer, specializing in retro ZX Spectrum-style deterministic engines (256x192px, 15-color ULA palette). I will be your Project Manager and QA Tester. Together, we will build the Service Incident Arc (Stage 7) following docs/service-incident-arc-design.md.

**Core Operating Procedure:**
1. The design doc is Law. All development adheres strictly to it.
2. Your role: read the design doc and provide every step required to build each feature.
3. My role: I review, approve, and test each deliverable.
4. Workflow loop: You give me ONE focused task. I review it. We do not move on until the current task is 100% complete and verified.
5. Tests first: write the acceptance test before the code. npm test must pass 0 failed after every change.
6. Determinism: no Math.random() anywhere in engine.ts/music.ts/levels.ts. All randomness seeded from config/grid.
7. Zero DOM dependencies in engine.ts and music.ts.
```

### Prompt 2: Screenshot Feedback + Specific Criticism

```
Here's a screenshot of the current [HUD element / game state]. Specific criticism:
- [Element] is too [tall/wide/bright/dim]
- [Spacing] doesn't match [reference element]
- Keep [this part], but [move/change] [this direction]
- The [charge meter / wave counter / timer] should [behavior description]

Do not change anything else. Keep [unchanged parts] exactly as they are.
```

### Prompt 3: Cross-System Audit (from CalebKious/kyazici)

```
Compare the current implementation against docs/service-incident-arc-design.md. Identify:
- Contradictions between code and spec
- Duplicated concepts across modes
- Stale documentation
- Partially migrated systems
- Violated ownership boundaries (agent directly mutating GameWorld instead of via stepWorld)
- Places where recent implementations changed the intended design

Do NOT modify anything yet. Report discrepancies and recommended resolution, grouped by severity.
```

### Prompt 4: Test-First Slice

```
Implement the `{feature}` slice following RULES.md:
1. Write the acceptance test FIRST (before any implementation code)
2. Test must: fresh clone opens without errors, input works, three consecutive runs complete identically
3. Implement only what's needed to make the test pass
4. Commit only after all tests pass
5. List exactly which files changed and how you verified determinism
```

---

## Part F: Missing / Underused Practices Matrix

| # | Practice | Source(s) | Priority | Value for Zúbok a signálik |
|---|----------|-----------|----------|---------------------------|
| 1 | **Agent game-master split** — stepWorld as sole state authority, HudSnapshot as read-only view, state hash chain | achivx forum | ⭐⭐⭐ Critical | Prevents agent from bypassing game rules; formalizes our existing contract |
| 2 | **Golden replays + state hash** — 3 per mode, FNV-1a hash, every N ticks + final | bastion-heroes, red-frontier, frontfall | ⭐⭐⭐ Critical | Free regression tests; catches subtle wave/relay behavior changes |
| 3 | **Strict sim/input/presentation separation** — CI enforces engine.ts boundaries | khovax | ⭐⭐⭐ Critical | Already largely true; worth automating as CI check |
| 4. | **Counterfactual forking of agent traces** — rewind to step k, mutate, resume | dev.to agent-trace-replay | ⭐⭐ High | Test "what if" balance changes cheaply (charge 0.3 vs 0.5) |
| 5 | **.agent-workflow/ commands** (do, integrate, clean-code, review, dupes, map) | PrjctUp | ⭐⭐ High | Standardizes how agents approach each task |
| 6 | **Screenshot feedback + specific criticism** | CalebKious | ⭐⭐ High | We can't screenshot in headless, but can use HudSnapshot diffs as "visual" feedback |
| 7 | **AGENTS.md as concise index; detailed docs in docs/** | open-realm | ⭐⭐ High | We already do this; worth formalizing |
| 8 | **First/Next iteration prompt templates** | ludenio | ⭐⭐ Medium | Standardize how we start each agent session |
| 9 | **Security checks on agent instruction files** | Agent.md | ⭐⭐ Medium | 26 deterministic checks on AGENTS.md, rules files |
| 10 | **Five-step workflow with evidence** (plan→build→review→test→ship) | Agentic OS | ⭐⭐ Medium | No step done without evidence |
| 11 | **Checkpoints between subphases** | armouredspy | ⭐⭐ Medium | Human review points between gate transitions |
| 12 | **Periodic cross-system audits** | CalebKious | ⭐⭐ Medium | Compare code vs spec; find contradictions, duplicated concepts |
| 13 | **GDD is Law + Project kick-off prompt** | r/aigamedev | ⭐⭐ Medium | We have design doc; could formalize as kick-off prompt |
| 14 | **Make a system, not a game** | Bratchan | ⭐ Medium | Build the engine/system first, then content |
| 15 | **Signed context bundles / SBOM** | Agent.md | ⭐ Low | Provenance for instruction files |
| 16 | **Cross-browser replay-hash test** | frontfall, Gridline | ⭐ Low | Run determinism tests in Chromium/Firefox/WebKit |

---

## Part G: Recommended Immediate Actions

### This session (highest impact)

1. **Add `src/game/hash.ts`** — `canonicalHash(world)` using FNV-1a over canonical JSON (sorted keys, sorted entity arrays)
2. **Add `src/game/replay.ts`** — record scripted inputs, replay + hash compare against golden
3. **Create 3 golden replays per mode** — `src/game/modes/*/replays/*.json` (idle, mid-flow, complete)
4. **Add CI determinism test** — run each golden twice, assert identical hashes

### Next session

5. **Formalize agent game-master split** — document that `stepWorld` is the sole state authority; agent receives only `HudSnapshot`
6. **Add `.agent-workflow/` commands** — `integrate`, `review`, `clean-code`, `map`
7. **Add state-hash to HudSnapshot or AgentView** — tamper-evidence chain visible to agent

### Ongoing

8. **Cross-system audit before each gate** — compare code vs `docs/service-incident-arc-design.md`
9. **Screenshot-equivalent feedback** — use HudSnapshot field diffs as "visual" criticism to agent
10. **Checkpoint between subphases** — human review at each gate boundary

---

## Part H: Source Index (All 3 Rounds)

| # | Source | URL | Key Idea |
|---|--------|-----|----------|
| 1 | achivx forum | https://forum.achivx.com/threads/the-agent-game-master-split | Deterministic rules engine vs narrative layer; validate_and_commit tool |
| 2 | tessl.io testland | https://tessl.io/registry/testland/gameplay-recording-replay | Input-only replay, seeded RNG, checkpoint assertions |
| 3 | dev.to bennialencar | https://dev.to/bennialencar/time-travel-debugging-for-ai-agents | Content-addressed trajectory frames, counterfactual forking, zero-token replay |
| 4 | github.com/revanthpuvanes/living-ai-town | https://github.com/revanthpuvanes/living-ai-town | Event-sourced world engine, deterministic ticks, state-hash verification |
| 5 | github.com/FatlindAzemi/bastion-heroes | https://github.com/FatlindAzemi/bastion-heroes (Issue #23) | 3 golden replays per level, FNV-1a hash, hash every 300 ticks |
| 6 | github.com/iant89/red-frontier | https://github.com/iant89/red-frontier (PR #41) | StateHash live state (not snapshot), cyrb53, canonical JSON sorted keys |
| 7 | github.com/Coarisfinia/khovax | https://github.com/Coarisfinia/khovax (Issue #26) | Strict sim/input/presentation separation, integers only, CI boundary enforcement |
| 8 | github.com/corepunch/open-realm | https://github.com/corepunch/open-realm/blob/main/AGENTS.md | One representation per concept, docs/ structure, AGENTS.md as index |
| 9 | github.com/ludenio/WebGameTemplateForAgents | https://github.com/ludenio/WebGameTemplateForAgents | AGENTS.md + ARCHITECTURE.md + DESIGN_RULES.md + prompt templates |
| 10 | github.com/Aaditya1273/Agent.md | https://github.com/Aaditya1273/Agent.md | 26 deterministic checks, SessionStart hook, signed context bundles |
| 11 | github.com/PrjctUp/agent-workflow | https://github.com/PrjctUp/agent-workflow | .agent-workflow/ commands, three-pass review, project map |
| 12 | github.com/KbWen/agentic-os | https://github.com/KbWen/agentic-os | Five-step workflow with evidence, phase sequencing |
| 13 | agent-flywheel.com | https://agent-flywheel.com/complete-guide | AGENTS.md core rules, layered context, review four questions |
| 14 | r/aigamedev CalebKious | https://www.reddit.com/r/aigamedev/comments/1vtpgo6 | Human owns architecture, screenshot feedback, cross-system audits, play the game |
| 15 | r/aigamedev Bratchan | https://www.reddit.com/r/aigamedev/comments/1vbr5hi | Make a system not a game, acceptance tests before code |
| 16 | r/aigamedev armouredspy | https://www.reddit.com/r/aigamedev/comments/1v8za8g | Spec-driven dev, design doc + roadmap, one-session subphases, checkpoints |
| 17 | r/aigamedev secret prompts | https://www.reddit.com/r/aigamedev/comments/1wyj43h | References, GDD first, brutal critic, GDD is Law, kick-off prompt |
| 18 | r/gamedev | https://www.reddit.com/r/gamedev/comments/1vsgym6 | Human designs architecture, small targeted items, modular components |
| 19 | ruguevara/zx-reaper | https://github.com/ruguevara/zx-reaper | Reverse engineering first, deterministic replays, cross-vendor review |
| 20 | antirez.com/news/160 | https://antirez.com/news/160 | Spec markdown, rules file, WIP log, test vectors |
| 21 | Multiple (Rounds 1-2) | Various | Play-mode type foundation, partner charge, wave defense, relay repair, deploy select |

---

*End of final research document. These ideas are ready to be adopted into the Zúbok a signálik development workflow.*
