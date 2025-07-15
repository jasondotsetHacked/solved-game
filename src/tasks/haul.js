module.exports = {
  run(creep) {
    if (creep.store.getFreeCapacity() === 0) {
      const target = creep.room.storage || creep.room.terminal;
      if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
        }
      }
    } else {
      const source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
      if (source) {
        if (creep.pickup(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
      }
    }
  }
};
