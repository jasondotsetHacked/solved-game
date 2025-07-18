module.exports = {
  run(creep) {
    // Toggle working state
    if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.working = false;
    }
    if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      // clear previous energy target
      creep.memory.sourceId = null;
      creep.memory.sourceType = null;
    }

    // If gathering energy
    if (!creep.memory.working) {
      let source;
      // Choose or stick with energy source
      if (!creep.memory.sourceId) {
        // 1. Dropped resources
        source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
        if (source) {
          creep.memory.sourceId = source.id;
          creep.memory.sourceType = 'dropped';
        } else {
          // 2. Containers
          source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
          });
          if (source) {
            creep.memory.sourceId = source.id;
            creep.memory.sourceType = 'container';
          } else {
            // 3. Storage
            source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
              filter: s => s.structureType === STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] > 0
            });
            if (source) {
              creep.memory.sourceId = source.id;
              creep.memory.sourceType = 'storage';
            } else {
              // 4. Harvest
              source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
              if (source) {
                creep.memory.sourceId = source.id;
                creep.memory.sourceType = 'harvest';
              }
            }
          }
        }
      }

      if (creep.memory.sourceId) {
        source = Game.getObjectById(creep.memory.sourceId);
        // if target invalid or empty, reset and retry next tick
        if (!source || ((creep.memory.sourceType === 'container' || creep.memory.sourceType === 'storage') && source.store[RESOURCE_ENERGY] === 0)) {
          creep.memory.sourceId = null;
          creep.memory.sourceType = null;
        } else {
          // perform action based on source type
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
            return;
          }
          if (result === OK) {
            // if full now, switch to working
            if (creep.store.getFreeCapacity() === 0) {
              creep.memory.working = true;
              creep.memory.sourceId = null;
              creep.memory.sourceType = null;
            }
            return;
          }
        }
      }
      // no valid source found or after reset, will retry next tick
      return;
    }

    // Working: perform tasks by priority
    // 1. Upgrade controller
    if (creep.room.controller && creep.room.controller.my) {
      if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
      }
      return;
    }
    // 2. Fill spawn/extensions
    let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_SPAWN || s.structureType === STRUCTURE_EXTENSION) && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 3. Build
    target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    if (target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 4. Repair (excl. walls/ramparts)
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
    });
    if (target) {
      if (creep.repair(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 5. Fill towers
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 6. Fill containers
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      return;
    }
    // 7. Fill storage
    target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    });
    if (target) {
      if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
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
