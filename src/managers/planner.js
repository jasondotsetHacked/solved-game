const ORIENTATIONS = [0, 90, 180, 270];
const PLANNER_VERSION = 1;
const PATH_VERSION = 1;
const PATH_REFRESH_INTERVAL = 500;

module.exports = {
  ensurePlan(room, roomState) {
    if (!room || !room.controller || !room.controller.my) return null;

    const roomMemory = Memory.rooms[room.name] = Memory.rooms[room.name] || {};
    const planning = roomMemory.planning = roomMemory.planning || {};

    if (planning.version !== PLANNER_VERSION || !planning.anchor) {
      const plan = createPlan(room, roomState, planning);
      if (plan) {
        planning.anchor = plan.anchor;
        planning.orientation = plan.orientation;
        planning.layout = plan.layout;
        planning.version = PLANNER_VERSION;
        planning.created = Game.time;
      }
    }

    if (!planning.anchor) return null;

    if (shouldRefreshPaths(planning)) {
      const paths = computePaths(room, planning);
      if (paths) planning.paths = paths;
    }

    planning.updated = Game.time;
    return planning;
  }
};

function createPlan(room, roomState, existingPlan) {
  const terrain = room.getTerrain();
  const distanceMap = buildDistanceTransform(terrain);
  const blueprintData = getBlueprintData();
  const sources = room.find(FIND_SOURCES);
  const controller = room.controller || null;

  const candidates = generateCandidates(room, roomState, distanceMap, terrain, blueprintData);
  if (candidates.length === 0) return null;

  let best = null;
  for (const candidate of candidates) {
    const score = scoreCandidate(room, candidate.anchor, candidate.orientation, distanceMap, terrain, blueprintData, sources, controller);
    if (!isFinite(score)) continue;
    if (!best || score > best.score) {
      best = {
        anchor: candidate.anchor,
        orientation: candidate.orientation,
        score
      };
    }
  }

  if (!best) return null;

  return {
    anchor: best.anchor,
    orientation: best.orientation,
    layout: 'bunker'
  };
}

function generateCandidates(room, roomState, distanceMap, terrain, blueprintData) {
  const candidates = [];
  const spawnOffsets = blueprintData.byType[STRUCTURE_SPAWN] || [];
  const spawns = room.find(FIND_MY_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_SPAWN
  });

  if (spawns.length > 0 && spawnOffsets.length > 0) {
    for (const spawn of spawns) {
      for (const orientation of ORIENTATIONS) {
        for (const offset of spawnOffsets) {
          const rotated = rotateOffset(offset, orientation);
          const anchorX = spawn.pos.x - rotated.x;
          const anchorY = spawn.pos.y - rotated.y;
          if (!inBounds(anchorX, anchorY)) continue;
          candidates.push({ anchor: { x: anchorX, y: anchorY }, orientation });
        }
      }
    }
  }

  const anchorHint = roomState && roomState.anchor ? roomState.anchor : null;
  if (anchorHint) {
    for (const orientation of ORIENTATIONS) {
      if (inBounds(anchorHint.x, anchorHint.y)) {
        candidates.push({ anchor: { x: anchorHint.x, y: anchorHint.y }, orientation });
      }
    }
  }

  if (candidates.length === 0) {
    const topTiles = selectTopDistanceTiles(distanceMap, terrain, 20);
    for (const tile of topTiles) {
      for (const orientation of ORIENTATIONS) {
        candidates.push({ anchor: { x: tile.x, y: tile.y }, orientation });
      }
    }
  }

  const seen = new Set();
  return candidates.filter(candidate => {
    const key = ${candidate.anchor.x}::;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreCandidate(room, anchor, orientation, distanceMap, terrain, blueprintData, sources, controller) {
  if (!inBounds(anchor.x, anchor.y)) return -Infinity;
  const clearance = distanceMap[anchor.y][anchor.x];
  if (clearance <= 1) return -Infinity;

  const footprintPenalty = evaluateFootprint(anchor, orientation, terrain, blueprintData.allOffsets);
  if (footprintPenalty >= 50) return -Infinity;

  const anchorPos = new RoomPosition(anchor.x, anchor.y, room.name);
  let pathScore = 0;
  for (const source of sources) {
    const cost = pathCost(anchorPos, source.pos, 1);
    if (!isFinite(cost)) return -Infinity;
    pathScore += cost * 1.1;
  }
  if (controller) {
    const controllerCost = pathCost(anchorPos, controller.pos, 3);
    if (!isFinite(controllerCost)) return -Infinity;
    pathScore += controllerCost * 1.4;
  }

  const edgeDistance = Math.min(anchor.x, anchor.y, 49 - anchor.x, 49 - anchor.y);
  const swampPenalty = terrain.get(anchor.x, anchor.y) === TERRAIN_MASK_SWAMP ? 15 : 0;

  return (clearance * 120) - pathScore - (footprintPenalty * 60) + (edgeDistance * 12) - swampPenalty;
}

function evaluateFootprint(anchor, orientation, terrain, offsets) {
  let penalties = 0;
  for (const offset of offsets) {
    const rotated = rotateOffset(offset, orientation);
    const x = anchor.x + rotated.x;
    const y = anchor.y + rotated.y;
    if (!inBounds(x, y)) {
      penalties += 10;
      continue;
    }
    if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
      penalties += 5;
    }
  }
  return penalties;
}

function selectTopDistanceTiles(distanceMap, terrain, limit) {
  const tiles = [];
  for (let y = 2; y < 48; y++) {
    for (let x = 2; x < 48; x++) {
      const clearance = distanceMap[y][x];
      if (clearance < 3) continue;
      if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
      const edgeDistance = Math.min(x, y, 49 - x, 49 - y);
      tiles.push({ x, y, clearance, edge: edgeDistance });
    }
  }

  tiles.sort((a, b) => {
    if (b.clearance !== a.clearance) return b.clearance - a.clearance;
    return distanceToCenter(a) - distanceToCenter(b);
  });

  return tiles.slice(0, limit);
}

function distanceToCenter(tile) {
  return Math.abs(tile.x - 25) + Math.abs(tile.y - 25);
}

function buildDistanceTransform(terrain) {
  const width = 50;
  const height = 50;
  const matrix = Array.from({ length: height }, () => Array(width).fill(0));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
        matrix[y][x] = 0;
        continue;
      }
      let minNeighbor = 255;
      if (y > 0) {
        minNeighbor = Math.min(minNeighbor, matrix[y - 1][x]);
        if (x > 0) minNeighbor = Math.min(minNeighbor, matrix[y - 1][x - 1]);
        if (x < width - 1) minNeighbor = Math.min(minNeighbor, matrix[y - 1][x + 1]);
      }
      if (x > 0) minNeighbor = Math.min(minNeighbor, matrix[y][x - 1]);
      matrix[y][x] = Math.min(minNeighbor + 1, 255);
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
      let minNeighbor = matrix[y][x];
      if (y < height - 1) {
        minNeighbor = Math.min(minNeighbor, matrix[y + 1][x] + 1);
        if (x > 0) minNeighbor = Math.min(minNeighbor, matrix[y + 1][x - 1] + 1);
        if (x < width - 1) minNeighbor = Math.min(minNeighbor, matrix[y + 1][x + 1] + 1);
      }
      if (x < width - 1) minNeighbor = Math.min(minNeighbor, matrix[y][x + 1] + 1);
      if (x > 0) minNeighbor = Math.min(minNeighbor, matrix[y][x - 1] + 1);
      matrix[y][x] = Math.min(matrix[y][x], minNeighbor);
    }
  }

  return matrix;
}

