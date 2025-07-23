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
        if (Memory.rooms) {
            for (const roomName in Memory.rooms) {
                const roomMemory = Memory.rooms[roomName];
                if (roomMemory.sources) {
                    for (const sourceId in roomMemory.sources) {
                        const sourceData = roomMemory.sources[sourceId];
                        if (sourceData.reservations) {
                            sourceData.reservations = sourceData.reservations.filter(creepName => Game.creeps[creepName]);
                        }
                    }
                }
            }
        }
    }
};
