const roomManager = require('managers_room');
const ROLE_DEFINITIONS = require('managers_roleDefinitions');

module.exports = {
  run() {
    for (const name in Game.rooms) {
      const room = Game.rooms[name];
      roomManager.run(room);
    }
  }
};
