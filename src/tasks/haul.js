module.exports = {
  run(creep) {
    // If creep has energy, transfer to spawn/extensions first
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
      const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: structure =>
          (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      });
      if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
        }
      } else {
        // No structures need energy, switch to upgrading
        creep.memory.task = 'upgrade';
      }
    } else {
      // No energy to haul, go harvest
      creep.memory.task = 'harvest';
    }
  }
};
