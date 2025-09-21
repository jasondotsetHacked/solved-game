const gather = require('utils_gather');

module.exports = {
  run(creep, empire) {
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

    const prioritySite = findPrioritySite(creep);
    if (prioritySite) {
      if (creep.build(prioritySite) === ERR_NOT_IN_RANGE) {
        creep.moveTo(prioritySite, { visualizePathStyle: { stroke: '#6b8cff' } });
      }
      return;
    }

    const repairTarget = findRepairTarget(creep);
    if (repairTarget) {
      if (creep.repair(repairTarget) === ERR_NOT_IN_RANGE) {
        creep.moveTo(repairTarget, { visualizePathStyle: { stroke: '#6b8cff' } });
      }
      return;
    }

    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#6b8cff' } });
      }
    }
  }
};

function findPrioritySite(creep) {
  const sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
  if (sites.length === 0) return null;
  sites.sort((a, b) => a.progressTotal - b.progressTotal);
  const closest = creep.pos.findClosestByPath(sites);
  return closest || sites[0];
}

function findRepairTarget(creep) {
  return creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
        return structure.hits < 50000;
      }
      if (structure.structureType === STRUCTURE_ROAD) {
        return structure.hits < structure.hitsMax * 0.7;
      }
      return structure.hits < structure.hitsMax * 0.8;
    }
  });
}
