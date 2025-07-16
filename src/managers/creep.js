const tasks = {
  harvest: require('tasks_harvest'),
  stationaryHarvest: require('tasks_stationaryHarvest'),
  build: require('tasks_build'),
  haul: require('tasks_haul'),
  upgrade: require('tasks_upgrade'),
  repair: require('tasks_repair'),
  scout: require('tasks_scout')
};

module.exports = {
  run(creep) {
    const taskName = creep.memory.task;
    const task = tasks[taskName];
    if (task && typeof task.run === 'function') {
      task.run(creep);
    } else {
      creep.say('idle');
    }
  }
};
