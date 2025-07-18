module.exports = {
  run(creep) {
    // Retrieve the sourceId from memory
    const sourceId = creep.memory.sourceId;
    if (!sourceId) {
      console.log(`${creep.name} has no sourceId in memory.`);
      return;
    }

    // Find the source by ID
    const source = Game.getObjectById(sourceId);
    if (!source) {
      console.log(`${creep.name} cannot find source with ID ${sourceId}.`);
      return;
    }

    // Find the container near the source
    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: structure => structure.structureType === STRUCTURE_CONTAINER
    })[0];

    if (!container) {
      console.log(`${creep.name} cannot find a container near source ${sourceId}.`);
      return;
    }

    // Move to the container if not already there
    if (!creep.pos.isEqualTo(container.pos)) {
      creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
      return;
    }

    // Start harvesting the source
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }
};
