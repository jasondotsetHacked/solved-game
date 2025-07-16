const spawnManager = require('managers_spawn');
const creepManager = require('managers_creep');

module.exports = {
  run(room) {
    if (room.controller && room.controller.level >= 2) {
      // ensure container construction sites exist at energy sources
      for (const source of room.find(FIND_SOURCES)) {
        const hasContainer = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
        // use FIND_CONSTRUCTION_SITES to detect any container construction sites
        const hasSite = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, { filter: c => c.structureType === STRUCTURE_CONTAINER })[0];
        if (!hasContainer && !hasSite) {
          source.pos.createConstructionSite(STRUCTURE_CONTAINER);
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
