# Agent Notes

## Persistent Directives
- Keep code self-documenting and only add comments for genuinely complex logic.
- Prefer fast text tools such as `rg` and avoid touching unrelated files.
- Preserve existing memory and data layouts used by private server tooling.

## Repository Map
- `src/` holds gameplay source modules (managers, roles, utils, structures); `main.js` is the loop entry point.
- `dist/` is produced by the Grunt copy step that flattens folders using underscores for Screeps upload.
- `pvt/` stores private utilities (`initialSpawn.js`, `re-origin.js`, bunker stamps) outside the build pipeline.
- `screeps-server-main/` contains the local private server bundle and third-party assets.
- Build and deploy flow: run `grunt` to clean `dist`, copy `src`, and push with `grunt-screeps`.

## Screeps Bot Snapshot (Sept 2025)
- Memory bootstrap resides in `managers_memory.js`; seeds bunker stamp data and an empty scouting queue scaffold.
- Colony loop (`managers_colony.js` with `managers_room.js`) iterates owned rooms, tracks source metadata, and auto-places containers once controllers reach level three.
- Spawning pipeline in `managers_spawn.js` hardcodes `Spawn1`, assigns stationary harvesters per source, then iterates `managers_roleDefinitions.js` (static desired counts, linear ordering).
- Bodies come from `managers_bodyManager.js`; it repeats role templates up to the energy cap but lacks tiered compositions or balanced movement ratios.
- Role execution leans on `utils_gather.js` for energy targeting with a reservation system; generalist workers backfill most tasks when nothing else needs energy.
- Visual support is limited to `managers_mapVisuals.js`; overlays exist but need validation for correctness and completeness.

## Immediate Observations
- Room automation stops at bunker stamps; no designation framework or remote mining planner yet.
- Population logic ignores per-room energy constraints, empire goals, and multiple spawn handling.
- Telemetry is minimal (periodic CPU log when `DEBUG`); no economy or KPI reporting.
- Scouting queue is prepared in memory but never populated or consumed by creeps.
- No mission or task system to coordinate logistics, expansion, or combat roles.

## Future Investigation Hooks
- Review `roles_*.js` for overlapping behaviour (filler, worker, upgrader) before redesigning assignments.
- Inspect `utils_bunkerPlanner.js` to gauge readiness for procedural layout placement.
- Check scripts in `pvt/` for seeding or migration utilities that might integrate into automation stages.
