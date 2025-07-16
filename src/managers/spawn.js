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
