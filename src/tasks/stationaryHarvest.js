module.exports = {
  /**
   * Stationary harvester: harvests from assigned source and transfers to adjacent container
   */
  run(creep) {
    const source = Game.getObjectById(creep.memory.sourceId);
    if (!source) return;
    // find container near source
    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0];

    if (creep.store.getFreeCapacity() > 0) {
      // harvest energy
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    } else {
      // transfer to container when full
      if (container) {
        if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }
  }
};
