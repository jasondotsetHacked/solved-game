const colony = require('managers_colony');
const empireManager = require('managers_empire');
const memoryManager = require('managers_memory');
const populationManager = require('managers_population');
const mapVisuals = require('managers_mapVisuals');
const telemetry = require('managers_telemetry');
const config = require('config');

memoryManager.initMemory();

module.exports.loop = function () {
  memoryManager.cleanCreepsMemory();

  const empire = empireManager.refresh();
  const spawnQueue = populationManager.buildSpawnQueue(empire);
  const spawnStats = colony.run(empire, spawnQueue);

  if (config.DEBUG === true) {
    mapVisuals.run(empire);
    telemetry.report(empire, spawnQueue, spawnStats);
  } else {
    telemetry.remember(empire, spawnQueue, spawnStats);
  }

  if (Game.cpu.bucket === 10000) {
    // Game.cpu.generatePixel();
  }
};
