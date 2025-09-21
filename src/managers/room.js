module.exports = {
  run(room, roomState) {
    seedRoomMemory(room, roomState);
    cacheSourceData(room);
    planSourceContainers(room, roomState);
  }
};

function seedRoomMemory(room, roomState) {
  Memory.rooms = Memory.rooms || {};
  const roomMemory = Memory.rooms[room.name] = Memory.rooms[room.name] || {};
  roomMemory.owner = roomState && roomState.owner ? roomState.owner : (room.controller && room.controller.owner && room.controller.owner.username);
  roomMemory.controllerLevel = room.controller ? room.controller.level : roomMemory.controllerLevel;
  roomMemory.lastVisit = Game.time;
  roomMemory.sources = roomMemory.sources || {};
}

function cacheSourceData(room) {
  const roomTerrain = room.getTerrain();
  const roomMemory = Memory.rooms[room.name];
  const sources = room.find(FIND_SOURCES);

  for (const source of sources) {
    const memory = roomMemory.sources[source.id] = roomMemory.sources[source.id] || { spots: 0, reservations: [] };
    if (memory.spots > 0) continue;

    let walkableSpots = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = source.pos.x + dx;
        const y = source.pos.y + dy;
        if (roomTerrain.get(x, y) === TERRAIN_MASK_WALL) continue;
        const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
        const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
        if (structures.length === 0 && constructionSites.length === 0) {
          walkableSpots += 1;
        }
      }
    }
    memory.spots = walkableSpots;
    memory.reservations = memory.reservations || [];
  }
}

function planSourceContainers(room, roomState) {
  const controller = room.controller;
  if (!controller) return;

  const mineControlled = controller.my;
  const username = mineControlled ? controller.owner.username : deriveUsername();
  const reservedByMe = controller.reservation && controller.reservation.username === username;
  const eligible = controller.level >= 3 && (mineControlled || reservedByMe);
  if (!eligible) return;

  const terrain = room.getTerrain();
  for (const source of room.find(FIND_SOURCES)) {
    const hasContainer = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
    if (hasContainer) continue;
    const hasSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
    if (hasSite) continue;

    let placed = false;
    for (let dx = -1; dx <= 1 && !placed; dx++) {
      for (let dy = -1; dy <= 1 && !placed; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = source.pos.x + dx;
        const y = source.pos.y + dy;
        if (terrain.get(x, y) === TERRAIN_MASK_WALL) continue;
        const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
        const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
        if (structures.length > 0 || constructionSites.length > 0) continue;
        const result = room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
        if (result === OK) placed = true;
      }
    }
  }
}

function deriveUsername() {
  const spawn = Object.values(Game.spawns)[0];
  return spawn && spawn.owner ? spawn.owner.username : null;
}