function pathCost(origin, targetPos, range) {
  const result = PathFinder.search(origin, { pos: targetPos, range }, {
    plainCost: 2,
    swampCost: 8,
    maxOps: 6000,
    roomCallback(roomName) {
      if (roomName !== origin.roomName) return false;
      return false;
    }
  });
  if (!result || result.incomplete) {
    if (!result || result.path.length === 0) return Infinity;
    return result.cost + 10;
  }
  return result.cost;
}

function computePaths(room, plan) {
  if (!plan || !plan.anchor) return null;
  const anchorPos = new RoomPosition(plan.anchor.x, plan.anchor.y, room.name);
  const options = {
    plainCost: 2,
    swampCost: 8,
    maxOps: 8000,
    roomCallback(roomName) {
      if (roomName !== room.name) return false;
      return false;
    }
  };

  const paths = {
    version: PATH_VERSION,
    generated: Game.time,
    sources: {}
  };

  const sources = room.find(FIND_SOURCES);
  for (const source of sources) {
    const search = PathFinder.search(anchorPos, { pos: source.pos, range: 1 }, options);
    if (search.path && search.path.length > 0) {
      paths.sources[source.id] = serializePath(search.path);
    }
  }

  if (room.controller) {
    const controllerSearch = PathFinder.search(anchorPos, { pos: room.controller.pos, range: 3 }, options);
    if (controllerSearch.path && controllerSearch.path.length > 0) {
      paths.controller = serializePath(controllerSearch.path);
    }
  }

  const mineral = room.find(FIND_MINERALS)[0];
  if (mineral) {
    const mineralSearch = PathFinder.search(anchorPos, { pos: mineral.pos, range: 1 }, options);
    if (mineralSearch.path && mineralSearch.path.length > 0) {
      paths.mineral = serializePath(mineralSearch.path);
    }
  }

  return paths;
}

function serializePath(path) {
  return path.map(pos => ({ x: pos.x, y: pos.y }));
}

function shouldRefreshPaths(plan) {
  if (!plan.paths) return true;
  if (plan.paths.version !== PATH_VERSION) return true;
  const generated = plan.paths.generated || 0;
  return Game.time - generated > PATH_REFRESH_INTERVAL;
}

function getBlueprintData() {
  const map = new Map();
  addBlueprint(map, Memory.bunkerCore);
  addBlueprint(map, Memory.bunkerStamp);

  const byType = {};
  const allOffsets = [];
  for (const [type, data] of map.entries()) {
    byType[type] = data.positions.slice();
    allOffsets.push(...data.positions);
  }

  return { byType, allOffsets };
}

function addBlueprint(map, blueprintMemory) {
  if (!blueprintMemory || !blueprintMemory.buildings) return;
  for (const [type, offsets] of Object.entries(blueprintMemory.buildings)) {
    if (!Array.isArray(offsets)) continue;
    let entry = map.get(type);
    if (!entry) {
      entry = { positions: [], seen: new Set() };
      map.set(type, entry);
    }
    for (const offset of offsets) {
      const ox = Math.floor(offset.x);
      const oy = Math.floor(offset.y);
      const key = ${ox}:;
      if (entry.seen.has(key)) continue;
      entry.seen.add(key);
      entry.positions.push({ x: ox, y: oy });
    }
  }
}

function rotateOffset(offset, rotation) {
  const x = offset.x;
  const y = offset.y;
  switch (rotation % 360) {
    case 90:
      return { x: y, y: -x };
    case 180:
      return { x: -x, y: -y };
    case 270:
      return { x: -y, y: x };
    default:
      return { x, y };
  }
}

function inBounds(x, y) {
  return x >= 0 && x < 50 && y >= 0 && y < 50;
}
