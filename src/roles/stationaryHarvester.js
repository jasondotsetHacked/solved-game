module.exports = {
  run(creep) {
    const sourceId = creep.memory.sourceId;
    if (!sourceId) {
      console.log(`${creep.name} has no sourceId in memory.`);
      return;
    }

    const source = Game.getObjectById(sourceId);
    if (!source) {
      console.log(`${creep.name} cannot find source with ID ${sourceId}.`);
      return;
    }

    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
    })[0];

    if (!container) {
      console.log(`${creep.name} cannot find a container near source ${sourceId}.`);
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
