module.exports = {
  run(creep) {
    if (creep.store.getFreeCapacity() > 0) {
      const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (source) {
        // persistent container selection: use creep.memory.containerId
        let container = null;
        if (creep.memory.containerId) {
          container = Game.getObjectById(creep.memory.containerId);
          // clear if invalid or empty
          if (!container || container.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            delete creep.memory.containerId;
            container = null;
          }
        }
        // select and remember the fullest container if none stored
        if (!container) {
          const containers = creep.room.find(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
          });
          if (containers.length > 0) {
            container = containers.reduce((maxC, c) =>
              c.store.getUsedCapacity(RESOURCE_ENERGY) > maxC.store.getUsedCapacity(RESOURCE_ENERGY) ? c : maxC
            );
            creep.memory.containerId = container.id;
          }
        }
        if (container) {
          // withdraw from container
          if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
          }
        } else {
          // no container chosen or available, harvest directly
          if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
          }
        }
      }
    } else {
      // switch to hauling energy when full
      creep.memory.task = 'haul';
    }
  }
};
