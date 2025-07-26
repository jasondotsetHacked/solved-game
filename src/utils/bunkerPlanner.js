const WALL = 1;
const SWAMP = 2;
const terrainCache = {};
const objectsCache = {};

function computeStampBounds(buildings) {
    let minDx = Infinity;
    let maxDx = -Infinity;
    let minDy = Infinity;
    let maxDy = -Infinity;
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

async function getTerrain(roomName, inGame) {
    if (inGame && global.Game && Game.rooms[roomName]) return Game.rooms[roomName].getTerrain();
    if (terrainCache[roomName]) return terrainCache[roomName];
    const url = `https://screeps.com/api/game/room-terrain?room=${roomName}&encoded=1&shard=shard3`;
    const res = await fetch(url);
    const data = await res.json();
    const str = data.terrain[0].terrain;
    console.log(`First 50 chars of str: ${str.slice(0, 50)}`);
    const grid = [];
    for (let y = 0; y < 50; y++) {
        grid[y] = [];
        for (let x = 0; x < 50; x++) {
            // const c = str.charCodeAt(y * 50 + x) - 48;
            const c = str.charAt(y * 50 + x);
            grid[y][x] = c === '1' ? WALL : c === '2' ? SWAMP : 0;
        }
    }
    console.log(`First y row of grid: ${grid[0].join(', ')}`);
    const terrain = { get: (x, y) => grid[y][x] };
    terrainCache[roomName] = terrain;
    return terrain;
}

/**
 * Fetch all visible objects in a room via Screeps HTTP API.
 */
async function getRoomObjects(roomName) {
    if (objectsCache[roomName]) return objectsCache[roomName];
    const url = `https://screeps.com/api/game/room-objects?room=${roomName}&shard=shard3`;
    const res = await fetch(url);
    const data = await res.json();
    const structures = [];
    const sources = [];
    const minerals = [];
    let controller = null;
    for (const obj of data.objects) {
        switch (obj.type) {
            case 'source': sources.push(obj); break;
            case 'mineral': minerals.push(obj); break;
            case 'controller': controller = obj; break;
            default: structures.push(obj);
        }
    }
    objectsCache[roomName] = { structures, sources, minerals, controller };
    return objectsCache[roomName];
}

async function stampFits(roomName, anchorX, anchorY, buildings, inGame = true) {
    const terrain = await getTerrain(roomName, inGame);
    // Ensure the anchor tile itself is not a wall or impassable terrain
    if (terrain.get(anchorX, anchorY) === WALL) return false;
    const room = inGame && global.Game ? Game.rooms[roomName] : null;
    const offline = room ? null : await getRoomObjects(roomName);
    for (const type in buildings) {
        for (const pos of buildings[type]) {
            const x = anchorX + pos.x;
            const y = anchorY + pos.y;
            if (x < 0 || x >= 50 || y < 0 || y >= 50) return false;
            if (terrain.get(x, y) === WALL) return false;
            if (room) {
                if (room.lookForAt(LOOK_STRUCTURES, x, y).length) return false;
                if (room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length) return false;
                if (room.lookForAt(LOOK_SOURCES, x, y).length) return false;
                if (room.lookForAt(LOOK_MINERALS, x, y).length) return false;
                if (room.lookForAt(LOOK_CONTROLLER, x, y).length) return false;
            } else if (offline) {
                if (offline.structures.some(s => s.x === x && s.y === y)) return false;
                if (offline.sources.some(s => s.x === x && s.y === y)) return false;
                if (offline.minerals.some(m => m.x === x && m.y === y)) return false;
                if (offline.controller && offline.controller.x === x && offline.controller.y === y) return false;
            }
        }
    }
    return true;
}

async function findStampAnchors(roomName, buildings, maxResults, inGame = true) {
    const { minDx, maxDx, minDy, maxDy } = computeStampBounds(buildings);
    const candidates = [];
    const room = inGame && global.Game ? Game.rooms[roomName] : null;
    const offline = room ? null : await getRoomObjects(roomName);
    // pick controller and sources from live room or offline data
    let controller, sources;
    if (room) {
        controller = room.controller;
        sources = room.find(FIND_SOURCES);
    } else {
        controller = offline.controller ? { pos: { x: offline.controller.x, y: offline.controller.y } } : null;
        sources = offline.sources.map(src => ({ pos: { x: src.x, y: src.y } }));
    }
    const startX = 0 - minDx;
    const endX = 49 - maxDx;
    const startY = 0 - minDy;
    const endY = 49 - maxDy;
    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            if (!await stampFits(roomName, x, y, buildings, inGame)) continue;
            let score = 0;
            if (controller) score += Math.hypot(x - controller.pos.x, y - controller.pos.y);
            for (const source of sources) score += Math.hypot(x - source.pos.x, y - source.pos.y);
            candidates.push({ x, y, score });
        }
    }
    candidates.sort((a, b) => a.score - b.score);
    if (typeof maxResults === 'number' && candidates.length > maxResults) return candidates.slice(0, maxResults);
    return candidates;
}

