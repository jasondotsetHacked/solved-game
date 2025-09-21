const ROLE_CATALOG = require('managers_roleDefinitions');

const PRIORITY = {
  bootstrap: 0,
  harvester: 5,
  worker: 10,
  filler: 20,
  hauler: 25,
  upgrader: 30,
  repairer: 40,
  builder: 50,
  scout: 60
};

module.exports = {
  buildSpawnQueue(empire) {
    const queue = [];

    for (const roomName of empire.ownedRooms) {
      const roomState = empire.rooms[roomName];
      if (!roomState) continue;
      queue.push(...buildRoomQueue(roomState, empire));
    }

    queue.push(...buildGlobalQueue(empire));

    return queue.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.room !== b.room) return a.room.localeCompare(b.room);
      return a.role.localeCompare(b.role);
    });
  }
};

function buildRoomQueue(roomState, empire) {
  const queue = [];
  const counts = roomState.creeps || {};
  const totalAssigned = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const energyCapacity = roomState.energyCapacity || roomState.energyAvailable || 300;

  if (totalAssigned === 0) {
    const bootstrapBudget = Math.min(energyCapacity, energyBudgetFor('worker', roomState));
    queue.push(createRoleRequest(roomState, 'worker', PRIORITY.bootstrap, {
      memory: { bootstrap: true },
      energyBudget: bootstrapBudget,
      minEnergy: energyMinimumFor('worker'),
      allowRemote: false
    }));
    return queue;
  }

  if (needsBootstrap(roomState)) {
    const targetBoot = Math.max(2, Math.min(4, roomState.sources ? roomState.sources.length + 1 : 2));
    const existingBoots = (counts.worker || 0) + (counts.hauler || 0) + (counts.filler || 0);
    const missing = Math.max(0, targetBoot - existingBoots);
    for (let i = 0; i < missing; i++) {
      queue.push(createRoleRequest(roomState, 'worker', PRIORITY.bootstrap, {
        memory: { bootstrap: true },
        energyBudget: Math.min(energyCapacity, energyBudgetFor('worker', roomState)),
        minEnergy: energyMinimumFor('worker'),
        allowRemote: false
      }));
    }
  }

  const sources = roomState.sources || [];
  for (const source of sources) {
    if (source.spots === 0) continue;
    if ((source.assignedHarvesters || 0) >= 1) continue;
    queue.push(createRoleRequest(roomState, 'stationaryHarvester', PRIORITY.harvester, {
      memory: { sourceId: source.id },
      minEnergy: energyMinimumFor('stationaryHarvester'),
      energyBudget: energyBudgetFor('stationaryHarvester', roomState),
      namePrefix: stationaryHarvester_
    }));
  }

  ensureRole(queue, roomState, 'worker', PRIORITY.worker, calculateWorkerTarget(roomState), {
    energyBudget: energyBudgetFor('worker', roomState)
  });

  if (sources.length > 0) {
    const haulerTarget = calculateHaulerTarget(roomState, sources);
    ensureRole(queue, roomState, 'hauler', PRIORITY.hauler, haulerTarget, {
      energyBudget: energyBudgetFor('hauler', roomState)
    });
  }

  if (roomState.supplyTargets > 0 || roomState.hasStorage) {
    const fillerTarget = calculateFillerTarget(roomState);
    ensureRole(queue, roomState, 'filler', PRIORITY.filler, fillerTarget, {
      energyBudget: energyBudgetFor('filler', roomState)
    });
  }

  const upgraderTarget = calculateUpgraderTarget(roomState, empire);
  ensureRole(queue, roomState, 'upgrader', PRIORITY.upgrader, upgraderTarget, {
    energyBudget: energyBudgetFor('upgrader', roomState)
  });

  const repairerTarget = calculateRepairerTarget(roomState);
  if (repairerTarget > 0) {
    ensureRole(queue, roomState, 'repairer', PRIORITY.repairer, repairerTarget, {
      energyBudget: energyBudgetFor('repairer', roomState)
    });
  }

  const builderTarget = calculateBuilderTarget(roomState);
  if (builderTarget > 0) {
    ensureRole(queue, roomState, 'builder', PRIORITY.builder, builderTarget, {
      energyBudget: energyBudgetFor('builder', roomState)
    });
  }

  return queue;
}

function buildGlobalQueue(empire) {
  const queue = [];
  const scoutQueue = (Memory.scouting && Memory.scouting.queue) ? Memory.scouting.queue.length : 0;
  const activeScouts = (empire.creeps.byRole.scout || 0) + ((empire.production.byRole && empire.production.byRole.scout) || 0);
  const desiredScouts = calculateScoutTarget(empire, scoutQueue);

  const homeRoom = empire.capital || empire.ownedRooms[0];
  if (!homeRoom) return queue;

  const missing = Math.max(0, desiredScouts - activeScouts);
  for (let i = 0; i < missing; i++) {
    queue.push({
      room: homeRoom,
      role: 'scout',
      priority: PRIORITY.scout,
      memory: { home: homeRoom },
      energyBudget: 50,
      minEnergy: 50,
      namePrefix: 'scout',
      allowRemote: true
    });
  }

  return queue;
}

function ensureRole(queue, roomState, role, priority, target, overrides) {
  if (target <= 0) return;
  const counts = roomState.creeps || {};
  const existing = counts[role] || 0;
  const missing = Math.max(0, target - existing);
  for (let i = 0; i < missing; i++) {
    queue.push(createRoleRequest(roomState, role, priority, overrides));
  }
}

