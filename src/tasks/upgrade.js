const config = require('./config');

module.exports = {
  run(creep, taskManager) {
    // --- Stall detection based on controller progress ---
    const posKey = `${creep.pos.x},${creep.pos.y}`;
    const ctrl = creep.room.controller;
    const progressKey = ctrl ? ctrl.progress : null;
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
    // --- End conditions ---
    if (creep.store[RESOURCE_ENERGY] === 0) {
      if (taskManager) taskManager.assignTask(creep);
      return;
    }
    if (!ctrl || ctrl.level === 8) {
      if (taskManager) taskManager.assignTask(creep);
      return;
    }
    // Try to upgrade
    if (creep.upgradeController(ctrl) === ERR_NOT_IN_RANGE) {
      creep.moveTo(ctrl, {visualizePathStyle: {stroke: '#ffffff'}});
    }
  }
};
