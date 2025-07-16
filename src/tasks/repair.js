module.exports = {
  run(creep) {
    // If empty, go harvest
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.task = 'harvest';
      return;
    }
    // existing repair logic
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => structure.hits < structure.hitsMax
    });
    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
      }
    } else {
      // No repair targets, switch to upgrading
      creep.memory.task = 'upgrade';
    }
  }
};
