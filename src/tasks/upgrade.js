module.exports = {
  run(creep) {
    // If out of energy, switch to harvesting
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.task = 'harvest';
      return;
    }

    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
    }
  }
};
