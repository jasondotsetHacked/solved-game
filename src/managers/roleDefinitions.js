module.exports = {
  worker: {
    template: [WORK, CARRY, MOVE]
  },
  stationaryHarvester: {
    template: [WORK, WORK, WORK, MOVE, CARRY],
    minimumEnergy: 550
  },
  filler: {
    template: [CARRY, CARRY, MOVE]
  },
  hauler: {
    template: [CARRY, CARRY, MOVE],
    minimumEnergy: 150
  },
  repairer: {
    template: [WORK, CARRY, MOVE]
  },
  upgrader: {
    template: [WORK, WORK, MOVE, CARRY]
  },
  builder: {
    template: [WORK, CARRY, CARRY, MOVE]
  },
  scout: {
    template: [MOVE],
    maximumEnergy: 50
  }
};
