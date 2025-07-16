const taskDistribution = require('managers_taskDistribution');

module.exports = {
  run(creep) {
    // If creep has energy, transfer to spawn/extensions first
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure =>
          (structure.structureType === STRUCTURE_SPAWN ||
            structure.structureType === STRUCTURE_EXTENSION) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });
      if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      } else {
        // Nothing needs energy - choose next productive task
        creep.memory.task = taskDistribution.chooseTask(creep.room);
      }
    } else {
      // No energy to haul, go harvest
      creep.memory.task = 'harvest';
    }
  }
};
