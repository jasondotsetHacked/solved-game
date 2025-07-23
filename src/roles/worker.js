const gather = require('utils_gather');
module.exports = {
  run(creep) {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
    }
    if (!creep.memory.working) {
      gather.gatherEnergy(creep, ['storage', 'container', 'dropped', 'harvest']);
      return;
    }
    let targetStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (targetStructure) {
      if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
    targetStructure = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (targetStructure) {
      if (creep.build(targetStructure) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
    targetStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
    });
    if (targetStructure) {
      if (creep.repair(targetStructure) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
    targetStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (targetStructure) {
      if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
    targetStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER &&
        s.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
        !s.pos.findInRange(FIND_SOURCES, 1).length
    });
    if (targetStructure) {
      if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
    targetStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (targetStructure) {
      if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
      return;
    }
    targetStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (targetStructure) {
      if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetStructure);
      }
      return;
    }
  }
};
