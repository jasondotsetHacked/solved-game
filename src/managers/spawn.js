module.exports = {
  run() {
    const spawn = Game.spawns['Spawn1'];
    if (!spawn || spawn.spawning) return;

    const scouts = _.filter(Game.creeps, c => c.memory.role === 'scout');
    if (scouts.length < 1) {
      spawn.spawnCreep([MOVE], `scout_${Game.time}`, {
        memory: { role: 'scout', task: 'scout' }
      });
      return;
    }

    const workers = _.filter(Game.creeps, c => c.memory.role === 'worker');
    if (workers.length < 4) {
      spawn.spawnCreep([WORK, CARRY, MOVE], `worker_${Game.time}`, {
        memory: { role: 'worker', task: 'harvest' }
      });
    }
  }
};
