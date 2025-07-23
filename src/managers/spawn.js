const bodyManager = require('managers_bodyManager');
const ROLE_DEFINITIONS = require('managers_roleDefinitions');


module.exports = {
  run() {
    const spawn = Game.spawns['Spawn1'];
    if (!spawn || spawn.spawning) return;

    if (_.size(Game.creeps) === 0) {
      const energyAvailable = spawn.room.energyAvailable;
      const body = bodyManager.buildBody('worker', energyAvailable);
      spawn.spawnCreep(body, `coldHarvester_${Game.time}`, {
        memory: { role: 'worker' }
      });
      return;
    }

    const energyCapacity = spawn.room.energyCapacityAvailable;
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

    for (const roleDef of ROLE_DEFINITIONS) {
      const existingCreeps = _.filter(Game.creeps, c => c.memory.role === roleDef.role);
      if (existingCreeps.length < roleDef.desiredCount) {
        const body = bodyManager.buildBody(roleDef.role, energyCapacity);
        spawn.spawnCreep(body, `${roleDef.role}_${Game.time}`, {
          memory: Object.assign({}, roleDef.memory)
        });
        return;
      }
    }
  }
};
