module.exports = {
  run() {
    const spawn = Game.spawns['Spawn1'];
    if (!spawn || spawn.spawning) return;

    const workers = _.filter(Game.creeps, c => c.memory.role === 'worker');
    if (workers.length < 4) {
      spawn.spawnCreep([WORK, CARRY, MOVE], `worker_${Game.time}`, {
        memory: { role: 'worker', task: 'harvest' }
      });
    }
  }
};
