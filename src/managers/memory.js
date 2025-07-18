module.exports = {
    initMemory() {
        if (!Memory.creeps) {
            Memory.creeps = {};
        }
        if (!Memory.rooms) {
            Memory.rooms = {};
        }
        if (!Memory.scouting) {
            Memory.scouting = {};
        }
        if (!Memory.scouting.queue) {
            Memory.scouting.queue = [];
        }
    },
    cleanCreepsMemory() {
        for (const name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
            }
        }
        // clean up stale harvest reservations
        if (Memory.rooms) {
            for (const roomName in Memory.rooms) {
                const roomMem = Memory.rooms[roomName];
                if (roomMem.sources) {
                    for (const sourceId in roomMem.sources) {
                        const src = roomMem.sources[sourceId];
                        if (src.reservations) {
                            src.reservations = src.reservations.filter(creepName => Game.creeps[creepName]);
                        }
                    }
                }
            }
        }
    }
};
