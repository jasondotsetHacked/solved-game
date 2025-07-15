module.exports = {
  run(creep) {
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => structure.hits < structure.hitsMax
    });
    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
      }
    }
  }
};
