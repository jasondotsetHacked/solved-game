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
      gather.gatherEnergy(creep, ['container', 'dropped', 'storage']);
      return;
    }

    const depositTarget = findDepositTarget(creep);
    if (depositTarget) {
      if (creep.transfer(depositTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(depositTarget, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return;
    }

    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
    }
  }
};

function findDepositTarget(creep) {
  const storage = creep.room.storage;
  if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    return storage;
  }

  const baseContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_CONTAINER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0 &&
      structure.pos.findInRange(FIND_SOURCES, 1).length === 0
  });
  if (baseContainer) return baseContainer;

  const energyStructure = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (energyStructure) return energyStructure;

  const tower = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_TOWER &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (tower) return tower;

  const terminal = creep.room.terminal;
  if (terminal && terminal.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
    return terminal;
  }

  return creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => structure.store && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
}
