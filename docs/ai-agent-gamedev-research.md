# AI-Agent Game Development Research

## Overview

Research from GitHub and Reddit (r/aigamedev, r/gamedev, r/zxspectrum) on how AI agents are being used to develop games — especially retro/ZX Spectrum-style engines like Zúbok a signálik. Compiled to capture effective tips, tricks, prompts, and practices we can adopt or avoid.

**Date:** 2026-11-20
**Sources:** GitHub repositories, Reddit threads, Medium article, antirez.com

---

## 1. The ZX-REAPER Method (ZX Spectrum reverse engineering with agents)

**Source:** https://github.com/ruguevara/zx-reaper
**Relevance:** Highest — directly applicable to our ZX Spectrum / Didaktik M engine.

### Key practices

| Practice | Description |
|----------|-------------|
| **Reverse engineering first** | One prompt turns a game file (TAP/TZX) into annotated, readable sources that rebuild it byte-for-byte. Start from the original, not from scratch. |
| **Deterministic engine with replays from day one** | "Build a deterministic engine with replays from day one. That gives you free regression tests, performance proofs and bug forensics." — directly matches our `stepWorld(world, dtSec, input)` contract. |
| **Cross-vendor review** | Have an agent from a *different vendor* review every milestone, not just once at the end. It sees what your main agent family has learned to ignore. |
| **Cap PR size** | One task, one PR — especially late in a project when momentum tempts you to bundle. |
| **Understanding check-ins** | Regularly chat with the agent about how it understands the rules/workflow/architecture; compare with your specs. Drift starts small (one bad placeholder, one deferred bug). |
| **No "magic numbers"** | Addresses inside the game: only `@label`, never `@equ`. A label moves with the code; `@equ` nails the address down. |
| **Agent narrates its own process** | Agent-written code documents its own construction unless told otherwise. |
| **Test scenes + debug overlay** | Highest-leverage first tool: a test scene plus a debug overlay/log so both you and the agent get observable feedback. |
| **Acceptance tests before code** | Write the acceptance test *before* asking for code: fresh clone opens without errors, input works, three consecutive runs complete, restart under two seconds, exported build behaves same as editor. |
| **One slice at a time** | Scene tree/data model → mechanic → fail/win state → polish. Commit only after each acceptance test passes. |
| **Treat generated code like a fast junior developer** | You still own node lifetimes, signals, resources, save data, and performance. If you cannot explain the scene tree it produced, the task was too large — shrink it. |
| **Frame hashes for regression** | Per-frame hashes of screen, sound and RAM compared against recorded runs (make test / make diff). |

### zx-reaper pipeline stages (adaptable to our engine)

1. **Init** — split tape/snapshot, simulate load, record input → map
2. **Coverage** — input scripts from screenshots, fuzz with real keys, RZX replay until code map stops growing (<1% new coverage per 2 scripts)
3. **Classification** — separate code/data/text/graphics; build memory map
4. **Annotation** — names, constants, self-modifying code labeled; subagents in batches of 5–15
5. **Review** — every name/claim/register line checked by a run
6. **Relocation** — shift-test passes at even and odd shifts
7. **Port** — clean logic over plain state; assets as editable files

---

## 2. antirez — Z80/ZX Spectrum Emulator with Claude Code

**Source:** https://antirez.com/news/160
**Relevance:** High — clean-room agent-driven retro development.

### Key practices

| Practice | Description |
|----------|-------------|
| **Write a spec markdown file first** | English, high-level scope. What to do, what not to do, hardware constraints. |
| **Rules file** | A markdown file with rules the agent must follow (e.g., "never stop for prompting," "commit solid progress," "test before committing"). |
| **Agent writes its own documentation** | The agent produced detailed documentation about ZX Spectrum internals as it worked. |
| **Trace of agent activity** | Keep a work-in-progress log (what's done, what's missing); update and read it often — especially after context compaction. |
| **Read spec again after context compaction** | Agents forget after context compaction; re-reading the spec re-anchors them. |
| **Never stop for prompting** | Design the workflow so the agent can run unattended; the human answers only at stage gates. |
| **Test vectors** | Provide .z80 images / test files so the agent can test against real software. |
| **Refactoring loops** | When the agent misses timing/abstraction, ask for a targeted refactor (e.g., split `zx_frame()` so `zx_tick()` can be called directly). |

---

## 3. Reddit r/aigamedev — Agent Game Development Workflows

**Sources:**
- https://www.reddit.com/r/aigamedev/comments/1vbr5hi/new_here_how_are_you_guys_making_these_freaking/
- https://www.reddit.com/r/aigamedev/comments/1wtbn2l/has_anyone_actually_managed_to_build_a_full_game/
- https://www.reddit.com/r/aigamedev/comments/1veywxa/ai_can_generate_a_game_in_minutes_why_is/

### Key practices

