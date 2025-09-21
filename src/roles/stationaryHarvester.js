module.exports = {
  run(creep, empire) {
    const sourceId = creep.memory.sourceId;
    if (!sourceId) {
      return;
    }

    const source = Game.getObjectById(sourceId);
    if (!source) {
      return;
    }

    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
    })[0];

    if (!container) {
      return;
    }

    if (!creep.pos.isEqualTo(container.pos)) {
      creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
      return;
    }
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }
};
