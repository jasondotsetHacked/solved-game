const gather = require('utils_gather');
const wallRampStep = 1000; // repair walls/ramparts in this increment

module.exports = {
  run(creep) {
    // Manage working state based on energy levels
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      delete creep.memory.targetId; // Clear target when out of energy
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
    }

    // Harvest energy when not working
    if (!creep.memory.working) {
      gather.gatherEnergy(creep, ['storage', 'container', 'dropped', 'harvest']);
      return;
    }
    

    // Working: perform repair tasks by priority
    // 1. Continue repairing memorized target if valid
    if (creep.memory.targetId) {
      const target = Game.getObjectById(creep.memory.targetId);
      if (target && target.hits < target.hitsMax) {
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
      // Clear memory if target is fully repaired or invalid
      delete creep.memory.targetId;
    }

    // 2. Repair non-wall structures
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
    });
    if (target) {
      creep.memory.targetId = target.id;
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    // 3. Repair walls and ramparts incrementally
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax
    });
    if (target) {
      creep.memory.targetId = target.id;
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    // 4. Fallback: Upgrade controller
    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }
  }
};
