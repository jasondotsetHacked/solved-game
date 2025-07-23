module.exports = {
  run(creep) {
    const roomCallback = (roomName) => {
      const roomTag = Memory.rooms[roomName] && Memory.rooms[roomName].tag;
      if (roomTag === 'hostile') {
        return false;
      }
      const matrix = new PathFinder.CostMatrix();
      const terrainInfo = Game.map.getRoomTerrain(roomName);
      const plainCost = 2;
      const swampCost = 5;
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          const terrainType = terrainInfo.get(x, y);
          if (terrainType === TERRAIN_MASK_WALL) {
            matrix.set(x, y, 0xff);
          } else if (terrainType === TERRAIN_MASK_SWAMP) {
            matrix.set(x, y, swampCost);
          } else {
            matrix.set(x, y, plainCost);
          }
        }
      }
      const roomObject = Game.rooms[roomName];
      if (roomObject) {
        roomObject.find(FIND_STRUCTURES).forEach(struct => {
          const pos = struct.pos;
          if (struct.structureType === STRUCTURE_ROAD) {
            matrix.set(pos.x, pos.y, 1);
          } else if (struct.structureType === STRUCTURE_RAMPART && struct.my) {
            matrix.set(pos.x, pos.y, plainCost);
          } else if (struct.structureType !== STRUCTURE_CONTAINER) {
            matrix.set(pos.x, pos.y, 0xff);
          }
        });
      }
      return matrix;
    };

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
      const targetPos = new RoomPosition(25, 25, creep.memory.targetRoom);
      const pathResult = PathFinder.search(
        creep.pos,
        { pos: targetPos, range: 1 },
        { roomCallback, maxRooms: 16, maxOps: 10000 }
      );
      if (pathResult.incomplete) {
        if (pathResult.path.length > 0) {
          creep.moveTo(pathResult.path[0]);
        }
      } else if (pathResult.path.length > 0) {
        creep.moveByPath(pathResult.path);
      }
      creep.room.visual.poly(pathResult.path, { stroke: '#00ff00' });
      return;
    }

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
      Memory.rooms[roomName] = { visited: true, tag };
      const exits = Game.map.describeExits(roomName);
      for (const dir in exits) {
        const neighboringRoom = exits[dir];
        const visited = Memory.rooms[neighboringRoom] && Memory.rooms[neighboringRoom].visited;
        const status = Game.map.getRoomStatus(neighboringRoom).status;
        if (status == 'closed') {
          continue;
        }
        if (!visited && !Memory.scouting.queue.includes(neighboringRoom)) {
          Memory.scouting.queue.push(neighboringRoom);
        }
      }
    }

    if (Memory.scouting.queue[0] === creep.room.name) {
      Memory.scouting.queue.shift();
    }
    creep.memory.targetRoom = Memory.scouting.queue[0];
  }
};
