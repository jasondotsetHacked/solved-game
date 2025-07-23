const turret = require('structures_turret');

module.exports = {
  run(room) {
    if (room.controller && room.controller.my) {
      const turrets = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_TOWER
      });
      for (const turretObj of turrets) {
        turret.run(turretObj);
      }
    }
  }
};
