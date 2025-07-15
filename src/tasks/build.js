module.exports = {
  run(creep) {
    const target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
      }
    } else {
      creep.say('No build');
    }
  }
};
