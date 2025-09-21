function repeat(part, count) {
  return Array.from({ length: count }, () => part);
}

function tier(...parts) {
  const body = [];
  for (const part of parts) {
    if (Array.isArray(part)) body.push(...part);
    else body.push(part);
  }
  const energy = body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
  return { energy, body };
}

module.exports = {
  worker: {
    minimumEnergy: 200,
    tiers: [
      tier(repeat(WORK, 1), repeat(CARRY, 1), repeat(MOVE, 1)),
      tier(repeat(WORK, 2), repeat(CARRY, 2), repeat(MOVE, 2)),
      tier(repeat(WORK, 3), repeat(CARRY, 2), repeat(MOVE, 3)),
      tier(repeat(WORK, 4), repeat(CARRY, 4), repeat(MOVE, 4)),
      tier(repeat(WORK, 5), repeat(CARRY, 5), repeat(MOVE, 5)),
      tier(repeat(WORK, 6), repeat(CARRY, 6), repeat(MOVE, 6))
    ]
  },
  stationaryHarvester: {
    minimumEnergy: 550,
    tiers: [
      tier(repeat(WORK, 5), CARRY, MOVE),
      tier(repeat(WORK, 6), CARRY, repeat(MOVE, 2)),
      tier(repeat(WORK, 7), CARRY, repeat(MOVE, 2)),
      tier(repeat(WORK, 8), CARRY, repeat(MOVE, 3))
    ],
    maximumEnergy: 1100
  },
  filler: {
    minimumEnergy: 200,
    tiers: [
      tier(repeat(CARRY, 2), MOVE),
      tier(repeat(CARRY, 4), repeat(MOVE, 2)),
      tier(repeat(CARRY, 6), repeat(MOVE, 3)),
      tier(repeat(CARRY, 8), repeat(MOVE, 4)),
      tier(repeat(CARRY, 10), repeat(MOVE, 5))
    ],
    maximumEnergy: 1000
  },
  hauler: {
    minimumEnergy: 200,
    tiers: [
      tier(repeat(CARRY, 3), repeat(MOVE, 2)),
      tier(repeat(CARRY, 6), repeat(MOVE, 3)),
      tier(repeat(CARRY, 9), repeat(MOVE, 5)),
      tier(repeat(CARRY, 12), repeat(MOVE, 6))
    ],
    maximumEnergy: 1200
  },
  repairer: {
    minimumEnergy: 200,
    tiers: [
      tier(WORK, CARRY, MOVE),
      tier(repeat(WORK, 2), repeat(CARRY, 2), repeat(MOVE, 2)),
      tier(repeat(WORK, 3), repeat(CARRY, 3), repeat(MOVE, 3)),
      tier(repeat(WORK, 4), repeat(CARRY, 4), repeat(MOVE, 4))
    ],
    maximumEnergy: 1000
  },
  upgrader: {
    minimumEnergy: 300,
    tiers: [
      tier(repeat(WORK, 2), CARRY, repeat(MOVE, 2)),
      tier(repeat(WORK, 3), repeat(CARRY, 2), repeat(MOVE, 3)),
      tier(repeat(WORK, 5), repeat(CARRY, 3), repeat(MOVE, 5)),
      tier(repeat(WORK, 7), repeat(CARRY, 5), repeat(MOVE, 6))
    ],
    maximumEnergy: 1400
  },
  builder: {
    minimumEnergy: 300,
    tiers: [
      tier(repeat(WORK, 2), repeat(CARRY, 2), repeat(MOVE, 2)),
      tier(repeat(WORK, 3), repeat(CARRY, 3), repeat(MOVE, 3)),
      tier(repeat(WORK, 4), repeat(CARRY, 4), repeat(MOVE, 4)),
      tier(repeat(WORK, 5), repeat(CARRY, 5), repeat(MOVE, 5))
    ],
    maximumEnergy: 1200
  },
  scout: {
    template: [MOVE],
    maximumEnergy: 50,
    minimumEnergy: 50
  }
};
