const spawnManager = require('managers_spawn');
const creepManager = require('managers_creep');

module.exports = {
  run(room) {
    const controller = room.controller;
    // determine if room is owned or reserved by me
    const mySpawn = Object.values(Game.spawns)[0];
    const myUsername = mySpawn ? mySpawn.owner.username : null;
    if (controller && controller.level >= 2 && (controller.my || (controller.reservation && controller.reservation.username === myUsername))) {
      // ensure container construction sites exist at energy sources
      const terrain = room.getTerrain();
      for (const source of room.find(FIND_SOURCES)) {
        const hasContainer = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
        const hasSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, { filter: c => c.structureType === STRUCTURE_CONTAINER })[0];
        if (!hasContainer && !hasSite) {
          // find a valid walkable position around the source
          let placed = false;
          for (let dx = -1; dx <= 1 && !placed; dx++) {
            for (let dy = -1; dy <= 1 && !placed; dy++) {
              if (dx === 0 && dy === 0) continue;
              const x = source.pos.x + dx;
              const y = source.pos.y + dy;
              if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                const structures = room.lookForAt(LOOK_STRUCTURES, x, y);
                const sites = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                if (structures.length === 0 && sites.length === 0) {
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
  }
};
