const tasks = {
  harvest: require('tasks_harvest'),
  build: require('tasks_build'),
  haul: require('tasks_haul'),
  upgrade: require('tasks_upgrade'),
  repair: require('tasks_repair')
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
