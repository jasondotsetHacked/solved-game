module.exports.gatherEnergy = function (creep, energyPriority = ['dropped', 'container', 'storage', 'harvest']) {

  const clearHarvestReservation = () => {
    if (creep.memory.sourceType === 'harvest' && creep.memory.sourceId) {
      const roomMemory = Memory.rooms && Memory.rooms[creep.room.name];
      const sourceMemory = roomMemory && roomMemory.sources && roomMemory.sources[creep.memory.sourceId];
      if (sourceMemory) {
        sourceMemory.reservations = sourceMemory.reservations.filter(reservedBy => reservedBy !== creep.name);
      }
    }
  };

  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return true;
  }

  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    clearHarvestReservation();
    creep.memory.working = true;
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return false;
  }

  if (creep.memory.working) return false;

  const selectEnergySource = () => {
    let energySource = Game.getObjectById(creep.memory.sourceId);
    if (energySource) return energySource;

    for (const sourceType of energyPriority) {
      switch (sourceType) {
        case 'dropped':
          energySource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
          if (energySource) {
            creep.memory.sourceType = 'dropped';
            return energySource;
          }
          break;
        case 'container':
          energySource = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] > 0
          });
          if (energySource) {
            creep.memory.sourceType = 'container';
            return energySource;
          }
          break;
        case 'storage':
          energySource = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: structure => structure.structureType === STRUCTURE_STORAGE && structure.store[RESOURCE_ENERGY] > 0
          });
          if (energySource) {
            creep.memory.sourceType = 'storage';
            return energySource;
          }
          break;
        case 'harvest':
          const roomMemory = Memory.rooms && Memory.rooms[creep.room.name];
          const sourcesMemory = (roomMemory && roomMemory.sources) || {};
          const availableSourceIds = Object.entries(sourcesMemory)
            .filter(([id, data]) => data.reservations.length < data.spots)
            .map(([id]) => id);

          if (availableSourceIds.length) {
            const availableSources = availableSourceIds.map(id => Game.getObjectById(id)).filter(source => source);
            energySource = creep.pos.findClosestByPath(availableSources);
            if (energySource) {
              creep.memory.sourceType = 'harvest';
              const reservationList = sourcesMemory[energySource.id].reservations;
              if (!reservationList.includes(creep.name)) reservationList.push(creep.name);
              return energySource;
            }
          }
          break;
      }
    }

    return null;
  };

  const energySource = selectEnergySource();
  if (!energySource) {
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return true;
  }

  creep.memory.sourceId = energySource.id;

  const isSourceValid = () => {
    if (!energySource || ((creep.memory.sourceType === 'container' || creep.memory.sourceType === 'storage') && energySource.store[RESOURCE_ENERGY] === 0)) {
      // console.log(`Creep ${creep.name} found invalid source (${creep.memory.sourceType}), clearing target.`);
      clearHarvestReservation();
      creep.memory.sourceId = null;
      creep.memory.sourceType = null;
      return false;
    }
    return true;
  };

  if (!isSourceValid()) return true;

  const gatherEnergyFromSource = () => {
    let actionResult;
    switch (creep.memory.sourceType) {
      case 'dropped':
        actionResult = creep.pickup(energySource);
        break;
      case 'container':
      case 'storage':
        actionResult = creep.withdraw(energySource, RESOURCE_ENERGY);
        break;
      case 'harvest':
        actionResult = creep.harvest(energySource);
        break;
    }

    if (actionResult === ERR_NOT_IN_RANGE) {
      creep.moveTo(energySource);
      return true;
    }

    if (actionResult === OK) {
      if (creep.store.getFreeCapacity() === 0) {
        clearHarvestReservation();
        creep.memory.working = true;
        creep.memory.sourceId = null;
        creep.memory.sourceType = null;
      }
      return true;
    }

    // handle unexpected errors (e.g., no energy, invalid target)
    // console.log(`Creep ${creep.name} gather error (${actionResult}) on ${creep.memory.sourceType}, resetting.`);
    clearHarvestReservation();
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return true;
  };

  return gatherEnergyFromSource();
};
