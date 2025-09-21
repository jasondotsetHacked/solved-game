module.exports = {
  remember(empire, queue, spawnStats) {
    capture(empire, queue, spawnStats, false);
  },
  report(empire, queue, spawnStats) {
    capture(empire, queue, spawnStats, true);
  }
};

function capture(empire, queue, spawnStats, verbose) {
  Memory.telemetry = Memory.telemetry || { history: [] };

  const queued = queue ? queue.length : 0;
  const pending = spawnStats && spawnStats.pending ? spawnStats.pending.length : queued;
  const spawned = spawnStats && spawnStats.spawned ? spawnStats.spawned : [];

  const snapshot = {
    time: Game.time,
    cpuUsed: Game.cpu.getUsed(),
    cpuLimit: Game.cpu.limit,
    bucket: Game.cpu.bucket,
    creepCount: empire.creeps.total,
    queue: queued,
    pending,
    spawned: spawned.map(entry => ({ role: entry.role, spawn: entry.spawn })),
    rooms: buildRoomSummaries(empire)
  };

  Memory.telemetry.last = snapshot;
  Memory.telemetry.history = Memory.telemetry.history || [];
  Memory.telemetry.history.push(snapshot);
  if (Memory.telemetry.history.length > 200) {
    Memory.telemetry.history.shift();
  }

  if (!verbose) return;
  if (Game.time % 5 !== 0) return;

  const roomLines = snapshot.rooms.map(room => formatRoomLine(room)).join(' | ');
  const spawnedLine = spawned.length > 0 ? spawned.map(entry => `${entry.role}@${entry.spawn}`).join(', ') : 'none';
  console.log(`CPU ${snapshot.cpuUsed.toFixed(1)}/${snapshot.cpuLimit} bucket ${snapshot.bucket} | creeps ${snapshot.creepCount} | queue ${snapshot.queue} pending ${snapshot.pending} | spawned ${spawnedLine}`);
  if (roomLines) {
    console.log(`Rooms ${roomLines}`);
  }
}

function buildRoomSummaries(empire) {
  return (empire.ownedRooms || []).map(roomName => {
    const state = empire.rooms[roomName];
    const energyAvailable = state ? state.energyAvailable : 0;
    const energyCapacity = state ? state.energyCapacity : 0;
    const storageEnergy = state ? state.storageEnergy || 0 : 0;
    const creepBreakdown = state && state.creeps ? state.creeps : {};
    const creepTotal = Object.values(creepBreakdown).reduce((sum, count) => sum + count, 0);

    return {
      name: roomName,
      designation: state ? state.designation : 'unknown',
      energyAvailable,
      energyCapacity,
      storageEnergy,
      creeps: creepTotal
    };
  });
}

function formatRoomLine(room) {
  const energyLine = `${room.energyAvailable}/${room.energyCapacity}`;
  const storageLine = room.storageEnergy > 0 ? `store ${room.storageEnergy}` : 'store 0';
  return `${room.name}:${room.designation} ${energyLine} ${storageLine} creeps ${room.creeps}`;
}
