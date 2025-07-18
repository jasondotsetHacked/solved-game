// centralized role definitions
module.exports = [
  { role: 'scout',
    desiredCount: 1,
    memory: { role: 'scout' },
    template: [MOVE]
  },
  { role: 'worker',
    desiredCount: 7,
    memory: { role: 'worker' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'stationaryHarvester',
    desiredCount: 0,
    memory: { role: 'stationaryHarvester' },
    template: [MOVE, WORK, WORK, WORK, CARRY]
  },
  { role: 'filler',
    desiredCount: 0,
    memory: { role: 'filler' },
    template: [MOVE, CARRY]
  },
  { role: 'repairer',
    desiredCount: 0,
    memory: { role: 'repairer' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'hauler',
    desiredCount: 0,
    memory: { role: 'hauler' },
    template: [MOVE, CARRY, CARRY]
  },
  { role: 'upgrader',
    desiredCount: 0,
    memory: { role: 'upgrader' },
    template: [MOVE, WORK, CARRY]
  },
  { role: 'builder',
    desiredCount: 0,
    memory: { role: 'builder' },
    template: [MOVE, WORK, CARRY]
  }
];