function createRoleRequest(roomState, role, priority, overrides) {
  const definition = ROLE_CATALOG[role] || {};
  const memory = Object.assign({}, overrides && overrides.memory);
  const allowRemote = overrides && overrides.allowRemote !== undefined
    ? overrides.allowRemote
    : (Array.isArray(roomState.spawns) ? roomState.spawns.length === 0 : false);

  const minEnergy = overrides && overrides.minEnergy !== undefined
    ? overrides.minEnergy
    : energyMinimumFor(role);

  const energyBudget = overrides && overrides.energyBudget !== undefined
    ? overrides.energyBudget
    : energyBudgetFor(role, roomState);

  return {
    room: roomState.name,
    role,
    priority,
    memory,
    energyBudget,
    minEnergy,
    namePrefix: overrides && overrides.namePrefix,
    allowRemote
  };
}

function calculateWorkerTarget(roomState) {
  const controllerLevel = roomState.controllerLevel || 0;
  const sources = roomState.sources ? roomState.sources.length : 0;
  const constructionSites = roomState.constructionSites || 0;
  let target = Math.max(2, sources + 1);
  if (controllerLevel <= 2) target = Math.max(target, 3);
  if (controllerLevel >= 4 && roomState.hasStorage) target = Math.max(2, Math.ceil(sources * 1.5));
  if (constructionSites > 0) target += Math.min(3, Math.ceil(constructionSites / 4));
  return Math.min(target, 10);
}

function calculateHaulerTarget(roomState, sources) {
  if (!Array.isArray(sources) || sources.length === 0) return 0;
  const totalHaulPartsNeeded = sources.reduce((sum, source) => {
    const harvestRate = source.harvestRate || 10; // energy per tick for a standard source
    const roundTrip = Math.max(2, (source.haulRange || 10) * 2);
    const energyPerTrip = harvestRate * roundTrip;
    const carryCapacityPerCreep = 50 * 6; // assume mid-tier hauler (6 carry parts) baseline
    return sum + Math.ceil(energyPerTrip / carryCapacityPerCreep);
  }, 0);
  return Math.min(Math.max(1, totalHaulPartsNeeded), 6);
}

function calculateFillerTarget(roomState) {
  let target = roomState.hasStorage ? 2 : 1;
  if (roomState.towerDemand > 0) target += 1;
  if (roomState.energyCapacity >= 800) target += 1;
  return Math.min(target, 4);
}

function calculateUpgraderTarget(roomState, empire) {
  const level = roomState.controllerLevel || 0;
  let target = level <= 2 ? 2 : 1;
  if (roomState.storageEnergy > 4000) target += 1;
  if (roomState.storageEnergy > 20000) target += 1;
  if (roomState.designation === 'capital') target += 1;
  if (level >= 7) target = Math.min(target, 3);
  if (level === 8 && roomState.storageEnergy < 200000) target = Math.max(1, target - 1);
  return Math.min(target, 6);
}

function calculateRepairerTarget(roomState) {
  if (roomState.damagedStructures > 200) return 3;
  if (roomState.damagedStructures > 50) return 2;
  if (roomState.damagedStructures > 0) return 1;
  if (roomState.reservationTicks && roomState.reservationTicks < 2000) return 1;
  return 0;
}

function calculateBuilderTarget(roomState) {
  const sites = roomState.constructionSites || 0;
  if (sites === 0) return 0;
  const storageEnergy = roomState.storageEnergy || 0;
  let target = Math.ceil(sites / 3);
  if (storageEnergy > 5000) target += 1;
  if (storageEnergy > 20000) target += 1;
  return Math.min(target, 6);
}

function calculateScoutTarget(empire, scoutQueueSize) {
  if (empire.ownedRooms.length === 0) return 0;
  if (scoutQueueSize === 0) return 1;
  if (scoutQueueSize > 30) return 3;
  if (scoutQueueSize > 10) return 2;
  return 1;
}

function needsBootstrap(roomState) {
  const counts = roomState.creeps || {};
  const workers = counts.worker || 0;
  const haulers = counts.hauler || 0;
  const fillers = counts.filler || 0;
  const harvesters = counts.stationaryHarvester || 0;
  const totalEconomy = workers + haulers + fillers + harvesters;
  if (totalEconomy === 0) return true;
  const storageEnergy = roomState.storageEnergy || 0;
  if (storageEnergy === 0 && totalEconomy < 2 && roomState.energyAvailable < 200) return true;
  return false;
}

function energyMinimumFor(role) {
  const definition = ROLE_CATALOG[role];
  return definition && definition.minimumEnergy ? definition.minimumEnergy : 0;
}

function energyBudgetFor(role, roomState) {
  const definition = ROLE_CATALOG[role];
  const capacity = roomState.energyCapacity || roomState.energyAvailable || 300;
  if (!definition) return capacity;
  let cap = capacity;
  if (definition.maximumEnergy) cap = Math.min(capacity, definition.maximumEnergy);
  if (definition.tiers && definition.tiers.length > 0) {
    const maxTierEnergy = definition.tiers.reduce((max, tier) => Math.max(max, tier.energy || 0), 0);
    cap = Math.min(cap, maxTierEnergy || cap);
  }
  return cap;
}
