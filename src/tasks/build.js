module.exports = {
  run(creep) {
    // If out of energy, go harvest
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.task = 'harvest';
      return;
    }
    const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
      }
    } else {
      // No construction sites, switch to upgrading
      creep.memory.task = 'upgrade';
    }
  }
};
