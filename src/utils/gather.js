module.exports.gatherEnergy = function(creep) {
  // toggle out of working if empty
  if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.working = false;
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    // just emptied energy: switch to gathering
    return true;
  }
  // toggle into working if full and release reservation
  if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
    if (creep.memory.sourceType === 'harvest' && creep.memory.sourceId) {
      const roomMem = Memory.rooms && Memory.rooms[creep.room.name];
      const src = roomMem && roomMem.sources && roomMem.sources[creep.memory.sourceId];
      if (src) src.reservations = src.reservations.filter(n => n !== creep.name);
    }
    creep.memory.working = true;
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return false;
  }
  // skip if already in working mode
  if (creep.memory.working) {
    return false;
  }

  // get or pick a source
  let source = Game.getObjectById(creep.memory.sourceId);
  if (!source) {
    source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
    if (source) {
      creep.memory.sourceType = 'dropped';
    } else {
      source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
      });
      if (source) {
        creep.memory.sourceType = 'container';
      } else {
        source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
          filter: s => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
        });
        if (source) {
          creep.memory.sourceType = 'storage';
        } else {
      // harvest sources with reservation system (use room.js initialized Memory.rooms)
      const roomName = creep.room.name;
      const roomMem = Memory.rooms && Memory.rooms[roomName];
      const sourcesMem = (roomMem && roomMem.sources) || {};
      // pick available source by reservations
      const availIds = Object.entries(sourcesMem)
        .filter(([id, data]) => data.reservations.length < data.spots)
        .map(([id]) => id);
      if (availIds.length) {
        const availSources = availIds
          .map(id => Game.getObjectById(id))
          .filter(s => s);
        source = creep.pos.findClosestByPath(availSources);
        if (source) {
          creep.memory.sourceType = 'harvest';
          const resList = sourcesMem[source.id].reservations;
          if (!resList.includes(creep.name)) resList.push(creep.name);
        }
      } else {
        source = null;
      }
        }
      }
    }
    if (source) {
      creep.memory.sourceId = source.id;
    } else {
      // no source found this tick: skip working tasks and remain in gathering mode
      return true;
    }
  }

  // validate source
  source = Game.getObjectById(creep.memory.sourceId);
  if (!source || ((creep.memory.sourceType === 'container' || creep.memory.sourceType === 'storage') && source.store[RESOURCE_ENERGY] === 0)) {
    // release reservation if harvesting
    if (creep.memory.sourceType === 'harvest' && creep.memory.sourceId) {
      const roomMem = Memory.rooms && Memory.rooms[creep.room.name];
      const src = roomMem && roomMem.sources && roomMem.sources[creep.memory.sourceId];
      if (src) src.reservations = src.reservations.filter(n => n !== creep.name);
    }
    creep.memory.sourceId = null;
    creep.memory.sourceType = null;
    return true; // retry next tick
  }

  // perform action
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
  if (result === OK) {
    if (creep.store.getFreeCapacity() === 0) {
      // release reservation after finishing harvest
      if (creep.memory.sourceType === 'harvest' && creep.memory.sourceId) {
        const roomMem = Memory.rooms && Memory.rooms[creep.room.name];
        const src = roomMem && roomMem.sources && roomMem.sources[creep.memory.sourceId];
        if (src) src.reservations = src.reservations.filter(n => n !== creep.name);
      }
      creep.memory.working = true;
      creep.memory.sourceId = null;
      creep.memory.sourceType = null;
    }
    return true;
  }
  // default: keep gathering
  return true;
};
