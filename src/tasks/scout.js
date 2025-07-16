module.exports = {
  run(creep) {
    if (!Memory.scouting) {
      Memory.scouting = {
        queue: [creep.room.name],
        visited: {},
        tags: {}
      };
    }

    const scouting = Memory.scouting;

    if (!creep.memory.targetRoom) {
      creep.memory.targetRoom = scouting.queue[0];
    }

    if (!creep.memory.targetRoom) return;

    if (creep.room.name !== creep.memory.targetRoom) {
      creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoom), {
        visualizePathStyle: { stroke: '#00ff00' }
      });
      return;
    }

    // Arrived in target room
    if (!scouting.visited[creep.room.name]) {
      scouting.visited[creep.room.name] = true;

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
      scouting.tags[room.name] = tag;

      const exits = Game.map.describeExits(room.name);
      for (const dir in exits) {
        const r = exits[dir];
        if (!scouting.visited[r] && !scouting.queue.includes(r)) {
          scouting.queue.push(r);
        }
      }
    }

    if (scouting.queue[0] === creep.room.name) {
      scouting.queue.shift();
    }
    creep.memory.targetRoom = scouting.queue[0];
  }
};
