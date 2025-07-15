const roomManager = require('managers.room');

module.exports = {
  run() {
    for (const name in Game.rooms) {
      const room = Game.rooms[name];
      roomManager.run(room);
    }
  }
};
