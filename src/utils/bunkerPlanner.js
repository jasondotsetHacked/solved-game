function computeStampBounds(buildings) {
    let minDx = Infinity, maxDx = -Infinity;
    let minDy = Infinity, maxDy = -Infinity;
    for (const type in buildings) {
        for (const pos of buildings[type]) {
            if (pos.x < minDx) minDx = pos.x;
            if (pos.x > maxDx) maxDx = pos.x;
            if (pos.y < minDy) minDy = pos.y;
            if (pos.y > maxDy) maxDy = pos.y;
        }
    }
    return { minDx, maxDx, minDy, maxDy };
}

function stampFits(room, anchorX, anchorY, buildings) {
    const terrain = room.getTerrain();
    for (const type in buildings) {
        for (const pos of buildings[type]) {
            const x = anchorX + pos.x;
            const y = anchorY + pos.y;
            if (x < 0 || x >= 50 || y < 0 || y >= 50) return false;
            if (terrain.get(x, y) === TERRAIN_MASK_WALL) return false;
            if (room.lookForAt(LOOK_STRUCTURES, x, y).length > 0) return false;
            if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) return false;
            if (room.lookForAt(LOOK_SOURCES, x, y).length > 0) return false;
            if (room.lookForAt(LOOK_MINERALS, x, y).length > 0) return false;
            if (room.lookForAt(LOOK_CONTROLLER, x, y).length > 0) return false;
        }
    }
    return true;
}

function findStampAnchors(room, buildings, maxResults) {
    const { minDx, maxDx, minDy, maxDy } = computeStampBounds(buildings);
    const candidates = [];
    const controller = room.controller;
    const sources = room.find(FIND_SOURCES);
    const startX = 0 - minDx, endX = 49 - maxDx;
    const startY = 0 - minDy, endY = 49 - maxDy;
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (!stampFits(room, x, y, buildings)) continue;
            let score = 0;
            if (controller) {
                score += Math.hypot(x - controller.pos.x, y - controller.pos.y);
            }
            for (const source of sources) {
                score += Math.hypot(x - source.pos.x, y - source.pos.y);
            }
            candidates.push({ x, y, score });
        }
    }
    candidates.sort((a, b) => a.score - b.score);
    if (typeof maxResults === 'number' && candidates.length > maxResults) {
        return candidates.slice(0, maxResults);
    }
    return candidates;
}

function placeStamp(room, anchorX, anchorY, buildings) {
    for (const type in buildings) {
        for (const pos of buildings[type]) {
            const x = anchorX + pos.x;
            const y = anchorY + pos.y;
            const res = room.createConstructionSite(x, y, type);
            if (res !== OK) {
                console.log(`Failed to create ${type} at ${x},${y}: ${res}`);
            }
        }
    }
}

function computeDistanceTransform(room) {
    const terrain = room.getTerrain();
    const dist = [];
    for (let y = 0; y < 50; y++) {
        dist[y] = [];
        for (let x = 0; x < 50; x++) {
            dist[y][x] = (terrain.get(x, y) === TERRAIN_MASK_WALL) ? 0 : Infinity;
        }
    }
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            if (dist[y][x] === 0) continue;
            const top = y > 0 ? dist[y - 1][x] + 1 : Infinity;
            const left = x > 0 ? dist[y][x - 1] + 1 : Infinity;
            const topLeft = (x > 0 && y > 0) ? dist[y - 1][x - 1] + 1 : Infinity;
            const topRight = (x < 49 && y > 0) ? dist[y - 1][x + 1] + 1 : Infinity;
            dist[y][x] = Math.min(dist[y][x], top, left, topLeft, topRight);
        }
    }
    for (let y = 49; y >= 0; y--) {
        for (let x = 49; x >= 0; x--) {
            if (dist[y][x] === 0) continue;
            const bottom = y < 49 ? dist[y + 1][x] + 1 : Infinity;
            const right = x < 49 ? dist[y][x + 1] + 1 : Infinity;
            const bottomRight = (x < 49 && y < 49) ? dist[y + 1][x + 1] + 1 : Infinity;
            const bottomLeft = (x > 0 && y < 49) ? dist[y + 1][x - 1] + 1 : Infinity;
            dist[y][x] = Math.min(dist[y][x], bottom, right, bottomRight, bottomLeft);
        }
    }
    return dist;
}

