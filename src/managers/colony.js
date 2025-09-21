const roomManager = require('managers_room');
const spawnManager = require('managers_spawn');
const creepManager = require('managers_creep');
const structureManager = require('managers_structure');

module.exports = {
  run(empire, spawnQueue) {
    for (const room of Object.values(Game.rooms)) {
      const roomState = empire.rooms[room.name] || null;
      roomManager.run(room, roomState, empire);
    }

    const spawnStats = spawnManager.run(empire, spawnQueue);

    for (const creep of Object.values(Game.creeps)) {
      creepManager.run(creep, empire);
    }

    for (const room of Object.values(Game.rooms)) {
      const roomState = empire.rooms[room.name] || null;
      structureManager.run(room, roomState, empire);
    }

    return spawnStats;
  }
};