| Practice | Description |
|----------|-------------|
| **Don't ask the AI to "make the game"** | Works much better when you provide a design document first, then implement system by system. |
| **Design doc → prototype → iterate → art** | Use one model (e.g., Gemini) to compile ideas into a design doc, another (Claude Code) to implement, then iterate until prototype matches vision, then generate art. |
| **Polish dominates time** | "The real time and effort is in the polish and details." Generating a playable prototype is easy; making it feel good takes months. |
| **Builder + critic loop** | `/loop` two agents: one builds, one is a harsh critic, they iterate quickly. (Chews tokens — use sparingly.) |
| **Multi-vendor orchestration** | Use AO (agent orchestrator) with many sub-agents (codex, claude, cursor, opencode, cline) — but watch token cost ($500 in 8 hours reported). |
| **AI as collaborator, not shortcut** | Most successful teams treat AI as a collaborator that amplifies developers. |
| **Playtest early** | "Tests verify the spec, not the game. If you don't read the diffs, the playtest is your code review, so playtest early." |

---

## 4. Reddit r/gamedev — AI in Games Reality Check

**Sources:**
- https://www.reddit.com/r/gamedev/comments/1jjt1h2/ai_in_games/
- https://www.reddit.com/r/gamedev/comments/1nlxbua/why_are_people_so_convinced_ai_will_be_making/

### Key takeaways

| Takeaway | Description |
|----------|-------------|
| **AI can't create "fun"** | AI can generate filler and mundane content, but cannot currently create "fun," "interesting," or "tunable" game design. |
| **Procedural generation ≠ LLM generation** | Games have had procedural generation since the 1980s (Rogue, etc.). LLMs add variability but lose tunability/understandability. |
| **AI as tooling, not replacement** | AI should improve the process, not replace it. Expert + AI > random person prompting. |
| **Backend structure needed** | Heavy backend structure + firm coded rules + multiple AI engines interacting is needed for good AI games. |

---

## 5. Reddit r/zxspectrum — Claude AI for 128k ZX Game

**Source:** https://www.reddit.com/r/zxspectrum/comments/1rtjhpd/update_i_am_creating_a_128k_game_using_claude_ai/

### Key practices

| Practice | Description |
|----------|-------------|
| **Memory map discipline** | "Get Claude to keep a memory map and keep an eye on the graphics budget, particularly if you're pre-shifting sprites." |
| **Modular rewrites** | Write core in C, drop to assembly for processor-intensive code; modular rewrites let you add parts yourself. |
| **File ordering for context caching** | Add files to a Claude project in a specific order to cache them. |

---

## 6. chuk-speccy — Deterministic Spectrum Emulator as Agent Lab

**Source:** https://github.com/chrishayuk/chuk-speccy
**Relevance:** Medium — agent-controllable, bit-exact-reproducible game lab.

### Key practices

| Practice | Description |
|----------|-------------|
| **Pure deterministic core** | Everything else is a thin consumer (frontend → spectrum → z80). The z80 crate never knows what a Spectrum is. |
| **Bit-exact checkpoints + rewindable timeline** | Makes the Spectrum a controlled, reproducible agent/RL environment. |
| **MCP server** | Exposes the machine over two endpoints: agent surface (screenshot, keys, frame-step, memory) and admin surface. |

---

## 7. Deterministic Simulation Repos (TypeScript/React)

| Repo | Relevant Practice |
|------|----------------|
| **ATemova/ai-driven-simulation-game** | Seeded Park–Miller RNG, fixed timestep regardless of frame rate, seed stored in URL for sharing runs, determinism tested by hashing full world state, no DOM dependencies (runs headless in Node). |
| **Maheer1001/valorant-sim** | Seeded randomness with named RNG streams forked from scenario seed; each shot stores hit chance + draw separately; integer milliseconds + millimetres; event queue ordered by (timeMs, sequence, agentId); sim/ kept free of React imports (architecture test). |
| **revanthpuvanes/living-ai-town** | Deterministic world engine + LLM dialogue separated; database is authoritative; simulation time = logical ticks not wall-clock; event-sourced with append-only history; state hashing for replay verification; snapshot recovery. |
| **Nilarf2/general-engine-public** | Fixed-step World simulation with no DOM/GPU dependency (testable in Node.js); explicit architecture boundaries; game rules owned by application, core kept testable. |

---

## 8. Effective Prompts & Prompting Patterns

Based on the research, here are prompt patterns that work well for AI-agent game development:

### Spec-first prompt
> "Write a markdown specification file describing the game engine you will build. Include: scope, hardware constraints (256x192, 15-color palette), input handling, audio rules, and the invariant that the engine must run deterministically in Node.js with zero DOM dependencies."

### Rules file prompt
> "Create a RULES.md file with coding rules you must follow: (1) never stop for prompting, (2) commit solid progress after each tested change, (3) write tests as you add features, (4) comment intent not syntax, (5) re-read this file after every context compaction."

