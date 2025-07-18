module.exports.gatherEnergy = function (creep, priority = ['dropped', 'container', 'storage', 'harvest']) {

  // Helper function to release reservations
  const releaseReservation = () => {
    if (creep.memory.sourceType === 'harvest' && creep.memory.sourceId) {
      const roomMem = Memory.rooms && Memory.rooms[creep.room.name];
      const src = roomMem && roomMem.sources && roomMem.sources[creep.memory.sourceId];
      if (src) src.reservations = src.reservations.filter(n => n !== creep.name);
    }
  };

  // Toggle out of working if empty
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return true;
  }

  // Toggle into working if full
  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    releaseReservation();
    creep.memory.working = true;
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return false;
  }

  // Skip if already in working mode
  if (creep.memory.working) return false;

  // Get or pick a source
  const pickSource = () => {
    let source = Game.getObjectById(creep.memory.sourceId);
    if (source) return source;

    for (const type of priority) {
      switch (type) {
        case 'dropped':
          source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
          if (source) {
            creep.memory.sourceType = 'dropped';
            return source;
          }
          break;
        case 'container':
          source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
          });
          if (source) {
            creep.memory.sourceType = 'container';
            return source;
          }
          break;
        case 'storage':
          source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
          });
          if (source) {
            creep.memory.sourceType = 'storage';
            return source;
          }
          break;
        case 'harvest':
          const roomMem = Memory.rooms && Memory.rooms[creep.room.name];
          const sourcesMem = (roomMem && roomMem.sources) || {};
          const availIds = Object.entries(sourcesMem)
            .filter(([id, data]) => data.reservations.length < data.spots)
            .map(([id]) => id);

          if (availIds.length) {
            const availSources = availIds.map(id => Game.getObjectById(id)).filter(s => s);
            source = creep.pos.findClosestByPath(availSources);
            if (source) {
              creep.memory.sourceType = 'harvest';
              const resList = sourcesMem[source.id].reservations;
              if (!resList.includes(creep.name)) resList.push(creep.name);
              return source;
            }
          }
          break;
      }
    }

    return null;
  };

  const source = pickSource();
  if (!source) {
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return true;
  }

  creep.memory.sourceId = source.id;

  // Validate source
  const validateSource = () => {
    if (!source || ((creep.memory.sourceType === 'container' || creep.memory.sourceType === 'storage') && source.store[RESOURCE_ENERGY] === 0)) {
      releaseReservation();
      creep.memory.sourceId = null;
      creep.memory.sourceType = null;
      return false;
    }
    return true;
  };

  if (!validateSource()) return true;

  // Perform action
  const performAction = () => {
    let result;
    switch (creep.memory.sourceType) {
      case 'dropped':
        result = creep.pickup(source);
        break;
      case 'container':
      case 'storage':
        result = creep.withdraw(source, RESOURCE_ENERGY);
        break;
      case 'harvest':
        result = creep.harvest(source);
        break;
    }

    if (result === ERR_NOT_IN_RANGE) {
      creep.moveTo(source);
      return true;
    }

    if (result === OK && creep.store.getFreeCapacity() === 0) {
      releaseReservation();
      creep.memory.working = true;
      creep.memory.sourceId = null;
      creep.memory.sourceType = null;
    }

    return true;
  };

  return performAction();
};
