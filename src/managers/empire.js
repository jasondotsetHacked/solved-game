module.exports = {
  refresh() {
    const creeps = Object.values(Game.creeps);
    const creepsByRole = {};
    const creepsByHome = {};
    const harvestAssignments = {};

    for (const creep of creeps) {
      const role = creep.memory.role || 'unknown';
      creepsByRole[role] = (creepsByRole[role] || 0) + 1;

      const home = creep.memory.home || creep.memory.spawnRoom || (creep.room && creep.room.name) || 'unknown';
      if (!creepsByHome[home]) creepsByHome[home] = {};
      creepsByHome[home][role] = (creepsByHome[home][role] || 0) + 1;

      if (role === 'stationaryHarvester' && creep.memory.sourceId) {
        harvestAssignments[creep.memory.sourceId] = (harvestAssignments[creep.memory.sourceId] || 0) + 1;
      }
    }

    const productionByHome = {};
    const productionByRole = {};
    for (const spawn of Object.values(Game.spawns)) {
      const spawning = spawn.spawning;
      if (!spawning) continue;
      const memory = Memory.creeps[spawning.name];
      if (!memory) continue;
      const role = memory.role || 'unknown';
      const home = memory.home || spawn.room.name;
      productionByRole[role] = (productionByRole[role] || 0) + 1;
      if (!productionByHome[home]) productionByHome[home] = {};
      productionByHome[home][role] = (productionByHome[home][role] || 0) + 1;
    }

    const username = deriveUsername();
    const rooms = {};

    for (const [roomName, room] of Object.entries(Game.rooms)) {
      rooms[roomName] = analyzeVisibleRoom(room, harvestAssignments, creepsByHome[roomName] || {}, productionByHome[roomName] || {}, username);
    }

    for (const roomName of Object.keys(Memory.rooms || {})) {
      if (!rooms[roomName]) {
        rooms[roomName] = analyzeMemoryRoom(roomName);
      }
    }

    const ownedRooms = Object.keys(rooms).filter(name => rooms[name].isOwned);
    const capital = selectCapital(ownedRooms, rooms);

    for (const [roomName, summary] of Object.entries(rooms)) {
      const designation = computeDesignation(roomName, summary, capital, ownedRooms);
      summary.designation = designation;

      const roomMemory = Memory.rooms[roomName] = Memory.rooms[roomName] || {};
      roomMemory.designation = designation;
      if (summary.lastVisit !== undefined) roomMemory.lastVisit = summary.lastVisit;
      if (summary.controllerLevel !== undefined) roomMemory.controllerLevel = summary.controllerLevel;
      roomMemory.owner = summary.owner || roomMemory.owner;
      roomMemory.tag = roomMemory.tag || summary.tag;
    }

    return {
      time: Game.time,
      cpu: {
        bucket: Game.cpu.bucket,
        limit: Game.cpu.limit,
        used: Game.cpu.getUsed()
      },
      creeps: {
        total: creeps.length,
        byRole: creepsByRole,
        byHome: creepsByHome
      },
      production: {
        byRole: productionByRole,
        byHome: productionByHome
      },
      assignments: {
        harvesters: harvestAssignments
      },
      rooms,
      ownedRooms,
      capital
    };
  }
};

function analyzeVisibleRoom(room, harvestAssignments, homeCounts, productionCounts, username) {
  const controller = room.controller;
  const controllerLevel = controller ? controller.level : 0;
  const isOwned = Boolean(controller && controller.my);
  const reservation = controller && controller.reservation;
  const isReserved = Boolean(reservation && reservation.username === username);
  const owner = controller && controller.owner && controller.owner.username;

  const structures = room.find(FIND_STRUCTURES);
  const myStructures = room.find(FIND_MY_STRUCTURES);

  const spawns = myStructures.filter(structure => structure.structureType === STRUCTURE_SPAWN);
  const extensions = myStructures.filter(structure => structure.structureType === STRUCTURE_EXTENSION);
  const towers = myStructures.filter(structure => structure.structureType === STRUCTURE_TOWER);
  const storage = myStructures.find(structure => structure.structureType === STRUCTURE_STORAGE) || null;
  const terminal = myStructures.find(structure => structure.structureType === STRUCTURE_TERMINAL) || null;

  const containers = structures.filter(structure => structure.structureType === STRUCTURE_CONTAINER);
  const sourceContainers = [];
  const baseContainers = [];
  for (const container of containers) {
    const nearSource = container.pos.findInRange(FIND_SOURCES, 1).length > 0;
    if (nearSource) sourceContainers.push(container);
    else baseContainers.push(container);
  }

  const storageEnergy = (storage ? storage.store[RESOURCE_ENERGY] : 0) + baseContainers.reduce((sum, container) => sum + (container.store[RESOURCE_ENERGY] || 0), 0);

  const supplyTargets = spawns.concat(extensions).filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0).length;
  const towerDemand = towers.filter(structure => structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0).length;

  const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
  const hostileCreeps = room.find(FIND_HOSTILE_CREEPS).length;
  const damagedStructures = room.find(FIND_STRUCTURES, {
    filter: structure => structure.hits < structure.hitsMax && structure.structureType !== STRUCTURE_WALL && structure.structureType !== STRUCTURE_RAMPART
  }).length;

  const anchorPos = deriveAnchor(room, storage, spawns);

  const sources = room.find(FIND_SOURCES).map(source => {
    const container = sourceContainers.find(cont => cont.pos.isNearTo(source));
    const link = room.lookForAtArea(LOOK_STRUCTURES, source.pos.y - 2, source.pos.x - 2, source.pos.y + 2, source.pos.x + 2, true)
      .map(entry => entry.structure)
      .find(structure => structure.structureType === STRUCTURE_LINK) || null;
    const spots = getSourceSpots(room.name, source.id);
    const assignedHarvesters = harvestAssignments[source.id] || 0;
    const haulTarget = anchorPos || (storage && storage.pos) || (spawns[0] && spawns[0].pos) || null;
    const haulRange = haulTarget ? source.pos.getRangeTo(haulTarget) : 0;

    return {
      id: source.id,
      hasContainer: Boolean(container),
      hasLink: Boolean(link),
      spots,
      assignedHarvesters,
      haulRange
    };
  });

  return {
    name: room.name,
    owner,
    controllerLevel,
    isOwned,
    isReserved,
    energyAvailable: room.energyAvailable,
    energyCapacity: room.energyCapacityAvailable,
    sources,
    spawns: spawns.map(spawn => spawn.name),
    extensions: extensions.length,
    towers: towers.map(tower => tower.id),
    storageId: storage ? storage.id : null,
    terminalId: terminal ? terminal.id : null,
    storageEnergy,
    supplyTargets,
    towerDemand,
    constructionSites,
    hostileCreeps,
    damagedStructures,
    sourceContainers: sourceContainers.map(container => container.id),
    baseContainers: baseContainers.map(container => container.id),
    creeps: mergeCounts(homeCounts, productionCounts),
    hasStorage: Boolean(storage),
    reservationTicks: reservation ? reservation.ticksToEnd : 0,
    lastVisit: Game.time,
    anchor: anchorPos ? { x: anchorPos.x, y: anchorPos.y } : null
  };
}

