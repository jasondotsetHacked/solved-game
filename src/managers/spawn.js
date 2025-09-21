const bodyManager = require('managers_bodyManager');
const ROLE_CATALOG = require('managers_roleDefinitions');

module.exports = {
  run(empire, spawnQueue) {
    const idleSpawns = Object.values(Game.spawns).filter(spawn => !spawn.spawning);
    if (idleSpawns.length === 0 || spawnQueue.length === 0) {
      return { spawned: [], pending: spawnQueue.slice() };
    }

    const pending = spawnQueue.slice();
    const spawned = [];

    for (const spawn of idleSpawns) {
      const requestIndex = selectRequestIndex(spawn, pending);
      if (requestIndex === -1) continue;

      const request = pending[requestIndex];
      const readiness = evaluateReadiness(spawn, request);
      if (readiness === 'insufficient-energy') continue;
      if (readiness === 'invalid') {
        pending.splice(requestIndex, 1);
        continue;
      }

      const result = spawnFromRequest(spawn, request);
      if (result.success) {
        spawned.push(result);
        pending.splice(requestIndex, 1);
      } else if (result.reason === ERR_NOT_ENOUGH_ENERGY) {
        // leave the request in place to retry when energy refills
      } else {
        pending.splice(requestIndex, 1);
      }
    }

    return { spawned, pending };
  }
};

function selectRequestIndex(spawn, queue) {
  const homeIndex = queue.findIndex(request => request.room === spawn.room.name && canSpawnHere(spawn, request));
  if (homeIndex !== -1) return homeIndex;
  return queue.findIndex(request => request.allowRemote && canSpawnHere(spawn, request));
}

function canSpawnHere(spawn, request) {
  const minEnergy = request.minEnergy || 0;
  if (minEnergy > 0 && spawn.room.energyCapacityAvailable < minEnergy) return false;
  return true;
}

function evaluateReadiness(spawn, request) {
  const minEnergy = request.minEnergy || 0;
  if (minEnergy > 0 && spawn.room.energyAvailable < minEnergy) {
    return 'insufficient-energy';
  }

  const definition = ROLE_CATALOG[request.role];
  if (!definition) return 'invalid';
  return 'ready';
}

function spawnFromRequest(spawn, request) {
  const energyBudget = Math.min(request.energyBudget || spawn.room.energyAvailable, spawn.room.energyAvailable);
  if (energyBudget <= 0) {
    return { success: false, reason: ERR_NOT_ENOUGH_ENERGY };
  }

  const body = bodyManager.buildBody(request.role, energyBudget);
  if (body.length === 0) {
    return { success: false, reason: 'no-body' };
  }

  const memory = Object.assign({ home: request.room }, request.memory || {}, { role: request.role });
  if (!memory.home) memory.home = spawn.room.name;

  const namePrefix = request.namePrefix || request.role;
  const name = generateName(namePrefix, spawn.room.name);
  const result = spawn.spawnCreep(body, name, { memory });

  if (result === OK) {
    return { success: true, name, role: request.role, spawn: spawn.name, body };
  }

  if (result === ERR_NAME_EXISTS) {
    const fallbackName = generateName(`${namePrefix}_${Game.time}`, spawn.room.name);
    const fallbackResult = spawn.spawnCreep(body, fallbackName, { memory });
    if (fallbackResult === OK) {
      return { success: true, name: fallbackName, role: request.role, spawn: spawn.name, body };
    }
    return { success: false, reason: fallbackResult };
  }

  return { success: false, reason: result };
}

function generateName(prefix, roomName) {
  const base = `${prefix}_${roomName}_${Game.time}`;
  if (!Game.creeps[base] && !Memory.creeps[base]) return base;
  let attempt = 1;
  while (attempt <= 5) {
    const candidate = `${base}_${attempt}`;
    if (!Game.creeps[candidate] && !Memory.creeps[candidate]) return candidate;
    attempt += 1;
  }
  return `${prefix}_${roomName}_${Game.time}_${Math.floor(Math.random() * 1000)}`;
}
