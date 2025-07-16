const wallRampStep = 1000; // repair walls/ramparts in this increment

module.exports = {
  run(creep) {
    // If empty, go harvest
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.task = 'harvest';
      return;
    }

    // Repair non-wall structures first
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure =>
        structure.hits < structure.hitsMax &&
        structure.structureType !== STRUCTURE_WALL &&
        structure.structureType !== STRUCTURE_RAMPART
    });

    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    // Handle walls and ramparts together, step wise
    const walls = creep.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART
    });

    if (walls.length > 0) {
      const minHits = Math.min(...walls.map(w => w.hits));
      const threshold = minHits + wallRampStep;
      const wallTarget = creep.pos.findClosestByPath(walls, {
        filter: s => s.hits < Math.min(threshold, s.hitsMax)
      });
      if (wallTarget) {
        if (creep.repair(wallTarget) === ERR_NOT_IN_RANGE) {
          creep.moveTo(wallTarget, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
    }

    // Nothing left to repair - pick another task
    const taskDistribution = require('managers_taskDistribution');
    creep.memory.task = taskDistribution.chooseTask(creep.room);
  }
};
