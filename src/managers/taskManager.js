// src/managers/taskManager.js
// Centralized task manager for assigning tasks to creeps

module.exports = {
  assignTask(creep) {
    // Prefer hauling if storage/terminal exists and not full
    if ((creep.room.storage && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) ||
        (creep.room.terminal && creep.room.terminal.store.getFreeCapacity(RESOURCE_ENERGY) > 0)) {
      creep.memory.task = 'haul';
      return;
    }
    // Assign building if there are construction sites
    const site = creep.room.find(FIND_CONSTRUCTION_SITES)[0];
    if (site) {
      creep.memory.task = 'build';
      return;
    }
    // Default to upgrading
    creep.memory.task = 'upgrade';
  }
};
