const colony = require('managers_colony');
const memoryManager = require('managers_memory');
const mapVisuals = require('managers_mapVisuals');
const roomVisuals = require('managers_roomVisuals');
const config = require('config');

memoryManager.initMemory();

module.exports.loop = function () {
  memoryManager.cleanCreepsMemory();
  colony.run();
  if (Game.cpu.bucket === 10000) {
    Game.cpu.generatePixel();
  }
  if (config.DEBUG === true) {
    roomVisuals.run();
    mapVisuals.run();
    if (Game.time % 100 === 0) {
      console.log(`CPU: ${Game.cpu.getUsed().toFixed(2)} / ${Game.cpu.limit} | Bucket: ${Game.cpu.bucket}`);
    }
  }
}