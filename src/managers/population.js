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

  if (totalAssigned === 0) {
    queue.push(createRoleRequest(roomState, 'worker', PRIORITY.bootstrap, {
      memory: { bootstrap: true },
      energyBudget: Math.max(roomState.energyAvailable, 200)
    }));
    return queue;
  }

  const sources = roomState.sources || [];
  for (const source of sources) {
    if (!source.hasContainer || source.spots === 0) continue;
    if ((source.assignedHarvesters || 0) >= 1) continue;
    queue.push(createRoleRequest(roomState, 'stationaryHarvester', PRIORITY.harvester, {
      memory: { sourceId: source.id },
      minEnergy: 550,
      energyBudget: roomState.energyCapacity,
      namePrefix: `stationaryHarvester_${source.id}`
    }));
  }

  ensureRole(queue, roomState, 'worker', PRIORITY.worker, calculateWorkerTarget(roomState), {});

  const containeredSources = sources.filter(source => source.hasContainer);
  if (containeredSources.length > 0) {
    const haulerTarget = calculateHaulerTarget(roomState, containeredSources);
    ensureRole(queue, roomState, 'hauler', PRIORITY.hauler, haulerTarget, {
      energyBudget: Math.max(roomState.energyAvailable, 300)
    });
  }

  if (roomState.supplyTargets > 0 || roomState.hasStorage) {
    const fillerTarget = calculateFillerTarget(roomState);
    ensureRole(queue, roomState, 'filler', PRIORITY.filler, fillerTarget, {
      energyBudget: Math.max(roomState.energyAvailable, 200)
    });
  }

  const upgraderTarget = calculateUpgraderTarget(roomState, empire);
  ensureRole(queue, roomState, 'upgrader', PRIORITY.upgrader, upgraderTarget, {});

  const repairerTarget = calculateRepairerTarget(roomState);
  if (repairerTarget > 0) {
    ensureRole(queue, roomState, 'repairer', PRIORITY.repairer, repairerTarget, {});
  }

  const builderTarget = calculateBuilderTarget(roomState);
  if (builderTarget > 0) {
    ensureRole(queue, roomState, 'builder', PRIORITY.builder, builderTarget, {
      energyBudget: Math.max(roomState.energyAvailable, 300)
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

  const minEnergy = overrides && overrides.minEnergy !== undefined ? overrides.minEnergy : definition.minimumEnergy;
  const energyBudget = overrides && overrides.energyBudget !== undefined ? overrides.energyBudget : roomState.energyAvailable;

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
  let target = Math.max(3, sources * 2);
  if (controllerLevel >= 3 && roomState.hasStorage) target = Math.max(2, sources + 1);
  if (roomState.constructionSites > 0) target += Math.min(2, Math.ceil(roomState.constructionSites / 5));
  return Math.min(target, 8);
}

function calculateHaulerTarget(roomState, containeredSources) {
  let target = 0;
  for (const source of containeredSources) {
    const range = source.haulRange || 0;
    if (range <= 10) target += 1;
    else if (range <= 20) target += 2;
    else target += 3;
  }
  if (roomState.hasStorage && target > 0) target += 1;
  return Math.min(target, 6);
}

function calculateFillerTarget(roomState) {
  let target = roomState.hasStorage ? 2 : 1;
  if (roomState.towerDemand > 0) target += 1;
  if (roomState.energyCapacity >= 800) target += 1;
  return Math.min(target, 3);
}

function calculateUpgraderTarget(roomState, empire) {
  const level = roomState.controllerLevel || 0;
  let target = level <= 2 ? 2 : 1;
  if (roomState.storageEnergy > 4000) target += 1;
  if (roomState.storageEnergy > 20000) target += 1;
  if (roomState.designation === 'capital') target += 1;
  if (level >= 7) target = Math.min(target, 2);
  return Math.min(target, 5);
}

function calculateRepairerTarget(roomState) {
  if (roomState.damagedStructures > 20) return 2;
  if (roomState.damagedStructures > 0) return 1;
  return 0;
}

function calculateBuilderTarget(roomState) {
  if (!roomState.constructionSites || roomState.constructionSites === 0) return 0;
  return Math.min(3, Math.ceil(roomState.constructionSites / 3));
}

function calculateScoutTarget(empire, scoutQueueSize) {
  if (empire.ownedRooms.length === 0) return 0;
  if (scoutQueueSize === 0) return 1;
  if (scoutQueueSize > 30) return 3;
  if (scoutQueueSize > 10) return 2;
  return 1;
}
