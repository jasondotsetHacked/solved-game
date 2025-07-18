const gather = require('utils_gather');
module.exports = {
    run(creep) {
    // manage working state based on energy levels
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
    }
    // harvest energy when not working
    if (!creep.memory.working) {
      gather.gatherEnergy(creep);
      return;
    }

    // Working: perform tasks by priority
    // 1. Fill spawn/extensions
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 2. Build
    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 3. Repair (excl. walls/ramparts)
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
    });
    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 4. Fill towers
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }

    // 5. Fill containers
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER &&
                  s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
                  !s.pos.findInRange(FIND_SOURCES, 1).length // Exclude containers near sources
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }

    // 6. Fill storage
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }

    // 7. Upgrade controller
    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
      return;
    }
    // 8. Fallback: transfer to any structure with free capacity
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
  }
};
