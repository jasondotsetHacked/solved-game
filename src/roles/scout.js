module.exports = {
  run(creep) {
    // define pathfinding callback to avoid hostile rooms and respect terrain
    const roomCallback = (roomName) => {
      // debug: log roomCallback invocation
      const tag = Memory.rooms[roomName] && Memory.rooms[roomName].tag;
      console.log(`[${creep.name}] roomCallback for ${roomName}: tag=${tag}`);
      // skip entire hostile rooms
      if (tag === 'hostile') {
        console.log(`[${creep.name}] skipping hostile room ${roomName}`);
        return false;
      }
      // build cost matrix with default costs
      const matrix = new PathFinder.CostMatrix();
      const terrain = Game.map.getRoomTerrain(roomName);
      const plainCost = 2;
      const swampCost = 5;
      for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
          const t = terrain.get(x, y);
          if (t === TERRAIN_MASK_WALL) {
            matrix.set(x, y, 0xff);
          } else if (t === TERRAIN_MASK_SWAMP) {
            matrix.set(x, y, swampCost);
          } else {
            matrix.set(x, y, plainCost);
          }
        }
      }
      // add structures cost: roads low cost, ramparts passable for own creeps
      const roomObj = Game.rooms[roomName];
      if (roomObj) {
        roomObj.find(FIND_STRUCTURES).forEach(struct => {
          const pos = struct.pos;
          if (struct.structureType === STRUCTURE_ROAD) {
            matrix.set(pos.x, pos.y, 1);
          } else if (struct.structureType === STRUCTURE_RAMPART && struct.my) {
            // treat owned rampart as plain
            matrix.set(pos.x, pos.y, plainCost);
          } else if (struct.structureType !== STRUCTURE_CONTAINER) {
            // other structures impassable
            matrix.set(pos.x, pos.y, 0xff);
          }
        });
      }
      return matrix;
    };

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
      const targetPos = new RoomPosition(25, 25, creep.memory.targetRoom);
      const pathResult = PathFinder.search(
        creep.pos,
        { pos: targetPos, range: 1 },
        { roomCallback, maxRooms: 16, maxOps: 10000 }
      );
      console.log(`[${creep.name}] Path to ${creep.memory.targetRoom}: steps=${pathResult.path.length}, incomplete=${pathResult.incomplete}`);
      // debug: show full path coordinates
      if (pathResult.incomplete || pathResult.path.length > 0) {
        console.log(`[${creep.name}] Path coords: ${JSON.stringify(pathResult.path)}`);
        // debug: log terrain mask at each path coordinate
        pathResult.path.forEach(step => {
          const terrain = Game.map.getRoomTerrain(step.roomName);
          const mask = terrain.get(step.x, step.y);
          console.log(`[${creep.name}] terrain at ${step.roomName} (${step.x},${step.y}): ${mask}`);
        });
      }
      if (pathResult.incomplete) {
        console.log(`[${creep.name}] Path incomplete, moving to first step only.`);
        if (pathResult.path.length > 0) {
          creep.moveTo(pathResult.path[0]);
        }
      } else if (pathResult.path.length > 0) {
        creep.moveByPath(pathResult.path);
      }
      // visualize the path
      creep.room.visual.poly(pathResult.path, { stroke: '#00ff00' });
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
