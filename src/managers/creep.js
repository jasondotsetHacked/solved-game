// Role-based behavior handlers
const roles = {
  scout: require('roles_scout'),
  stationaryHarvester: require('roles_stationaryHarvester'),
  hauler: require('roles_hauler'),
  filler: require('roles_filler'),
  upgrader: require('roles_upgrader'),
  builder: require('roles_builder'),
  repairer: require('roles_repairer')
};

module.exports = {
  run(creep) {
    const role = creep.memory.role;
    const handler = roles[role];
    if (handler && typeof handler.run === 'function') {
      handler.run(creep);
    } else {
      creep.say('noRole');
    }
  }
};
