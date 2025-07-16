const bodyManager = require('managers_bodyManager');
// Define roles with desired count and memory template
const ROLE_DEFINITIONS = [
  { role: 'scout', desiredCount: 1, memory: { role: 'scout', task: 'scout' } },
  { role: 'worker', desiredCount: 7, memory: { role: 'worker', task: 'harvest' } }
];

module.exports = {
  run() {
    const spawn = Game.spawns['Spawn1'];
    if (!spawn || spawn.spawning) return;

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
          memory: { role: 'stationaryHarvester', task: 'stationaryHarvest', sourceId: source.id }
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
