const colony = require('managers_colony');
const memoryManager = require('managers_memory');
const mapVisuals = require('managers_mapVisuals');

memoryManager.initMemory();

module.exports.loop = function () {
  memoryManager.cleanCreepsMemory();
  colony.run();
  mapVisuals.run();
};
