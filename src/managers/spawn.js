const bodyManager = require('managers_bodyManager');
const { ROLE_DEFINITIONS } = require('managers_colony');


module.exports = {
  run() {
    const spawn = Game.spawns['Spawn1'];
    if (!spawn || spawn.spawning) return;

    // Cold boot: if no creeps exist, spawn a minimal harvester to restart economy
    if (_.size(Game.creeps) === 0) {
      const energyAvailable = spawn.room.energyAvailable;
      const body = bodyManager.buildBody('worker', energyAvailable);
      spawn.spawnCreep(body, `coldHarvester_${Game.time}`, {
        memory: { role: 'worker' }
      });
      return;
    }

    // use full room energy capacity for body building
    const energyCapacity = spawn.room.energyCapacityAvailable;
    // spawn stationary harvesters: one per source with container
    const sources = spawn.room.find(FIND_SOURCES);
    for (const source of sources) {
      const container = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: s => s.structureType === STRUCTURE_CONTAINER })[0];
      if (!container) continue;
      const assigned = _.filter(Game.creeps, c => c.memory.role === 'stationaryHarvester' && c.memory.sourceId === source.id);
      if (assigned.length === 0) {
        const body = bodyManager.buildBody('stationaryHarvester', energyCapacity);
        spawn.spawnCreep(body, `stationaryHarvester_${source.id}_${Game.time}`, {
          memory: { role: 'stationaryHarvester', sourceId: source.id }
        });
        return;
      }
    }

    // iterate roles and spawn the first one below its desired count
    for (const def of ROLE_DEFINITIONS) {
      const creeps = _.filter(Game.creeps, c => c.memory.role === def.role);
      if (creeps.length < def.desiredCount) {
        // build body via bodyManager
        const body = bodyManager.buildBody(def.role, energyCapacity);
        spawn.spawnCreep(body, `${def.role}_${Game.time}`, {
          memory: Object.assign({}, def.memory)
        });
        return;
      }
    }
  }
};
