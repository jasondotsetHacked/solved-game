const wallRampStep = 1000; // repair walls/ramparts in this increment

module.exports = {
  run(creep) {
    // If empty, clear previous target and go harvest
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      // clear memorized repair target so we reselect after refill
      delete creep.memory.targetId;
      creep.memory.task = 'harvest';
      return;
    }

    // If have a remembered target, continue repairing it until fully repaired
    if (creep.memory.targetId) {
      const memTarget = Game.getObjectById(creep.memory.targetId);
      if (memTarget && memTarget.hits < memTarget.hitsMax) {
        if (creep.repair(memTarget) === ERR_NOT_IN_RANGE) {
          creep.moveTo(memTarget, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
      // Target done or gone, clear memory
      delete creep.memory.targetId;
    }
    // Repair non-wall structures first
    const nonWallTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure =>
        structure.hits < structure.hitsMax &&
        structure.structureType !== STRUCTURE_WALL &&
        structure.structureType !== STRUCTURE_RAMPART
    });

    if (nonWallTarget) {
      // remember and repair
      creep.memory.targetId = nonWallTarget.id;
      if (creep.repair(nonWallTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(nonWallTarget, { visualizePathStyle: { stroke: '#ffffff' } });
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
        // remember and repair wall/rampart target
        creep.memory.targetId = wallTarget.id;
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
