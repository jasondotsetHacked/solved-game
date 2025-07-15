const tasks = {
  harvest: require('tasks.harvest'),
  build: require('tasks.build'),
  haul: require('tasks.haul'),
  upgrade: require('tasks.upgrade'),
  repair: require('tasks.repair')
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
