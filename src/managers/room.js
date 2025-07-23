const spawnManager = require('managers_spawn');
const creepManager = require('managers_creep');
const structureManager = require('managers_structure');

module.exports = {
  run(room) {
    Memory.rooms = Memory.rooms || {};
    Memory.rooms[room.name] = Memory.rooms[room.name] || {};
    Memory.rooms[room.name].sources = Memory.rooms[room.name].sources || {};
    const activeSources = room.find(FIND_SOURCES);
    const roomTerrain = room.getTerrain();
    activeSources.forEach(source => {
      if (!Memory.rooms[room.name].sources[source.id]) {
        let walkableSpots = 0;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const x = source.pos.x + dx, y = source.pos.y + dy;
            if (roomTerrain.get(x, y) !== TERRAIN_MASK_WALL) {
              const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
              const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
              if (structures.length === 0 && constructionSites.length === 0) {
                walkableSpots++;
              }
            }
          }
        }
        Memory.rooms[room.name].sources[source.id] = { spots: walkableSpots, reservations: [] };
      }
    });
    const controller = room.controller;
    const mySpawn = Object.values(Game.spawns)[0];
    const myUsername = mySpawn ? mySpawn.owner.username : null;
    if (controller && controller.level >= 3 && (controller.my || (controller.reservation && controller.reservation.username === myUsername))) {
      const terrainData = room.getTerrain();
      for (const source of room.find(FIND_SOURCES)) {
        const hasContainer = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
        const hasConstructionSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, { filter: c => c.structureType === STRUCTURE_CONTAINER })[0];
        if (!hasContainer && !hasConstructionSite) {
          let placed = false;
          for (let dx = -1; dx <= 1 && !placed; dx++) {
            for (let dy = -1; dy <= 1 && !placed; dy++) {
              if (dx === 0 && dy === 0) continue;
              const x = source.pos.x + dx;
              const y = source.pos.y + dy;
              if (terrainData.get(x, y) !== TERRAIN_MASK_WALL) {
                const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
                const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                if (structures.length === 0 && constructionSites.length === 0) {
                  room.createConstructionSite(x, y, STRUCTURE_CONTAINER);
                  placed = true;
                }
              }
            }
          }
        }
      }
    }
    spawnManager.run();
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      creepManager.run(creep);
    }
    structureManager.run(room);
  }
};
