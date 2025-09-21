const gather = require('utils_gather');

module.exports = {
  run(creep, empire) {
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
      delete creep.memory.targetId;
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
    }

    if (!creep.memory.working) {
      gather.gatherEnergy(creep, ['storage', 'container', 'dropped', 'harvest']);
      return;
    }
    

    if (creep.memory.targetId) {
      const target = Game.getObjectById(creep.memory.targetId);
      if (target && target.hits < target.hitsMax) {
        if (creep.repair(target) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return;
      }
      delete creep.memory.targetId;
    }

    let repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
    });
    if (repairTarget) {
      creep.memory.targetId = repairTarget.id;
      if (creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(repairTarget, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    const walls = creep.room.find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax
    });
    if (walls.length) {
      repairTarget = walls.reduce((min, s) => (s.hits < min.hits ? s : min), walls[0]);
      creep.memory.targetId = repairTarget.id;
      if (creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(repairTarget, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }

    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return;
    }
  }
};
