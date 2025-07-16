const colony = require('managers_colony');
const memoryManager = require('managers_memory');

memoryManager.initMemory();

module.exports.loop = function () {
  colony.run();
};