function planResourceRoads(room, anchorX, anchorY) {
    const start = new RoomPosition(anchorX, anchorY, room.name);
    const targets = room.find(FIND_SOURCES).map(src => ({ pos: src.pos, range: 1 }));
    const mineral = room.find(FIND_MINERALS)[0];
    if (mineral) targets.push({ pos: mineral.pos, range: 1 });
    for (const target of targets) {
        const result = PathFinder.search(start, target, {
            plainCost: 1,
            swampCost: 5,
            roomCallback: roomName => {
                const current = Game.rooms[roomName];
                if (!current) return;
                const costs = new PathFinder.CostMatrix();
                current.find(FIND_STRUCTURES).forEach(struct => {
                    if (struct.structureType === STRUCTURE_ROAD) {
                        costs.set(struct.pos.x, struct.pos.y, 1);
                    } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                        (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
                        costs.set(struct.pos.x, struct.pos.y, 255);
                    }
                });
                current.find(FIND_CONSTRUCTION_SITES).forEach(site => {
                    if (site.structureType !== STRUCTURE_ROAD) {
                        costs.set(site.pos.x, site.pos.y, 255);
                    }
                });
                return costs;
            }
        });
        for (const step of result.path) {
            room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
        }
    }
}

function findExtensionSpots(room, anchorX, anchorY, count, reservedKeys) {
    const terrain = room.getTerrain();
    const visited = new Set();
    const queue = [];
    const spots = [];
    function key(x, y) { return `${x},${y}`; }
    queue.push({ x: anchorX, y: anchorY });
    visited.add(key(anchorX, anchorY));
    while (queue.length && spots.length < count) {
        const { x, y } = queue.shift();
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = x + dx;
            const ny = y + dy;
            const k = key(nx, ny);
            if (nx < 0 || nx >= 50 || ny < 0 || ny >= 50) continue;
            if (visited.has(k)) continue;
            visited.add(k);
            if (terrain.get(nx, ny) === TERRAIN_MASK_WALL) continue;
            if (reservedKeys && reservedKeys.has(k)) continue;
            if (room.lookForAt(LOOK_STRUCTURES, nx, ny).length > 0) continue;
            if (room.lookForAt(LOOK_SOURCES, nx, ny).length > 0) continue;
            if (room.lookForAt(LOOK_MINERALS, nx, ny).length > 0) continue;
            if (room.lookForAt(LOOK_CONTROLLER, nx, ny).length > 0) continue;
            if (room.lookForAt(LOOK_CONSTRUCTION_SITES, nx, ny).length > 0) continue;
            spots.push({ x: nx, y: ny });
            queue.push({ x: nx, y: ny });
            if (spots.length >= count) break;
        }
    }
    return spots;
}

function findBestBunkerPlacement(room, fullBuildings, coreBuildings) {
    const fullAnchors = findStampAnchors(room, fullBuildings, 1);
    if (fullAnchors.length > 0) {
        return { buildings: fullBuildings, anchor: fullAnchors[0], type: 'full' };
    }
    const coreAnchors = findStampAnchors(room, coreBuildings, 1);
    if (coreAnchors.length > 0) {
        return { buildings: coreBuildings, anchor: coreAnchors[0], type: 'core' };
    }
    return null;
}

module.exports = {
    computeStampBounds,
    stampFits,
    findStampAnchors,
    placeStamp,
    computeDistanceTransform,
    planResourceRoads,
    findExtensionSpots,
    findBestBunkerPlacement
};
