const spawnManager = require('managers_spawn');
const creepManager = require('managers_creep');

module.exports = {
  run(room) {
    spawnManager.run();
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      creepManager.run(creep);
    }
  }
};
