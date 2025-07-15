const spawnManager = require('managers.spawn');
const creepManager = require('managers.creep');

module.exports = {
  run(room) {
    spawnManager.run();
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      creepManager.run(creep);
    }
  }
};
