const UPGRADE_RATIO = 0.5;
const REPAIR_RATIO = 0.3;

module.exports = {
  /**
   * Choose next task for a worker creep based on desired ratios and room needs.
   * @param {Room} room
   * @returns {string} task name
   */
  chooseTask(room) {
    const workers = _.filter(Game.creeps, c => c.memory.role === 'worker');
    const upgradeCount = _.sum(workers, c => c.memory.task === 'upgrade');
    const repairCount = _.sum(workers, c => c.memory.task === 'repair');
    const total = workers.length || 1; // avoid divide by zero

    const upgradeTarget = Math.floor(total * UPGRADE_RATIO);
    const repairTarget = Math.floor(total * REPAIR_RATIO);

    const hasRepairs = room.find(FIND_STRUCTURES, {
      filter: s => s.hits < s.hitsMax &&
        s.structureType !== STRUCTURE_WALL &&
        s.structureType !== STRUCTURE_RAMPART
    }).length > 0 ||
    room.find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax
    }).length > 0;

    const hasConstruction = room.find(FIND_CONSTRUCTION_SITES).length > 0;

    if (hasConstruction) return 'build';
    if (hasRepairs && repairCount < repairTarget) return 'repair';
    if (upgradeCount < upgradeTarget) return 'upgrade';
    return hasRepairs ? 'repair' : 'upgrade';
  }
};
