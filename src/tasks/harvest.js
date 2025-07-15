const config = require('./config');

module.exports = {
  run(creep, taskManager) {
    // --- Stall detection based on carried energy ---
    const posKey = `${creep.pos.x},${creep.pos.y}`;
    const progressKey = creep.store[RESOURCE_ENERGY];
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
    // If creep is full, decide next task based on room state
    if (creep.store.getFreeCapacity() === 0) {
      // Prefer hauling if storage/terminal exists
      if (creep.room.storage || creep.room.terminal) {
        creep.memory.task = 'haul';
      } else {
        // If there are construction sites, build
        const site = creep.room.find(FIND_CONSTRUCTION_SITES)[0];
        if (site) {
          creep.memory.task = 'build';
        } else {
          // Otherwise, upgrade controller
          creep.memory.task = 'upgrade';
        }
      }
      return;
    }
    if (creep.store.getFreeCapacity() > 0) {
      const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
      if (source) {
        if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
          creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
      }
    }
  }
};