// function placeStamp(roomName, anchorX, anchorY, buildings) {
//     if (!global.Game || !Game.rooms[roomName]) return;
//     const room = Game.rooms[roomName];
//     for (const type in buildings) {
//         for (const pos of buildings[type]) {
//             const x = anchorX + pos.x;
//             const y = anchorY + pos.y;
//             const res = room.createConstructionSite(x, y, type);
//             if (res !== OK) console.log(`Failed to create ${type} at ${x},${y}: ${res}`);
//         }
//     }
// }

async function computeDistanceTransform(roomName, inGame = true) {
    const terrain = await getTerrain(roomName, inGame);
    const dist = [];
    for (let y = 0; y < 50; y++) {
        dist[y] = [];
        for (let x = 0; x < 50; x++) {
            dist[y][x] = terrain.get(x, y) === WALL ? 0 : Infinity;
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

// function planResourceRoads(roomName, anchorX, anchorY) {
//     if (!global.Game || !Game.rooms[roomName]) return;
//     const room = Game.rooms[roomName];
//     const start = new RoomPosition(anchorX, anchorY, room.name);
//     const targets = room.find(FIND_SOURCES).map(src => ({ pos: src.pos, range: 1 }));
//     const mineral = room.find(FIND_MINERALS)[0];
//     if (mineral) targets.push({ pos: mineral.pos, range: 1 });
//     for (const target of targets) {
//         const result = PathFinder.search(start, target, {
//             plainCost: 1,
//             swampCost: 5,
//             roomCallback: roomName => {
//                 const current = Game.rooms[roomName];
//                 if (!current) return;
//                 const costs = new PathFinder.CostMatrix();
//                 current.find(FIND_STRUCTURES).forEach(struct => {
//                     if (struct.structureType === STRUCTURE_ROAD) {
//                         costs.set(struct.pos.x, struct.pos.y, 1);
//                     } else if (struct.structureType !== STRUCTURE_CONTAINER &&
//                         (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
//                         costs.set(struct.pos.x, struct.pos.y, 255);
//                     }
//                 });
//                 current.find(FIND_CONSTRUCTION_SITES).forEach(site => {
//                     if (site.structureType !== STRUCTURE_ROAD) {
//                         costs.set(site.pos.x, site.pos.y, 255);
//                     }
//                 });
//                 return costs;
//             }
//         });
//         for (const step of result.path) room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
//     }
// }

// async function findExtensionSpots(roomName, anchorX, anchorY, count, reservedKeys, inGame = true) {
//     const terrain = await getTerrain(roomName, inGame);
//     const room = inGame && global.Game ? Game.rooms[roomName] : null;
//     const visited = new Set();
//     const queue = [];
//     const spots = [];
//     function key(x, y) { return `${x},${y}`; }
//     queue.push({ x: anchorX, y: anchorY });
//     visited.add(key(anchorX, anchorY));
//     while (queue.length && spots.length < count) {
//         const { x, y } = queue.shift();
//         for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
//             const nx = x + dx;
//             const ny = y + dy;
//             const k = key(nx, ny);
//             if (nx < 0 || nx >= 50 || ny < 0 || ny >= 50) continue;
//             if (visited.has(k)) continue;
//             visited.add(k);
//             if (terrain.get(nx, ny) === WALL) continue;
//             if (reservedKeys && reservedKeys.has(k)) continue;
//             if (room) {
//                 if (room.lookForAt(LOOK_STRUCTURES, nx, ny).length) continue;
//                 if (room.lookForAt(LOOK_SOURCES, nx, ny).length) continue;
//                 if (room.lookForAt(LOOK_MINERALS, nx, ny).length) continue;
//                 if (room.lookForAt(LOOK_CONTROLLER, nx, ny).length) continue;
//                 if (room.lookForAt(LOOK_CONSTRUCTION_SITES, nx, ny).length) continue;
//             }
//             spots.push({ x: nx, y: ny });
//             queue.push({ x: nx, y: ny });
//             if (spots.length >= count) break;
//         }
//     }
//     return spots;
// }

async function findBestBunkerPlacement(roomName, fullBuildings, coreBuildings, inGame = true) {
    const fullAnchors = await findStampAnchors(roomName, fullBuildings, 1, inGame);
    if (fullAnchors.length) return { buildings: fullBuildings, anchor: fullAnchors[0], type: 'full' };
    const coreAnchors = await findStampAnchors(roomName, coreBuildings, 1, inGame);
    if (coreAnchors.length) return { buildings: coreBuildings, anchor: coreAnchors[0], type: 'core' };
    return null;
}

module.exports = {
    computeStampBounds,
    stampFits,
    findStampAnchors,
    // placeStamp,
    computeDistanceTransform,
    // planResourceRoads,
    // findExtensionSpots,
    findBestBunkerPlacement
};
