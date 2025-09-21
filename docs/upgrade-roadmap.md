# Upgrade Roadmap

## Phase 0: Stabilize Baseline
- Harden spawn selection (multi-spawn, bootstrapping, prioritized queues).
- Normalize module paths and guard against missing memory structures at runtime.
- Capture current behaviour with a lightweight regression checklist (harvest loop, spawn loop, map visuals).

## Phase 1: Empire State & Room Designations
- Build an `empire` state module that snapshots rooms, structures, creeps, and inter-room links each tick.
- Create a room designation system (capital, annex, remote, highway, hostile) driven by controller ownership, threats, and proximity.
- Persist designation metadata in `Memory.rooms` with timestamps for decay and review.

## Phase 2: Population Strategy & Body Planning
- Replace static `roleDefinitions` with policy-driven quotas keyed by room designation and controller level.
- Extend `bodyManager` to generate tiered bodies per role (bootstrap, standard, remote, heavy) with movement/carry ratios and road usage adjustments.
- Implement a spawn queue manager that scores requests, respects energy thresholds, and supports multi-room spawning.

## Phase 3: Task & Logistics Layer
- Introduce a job board for harvesting, hauling, building, upgrading, and repair tasks with reservation semantics.
- Split energy roles into miners (fixed), haulers (multi-room), fillers (in-room), and utility workers that subscribe to tasks.
- Auto-plan mining sites (container/link positions, road layouts) and maintain road construction orders between sources and storage.

## Phase 4: Scouting, Expansion, and Defense
- Upgrade scout workflow to prioritise unexplored exits, maintain revisit cadence, and promote suitable rooms to annex/claim queues.
- Build expansion planner that evaluates sources, threats, and distance to select next claim target and schedule claimer/settler waves.
- Add basic threat response (tower focus, wall/rampart repair, emergency defenders) keyed to room tags.

## Phase 5: Telemetry & Visualization
- Implement KPI tracker logging CPU usage, bucket trends, energy income/spend, creep lifecycle, and spawn queue state.
- Extend map visuals with room designations, remote routes, and mining site overlays; add RoomVisual overlays for roads/structures under construction.
- Provide console dashboards (e.g., `console.table`) for room summaries, scout status, and resource stockpiles.

## Phase 6: Tooling & Validation
- Script private-server bootstrap (from `pvt/initialSpawn.js`) to seed test worlds quickly.
- Add deterministic simulation harness to run key scenarios (RCL transitions, remote mining activation, hostile detection).
- Document configuration knobs (DEBUG levels, feature flags) and surface them via `config.js`.
