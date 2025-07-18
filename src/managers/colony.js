const roomManager = require('managers_room');

const ROLE_DEFINITIONS = [
  { role: 'scout',
    desiredCount: 1,
    memory: { role: 'scout' }, 
    template: [MOVE]
  },
  { role: 'worker',
    desiredCount: 1,
    memory: { role: 'worker' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'stationaryHarvester',
    desiredCount: 2,
    memory: { role: 'stationaryHarvester' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'filler',
    desiredCount: 1,
    memory: { role: 'filler' },
    template: [MOVE, CARRY]
  },
  { role: 'repairer',
    desiredCount: 1,
    memory: { role: 'repairer' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'hauler',
    desiredCount: 1,
    memory: { role: 'hauler' },
    template: [MOVE, CARRY, CARRY]
  },
  { role: 'upgrader',
    desiredCount: 1,
    memory: { role: 'upgrader' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'builder',
    desiredCount: 1,
    memory: { role: 'builder' },
    template: [MOVE, WORK, CARRY]
  }
];

module.exports = {
  run() {
    for (const name in Game.rooms) {
      const room = Game.rooms[name];
      roomManager.run(room);
    }
  },
  ROLE_DEFINITIONS: ROLE_DEFINITIONS
};
