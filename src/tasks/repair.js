const config = require('./config');

module.exports = {
  run(creep, taskManager) {
    // --- Stall detection based on structure hits ---
    const posKey = `${creep.pos.x},${creep.pos.y}`;
    const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => structure.hits < structure.hitsMax
    });
    const progressKey = target ? target.hits : null;
    if (!creep.memory.lastPos || creep.memory.lastPos !== posKey || creep.memory.lastProgress !== progressKey) {
      creep.memory.lastPos = posKey;
      creep.memory.lastProgress = progressKey;
      creep.memory.stallTicks = 0;
    } else {
      creep.memory.stallTicks = (creep.memory.stallTicks || 0) + 1;
    }
    if (creep.memory.stallTicks > config.STALL_TICKS_THRESHOLD) {
      if (taskManager) taskManager.assignTask(creep);
      creep.memory.stallTicks = 0;
      return;
    }
    // End condition: out of energy
    if (creep.store[RESOURCE_ENERGY] === 0) {
      if (taskManager) taskManager.assignTask(creep);
      return;
    }
    // End condition: nothing to repair
    if (!target) {
      if (taskManager) taskManager.assignTask(creep);
      return;
    }
    // Try to repair
    if (creep.repair(target) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
    }
  }
};
