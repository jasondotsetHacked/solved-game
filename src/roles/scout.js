module.exports = {
  run(creep) {
    // Seed scouting queue with owned room(s) if empty
    if (Memory.scouting.queue.length === 0) {
      for (const spawnName in Game.spawns) {
        const roomName = Game.spawns[spawnName].room.name;
        if (!Memory.scouting.queue.includes(roomName)) {
          Memory.scouting.queue.push(roomName);
        }
      }
    }

    if (!creep.memory.targetRoom) {
      creep.memory.targetRoom = Memory.scouting.queue[0];
    }

    if (!creep.memory.targetRoom) return;

    if (creep.room.name !== creep.memory.targetRoom) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
        visualizePathStyle: { stroke: '#00ff00' }
      });
      return;
    }

    // Arrived in target room - record in rooms memory
    const roomName = creep.room.name;
    if (!Memory.rooms[roomName] || !Memory.rooms[roomName].visited) {
      let tag = 'empty';
      const room = creep.room;
      if (room.controller) {
        if (room.controller.my) {
          tag = 'owned';
        } else if (!room.controller.owner) {
          tag = 'claimable';
        } else {
          tag = 'hostile';
        }
      } else if (room.find(FIND_HOSTILE_CREEPS).length) {
        tag = 'hostile';
      }
      // Store room info
      Memory.rooms[roomName] = { visited: true, tag };

      // Enqueue neighboring rooms
      const exits = Game.map.describeExits(roomName);
      for (const dir in exits) {
        const r = exits[dir];
        const visited = Memory.rooms[r] && Memory.rooms[r].visited;
        // Only enqueue rooms that are actually accessible (normal)
        const status = Game.map.getRoomStatus(r).status;
        if (status == 'closed') {
          continue;
        }
        if (!visited && !Memory.scouting.queue.includes(r)) {
          Memory.scouting.queue.push(r);
        }
      }
    }

    if (Memory.scouting.queue[0] === creep.room.name) {
      Memory.scouting.queue.shift();
    }
    creep.memory.targetRoom = Memory.scouting.queue[0];
  }
};
