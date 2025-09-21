module.exports = {
  run(creep, empire) {
    if (!creep.room.controller || !creep.room.controller.my) return;

    if (creep.store[RESOURCE_ENERGY] === 0) {
      // Wait for hauler to supply energy
      return;
    }

    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller);
    }
  }
};