### Slice-by-slice prompt
> "Implement only one slice at a time: first the scene tree and data model, then the mechanic, then the fail/win state, then polish. After each slice, run the acceptance test and commit only when it passes. List exactly which files changed and how you verified them."

### Determinism prompt
> "The simulation must be deterministic: no Math.random() anywhere. All randomness must be seeded from config or grid. Provide a seeded RNG and a fixed timestep. Write a test that hashes the full world state after N frames and confirms it matches a recorded value."

### Cross-vendor review prompt
> "Review this code as if you are from a different vendor than the original author. Look for assumptions the main agent family may have learned to ignore, especially around: determinism, memory pools, attribute clash rules, and the stepWorld contract."

### Acceptance test prompt
> "Write the acceptance test BEFORE the code: fresh clone opens without errors, input works, three consecutive runs complete identically, restart under two seconds, exported build behaves same as editor."

---

## 9. Missing / Underused Practices for Our Project

Based on comparing our current implementation (Gates 0–5 complete) against the research, here are effective practices we are **not yet using** that would strengthen the agent-driven workflow:

| # | Practice | Source | Value for Zúbok a signálik |
|---|----------|--------|---------------------------|
| 1 | **Test scenes + debug overlay** | r/aigamedev | We run headless tests but have no visual debug overlay; adding one would let the agent "see" its results during stage development. |
| 2 | **Frame-hash regression tests** | zx-reaper | We have unit tests but no per-frame state hashing against recorded golden runs; this would catch subtle regressions in wave/relay behavior. |
| 3 | **Cross-vendor code review** | zx-reaper, Medium article | All code reviewed by one agent family; an independent reviewer would catch drift (e.g., the 3 pre-existing App.tsx errors went unnoticed). |
| 4 | **Agent WIP log** | antirez | We have docs/service-incident-arc-design.md but no running WIP log of what the agent did per session. |
| 5 | **Rules file (RULES.md)** | antirez | We have AGENTS.md rules but no concise per-session rules file the agent re-reads after context compaction. |
| 6 | **Memory map discipline** | r/zxspectrum | Our engine has no explicit memory map; for a 256x192 engine this is less critical, but a sprite/attribute budget tracker would help as we add particles/afterimages. |
| 7 | **Builder + critic /loop** | r/aigamedev | We use single-agent builds; a harsh-critic sub-agent loop could catch balance issues (e.g., charge threshold 0.5, hubHp 3) before playtesting. |
| 8 | **Small PRs, one task each** | zx-reaper | Our gates are well-scoped but some PRs bundle multiple changes (e.g., Gate 3 combined relay + deploy select). |
| 9 | **Seeded RNG streams** | valorant-sim | We use config/seeded spawning but no named RNG streams; useful if we later add procedural wave variations. |
| 10 | **Design doc → prototype → art pipeline** | r/aigamedev | We have a design doc but no dedicated art-generation step; the HUD/sprites are hand-written SVG/Canvas. |

---

## 10. Recommended Prompts for Continuing Development

Save these to `docs/prompts/` and reuse when delegating to agents:

### Prompt: Extend a play mode
> "Extend the `{mode}` play mode in src/game/engine.ts. Follow RULES.md: deterministic (no Math.random()), zero DOM dependencies, preserve stepWorld contract. Add tests in src/game/modes/{mode}.test.ts following the acceptance-test-first pattern. Commit only after tests pass."

### Prompt: Add a new stage
> "Add Stage N to src/game/levels.ts with a 32x24 grid using legend # . ~ D E 1-4. Ensure player start is safe from walls/enemies/hazards. Add StageDefinition fields (timeLimitSec, waves, startPlayMode) as needed. Verify with stages.test.ts patterns."

### Prompt: Balance tuning
> "Tune wave_defense balance: review wave compositions, spawnTimers, hubHp, and boss fragment stats in docs/service-incident-balance.md. Adjust values so wave 5 is beatable but challenging. Update tests and re-run npm test."

### Prompt: Cross-vendor review
> "Review the Service Incident Arc implementation as an independent reviewer. Focus on: determinism violations, attribute clash rule breaches, stepWorld contract drift, HUD snapshot consistency, and the 3 pre-existing App.tsx:576 errors (do not fix those, just note them)."

---

## 11. Conclusion

The research confirms our approach is well-aligned with effective AI-agent game development:

✅ **Already doing well:** deterministic engine, no Math.random(), test-first, small gated PRs, spec-first design (docs/service-incident-arc-design.md), no DOM in engine.

🔧 **Worth adopting:** frame-hash regression tests, cross-vendor review, WIP log, test scenes + debug overlay, named RNG streams, builder+critic loop for balance tuning.

📖 **Full source material saved in this document.** Revisit before each gate to keep agent understanding aligned with the spec and prevent drift.