function analyzeMemoryRoom(roomName) {
  const roomMemory = Memory.rooms[roomName] || {};
  return {
    name: roomName,
    owner: roomMemory.owner,
    controllerLevel: roomMemory.controllerLevel,
    isOwned: roomMemory.designation === 'capital' || roomMemory.designation === 'colony',
    isReserved: roomMemory.designation === 'remote',
    sources: [],
    storageEnergy: 0,
    supplyTargets: 0,
    towerDemand: 0,
    constructionSites: 0,
    hostileCreeps: 0,
    damagedStructures: 0,
    creeps: {},
    lastVisit: roomMemory.lastVisit,
    tag: roomMemory.tag,
    designation: roomMemory.designation
  };
}

function computeDesignation(roomName, summary, capital, ownedRooms) {
  if (summary.isOwned) {
    return roomName === capital ? 'capital' : 'colony';
  }
  if (summary.isReserved) return 'remote';
  if (summary.hostileCreeps > 0) return 'hostile';

  const roomMemory = Memory.rooms[roomName] || {};
  if (roomMemory.tag === 'hostile') return 'hostile';
  if (roomMemory.tag === 'claimable') return 'claimable';

  const status = Game.map.getRoomStatus(roomName);
  if (status && status.status && status.status !== 'normal') return status.status;

  return roomMemory.designation || 'neutral';
}

function selectCapital(ownedRooms, rooms) {
  if (ownedRooms.length === 0) {
    const primarySpawn = Object.values(Game.spawns)[0];
    return primarySpawn ? primarySpawn.room.name : null;
  }

  const sorted = ownedRooms.slice().sort((a, b) => {
    const roomA = rooms[a];
    const roomB = rooms[b];
    const levelA = roomA ? roomA.controllerLevel || 0 : 0;
    const levelB = roomB ? roomB.controllerLevel || 0 : 0;
    if (levelA !== levelB) return levelB - levelA;
    const capacityA = roomA ? roomA.energyCapacity || 0 : 0;
    const capacityB = roomB ? roomB.energyCapacity || 0 : 0;
    if (capacityA !== capacityB) return capacityB - capacityA;
    return a.localeCompare(b);
  });

  return sorted[0];
}

function getSourceSpots(roomName, sourceId) {
  const roomMemory = Memory.rooms && Memory.rooms[roomName];
  if (!roomMemory || !roomMemory.sources) return 0;
  const sourceMemory = roomMemory.sources[sourceId];
  return sourceMemory && sourceMemory.spots ? sourceMemory.spots : 0;
}

function deriveAnchor(room, storage, spawns) {
  if (storage) return storage.pos;
  if (spawns && spawns.length > 0) return spawns[0].pos;
  const flags = room.find(FIND_FLAGS, { filter: flag => flag.name.startsWith('anchor') });
  return flags.length > 0 ? flags[0].pos : null;
}

function mergeCounts(activeCounts, productionCounts) {
  const merged = Object.assign({}, activeCounts);
  for (const [role, count] of Object.entries(productionCounts)) {
    merged[role] = (merged[role] || 0) + count;
  }
  return merged;
}

function deriveUsername() {
  const spawn = Object.values(Game.spawns)[0];
  return spawn && spawn.owner ? spawn.owner.username : null;
}
